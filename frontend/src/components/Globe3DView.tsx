import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AnalysisMode,
  RegionLocation,
} from '../types/climate';

export type ROIShapeMode = 'circle' | 'box' | 'off';

interface Globe3DViewProps {
  mode: AnalysisMode;
  regionA: RegionLocation;
  regionB: RegionLocation | null;
  activeTarget: 'A' | 'B';
  cameraTrigger: number;
  baseTileUrl: string;
  referenceTileUrl?: string;
  gibsTileUrl: string;
  gibsEnabled: boolean;
  gibsOpacity: number;
  showGraticule: boolean;
  autoRotate: boolean;
  roiShape: ROIShapeMode;
  onStopAutoRotate: () => void;
  onMapClickRegion: (target: 'A' | 'B', location: RegionLocation) => void;
}

function buildGreatCircleCoordinates(
  a: RegionLocation,
  b: RegionLocation,
  steps = 64
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(a.lat);
  const lon1 = toRad(a.lon);
  const lat2 = toRad(b.lat);
  const lon2 = toRad(b.lon);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.pow(Math.sin((lon1 - lon2) / 2), 2)
      )
    );

  if (d < 1e-6) {
    return [
      [a.lon, a.lat],
      [b.lon, b.lat],
    ];
  }

  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x =
      A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y =
      A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lon = toDeg(Math.atan2(y, x));
    coords.push([lon, lat]);
  }
  return coords;
}

function buildGraticuleGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (let lat = -75; lat <= 75; lat += 15) {
    const coords: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      coords.push([lon, lat]);
    }
    features.push({
      type: 'Feature',
      properties: { isMajor: lat === 0 ? 1 : 0 },
      geometry: { type: 'LineString', coordinates: coords },
    });
  }

  for (let lon = -180; lon < 180; lon += 15) {
    const coords: [number, number][] = [];
    for (let lat = -85; lat <= 85; lat += 5) {
      coords.push([lon, lat]);
    }
    features.push({
      type: 'Feature',
      properties: { isMajor: lon === 0 ? 1 : 0 },
      geometry: { type: 'LineString', coordinates: coords },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function buildROIPolygonCoords(
  center: RegionLocation,
  shape: ROIShapeMode,
  radiusDeg = 3.2,
  segments = 48
): [number, number][] {
  if (shape === 'off') return [];

  const cosLat = Math.max(0.2, Math.cos((center.lat * Math.PI) / 180));
  const lonScale = radiusDeg / cosLat;

  if (shape === 'box') {
    const minLat = Math.max(-85, center.lat - radiusDeg);
    const maxLat = Math.min(85, center.lat + radiusDeg);
    const minLon = center.lon - lonScale;
    const maxLon = center.lon + lonScale;
    return [
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat],
    ];
  }

  const ring: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const dLat = radiusDeg * Math.sin(angle);
    const dLon = lonScale * Math.cos(angle);
    ring.push([
      center.lon + dLon,
      Math.max(-85, Math.min(85, center.lat + dLat)),
    ]);
  }
  return ring;
}

function createMarkerElement(
  label: 'A' | 'B',
  colorHex: string,
  pulseClass: string
) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '28px';
  wrapper.style.height = '28px';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.cursor = 'pointer';

  const pulse = document.createElement('div');
  pulse.className = pulseClass;
  pulse.style.position = 'absolute';
  pulse.style.inset = '0';
  pulse.style.borderRadius = '9999px';

  const circle = document.createElement('div');
  circle.style.width = '24px';
  circle.style.height = '24px';
  circle.style.borderRadius = '9999px';
  circle.style.background = '#11111b';
  circle.style.border = `2.5px solid ${colorHex}`;
  circle.style.boxShadow = `0 0 14px ${colorHex}`;
  circle.style.color = colorHex;
  circle.style.fontFamily = "'JetBrains Mono', monospace";
  circle.style.fontWeight = '700';
  circle.style.fontSize = '12px';
  circle.style.display = 'flex';
  circle.style.alignItems = 'center';
  circle.style.justifyContent = 'center';
  circle.style.zIndex = '10';
  circle.textContent = label;

  wrapper.appendChild(pulse);
  wrapper.appendChild(circle);
  return wrapper;
}

export const Globe3DView: React.FC<Globe3DViewProps> = ({
  mode,
  regionA,
  regionB,
  activeTarget,
  cameraTrigger,
  baseTileUrl,
  referenceTileUrl,
  gibsTileUrl,
  gibsEnabled,
  gibsOpacity,
  showGraticule,
  autoRotate,
  roiShape,
  onStopAutoRotate,
  onMapClickRegion,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerARef = useRef<maplibregl.Marker | null>(null);
  const markerBRef = useRef<maplibregl.Marker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const clickStateRef = useRef({
    mode,
    activeTarget,
    onMapClickRegion,
    onStopAutoRotate,
  });
  useEffect(() => {
    clickStateRef.current = {
      mode,
      activeTarget,
      onMapClickRegion,
      onStopAutoRotate,
    };
  }, [mode, activeTarget, onMapClickRegion, onStopAutoRotate]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sources: Record<string, maplibregl.SourceSpecification> = {
      'base-tiles': {
        type: 'raster',
        tiles: [baseTileUrl],
        tileSize: 256,
        attribution: 'Esri | NASA Earthdata GIBS',
      },
      'gibs-tiles': {
        type: 'raster',
        tiles: [gibsTileUrl],
        tileSize: 256,
      },
      'graticule-grid': {
        type: 'geojson',
        data: buildGraticuleGeoJSON(),
      },
      'roi-zones': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      },
      'dipole-arc': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      },
    };

    const layers: maplibregl.LayerSpecification[] = [
      {
        id: 'base-layer',
        type: 'raster',
        source: 'base-tiles',
        minzoom: 0,
        maxzoom: 12,
      },
      {
        id: 'gibs-layer',
        type: 'raster',
        source: 'gibs-tiles',
        paint: {
          'raster-opacity': gibsEnabled ? gibsOpacity : 0,
        },
      },
    ];

    if (referenceTileUrl) {
      sources['ref-tiles'] = {
        type: 'raster',
        tiles: [referenceTileUrl],
        tileSize: 256,
      };
      layers.push({
        id: 'ref-layer',
        type: 'raster',
        source: 'ref-tiles',
        paint: {
          'raster-opacity': 0.8,
        },
      });
    }

    layers.push({
      id: 'graticule-layer',
      type: 'line',
      source: 'graticule-grid',
      layout: {
        visibility: showGraticule ? 'visible' : 'none',
      },
      paint: {
        'line-color': '#89b4fa',
        'line-width': ['case', ['==', ['get', 'isMajor'], 1], 1.4, 0.6],
        'line-opacity': ['case', ['==', ['get', 'isMajor'], 1], 0.5, 0.25],
      },
    });

    layers.push({
      id: 'roi-fill-layer',
      type: 'fill',
      source: 'roi-zones',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.16,
      },
    });
    layers.push({
      id: 'roi-line-layer',
      type: 'line',
      source: 'roi-zones',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-dasharray': [2, 2],
        'line-opacity': 0.85,
      },
    });

    layers.push({
      id: 'dipole-arc-layer',
      type: 'line',
      source: 'dipole-arc',
      paint: {
        'line-color': '#cba6f7',
        'line-width': 2.5,
        'line-dasharray': [2, 2],
        'line-opacity': 0.88,
      },
    });

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        projection: {
          type: 'globe',
        },
        sources,
        layers,
      },
      center: [regionA.lon, regionA.lat],
      zoom: 2.0,
      pitch: 15,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'bottom-right'
    );

    map.on('mousedown', () => {
      clickStateRef.current.onStopAutoRotate();
    });

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      const {
        mode: curMode,
        activeTarget: curTarget,
        onMapClickRegion: cb,
      } = clickStateRef.current;
      const lat = Number(Math.max(-85, Math.min(85, e.lngLat.lat)).toFixed(3));
      const rawLon = e.lngLat.lng;
      const lon = Number(
        ((((rawLon + 180) % 360 + 360) % 360) - 180).toFixed(3)
      );
      const target: 'A' | 'B' = curMode === 'single' ? 'A' : curTarget;
      const label =
        target === 'A'
          ? `Точка А (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
          : `Точка Б (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
      cb(target, { name: label, lat, lon });
    });

    mapRef.current = map;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      markerARef.current?.remove();
      markerBRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [baseTileUrl, referenceTileUrl, gibsTileUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer('gibs-layer')) {
      map.setPaintProperty(
        'gibs-layer',
        'raster-opacity',
        gibsEnabled ? gibsOpacity : 0
      );
    }
  }, [gibsEnabled, gibsOpacity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer('graticule-layer')) {
      map.setLayoutProperty(
        'graticule-layer',
        'visibility',
        showGraticule ? 'visible' : 'none'
      );
    }
  }, [showGraticule]);

  useEffect(() => {
    if (!autoRotate) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const spinGlobe = () => {
      const map = mapRef.current;
      if (map) {
        const center = map.getCenter();
        map.setCenter([center.lng + 0.18, center.lat]);
      }
      animFrameRef.current = requestAnimationFrame(spinGlobe);
    };

    animFrameRef.current = requestAnimationFrame(spinGlobe);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [autoRotate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!markerARef.current) {
      const elA = createMarkerElement('A', '#89b4fa', 'marker-pulse-blue');
      markerARef.current = new maplibregl.Marker({ element: elA })
        .setLngLat([regionA.lon, regionA.lat])
        .addTo(map);
    } else {
      markerARef.current.setLngLat([regionA.lon, regionA.lat]);
    }

    if (mode === 'dipole' && regionB) {
      if (!markerBRef.current) {
        const elB = createMarkerElement('B', '#fab387', 'marker-pulse-peach');
        markerBRef.current = new maplibregl.Marker({ element: elB })
          .setLngLat([regionB.lon, regionB.lat])
          .addTo(map);
      } else {
        markerBRef.current.setLngLat([regionB.lon, regionB.lat]);
      }
    } else if (markerBRef.current) {
      markerBRef.current.remove();
      markerBRef.current = null;
    }

    const updateVectors = () => {
      const arcSrc = map.getSource('dipole-arc') as
        | maplibregl.GeoJSONSource
        | undefined;
      if (arcSrc) {
        if (mode === 'dipole' && regionB) {
          const coords = buildGreatCircleCoordinates(regionA, regionB, 64);
          arcSrc.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: coords },
              },
            ],
          });
        } else {
          arcSrc.setData({ type: 'FeatureCollection', features: [] });
        }
      }

      const roiSrc = map.getSource('roi-zones') as
        | maplibregl.GeoJSONSource
        | undefined;
      if (roiSrc) {
        const roiFeatures: GeoJSON.Feature[] = [];
        if (roiShape !== 'off') {
          const ringA = buildROIPolygonCoords(regionA, roiShape);
          if (ringA.length > 0) {
            roiFeatures.push({
              type: 'Feature',
              properties: { color: '#89b4fa' },
              geometry: { type: 'Polygon', coordinates: [ringA] },
            });
          }
          if (mode === 'dipole' && regionB) {
            const ringB = buildROIPolygonCoords(regionB, roiShape);
            if (ringB.length > 0) {
              roiFeatures.push({
                type: 'Feature',
                properties: { color: '#fab387' },
                geometry: { type: 'Polygon', coordinates: [ringB] },
              });
            }
          }
        }
        roiSrc.setData({
          type: 'FeatureCollection',
          features: roiFeatures,
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateVectors();
    } else {
      map.once('load', updateVectors);
    }
  }, [mode, regionA, regionB, roiShape, baseTileUrl, gibsTileUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || cameraTrigger === 0) return;

    if (mode === 'dipole' && regionB) {
      const midLat = (regionA.lat + regionB.lat) / 2;
      const midLon = (regionA.lon + regionB.lon) / 2;
      map.flyTo({
        center: [midLon, midLat],
        zoom: 1.9,
        duration: 1400,
      });
    } else {
      map.flyTo({
        center: [regionA.lon, regionA.lat],
        zoom: 3.5,
        duration: 1300,
      });
    }
  }, [cameraTrigger, mode, regionA, regionB]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '460px' }}
      className="w-full h-full bg-[radial-gradient(ellipse_at_center,_#313244_0%,_#181825_55%,_#11111b_100%)]"
    />
  );
};
