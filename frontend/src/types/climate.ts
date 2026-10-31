export type AnalysisMode = 'single' | 'dipole';

export type SeasonMode =
  | 'raw'
  | 'deseasonalized'
  | 'DJF'
  | 'MAM'
  | 'JJA'
  | 'SON';

export type ClimateVariableCode =
  | 'T2M'
  | 'PRECTOTCORR'
  | 'GWETROOT'
  | 'ALLSKY_SFC_SW_DWN'
  | 'AOD'
  | 'SO2'
  | 'EVPTRNS'
  | 'QRUNOFF'
  | 'SNODP'
  | 'SST';

export interface RegionLocation {
  name: string;
  lat: number;
  lon: number;
}

export interface VariableMetadata {
  code: ClimateVariableCode | string;
  name: string;
  name_ua?: string;
  unit: string;
  satellite_badge?: string;
  gibs_layer?: string;
  description?: string;
}

export interface TimeSeriesPoint {
  year: number;
  value: number;
  anomaly: number;
  trend_line: number;
  ci_lower?: number;
  ci_upper?: number;
  loess_trend?: number;
  residual?: number;
}

export interface SeasonalCyclePoint {
  month: number;
  month_name: string;
  seasonal_effect: number;
}

export interface AnnualDecompositionPoint {
  year: number;
  observed: number;
  trend: number;
  seasonal_amplitude: number;
  residual: number;
}

export interface STLDecompositionData {
  timestamps: string[];
  observed: number[];
  trend: number[];
  seasonal: number[];
  residual: number[];
  annual_decomposition?: AnnualDecompositionPoint[];
  annual_seasonal_cycle?: SeasonalCyclePoint[];
}

export interface StudentTTestResult {
  t_stat: number;
  p_value: number;
  degrees_of_freedom: number;
  is_significant: boolean;
}

export interface MannKendallTestResult {
  z_score: number;
  p_value: number;
  sens_slope: number;
  trend: string;
  is_significant: boolean;
}

export interface RateOfChangeResult {
  per_year: number;
  per_decade: number;
  ci_95_lower_decade: number;
  ci_95_upper_decade: number;
}

export interface TimeToSignificanceResult {
  is_already_significant: boolean;
  additional_years_needed: number;
  total_years_required: number;
  current_years: number;
  projected_significance_year: number;
  status: 'significant' | 'emerging' | 'long_horizon' | 'noise_dominated' | string;
  message: string;
}

export interface TrendStatistics {
  season_mode?: SeasonMode;
  season_label?: string;
  sample_size_years?: number;
  mk_trend: 'increasing' | 'decreasing' | 'no trend' | string;
  is_significant: boolean;
  p_value: number;
  z_score: number;
  sens_slope_per_year: number;
  sens_intercept?: number;
  ols_slope_per_year?: number;
  ols_r_squared?: number;
  student_t_test?: StudentTTestResult;
  mann_kendall_test?: MannKendallTestResult;
  rate_of_change?: RateOfChangeResult;
  change_per_decade: number;
  slope_ci_lower_decade?: number;
  slope_ci_upper_decade?: number;
  total_change_abs: number;
  total_change_pct?: number;
  first_5yr_mean?: number;
  last_5yr_mean?: number;
  baseline_mean?: number;
  baseline_std?: number;
  confidence_level: string;
  significance_label?: string;
  signal_to_noise_ratio: number;
  time_to_significance?: TimeToSignificanceResult;
}

export interface RegionAnalysis {
  location: RegionLocation;
  season_mode?: SeasonMode;
  time_series: TimeSeriesPoint[];
  stl_decomposition?: STLDecompositionData;
  statistics: TrendStatistics;
  human_summary: string;
  data_source?: string;
}

export interface DipoleComparison {
  is_opposite_trend: boolean;
  is_dipole_detected?: boolean;
  pearson_r: number;
  correlation_p_value: number;
  spearman_r?: number;
  spearman_p_value?: number;
  badge?: string;
  verdict: string;
}

export interface AnalyzeTrendRequest {
  variable: string;
  start_year: number;
  end_year: number;
  season_mode?: SeasonMode;
  region_a: RegionLocation;
  region_b?: RegionLocation | null;
  prefer_live_api?: boolean;
}

export interface AnalyzeTrendResponse {
  season_mode?: SeasonMode;
  variable_metadata: VariableMetadata;
  region_a_analysis: RegionAnalysis;
  region_b_analysis?: RegionAnalysis | null;
  dipole_comparison?: DipoleComparison | null;
}

export interface PhenomenonScenario {
  id: string;
  eonet_id?: string;
  title: string;
  category: string;
  source_type: 'curated' | 'eonet_live';
  tags: string[];
  satellite_badge: string;
  variable: ClimateVariableCode;
  secondary_variable?: ClimateVariableCode;
  mode: AnalysisMode;
  start_year: number;
  end_year: number;
  season_mode: SeasonMode;
  region_a: RegionLocation;
  region_b?: RegionLocation | null;
  event_date?: string;
  scientific_summary: string;
  student_note?: string;
}

export interface FetchPhenomenaResponse {
  total_count: number;
  curated_count: number;
  eonet_count: number;
  eonet_is_live: boolean;
  scenarios: PhenomenonScenario[];
}

export interface DetectiveCasePreset {
  id: string;
  title: string;
  subtitle: string;
  mode: AnalysisMode;
  variable: ClimateVariableCode;
  start_year: number;
  end_year: number;
  season_mode?: SeasonMode;
  physical_process: string;
  expected_finding: string;
  region_a: RegionLocation;
  region_b: RegionLocation;
}
