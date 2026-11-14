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
import { Language, useLanguage } from '../i18n/translations';

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
  labelEn: string;
  layerName: string;
  matrixSet: string;
  format: 'png' | 'jpg';
  isStaticDate?: boolean;
  colorbar?: {
    gradientCss: string;
    minLabel: string;
    minLabelEn?: string;
    midLabel: string;
    midLabelEn?: string;
    maxLabel: string;
    maxLabelEn?: string;
    unit: string;
    unitEn?: string;
  };
}

export const TERRA_GIBS_CATALOG: Record<string, GibsLayerConfig> = {
  T2M: {
    id: 'T2M',
    label: 'MODIS: Температура поверхні (LST Day)',
    labelEn: 'MODIS: Land Surface Temperature (LST Day)',
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
    labelEn: 'GPM IMERG: Precipitation Rate',
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
      unitEn: 'mm/hr',
    },
  },
  GWETROOT: {
    id: 'GWETROOT',
    label: 'SMAP L4: Вологість ґрунту (Root Zone)',
    labelEn: 'SMAP L4: Root Zone Soil Moisture',
    layerName: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #fab387 0%, #f9e2af 30%, #a6e3a1 65%, #89b4fa 100%)',
      minLabel: '0.05 (Посуха)',
      minLabelEn: '0.05 (Dry)',
      midLabel: '0.35',
      maxLabel: '0.65 (Волого)',
      maxLabelEn: '0.65 (Wet)',
      unit: 'м³/м³',
      unitEn: 'm³/m³',
    },
  },
  AOD: {
    id: 'AOD',
    label: 'MODIS Aqua/Terra: Аерозолі та Дим Пожеж (AOD)',
    labelEn: 'MODIS Aqua/Terra: Wildfire Smoke & Aerosols (AOD)',
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
    labelEn: 'Aura OMI / MODIS: Volcanic Plume & Sulfates (SO₂/AOD)',
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
    labelEn: 'MODIS Terra: True Color (Clouds & Solar Flux)',
    layerName: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
  },
  SNODP: {
    id: 'SNODP',
    label: 'MODIS: Сніговий та льодовий покрив (NDSI)',
    labelEn: 'MODIS: Snow & Ice Cover (NDSI)',
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
      unitEn: 'Snow/Ice',
    },
  },
  TERRA_BANDS_721: {
    id: 'TERRA_BANDS_721',
    label: 'MODIS Terra: ІЧ-композит Bands 7-2-1 (Повені / Згарища)',
    labelEn: 'MODIS Terra: SWIR Bands 7-2-1 (Floods / Burn Scars)',
    layerName: 'MODIS_Terra_CorrectedReflectance_Bands721',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
  },
  ASTER_RELIEF: {
    id: 'ASTER_RELIEF',
    label: 'ASTER GDEM: Кольоровий рельєф висот Землі',
    labelEn: 'ASTER GDEM: Color Shaded Relief Elevation',
    layerName: 'ASTER_GDEM_Color_Shaded_Relief',
    matrixSet: 'GoogleMapsCompatible_Level12',
    format: 'jpg',
    isStaticDate: true,
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #a6e3a1 0%, #f9e2af 45%, #fab387 75%, #cdd6f4 100%)',
      minLabel: '0 м',
      minLabelEn: '0 m',
      midLabel: '1500 м',
      midLabelEn: '1500 m',
      maxLabel: '5000+ м',
      maxLabelEn: '5000+ m',
      unit: 'Висота',
      unitEn: 'Elevation',
    },
  },
  SEAWIFS_CHLA: {
    id: 'SEAWIFS_CHLA',
    label: 'MODIS Aqua / SeaWiFS: Прибережний хлорофіл-а (Ocean Color)',
    labelEn: 'MODIS Aqua / SeaWiFS: Coastal Chlorophyll-a (Ocean Color)',
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
    labelEn: 'SWOT / MODIS Bands 7-2-1: Water Surface Elevation (WSE)',
    layerName: 'MODIS_Terra_CorrectedReflectance_Bands721',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #1e3a8a 0%, #89b4fa 45%, #94e2d5 75%, #a6e3a1 100%)',
      minLabel: 'Низький',
      minLabelEn: 'Low',
      midLabel: 'Норма',
      midLabelEn: 'Normal',
      maxLabel: 'Паводок',
      maxLabelEn: 'Flood',
      unit: 'm (WSE)',
    },
  },
  RCM_SAR_BACKSCATTER: {
    id: 'RCM_SAR_BACKSCATTER',
    label: 'CSA RADARSAT / MODIS: Морський лід та вологість поверхні (SAR σ°)',
    labelEn: 'CSA RADARSAT / MODIS: Sea Ice & Surface Moisture (SAR σ°)',
    layerName: 'MODIS_Terra_NDSI_Snow_Cover',
    matrixSet: 'GoogleMapsCompatible_Level8',
    format: 'png',
    colorbar: {
      gradientCss:
        'linear-gradient(90deg, #1e1e2e 0%, #74c7ec 40%, #89b4fa 70%, #cdd6f4 100%)',
      minLabel: '-22 dB (Вода)',
      minLabelEn: '-22 dB (Water)',
      midLabel: '-13 dB',
      maxLabel: '-5 dB (Лід)',
      maxLabelEn: '-5 dB (Ice)',
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
    labelEn: string;
    baseUrl: string;
    refUrl?: string;
    attribution: string;
  }
> = {
  dark: {
    label: 'Темна',
    labelEn: 'Dark',
    baseUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    refUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Dark Gray | NASA Earthdata GIBS',
  },
  night: {
    label: 'Нічна',
    labelEn: 'Night',
    baseUrl:
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    refUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'NASA VIIRS Earth at Night | Esri',
  },
  satellite: {
    label: 'Супутник',
    labelEn: 'Satellite',
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
  lang: Language;
  onMapClickRegion: (target: 'A' | 'B', location: RegionLocation) => void;
}> = ({ mode, activeTarget, lang, onMapClickRegion }) => {
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(3));
      const rawLon = e.latlng.lng;
      const normalizedLon = Number(
        ((((rawLon + 180) % 360 + 360) % 360) - 180).toFixed(3)
      );
      const target: 'A' | 'B' = mode === 'single' ? 'A' : activeTarget;
      const prefix =
        target === 'A'
          ? lang === 'en'
            ? 'Point A'
            : 'Точка А'
          : lang === 'en'
          ? 'Point B'
          : 'Точка Б';
      const pointLabel = `${prefix} (${lat.toFixed(2)}°, ${normalizedLon.toFixed(2)}°)`;

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
  const { lang } = useLanguage();
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

  const [layersOpen, setLayersOpen] = useState<boolean>(false);
  const activeLayerDisplayLabel =
    lang === 'en' ? gibsConfig.labelEn : gibsConfig.label;

  const en = lang === 'en';
  const floatBtn =
    'h-9 px-2.5 rounded-md text-sm transition flex items-center gap-1.5';
  const floatGroup =
    'flex items-center p-0.5 rounded-md bg-[#0c0c0f]/95 backdrop-blur border border-[#2a2a32] shadow-lg';

  return (
    <div className="relative isolate w-full h-full min-h-[360px] rounded-md overflow-hidden border border-[#1f1f24] bg-[#070709]">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Floating controls: projection + active point (top-left) */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
          <div className={floatGroup}>
            <button
              type="button"
              onClick={() => {
                setViewMode('2d');
                setAutoRotate(false);
              }}
              aria-pressed={viewMode === '2d'}
              className={`${floatBtn} ${
                viewMode === '2d'
                  ? 'bg-zinc-100 text-zinc-950 font-medium'
                  : 'text-zinc-200 hover:text-white'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>{en ? 'Map' : 'Карта'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              aria-pressed={viewMode === '3d'}
              className={`${floatBtn} ${
                viewMode === '3d'
                  ? 'bg-zinc-100 text-zinc-950 font-medium'
                  : 'text-zinc-200 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{en ? 'Globe' : 'Глобус'}</span>
            </button>
          </div>

          {mode === 'dipole' && (
            <div className={floatGroup}>
              <span className="px-2 text-xs text-zinc-300">
                {en ? 'Click sets' : 'Клік ставить'}
              </span>
              <button
                type="button"
                onClick={() => onToggleActiveTarget('A')}
                aria-pressed={activeTarget === 'A'}
                className={`${floatBtn} ${
                  activeTarget === 'A'
                    ? 'bg-sky-500/25 text-sky-300 font-medium'
                    : 'text-zinc-200 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                {en ? 'Point A' : 'Точку A'}
              </button>
              <button
                type="button"
                onClick={() => onToggleActiveTarget('B')}
                aria-pressed={activeTarget === 'B'}
                className={`${floatBtn} ${
                  activeTarget === 'B'
                    ? 'bg-orange-500/25 text-orange-300 font-medium'
                    : 'text-zinc-200 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                {en ? 'Point B' : 'Точку B'}
              </button>
            </div>
          )}
        </div>

        {/* Floating controls: layers popover (top-right) */}
        <div className="absolute top-3 right-3 z-[1001] flex flex-col items-end gap-2">
          <div className={floatGroup}>
            <button
              type="button"
              onClick={() => setLayersOpen((prev) => !prev)}
              aria-expanded={layersOpen}
              className={`${floatBtn} ${
                layersOpen
                  ? 'bg-zinc-100 text-zinc-950 font-medium'
                  : 'text-zinc-200 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{en ? 'Layers' : 'Шари'}</span>
            </button>
          </div>

          {layersOpen && (
            <div className="w-80 max-w-[calc(100vw-2rem)] rounded-md bg-[#0c0c0f] border border-[#2a2a32] shadow-2xl p-3 space-y-3 text-sm text-zinc-100">
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-400">
                  {en ? 'Base map' : 'Підкладка'}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['dark', 'night', 'satellite'] as BasemapTheme[]).map(
                    (themeKey) => (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setBasemapTheme(themeKey)}
                        className={`h-8 rounded-md text-sm border transition ${
                          basemapTheme === themeKey
                            ? 'bg-zinc-800 text-zinc-50 border-zinc-500 font-medium'
                            : 'text-zinc-300 border-[#2a2a32] hover:text-white'
                        }`}
                      >
                        {en
                          ? BASEMAP_THEMES[themeKey].labelEn
                          : BASEMAP_THEMES[themeKey].label}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gibsEnabled}
                    onChange={(e) => setGibsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-sky-500"
                  />
                  <span>
                    {en
                      ? 'Show NASA satellite layer'
                      : 'Показувати супутниковий шар NASA'}
                  </span>
                </label>

                {gibsEnabled && (
                  <>
                    <select
                      value={customLayerKey}
                      onChange={(e) => setCustomLayerKey(e.target.value)}
                      className="h-9 w-full bg-[#09090b] text-zinc-100 border border-[#2a2a32] rounded-md px-2 text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="AUTO">
                        {en
                          ? 'Automatic (matches the variable)'
                          : 'Автоматично (за показником)'}
                      </option>
                      {Object.values(TERRA_GIBS_CATALOG).map((layer) => (
                        <option key={layer.id} value={layer.id}>
                          {en ? layer.labelEn : layer.label}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="w-28">
                        {en ? 'Opacity' : 'Прозорість'}{' '}
                        {Math.round(gibsOpacity * 100)}%
                      </span>
                      <input
                        type="range"
                        min={0.15}
                        max={0.9}
                        step={0.05}
                        value={gibsOpacity}
                        onChange={(e) =>
                          setGibsOpacity(parseFloat(e.target.value))
                        }
                        className="flex-1 accent-sky-500 cursor-pointer"
                      />
                    </label>

                    {!gibsConfig.isStaticDate && (
                      <label className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="w-28">
                          {en ? 'Image date' : 'Дата знімка'}
                        </span>
                        <input
                          type="date"
                          min="2001-01-01"
                          max="2025-02-01"
                          value={gibsDate}
                          onChange={(e) => {
                            if (e.target.value) setGibsDate(e.target.value);
                          }}
                          className="flex-1 h-8 bg-[#09090b] border border-[#2a2a32] rounded-md px-2 text-sm text-zinc-100 focus:outline-none"
                        />
                      </label>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-xs text-zinc-400">
                  {en
                    ? 'Area outline around the point'
                    : 'Контур області навколо точки'}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['circle', 'box', 'off'] as ROIShapeMode[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setRoiShape(shape)}
                      className={`h-8 rounded-md text-sm border transition ${
                        roiShape === shape
                          ? 'bg-zinc-800 text-zinc-50 border-zinc-500 font-medium'
                          : 'text-zinc-300 border-[#2a2a32] hover:text-white'
                      }`}
                    >
                      {shape === 'circle'
                        ? en
                          ? 'Circle'
                          : 'Коло'
                        : shape === 'box'
                        ? en
                          ? 'Square'
                          : 'Квадрат'
                        : en
                        ? 'Hidden'
                        : 'Сховати'}
                    </button>
                  ))}
                </div>
              </div>

              {viewMode === '3d' && (
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGraticule}
                      onChange={(e) => setShowGraticule(e.target.checked)}
                      className="w-4 h-4 accent-sky-500"
                    />
                    <span>{en ? 'Coordinate grid' : 'Сітка координат'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                      className="w-4 h-4 accent-sky-500"
                    />
                    <span>{en ? 'Rotate the globe' : 'Обертати глобус'}</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {gibsEnabled && gibsConfig.colorbar && (
          <div className="absolute bottom-3 left-3 z-[1000] px-3 py-2 rounded-xl bg-ctp-crust/90 backdrop-blur-md border border-ctp-surface1 shadow-lg pointer-events-none min-w-[210px]">
            <div className="flex items-center justify-between text-xs font-mono text-ctp-text mb-1">
              <span className="font-semibold truncate max-w-[150px]">
                {activeLayerDisplayLabel.split(':')[1] || activeLayerDisplayLabel}
              </span>
              <span className="text-ctp-blue font-bold ml-2">
                {lang === 'en' && gibsConfig.colorbar.unitEn
                  ? gibsConfig.colorbar.unitEn
                  : gibsConfig.colorbar.unit}
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full border border-ctp-surface0"
              style={{ background: gibsConfig.colorbar.gradientCss }}
            />
            <div className="flex items-center justify-between text-xs font-mono text-ctp-subtext0 mt-1">
              <span>
                {lang === 'en' && gibsConfig.colorbar.minLabelEn
                  ? gibsConfig.colorbar.minLabelEn
                  : gibsConfig.colorbar.minLabel}
              </span>
              <span>
                {lang === 'en' && gibsConfig.colorbar.midLabelEn
                  ? gibsConfig.colorbar.midLabelEn
                  : gibsConfig.colorbar.midLabel}
              </span>
              <span>
                {lang === 'en' && gibsConfig.colorbar.maxLabelEn
                  ? gibsConfig.colorbar.maxLabelEn
                  : gibsConfig.colorbar.maxLabel}
              </span>
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
            style={{ width: '100%', height: '100%' }}
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
              lang={lang}
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
                <div className="text-sm space-y-1 font-sans">
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
                    <div className="text-sm space-y-1 font-sans">
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

    </div>
  );
};
