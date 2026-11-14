import { describe, expect, it } from 'vitest';
import { analyzeCsvClientSideFallback } from '../api';

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
    });

    expect(result.csv_import_metadata?.years_count).toBe(24);
    expect(result.csv_import_metadata?.start_year).toBe(2002);
    expect(result.csv_import_metadata?.end_year).toBe(2025);
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
