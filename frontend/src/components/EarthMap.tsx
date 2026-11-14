import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Crosshair,
  Navigation,
  Eye,
  EyeOff,
  Radio,
  Globe,
  Map as MapIcon,
  RotateCw,
  Grid,
  Scan,
  Calendar,
} from 'lucide-react';
import {
  AnalysisMode,
  ClimateVariableCode,
  RegionLocation,
} from '../types/climate';
import {
  Globe3DView,
  ROIShapeMode,
  buildROIPolygonCoords,
} from './Globe3DView';

interface EarthMapProps {
  mode: AnalysisMode;
  variable: ClimateVariableCode;
  regionA: RegionLocation;
  regionB: RegionLocation | null;
  activeTarget: 'A' | 'B';
  cameraTrigger: number;
  onMapClickRegion: (target: 'A' | 'B', location: RegionLocation) => void;
  onToggleActiveTarget: (target: 'A' | 'B') => void;
}

type ViewProjectionMode = '2d' | '3d';
type BasemapTheme = 'dark' | 'night' | 'satellite';

interface GibsLayerConfig {
  id: string;
  label: string;
  layerName: string;
  matrixSet: string;
  format: 'png' | 'jpg';
  isStaticDate?: boolean;
  colorbar?: {
    gradientCss: string;
    minLabel: string;
    midLabel: string;
    maxLabel: string;
    unit: string;
  };
}

export const TERRA_GIBS_CATALOG: Record<string, GibsLayerConfig> = {
  T2M: {
    id: 'T2M',
    label: 'MODIS: Температура поверхні (LST Day)',
    layerName: 'MODIS_Terra_Land_Surface_Temp_Day',
    matrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #1e3a8a 0%, #89b4fa 28%, #f9e2af 55%, #fab387 80%, #f38ba8 100%)',
      minLabel: '-25',
      midLabel: '+15',
      maxLabel: '+50',
      unit: '°C',
    },
  },
  PRECTOTCORR: {
    id: 'PRECTOTCORR',
    label: 'GPM IMERG: Інтенсивність опадів',
    layerName: 'IMERG_Precipitation_Rate',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #74c7ec 0%, #a6e3a1 38%, #f9e2af 70%, #f38ba8 90%, #cba6f7 100%)',
      minLabel: '0.1',
      midLabel: '10',
      maxLabel: '50+',
      unit: 'мм/год',
    },
  },
  GWETROOT: {
    id: 'GWETROOT',
    label: 'SMAP L4: Вологість ґрунту (Root Zone)',
    layerName: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #fab387 0%, #f9e2af 30%, #a6e3a1 65%, #89b4fa 100%)',
      minLabel: '0.05 (Посуха)',
      midLabel: '0.35',
      maxLabel: '0.65 (Волого)',
      unit: 'м³/м³',
    },
  },
  AOD: {
    id: 'AOD',
    label: 'MODIS Aqua/Terra: Аерозолі та Дим Пожеж (AOD)',
    layerName: 'MODIS_Terra_Aerosol',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #f9e2af 0%, #fab387 50%, #f38ba8 100%)',
      minLabel: '0.0',
      midLabel: '0.5',
      maxLabel: '1.5+',
      unit: 'AOD',
    },
  },
  SO2: {
    id: 'SO2',
    label: 'Aura OMI / MODIS: Вулканічний шлейф та сульфати (SO₂/AOD)',
    layerName: 'MODIS_Terra_Aerosol',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #89dceb 0%, #cba6f7 55%, #f38ba8 100%)',
      minLabel: '0.1',
      midLabel: '1.5',
      maxLabel: '5.0+',
      unit: 'DU',
    },
  },
  ALLSKY_SFC_SW_DWN: {
    id: 'ALLSKY_SFC_SW_DWN',
    label: 'MODIS Terra: True Color (Хмарність та Радіація)',
    layerName: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
  },
  SNODP: {
    id: 'SNODP',
    label: 'MODIS: Сніговий та льодовий покрив (NDSI)',
    layerName: 'MODIS_Terra_NDSI_Snow_Cover',
    matrixSet: 'GoogleMapsCompatible_Level8',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #74c7ec 0%, #89b4fa 45%, #cdd6f4 80%, #ffffff 100%)',
      minLabel: '10%',
      midLabel: '50%',
      maxLabel: '100%',
      unit: 'Сніг/Лід',
    },
  },
  TERRA_BANDS_721: {
    id: 'TERRA_BANDS_721',
    label: 'MODIS Terra: ІЧ-композит Bands 7-2-1 (Повені / Згарища)',
    layerName: 'MODIS_Terra_CorrectedReflectance_Bands721',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
  },
  ASTER_RELIEF: {
    id: 'ASTER_RELIEF',
    label: 'ASTER GDEM: Кольоровий рельєф висот Землі',
    layerName: 'ASTER_GDEM_Color_Shaded_Relief',
    matrixSet: 'GoogleMapsCompatible_Level12',
    format: 'jpg',
    isStaticDate: true,
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #a6e3a1 0%, #f9e2af 45%, #fab387 75%, #cdd6f4 100%)',
      minLabel: '0 м',
      midLabel: '1500 м',
      maxLabel: '5000+ м',
      unit: 'Висота',
    },
  },
  SEAWIFS_CHLA: {
    id: 'SEAWIFS_CHLA',
    label: 'MODIS Aqua / SeaWiFS: Прибережний хлорофіл-а (Ocean Color)',
    layerName: 'MODIS_Aqua_Chlorophyll_A',
    matrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #1e3a8a 0%, #74c7ec 35%, #a6e3a1 65%, #f9e2af 85%, #f38ba8 100%)',
      minLabel: '0.03',
      midLabel: '1.0',
      maxLabel: '20+',
      unit: 'mg/m³',
    },
  },
  SWOT_WSE: {
    id: 'SWOT_WSE',
    label: 'SWOT / MODIS Bands 7-2-1: Рівень поверхневих вод та озер (WSE)',
    layerName: 'MODIS_Terra_CorrectedReflectance_Bands721',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #1e3a8a 0%, #89b4fa 45%, #94e2d5 75%, #a6e3a1 100%)',
      minLabel: 'Низький',
      midLabel: 'Норма',
      maxLabel: 'Паводок',
      unit: 'm (WSE)',
    },
  },
  RCM_SAR_BACKSCATTER: {
    id: 'RCM_SAR_BACKSCATTER',
    label: 'CSA RADARSAT / MODIS: Морський лід та вологість поверхні (SAR σ°)',
    layerName: 'MODIS_Terra_NDSI_Snow_Cover',
    matrixSet: 'GoogleMapsCompatible_Level8',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #1e1e2e 0%, #74c7ec 40%, #89b4fa 70%, #cdd6f4 100%)',
      minLabel: '-22 dB (Вода)',
      midLabel: '-13 dB',
      maxLabel: '-5 dB (Лід)',
      unit: 'dB (σ°)',
    },
  },
};

const VARIABLE_TO_GIBS_KEY: Record<string, string> = {
  T2M: 'T2M',
  SST: 'T2M',
  PRECTOTCORR: 'PRECTOTCORR',
  QRUNOFF: 'PRECTOTCORR',
  GWETROOT: 'GWETROOT',
  EVPTRNS: 'GWETROOT',
  AOD: 'AOD',
  SO2: 'SO2',
  ALLSKY_SFC_SW_DWN: 'ALLSKY_SFC_SW_DWN',
  SNODP: 'SNODP',
  SEAWIFS_CHLA: 'SEAWIFS_CHLA',
  SWOT_WSE: 'SWOT_WSE',
  RCM_SAR_BACKSCATTER: 'RCM_SAR_BACKSCATTER',
};

const BASEMAP_THEMES: Record<
  BasemapTheme,
  {
    label: string;
    baseUrl: string;
    refUrl?: string;
    attribution: string;
  }
> = {
  dark: {
    label: 'Темна',
    baseUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    refUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Dark Gray | NASA Earthdata GIBS',
  },
  night: {
    label: 'Нічна',
    baseUrl:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    refUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'NASA VIIRS Earth at Night | Esri',
  },
  satellite: {
    label: 'Супутник',
    baseUrl:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    refUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'NASA Blue Marble Next Generation | GIBS',
  },
};

function createCatppuccinMarkerIcon(
  label: 'A' | 'B',
  colorHex: string,
  pulseClass: string
) {
  return L.divIcon({
    className: 'custom-ctp-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div class="${pulseClass}" style="position: absolute; inset: 0; border-radius: 9999px;"></div>
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: #11111b;
          border: 2.5px solid ${colorHex};
          box-shadow: 0 0 14px ${colorHex};
          color: ${colorHex};
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

const MapClickHandler: React.FC<{
  mode: AnalysisMode;
  activeTarget: 'A' | 'B';
  onMapClickRegion: (target: 'A' | 'B', location: RegionLocation) => void;
}> = ({ mode, activeTarget, onMapClickRegion }) => {
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(3));
      const rawLon = e.latlng.lng;
      const normalizedLon = Number(
        ((((rawLon + 180) % 360 + 360) % 360) - 180).toFixed(3)
      );
      const target: 'A' | 'B' = mode === 'single' ? 'A' : activeTarget;
      const pointLabel =
        target === 'A'
          ? `Точка А (${lat.toFixed(2)}°, ${normalizedLon.toFixed(2)}°)`
          : `Точка Б (${lat.toFixed(2)}°, ${normalizedLon.toFixed(2)}°)`;

      onMapClickRegion(target, {
        name: pointLabel,
        lat,
        lon: normalizedLon,
      });
    },
  });
  return null;
};

const CameraFlyController: React.FC<{
  mode: AnalysisMode;
  regionA: RegionLocation;
  regionB: RegionLocation | null;
  cameraTrigger: number;
}> = ({ mode, regionA, regionB, cameraTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (cameraTrigger === 0) return;

    if (mode === 'dipole' && regionB) {
      const bounds = L.latLngBounds(
        [regionA.lat, regionA.lon],
        [regionB.lat, regionB.lon]
      );
      map.flyToBounds(bounds.pad(0.42), {
        duration: 1.4,
        maxZoom: 5,
      });
    } else {
      map.flyTo([regionA.lat, regionA.lon], 5, {
        duration: 1.3,
      });
    }
  }, [cameraTrigger, mode, regionA, regionB, map]);

  return null;
};

export const EarthMap: React.FC<EarthMapProps> = ({
  mode,
  variable,
  regionA,
  regionB,
  activeTarget,
  cameraTrigger,
  onMapClickRegion,
  onToggleActiveTarget,
}) => {
  const [viewMode, setViewMode] = useState<ViewProjectionMode>('2d');
  const [basemapTheme, setBasemapTheme] = useState<BasemapTheme>('dark');
  const [gibsEnabled, setGibsEnabled] = useState<boolean>(true);
  const [gibsOpacity, setGibsOpacity] = useState<number>(0.55);

  const [customLayerKey, setCustomLayerKey] = useState<string>('AUTO');
  const [gibsDate, setGibsDate] = useState<string>('2024-07-15');
  const [roiShape, setRoiShape] = useState<ROIShapeMode>('circle');
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'a' && viewMode === '3d') {
        setAutoRotate((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const iconA = useMemo(
    () => createCatppuccinMarkerIcon('A', '#89b4fa', 'marker-pulse-blue'),
    []
  );
  const iconB = useMemo(
    () => createCatppuccinMarkerIcon('B', '#fab387', 'marker-pulse-peach'),
    []
  );

  const mappedAutoKey = VARIABLE_TO_GIBS_KEY[variable] || 'T2M';
  const effectiveLayerKey =
    customLayerKey === 'AUTO' ? mappedAutoKey : customLayerKey;
  const gibsConfig =
    TERRA_GIBS_CATALOG[effectiveLayerKey] || TERRA_GIBS_CATALOG.T2M;

  const dateSegment = gibsConfig.isStaticDate ? 'default' : gibsDate;
  const gibsTileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${gibsConfig.layerName}/default/${dateSegment}/${gibsConfig.matrixSet}/{z}/{y}/{x}.${gibsConfig.format}`;
  const activeBasemap = BASEMAP_THEMES[basemapTheme];

  const roiLatLngsA = useMemo(() => {
    return buildROIPolygonCoords(regionA, roiShape).map(
      ([lon, lat]) => [lat, lon] as [number, number]
    );
  }, [regionA, roiShape]);

  const roiLatLngsB = useMemo(() => {
    if (mode !== 'dipole' || !regionB) return [];
    return buildROIPolygonCoords(regionB, roiShape).map(
      ([lon, lat]) => [lat, lon] as [number, number]
    );
  }, [mode, regionB, roiShape]);

  return (
    <div className="w-full h-[640px] min-h-[580px] rounded-md overflow-hidden border border-[#1f1f24] bg-[#0c0c0f] flex flex-col">
      {/* Row 1: Primary Map Controls (2D/3D, Click Target, Basemap, GIBS Opacity) */}
      <div className="px-3.5 py-2 bg-ctp-mantle border-b border-ctp-surface0 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-ctp-crust border border-ctp-surface0 text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('2d');
                setAutoRotate(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono font-semibold transition ${
                viewMode === '2d'
                  ? 'bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/55'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Мапа</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono font-semibold transition ${
                viewMode === '3d'
                  ? 'bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/55'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Глобус</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ctp-crust border border-ctp-surface0 text-xs">
            <Crosshair
              className="w-3.5 h-3.5 text-ctp-blue shrink-0 animate-spin"
              style={{ animationDuration: '8s' }}
            />
            {mode === 'single' ? (
              <span className="font-mono font-semibold text-ctp-blue">
                Клік → Точка А
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleActiveTarget('A')}
                  className={`px-2 py-0.5 rounded font-mono font-semibold transition ${
                    activeTarget === 'A'
                      ? 'bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/55'
                      : 'text-ctp-subtext0 hover:text-ctp-text'
                  }`}
                >
                  Точка А
                </button>
                <span className="text-ctp-surface2">/</span>
                <button
                  type="button"
                  onClick={() => onToggleActiveTarget('B')}
                  className={`px-2 py-0.5 rounded font-mono font-semibold transition ${
                    activeTarget === 'B'
                      ? 'bg-ctp-peach/20 text-ctp-peach border border-ctp-peach/55'
                      : 'text-ctp-subtext0 hover:text-ctp-text'
                  }`}
                >
                  Точка Б
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-ctp-crust border border-ctp-surface0 text-xs">
            {(['dark', 'night', 'satellite'] as BasemapTheme[]).map(
              (themeKey) => (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => setBasemapTheme(themeKey)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition ${
                    basemapTheme === themeKey
                      ? 'bg-ctp-surface0 text-ctp-blue border border-ctp-blue/40 font-semibold'
                      : 'text-ctp-subtext0 hover:text-ctp-text'
                  }`}
                >
                  {BASEMAP_THEMES[themeKey].label}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-ctp-crust border border-ctp-surface0 text-xs">
            <button
              type="button"
              onClick={() => setGibsEnabled((prev) => !prev)}
              className={`flex items-center gap-1.5 font-medium transition ${
                gibsEnabled ? 'text-ctp-teal' : 'text-ctp-subtext0'
              }`}
            >
              {gibsEnabled ? (
                <Eye className="w-3.5 h-3.5 text-ctp-teal" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-ctp-surface2" />
              )}
              <span>GIBS</span>
            </button>

            {gibsEnabled && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-ctp-surface0">
                <span className="text-[11px] text-ctp-subtext0 font-mono w-7 text-right">
                  {Math.round(gibsOpacity * 100)}%
                </span>
                <input
                  type="range"
                  min={0.15}
                  max={0.9}
                  step={0.05}
                  value={gibsOpacity}
                  onChange={(e) => setGibsOpacity(parseFloat(e.target.value))}
                  className="w-14 accent-ctp-blue cursor-pointer h-1 bg-ctp-surface0 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: NASA Terra/Aqua/OMI Instrument Layer Bar + Date + ROI + Globe Controls */}
      <div className="px-3.5 py-1.5 bg-ctp-crust/90 border-b border-ctp-surface0 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono z-20">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-ctp-blue shrink-0" />
            <select
              value={customLayerKey}
              onChange={(e) => setCustomLayerKey(e.target.value)}
              className="bg-ctp-mantle text-ctp-text border border-ctp-surface0 rounded-md px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-ctp-blue"
            >
              <option value="AUTO">
                Авто-шар GIBS (змінна: {variable})
              </option>
              {Object.values(TERRA_GIBS_CATALOG).map((layer) => (
                <option key={layer.id} value={layer.id}>
                  {layer.label}
                </option>
              ))}
            </select>
          </div>

          {!gibsConfig.isStaticDate && (
            <div className="flex items-center gap-1.5 bg-ctp-mantle px-2 py-0.5 rounded-md border border-ctp-surface0">
              <Calendar className="w-3 h-3 text-ctp-sapphire" />
              <span className="text-ctp-subtext0">Дата GIBS:</span>
              <input
                type="date"
                min="2001-01-01"
                max="2025-02-01"
                value={gibsDate}
                onChange={(e) => {
                  if (e.target.value) setGibsDate(e.target.value);
                }}
                className="bg-transparent text-ctp-blue font-mono text-[11px] focus:outline-none cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-ctp-mantle px-2 py-0.5 rounded-md border border-ctp-surface0">
            <Scan className="w-3 h-3 text-ctp-mauve" />
            <span className="text-ctp-subtext0">Зона ROI:</span>
            {(['circle', 'box', 'off'] as ROIShapeMode[]).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => setRoiShape(shape)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                  roiShape === shape
                    ? 'bg-ctp-mauve/20 text-ctp-mauve border border-ctp-mauve/45 font-bold'
                    : 'text-ctp-subtext0 hover:text-ctp-text'
                }`}
              >
                {shape === 'circle'
                  ? 'Коло'
                  : shape === 'box'
                  ? 'Квадрат'
                  : 'Вимк'}
              </button>
            ))}
          </div>

          {viewMode === '3d' && (
            <>
              <button
                type="button"
                onClick={() => setShowGraticule((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border transition ${
                  showGraticule
                    ? 'bg-ctp-blue/15 text-ctp-blue border-ctp-blue/45'
                    : 'bg-ctp-mantle text-ctp-subtext0 border-ctp-surface0'
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>Сітка</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoRotate((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border transition ${
                  autoRotate
                    ? 'bg-ctp-green/20 text-ctp-green border-ctp-green/50'
                    : 'bg-ctp-mantle text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
                }`}
              >
                <RotateCw
                  className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`}
                />
                <span>Обертання [A]</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Center Canvas: 2D Map or 3D WebGL Globe */}
      <div className="relative isolate z-0 flex-1 w-full min-h-[460px] bg-[#070709] overflow-hidden">
        {gibsEnabled && gibsConfig.colorbar && (
          <div className="absolute bottom-3 left-3 z-[1000] px-3 py-2 rounded-xl bg-ctp-crust/90 backdrop-blur-md border border-ctp-surface1 shadow-lg pointer-events-none min-w-[210px]">
            <div className="flex items-center justify-between text-[10px] font-mono text-ctp-text mb-1">
              <span className="font-semibold truncate max-w-[150px]">
                {gibsConfig.label.split(':')[1] || gibsConfig.label}
              </span>
              <span className="text-ctp-blue font-bold ml-2">
                {gibsConfig.colorbar.unit}
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full border border-ctp-surface0"
              style={{ background: gibsConfig.colorbar.gradientCss }}
            />
            <div className="flex items-center justify-between text-[9px] font-mono text-ctp-subtext0 mt-1">
              <span>{gibsConfig.colorbar.minLabel}</span>
              <span>{gibsConfig.colorbar.midLabel}</span>
              <span>{gibsConfig.colorbar.maxLabel}</span>
            </div>
          </div>
        )}

        {viewMode === '3d' ? (
          <Globe3DView
            mode={mode}
            regionA={regionA}
            regionB={regionB}
            activeTarget={activeTarget}
            cameraTrigger={cameraTrigger}
            baseTileUrl={activeBasemap.baseUrl}
            referenceTileUrl={activeBasemap.refUrl}
            gibsTileUrl={gibsTileUrl}
            gibsEnabled={gibsEnabled}
            gibsOpacity={gibsOpacity}
            showGraticule={showGraticule}
            autoRotate={autoRotate}
            roiShape={roiShape}
            onStopAutoRotate={() => setAutoRotate(false)}
            onMapClickRegion={onMapClickRegion}
          />
        ) : (
          <MapContainer
            center={[35.0, 15.0]}
            zoom={2}
            minZoom={2}
            maxZoom={9}
            zoomControl={false}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', minHeight: '460px' }}
            className="w-full h-full"
            worldCopyJump={true}
          >
            <ZoomControl position="bottomright" />

            <TileLayer
              key={activeBasemap.baseUrl}
              attribution={activeBasemap.attribution}
              url={activeBasemap.baseUrl}
            />

            {gibsEnabled && (
              <TileLayer
                key={`${gibsConfig.layerName}-${dateSegment}`}
                url={gibsTileUrl}
                opacity={gibsOpacity}
                attribution="NASA EOSDIS GIBS WMTS"
              />
            )}

            {activeBasemap.refUrl && (
              <TileLayer
                key={activeBasemap.refUrl}
                url={activeBasemap.refUrl}
                opacity={0.75}
              />
            )}

            <MapClickHandler
              mode={mode}
              activeTarget={activeTarget}
              onMapClickRegion={onMapClickRegion}
            />

            <CameraFlyController
              mode={mode}
              regionA={regionA}
              regionB={regionB}
              cameraTrigger={cameraTrigger}
            />

            {roiShape !== 'off' && roiLatLngsA.length > 0 && (
              <Polygon
                positions={roiLatLngsA}
                pathOptions={{
                  color: '#89b4fa',
                  weight: 1.6,
                  dashArray: '4 4',
                  fillColor: '#89b4fa',
                  fillOpacity: 0.14,
                }}
              />
            )}

            <Marker position={[regionA.lat, regionA.lon]} icon={iconA}>
              <Popup>
                <div className="text-xs space-y-1 font-sans">
                  <div className="font-bold text-ctp-blue">
                    REGION A (Primary Target)
                  </div>
                  <div className="font-medium text-ctp-text">{regionA.name}</div>
                  <div className="font-mono text-ctp-subtext0">
                    Lat: {regionA.lat.toFixed(3)}° | Lon:{' '}
                    {regionA.lon.toFixed(3)}°
                  </div>
                </div>
              </Popup>
            </Marker>

            {mode === 'dipole' && regionB && (
              <>
                {roiShape !== 'off' && roiLatLngsB.length > 0 && (
                  <Polygon
                    positions={roiLatLngsB}
                    pathOptions={{
                      color: '#fab387',
                      weight: 1.6,
                      dashArray: '4 4',
                      fillColor: '#fab387',
                      fillOpacity: 0.14,
                    }}
                  />
                )}

                <Marker position={[regionB.lat, regionB.lon]} icon={iconB}>
                  <Popup>
                    <div className="text-xs space-y-1 font-sans">
                      <div className="font-bold text-ctp-peach">
                        REGION B (Dipole Counterpart)
                      </div>
                      <div className="font-medium text-ctp-text">
                        {regionB.name}
                      </div>
                      <div className="font-mono text-ctp-subtext0">
                        Lat: {regionB.lat.toFixed(3)}° | Lon:{' '}
                        {regionB.lon.toFixed(3)}°
                      </div>
                    </div>
                  </Popup>
                </Marker>

                <Polyline
                  positions={[
                    [regionA.lat, regionA.lon],
                    [regionB.lat, regionB.lon],
                  ]}
                  pathOptions={{
                    color: '#cba6f7',
                    weight: 2.2,
                    dashArray: '6 8',
                    opacity: 0.85,
                  }}
                />
              </>
            )}
          </MapContainer>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3.5 py-2 bg-ctp-mantle border-t border-ctp-surface0 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono z-20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-ctp-blue">
            <Radio className="w-3.5 h-3.5 text-ctp-blue shrink-0" />
            <span className="font-bold">A:</span>
            <span className="text-ctp-text truncate max-w-[175px]">
              {regionA.name}
            </span>
            <span className="text-ctp-blue/90">
              [{regionA.lat.toFixed(2)}°, {regionA.lon.toFixed(2)}°]
            </span>
          </div>

          {mode === 'dipole' && regionB && (
            <div className="flex items-center gap-1.5 text-ctp-peach">
              <Navigation className="w-3.5 h-3.5 text-ctp-peach shrink-0" />
              <span className="font-bold">B:</span>
              <span className="text-ctp-text truncate max-w-[175px]">
                {regionB.name}
              </span>
              <span className="text-ctp-peach/90">
                [{regionB.lat.toFixed(2)}°, {regionB.lon.toFixed(2)}°]
              </span>
            </div>
          )}
        </div>

        <div className="text-ctp-subtext0 truncate">
          NASA GIBS:{' '}
          <span className="text-ctp-teal">
            {gibsEnabled ? gibsConfig.layerName : 'Вимкнено'}
          </span>
        </div>
      </div>
    </div>
  );
};
