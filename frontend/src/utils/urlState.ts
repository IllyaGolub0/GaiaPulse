import {
  AnalysisMode,
  ClimateVariableCode,
  PhenomenonScenario,
  RegionLocation,
  SeasonMode,
  VariableMetadata,
} from '../types/climate';
import {
  clampYearRangeForVariable,
  DEFAULT_VARIABLES,
  FALLBACK_PHENOMENA_SCENARIOS,
  getVariableMetaLocal,
} from '../services/api';

export const SCENARIO_SHORT_CODES: Record<string, string> = {
  'wisconsin-wildfire-smoke': 'wisconsin',
  'ackers-seawifs-coastal-study': 'seawifs',
  'csa-swot-radarsat-water-ice': 'csa',
  'kasatochi-volcanic-cooling': 'kasatochi',
  'enso-pacific-dipole': 'enso',
  'arctic-atlantic-dipole': 'arctic',
  'ukraine-steppe-soil-moisture': 'steppe',
  'eonet-fallback-wildfires-canada': 'eonet-fire',
  'eonet-fallback-volcano-reykjanes': 'eonet-volcano',
  'eonet-fallback-storm-atlantic': 'eonet-storm',
  'eonet-fallback-drought-amazon': 'eonet-drought',
};

const SHORT_CODE_TO_SCENARIO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SCENARIO_SHORT_CODES).map(([id, code]) => [code, id])
);

const SEASON_TO_SHORT: Record<SeasonMode, string> = {
  raw: 'r',
  deseasonalized: 'd',
  DJF: 'DJF',
  MAM: 'MAM',
  JJA: 'JJA',
  SON: 'SON',
};

const SHORT_TO_SEASON: Record<string, SeasonMode> = {
  r: 'raw',
  raw: 'raw',
  d: 'deseasonalized',
  deseasonalized: 'deseasonalized',
  DJF: 'DJF',
  MAM: 'MAM',
  JJA: 'JJA',
  SON: 'SON',
};

const SUPPORTED_VAR_CODES = new Set<string>(DEFAULT_VARIABLES.map((v) => v.code));

export interface YearPresetOption {
  label: string;
  start: number;
  end: number;
}

const RECENT_MILESTONE_STARTS = [1985, 2000, 2002, 2004, 2010, 2015, 2019, 2020];
const HISTORICAL_YEAR_WINDOWS: Array<[number, number]> = [
  [1998, 2005],
  [2003, 2010],
];

export function getYearPresetsForVariable(
  varMeta?: Pick<VariableMetadata, 'min_year' | 'max_year'>
): YearPresetOption[] {
  const varMin = varMeta?.min_year ?? 1981;
  const varMax = varMeta?.max_year ?? 2025;
  const full: YearPresetOption = {
    label: `${varMin}–${varMax}`,
    start: varMin,
    end: varMax,
  };

  const recentExtras: YearPresetOption[] = RECENT_MILESTONE_STARTS.filter(
    (s) => s > varMin && varMax - s >= 4
  ).map((s) => ({
    label: `${s}–${varMax}`,
    start: s,
    end: varMax,
  }));

  const historicalExtras: YearPresetOption[] = HISTORICAL_YEAR_WINDOWS.filter(
    ([s, e]) =>
      s >= varMin &&
      e <= varMax &&
      e - s >= 4 &&
      !(s === varMin && e === varMax)
  ).map(([s, e]) => ({ label: `${s}–${e}`, start: s, end: e }));

  return [full, ...recentExtras, ...historicalExtras];
}

export interface UrlInvestigationState {
  activeScenarioId: string;
  mode: AnalysisMode;
  variable: ClimateVariableCode;
  seasonMode: SeasonMode;
  startYear: number;
  endYear: number;
  regionA: RegionLocation;
  regionB: RegionLocation;
}

const COMPACT_QUERY_REGEX =
  /^([A-Z0-9_]+)\.([a-zA-Z]+)\.(\d{4})-(\d{4})\.(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:~(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?$/;

const DEFAULT_REGION_B: RegionLocation = {
  name: 'Northern Ontario Forest, Canada',
  lat: 50.5,
  lon: -86.0,
};

function coordsNear(a: RegionLocation, b: RegionLocation): boolean {
  return Math.abs(a.lat - b.lat) < 0.02 && Math.abs(a.lon - b.lon) < 0.02;
}

function stateMatchesScenario(
  state: Pick<
    UrlInvestigationState,
    | 'variable'
    | 'seasonMode'
    | 'startYear'
    | 'endYear'
    | 'mode'
    | 'regionA'
    | 'regionB'
  >,
  scenario: PhenomenonScenario
): boolean {
  if (
    state.variable !== scenario.variable ||
    state.seasonMode !== scenario.season_mode ||
    state.startYear !== scenario.start_year ||
    state.endYear !== scenario.end_year ||
    state.mode !== scenario.mode ||
    !coordsNear(state.regionA, scenario.region_a)
  ) {
    return false;
  }
  if (state.mode === 'dipole') {
    return Boolean(
      scenario.region_b && coordsNear(state.regionB, scenario.region_b)
    );
  }
  return true;
}

function isValidCoord(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export function encodeUrlSearch(
  state: UrlInvestigationState,
  scenarios: PhenomenonScenario[] = FALLBACK_PHENOMENA_SCENARIOS
): string {
  const defaultScenario = scenarios[0] || FALLBACK_PHENOMENA_SCENARIOS[0];
  if (stateMatchesScenario(state, defaultScenario)) {
    return '';
  }

  const matchedScenario =
    scenarios.find(
      (s) => s.id === state.activeScenarioId && s.id in SCENARIO_SHORT_CODES
    ) ||
    scenarios.find(
      (s) => s.id in SCENARIO_SHORT_CODES && stateMatchesScenario(state, s)
    );

  if (matchedScenario && stateMatchesScenario(state, matchedScenario)) {
    const shortCode = SCENARIO_SHORT_CODES[matchedScenario.id];
    if (shortCode) {
      return `?s=${shortCode}`;
    }
  }

  const seasonShort = SEASON_TO_SHORT[state.seasonMode] || state.seasonMode;
  const coordA = `${state.regionA.lat.toFixed(2)},${state.regionA.lon.toFixed(2)}`;
  const coordPart =
    state.mode === 'dipole'
      ? `${coordA}~${state.regionB.lat.toFixed(2)},${state.regionB.lon.toFixed(2)}`
      : coordA;

  return `?q=${state.variable}.${seasonShort}.${state.startYear}-${state.endYear}.${coordPart}`;
}

export function parseInitialUrlState(
  search: string,
  scenarios: PhenomenonScenario[] = FALLBACK_PHENOMENA_SCENARIOS
): UrlInvestigationState {
  const baseScenario = scenarios[0] || FALLBACK_PHENOMENA_SCENARIOS[0];
  const baseState: UrlInvestigationState = {
    activeScenarioId: baseScenario.id,
    mode: baseScenario.mode,
    variable: baseScenario.variable,
    seasonMode: baseScenario.season_mode,
    startYear: baseScenario.start_year,
    endYear: baseScenario.end_year,
    regionA: baseScenario.region_a,
    regionB: baseScenario.region_b || DEFAULT_REGION_B,
  };

  if (!search) {
    return baseState;
  }

  const params = new URLSearchParams(search);

  // 1. Short scenario link: ?s=<shortCode_or_id>
  const sParam = params.get('s') || params.get('scenario');
  if (sParam) {
    const resolvedId = SHORT_CODE_TO_SCENARIO_ID[sParam] || sParam;
    const found = scenarios.find((sc) => sc.id === resolvedId);
    if (found) {
      const varMeta = getVariableMetaLocal(found.variable);
      const [clampedStart, clampedEnd] = clampYearRangeForVariable(
        found.start_year,
        found.end_year,
        varMeta
      );
      return {
        activeScenarioId: found.id,
        mode: found.mode,
        variable: found.variable,
        seasonMode: found.season_mode,
        startYear: clampedStart,
        endYear: clampedEnd,
        regionA: found.region_a,
        regionB: found.region_b || DEFAULT_REGION_B,
      };
    }
  }

  // 2. Compact query link: ?q=VAR.SEASON.START-END.LAT,LON[~LATB,LONB]
  const qParam = params.get('q');
  if (qParam) {
    const match = qParam.trim().match(COMPACT_QUERY_REGEX);
    if (match) {
      const [, rawVar, rawSeason, rawStart, rawEnd, rawLatA, rawLonA, rawLatB, rawLonB] =
        match;
      const varCode = SUPPORTED_VAR_CODES.has(rawVar)
        ? (rawVar as ClimateVariableCode)
        : baseScenario.variable;
      const season = SHORT_TO_SEASON[rawSeason] || 'raw';
      const varMeta = getVariableMetaLocal(varCode);
      const [clampedStart, clampedEnd] = clampYearRangeForVariable(
        Number(rawStart),
        Number(rawEnd),
        varMeta
      );
      const latA = parseFloat(rawLatA);
      const lonA = parseFloat(rawLonA);
      const regionA: RegionLocation = isValidCoord(latA, lonA)
        ? {
            name: `${latA.toFixed(2)}°, ${lonA.toFixed(2)}°`,
            lat: latA,
            lon: lonA,
          }
        : baseScenario.region_a;

      let mode: AnalysisMode = 'single';
      let regionB = DEFAULT_REGION_B;
      if (rawLatB !== undefined && rawLonB !== undefined) {
        const latB = parseFloat(rawLatB);
        const lonB = parseFloat(rawLonB);
        if (isValidCoord(latB, lonB)) {
          mode = 'dipole';
          regionB = {
            name: `${latB.toFixed(2)}°, ${lonB.toFixed(2)}°`,
            lat: latB,
            lon: lonB,
          };
        }
      }

      return {
        activeScenarioId: 'custom',
        mode,
        variable: varCode,
        seasonMode: season,
        startYear: clampedStart,
        endYear: clampedEnd,
        regionA,
        regionB,
      };
    }
  }

  // 3. Backwards-compatible legacy parameters: ?var=...&season=...&start=...&end=...
  const legacyVar = params.get('var');
  const varCode: ClimateVariableCode =
    legacyVar && SUPPORTED_VAR_CODES.has(legacyVar)
      ? (legacyVar as ClimateVariableCode)
      : baseState.variable;
  const varMeta = getVariableMetaLocal(varCode);

  const legacySeason = params.get('season');
  const season: SeasonMode =
    legacySeason && legacySeason in SHORT_TO_SEASON
      ? SHORT_TO_SEASON[legacySeason]
      : baseState.seasonMode;

  const rawStart = Number(params.get('start'));
  const rawEnd = Number(params.get('end'));
  const [clampedStart, clampedEnd] = clampYearRangeForVariable(
    Number.isFinite(rawStart) && rawStart >= 1981 ? rawStart : baseState.startYear,
    Number.isFinite(rawEnd) && rawEnd >= 1985 ? rawEnd : baseState.endYear,
    varMeta
  );

  const legacyMode = params.get('mode');
  const mode: AnalysisMode =
    legacyMode === 'dipole' || legacyMode === 'single'
      ? legacyMode
      : baseState.mode;

  const latA = parseFloat(params.get('lat') || '');
  const lonA = parseFloat(params.get('lon') || '');
  const legacyName = params.get('name');
  const regionA: RegionLocation = isValidCoord(latA, lonA)
    ? {
        name: legacyName || `${latA.toFixed(2)}°, ${lonA.toFixed(2)}°`,
        lat: latA,
        lon: lonA,
      }
    : baseState.regionA;

  return {
    activeScenarioId: sParam || 'custom',
    mode,
    variable: varCode,
    seasonMode: season,
    startYear: clampedStart,
    endYear: clampedEnd,
    regionA,
    regionB: baseState.regionB,
  };
}
