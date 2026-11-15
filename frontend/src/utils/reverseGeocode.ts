import { Language } from '../i18n/translations';

// In-memory cache for reverse geocoding to prevent redundant network queries
const geocodeCache = new Map<string, string>();

interface BigDataCloudLocalityItem {
  name?: string;
  description?: string;
  adminLevel?: number;
}

interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  localityInfo?: {
    administrative?: BigDataCloudLocalityItem[];
    informative?: BigDataCloudLocalityItem[];
  };
}

interface NominatimResponse {
  address?: {
    village?: string;
    town?: string;
    city?: string;
    hamlet?: string;
    suburb?: string;
    municipality?: string;
    county?: string;
    state?: string;
    state_district?: string;
    country?: string;
  };
  display_name?: string;
}

function isDistrictOrAdministrative(s?: string): boolean {
  if (!s) return false;
  return /(район|громада|district|county|municipality|borough|board)/i.test(s);
}

function extractLocalName(data: BigDataCloudResponse): string | undefined {
  let city = (data.city || '').trim();
  let locality = (data.locality || '').trim();

  // If locality is missing or an administrative district/board, search admin levels for a clean village or town
  if (!locality || isDistrictOrAdministrative(locality)) {
    const admin = data.localityInfo?.administrative;
    if (admin && admin.length > 0) {
      for (let i = admin.length - 1; i >= 0; i--) {
        const item = admin[i];
        const name = item.name?.trim();
        if (
          name &&
          !isDistrictOrAdministrative(name) &&
          name !== data.countryName &&
          name !== data.principalSubdivision
        ) {
          locality = name;
          break;
        }
      }
    }
  }

  if (locality && isDistrictOrAdministrative(city)) {
    return locality;
  }
  if (city && !isDistrictOrAdministrative(city)) {
    if (
      locality &&
      !city.toLowerCase().includes(locality.toLowerCase()) &&
      !isDistrictOrAdministrative(locality)
    ) {
      return `${locality}, ${city}`;
    }
    return city;
  }
  return locality || city || undefined;
}

/**
 * Clean and combine place components into a concise, human-readable name:
 * e.g. "Диканька, Полтавська область, Україна" or "Bedourie, Queensland, Australia"
 */
function buildFriendlyName(
  localName: string | undefined,
  subdivision: string | undefined,
  country: string | undefined
): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  const addPart = (raw?: string) => {
    if (!raw) return;
    const clean = raw.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      parts.push(clean);
    }
  };

  addPart(localName);
  addPart(subdivision);
  addPart(country);

  return parts.join(', ');
}

/**
 * Reverse geocode coordinates to a human-friendly place name (city, village, region, country, or water body).
 * Uses BigDataCloud client-side API with an OpenStreetMap Nominatim fallback.
 */
export async function reverseGeocodePlace(
  lat: number,
  lon: number,
  lang: Language = 'ua'
): Promise<string | null> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${lang}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const langCode = lang === 'en' ? 'en' : 'uk';

  // 1. Primary: BigDataCloud reverse geocode client (free, client-side, highly detailed)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${langCode}`;

    const resp = await fetch(bdcUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data: BigDataCloudResponse = await resp.json();

      const local = extractLocalName(data);
      const subdiv = data.principalSubdivision;
      const country = data.countryName;

      let result = buildFriendlyName(local, subdiv, country);

      // If over oceans, seas or lakes without administrative land boundaries
      if (!result && data.localityInfo?.informative) {
        for (const item of data.localityInfo.informative) {
          if (item.name) {
            result = item.name;
            break;
          }
        }
      }

      if (result) {
        geocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Proceed to fallback
  }

  // 2. Secondary fallback: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=11&addressdetails=1&accept-language=${langCode}`;

    const resp = await fetch(osmUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data: NominatimResponse = await resp.json();
      const addr = data.address || {};
      const local =
        addr.village ||
        addr.town ||
        addr.city ||
        addr.hamlet ||
        addr.suburb ||
        addr.municipality;
      const subdiv = addr.state || addr.state_district || addr.county;
      const country = addr.country;

      const result = buildFriendlyName(local, subdiv, country) || data.display_name;
      if (result) {
        geocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Both failed
  }

  return null;
}

/**
 * Returns a user-friendly location name for the point.
 * If reverse geocoding succeeds, returns "City/Village, Region, Country".
 * Otherwise, falls back to "Point A (lat°, lon°)".
 */
export async function getFriendlyLocationName(
  target: 'A' | 'B',
  lat: number,
  lon: number,
  lang: Language = 'ua'
): Promise<string> {
  const place = await reverseGeocodePlace(lat, lon, lang);
  if (place) {
    return place;
  }
  const prefix =
    target === 'A'
      ? lang === 'en'
        ? 'Point A'
        : 'Точка А'
      : lang === 'en'
      ? 'Point B'
      : 'Точка Б';
  return `${prefix} (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
}
