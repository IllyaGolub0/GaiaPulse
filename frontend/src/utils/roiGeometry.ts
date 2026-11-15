import { RegionLocation } from '../types/climate';

export type ROIShapeMode = 'circle' | 'box' | 'off';

/**
 * Builds polygon ring coordinates [lon, lat] around a target coordinate
 * representing the Region-of-Interest (ROI) bounding box or circle.
 */
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
