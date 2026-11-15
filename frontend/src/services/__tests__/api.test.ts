import { describe, expect, it } from 'vitest';
import {
  analyzeCsvClientSideFallback,
  clampYearRangeForVariable,
  DEFAULT_VARIABLES,
  FALLBACK_PHENOMENA_SCENARIOS,
  getVariableMetaLocal,
} from '../api';
import {
  encodeUrlSearch,
  getYearPresetsForVariable,
  parseInitialUrlState,
} from '../../utils/urlState';

describe('analyzeCsvClientSideFallback', () => {
  it('parses NASA Giovanni comment headers, YYYY-MM dates, and detects significant upward trend', () => {
    const rows: string[] = [
      '# Title: MODIS Aqua AOD 550nm',
      '# Region: Wisconsin',
      'Date,Value',
    ];
    for (let yr = 2002; yr <= 2025; yr++) {
      const idx = yr - 2002;
      rows.push(`${yr}-06,${(0.12 + idx * 0.008).toFixed(4)}`);
      rows.push(`${yr}-07,${(0.15 + idx * 0.009).toFixed(4)}`);
      rows.push(`${yr}-08,${(0.13 + idx * 0.008).toFixed(4)}`);
    }

    const result = analyzeCsvClientSideFallback({
      csv_text: rows.join('\n'),
      dataset_name: 'Giovanni AOD Test',
      variable_code: 'AOD',
      season_mode: 'JJA',
      lang: 'en',
    });

    expect(result.csv_import_metadata?.years_count).toBe(24);
    expect(result.csv_import_metadata?.start_year).toBe(2002);
    expect(result.csv_import_metadata?.end_year).toBe(2025);
    expect(result.region_a_analysis.data_origin).toBe('user_csv');
    expect(result.region_a_analysis.human_summary).toContain('Statistically significant trend');
    expect(result.region_a_analysis.statistics.is_significant).toBe(true);
    expect(result.region_a_analysis.statistics.mk_trend).toBe('increasing');
    expect(result.region_a_analysis.statistics.change_per_decade).toBeGreaterThan(0.05);
  });

  it('filters fill values <= -900 and supports annual YYYY rows with semicolon delimiter', () => {
    const csv = [
      'Year;Value',
      '2000;-9999',
      '2001;10.0',
      '2002;10.5',
      '2003;11.0',
      '2004;-999.9',
      '2005;12.0',
      '2006;12.5',
    ].join('\n');

    const result = analyzeCsvClientSideFallback({
      csv_text: csv,
      dataset_name: 'Annual Semicolon Series',
      variable_code: 'T2M',
      season_mode: 'raw',
    });

    expect(result.csv_import_metadata?.total_observations).toBe(5);
    expect(result.region_a_analysis.time_series.map((p) => p.year)).toEqual([
      2001, 2002, 2003, 2005, 2006,
    ]);
  });

  it('throws descriptive error when CSV has fewer than 3 valid rows', () => {
    expect(() =>
      analyzeCsvClientSideFallback({
        csv_text: 'Date,Value\n2020-01,1.2\n2021-01,1.4',
        dataset_name: 'Too Short',
        variable_code: 'T2M',
      })
    ).toThrow();
  });
});

describe('satellite mission year bounds clamping', () => {
  it('clamps SeaWiFS (1998-2010), AOD (2002-2024), SO2 (2004-2024), SNODP (2000-2024), SWOT (2016-2025), and RCM (2019-2025)', () => {
    expect(
      clampYearRangeForVariable(1990, 2026, getVariableMetaLocal('SEAWIFS_CHLA'))
    ).toEqual([1998, 2010]);
    expect(
      clampYearRangeForVariable(2020, 2026, getVariableMetaLocal('SEAWIFS_CHLA'))
    ).toEqual([2006, 2010]);

    expect(
      clampYearRangeForVariable(1985, 2026, getVariableMetaLocal('AOD'))
    ).toEqual([2002, 2024]);
    expect(getVariableMetaLocal('AOD').mission_status).toBe('completed');

    expect(
      clampYearRangeForVariable(1990, 2026, getVariableMetaLocal('SO2'))
    ).toEqual([2004, 2024]);
    expect(getVariableMetaLocal('SO2').mission_status).toBe('completed');

    expect(
      clampYearRangeForVariable(1990, 2026, getVariableMetaLocal('SNODP'))
    ).toEqual([2000, 2024]);
    expect(getVariableMetaLocal('SNODP').mission_status).toBe('completed');

    expect(
      clampYearRangeForVariable(2000, 2026, getVariableMetaLocal('SWOT_WSE'))
    ).toEqual([2016, 2025]);

    expect(
      clampYearRangeForVariable(2000, 2026, getVariableMetaLocal('RCM_SAR_BACKSCATTER'))
    ).toEqual([2019, 2025]);
  });

  it('builds quick year presets strictly within each satellite operational window and never exceeds 2025', () => {
    const seawifsPresets = getYearPresetsForVariable(getVariableMetaLocal('SEAWIFS_CHLA'));
    expect(seawifsPresets.length).toBeGreaterThan(0);
    expect(seawifsPresets.every((p) => p.start >= 1998 && p.end <= 2010)).toBe(true);

    const aodPresets = getYearPresetsForVariable(getVariableMetaLocal('AOD'));
    expect(aodPresets.length).toBeGreaterThan(0);
    expect(aodPresets.every((p) => p.start >= 2002 && p.end <= 2024)).toBe(true);

    const rcmPresets = getYearPresetsForVariable(getVariableMetaLocal('RCM_SAR_BACKSCATTER'));
    expect(rcmPresets.length).toBeGreaterThan(0);
    expect(rcmPresets.every((p) => p.start >= 2019 && p.end <= 2025)).toBe(true);

    expect(DEFAULT_VARIABLES.every((v) => (v.max_year ?? 0) <= 2025)).toBe(true);
    expect(
      FALLBACK_PHENOMENA_SCENARIOS.every((s) => s.end_year <= 2025)
    ).toBe(true);
  });
});

describe('compact URL state encoding and parsing', () => {
  it('returns empty search for unmodified default scenario and ?s= for known scenarios', () => {
    const defaultScenario = FALLBACK_PHENOMENA_SCENARIOS[0];
    expect(
      encodeUrlSearch({
        activeScenarioId: defaultScenario.id,
        mode: defaultScenario.mode,
        variable: defaultScenario.variable,
        seasonMode: defaultScenario.season_mode,
        startYear: defaultScenario.start_year,
        endYear: defaultScenario.end_year,
        regionA: defaultScenario.region_a,
        regionB: defaultScenario.region_b || { name: 'B', lat: 50.5, lon: -86.0 },
      })
    ).toBe('');

    const seawifsScenario = FALLBACK_PHENOMENA_SCENARIOS.find(
      (s) => s.id === 'ackers-seawifs-coastal-study'
    )!;
    expect(
      encodeUrlSearch({
        activeScenarioId: seawifsScenario.id,
        mode: seawifsScenario.mode,
        variable: seawifsScenario.variable,
        seasonMode: seawifsScenario.season_mode,
        startYear: seawifsScenario.start_year,
        endYear: seawifsScenario.end_year,
        regionA: seawifsScenario.region_a,
        regionB: seawifsScenario.region_b || { name: 'B', lat: 50.5, lon: -86.0 },
      })
    ).toBe('?s=seawifs');
  });

  it('encodes custom points without name= and clamps legacy query params on parse', () => {
    const encoded = encodeUrlSearch({
      activeScenarioId: 'custom',
      mode: 'single',
      variable: 'SWOT_WSE',
      seasonMode: 'JJA',
      startYear: 2016,
      endYear: 2025,
      regionA: { name: 'Point A (79.75°, -56.25°)', lat: 79.75, lon: -56.25 },
      regionB: { name: 'B', lat: 50.5, lon: -86.0 },
    });
    expect(encoded).toBe('?q=SWOT_WSE.JJA.2016-2025.79.75,-56.25');
    expect(encoded).not.toContain('name=');

    const parsedCompact = parseInitialUrlState(encoded);
    expect(parsedCompact.variable).toBe('SWOT_WSE');
    expect(parsedCompact.seasonMode).toBe('JJA');
    expect(parsedCompact.startYear).toBe(2016);
    expect(parsedCompact.endYear).toBe(2025);
    expect(parsedCompact.regionA.lat).toBe(79.75);
    expect(parsedCompact.regionA.lon).toBe(-56.25);

    const parsedLegacyOutOfBounds = parseInitialUrlState(
      '?var=SWOT_WSE&season=JJA&start=2000&end=2026&mode=single&lat=79.75&lon=-56.25&name=Custom'
    );
    expect(parsedLegacyOutOfBounds.variable).toBe('SWOT_WSE');
    expect(parsedLegacyOutOfBounds.startYear).toBe(2016);
    expect(parsedLegacyOutOfBounds.endYear).toBe(2025);

    const parsedSeaWiFSOutOfBounds = parseInitialUrlState(
      '?q=SEAWIFS_CHLA.r.1998-2026.37.00,-76.00'
    );
    expect(parsedSeaWiFSOutOfBounds.startYear).toBe(1998);
    expect(parsedSeaWiFSOutOfBounds.endYear).toBe(2010);
  });
});
