import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompareArrows,
} from 'lucide-react';
import {
  DipoleComparison,
  RegionAnalysis,
  SeasonMode,
  VariableMetadata,
} from '../types/climate';
import { useLanguage } from '../i18n/translations';

interface VerdictCardProps {
  regionKey: 'A' | 'B';
  analysis: RegionAnalysis;
  variableMeta: VariableMetadata;
  onSelectSeasonMode?: (mode: SeasonMode) => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  regionKey,
  analysis,
  variableMeta,
  onSelectSeasonMode,
}) => {
  const { t, lang } = useLanguage();
  const { location, statistics, human_summary, data_source } = analysis;
  const isRegionA = regionKey === 'A';

  const slopeDecade = statistics.change_per_decade;
  const slopeYear = statistics.sens_slope_per_year;
  const slopeSign = slopeDecade > 0 ? '+' : '';
  const yearSign = slopeYear > 0 ? '+' : '';
  const absDeltaSign = statistics.total_change_abs > 0 ? '+' : '';

  const formattedPValue =
    statistics.p_value < 0.0001
      ? '< 0.0001'
      : statistics.p_value.toFixed(4);

  const tStat = statistics.student_t_test?.t_stat ?? 0;
  const tPVal = statistics.student_t_test?.p_value ?? statistics.p_value;
  const formattedTPValue =
    tPVal < 0.0001 ? '< 0.0001' : tPVal.toFixed(4);

  const snrPercent = Math.min(
    100,
    Math.round((statistics.signal_to_noise_ratio / 3.5) * 100)
  );

  const tts = statistics.time_to_significance;

  return (
    <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] overflow-hidden flex flex-col justify-between">
      {/* Top Header Strip */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f24]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
              isRegionA
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRegionA ? 'bg-sky-400' : 'bg-orange-400'
              }`}
            />
            {t.verdictRegionLabel} {regionKey}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {location.name}
            </h3>
            <p className="text-[11px] font-mono text-zinc-500 truncate">
              {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E
              {statistics.season_mode ? ` · ${statistics.season_mode}` : ''}
              {data_source ? ` · ${data_source}` : ''}
            </p>
          </div>
        </div>

        {/* Minimalist Status Indicator */}
        <div
          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-mono border ${
            statistics.is_significant
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              statistics.is_significant ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="font-medium">
            {statistics.is_significant
              ? `${t.verdictSignificant} · p = ${formattedPValue}`
              : `${t.verdictNotYetSig} · p = ${formattedPValue}`}
          </span>
        </div>
      </div>

      {/* Swiss 5-Column Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#1f1f24] bg-[#09090b] border-b border-[#1f1f24]">
        {/* Col 1: Sen's Slope (Hero Metric) */}
        <div className="col-span-2 sm:col-span-2 p-3.5 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Sen&apos;s Slope / {t.verdictPerDecade}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-xl font-mono font-semibold tracking-tight ${
                  slopeDecade > 0
                    ? isRegionA
                      ? 'text-sky-400'
                      : 'text-orange-400'
                    : slopeDecade < 0
                    ? 'text-rose-400'
                    : 'text-zinc-100'
                }`}
              >
                {slopeSign}
                {slopeDecade.toFixed(3)}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {variableMeta.unit} ({yearSign}
                {slopeYear.toFixed(4)}/{t.verdictPerYear})
              </span>
            </div>
            {statistics.slope_ci_lower_decade !== undefined &&
              statistics.slope_ci_upper_decade !== undefined && (
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  95% CI: [{statistics.slope_ci_lower_decade.toFixed(3)},{' '}
                  {statistics.slope_ci_upper_decade.toFixed(3)}]
                </div>
              )}
          </div>

          <div className="text-zinc-500 pr-1">
            {statistics.mk_trend === 'increasing' && (
              <TrendingUp className="w-4 h-4 text-sky-400" />
            )}
            {statistics.mk_trend === 'decreasing' && (
              <TrendingDown className="w-4 h-4 text-orange-400" />
            )}
            {statistics.mk_trend !== 'increasing' &&
              statistics.mk_trend !== 'decreasing' && (
                <Minus className="w-4 h-4 text-zinc-600" />
              )}
          </div>
        </div>

        {/* Col 2: Mann-Kendall Z & Student t */}
        <div className="p-3.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            MK Z / t-stat
          </div>
          <div className="text-sm font-mono font-semibold text-zinc-100 mt-1">
            {statistics.z_score > 0
              ? `+${statistics.z_score.toFixed(2)}`
              : statistics.z_score.toFixed(2)}
            σ · t={tStat > 0 ? `+${tStat.toFixed(2)}` : tStat.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
            p = {formattedTPValue}
          </div>
        </div>

        {/* Col 3: Signal to Noise */}
        <div className="p-3.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            SNR
          </div>
          <div className="text-sm font-mono font-semibold text-zinc-100 mt-1">
            {statistics.signal_to_noise_ratio.toFixed(2)}
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-none overflow-hidden mt-2">
            <div
              className={`h-full ${
                statistics.signal_to_noise_ratio >= 1.5
                  ? 'bg-emerald-400'
                  : statistics.signal_to_noise_ratio >= 0.8
                  ? 'bg-sky-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${snrPercent}%` }}
            />
          </div>
        </div>

        {/* Col 4: Total Shift */}
        <div className="p-3.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            {t.verdictTotalDelta}
          </div>
          <div className="text-sm font-mono font-semibold text-zinc-100 mt-1">
            {absDeltaSign}
            {statistics.total_change_abs.toFixed(2)} {variableMeta.unit}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
            R² ={' '}
            {statistics.ols_r_squared !== undefined
              ? statistics.ols_r_squared.toFixed(2)
              : '—'}
          </div>
        </div>
      </div>

      {/* Bottom Editorial Summary, Regime Shift, Autocorrelation & Seasonal Matrix */}
      <div className="p-4 space-y-2.5 text-xs">
        {tts && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-[#121216] border border-[#1f1f24] font-mono text-[11px]">
            <span className="text-zinc-400 uppercase tracking-wider text-[10px]">
              Time-to-Significance (p &lt; 0.05)
            </span>
            <span
              className={
                tts.is_already_significant
                  ? 'text-emerald-400 font-medium'
                  : 'text-amber-400 font-medium'
              }
            >
              {lang === 'en'
                ? tts.is_already_significant
                  ? `Reached (${tts.current_years} yrs)`
                  : `+${tts.additional_years_needed} yrs (~${tts.projected_significance_year})`
                : tts.message}
            </span>
          </div>
        )}

        {/* Pettitt Change-Point (Regime Shift) & Hamed-Rao AR(1) Diagnostics */}
        {(statistics.regime_shift || statistics.autocorrelation) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
            {statistics.regime_shift && (
              <div className="px-3 py-2 rounded bg-[#09090b] border border-[#1f1f24] flex items-center justify-between gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                    {lang === 'en'
                      ? 'Pettitt Regime Shift'
                      : 'Точка зламу (Pettitt Test)'}
                  </div>
                  <div className="text-zinc-200 font-medium mt-0.5">
                    {statistics.regime_shift.change_point_year}{' '}
                    <span className="text-zinc-500">
                      (Δ{' '}
                      {statistics.regime_shift.step_delta >= 0 ? '+' : ''}
                      {statistics.regime_shift.step_delta.toFixed(3)}{' '}
                      {variableMeta.unit})
                    </span>
                  </div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] border ${
                    statistics.regime_shift.is_significant
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}
                >
                  p ={' '}
                  {statistics.regime_shift.p_value < 0.001
                    ? '<0.001'
                    : statistics.regime_shift.p_value.toFixed(3)}
                </span>
              </div>
            )}

            {statistics.autocorrelation && (
              <div className="px-3 py-2 rounded bg-[#09090b] border border-[#1f1f24] flex items-center justify-between gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                    {lang === 'en'
                      ? 'AR(1) & Hamed-Rao MK'
                      : 'Автокореляція AR(1) · Hamed-Rao'}
                  </div>
                  <div className="text-zinc-200 font-medium mt-0.5">
                    r₁ = {statistics.autocorrelation.lag1_r >= 0 ? '+' : ''}
                    {statistics.autocorrelation.lag1_r.toFixed(2)} · N_eff ={' '}
                    {statistics.autocorrelation.effective_sample_size}
                  </div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] border ${
                    statistics.autocorrelation.is_significant_adjusted
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  p* ={' '}
                  {statistics.autocorrelation.hamed_rao_p_value < 0.0001
                    ? '<0.0001'
                    : statistics.autocorrelation.hamed_rao_p_value.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Multi-Season Fingerprint Heatmap Matrix (DJF, MAM, JJA, SON, Deseas, Raw) */}
        {statistics.seasonal_matrix && statistics.seasonal_matrix.length > 0 && (
          <div className="rounded bg-[#09090b] border border-[#1f1f24] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="uppercase tracking-wider">
                {lang === 'en'
                  ? 'Seasonal Fingerprint Matrix (Click to switch season)'
                  : 'Матриця сезонного підпису (клік — перемкнути сезон)'}
              </span>
              <span>Slope/dec · p-val</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono text-[10px]">
              {statistics.seasonal_matrix.map((row) => {
                const isCurrent =
                  (statistics.season_mode || 'raw') === row.season_mode;
                const shortName =
                  row.season_mode === 'deseasonalized'
                    ? 'Deseas'
                    : row.season_mode === 'raw'
                    ? 'Raw'
                    : row.season_mode;
                return (
                  <button
                    key={row.season_mode}
                    type="button"
                    onClick={() =>
                      onSelectSeasonMode?.(row.season_mode as SeasonMode)
                    }
                    className={`p-1.5 rounded border text-left transition ${
                      isCurrent
                        ? 'bg-zinc-800 border-zinc-500 text-zinc-100'
                        : 'bg-[#0c0c0f] border-[#1f1f24] hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-zinc-200">
                        {shortName}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          row.is_significant ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <div
                      className={`mt-0.5 ${
                        row.change_per_decade >= 0
                          ? 'text-sky-400'
                          : 'text-orange-400'
                      }`}
                    >
                      {row.change_per_decade >= 0 ? '+' : ''}
                      {row.change_per_decade.toFixed(3)}
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      p=
                      {row.p_value < 0.001
                        ? '<.001'
                        : row.p_value.toFixed(3)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-l-2 border-zinc-700 pl-3 py-0.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-0.5">
            {t.verdictSummaryTitle}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {lang === 'en'
              ? `[${statistics.season_mode || 'Annual'}] In ${location.name}, ${
                  variableMeta.name
                } exhibits ${
                  statistics.is_significant
                    ? `a statistically significant ${statistics.mk_trend} trend`
                    : `an emerging ${statistics.mk_trend} signal not yet crossing p < 0.05`
                } (${slopeSign}${slopeDecade.toFixed(3)} ${
                  variableMeta.unit
                }/decade, Mann-Kendall p = ${formattedPValue}, Student's t = ${tStat.toFixed(
                  2
                )}, SNR = ${statistics.signal_to_noise_ratio.toFixed(2)}).`
              : human_summary}
          </p>
        </div>
      </div>
    </div>
  );
};

interface DipoleVerdictBannerProps {
  dipole: DipoleComparison;
  regionAName: string;
  regionBName: string;
}

export const DipoleVerdictBanner: React.FC<DipoleVerdictBannerProps> = ({
  dipole,
  regionAName,
  regionBName,
}) => {
  const { t } = useLanguage();

  return (
    <div className="rounded-md p-4 bg-[#0c0c0f] border border-[#1f1f24] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
            <GitCompareArrows className="w-3.5 h-3.5 text-zinc-400" />
            {dipole.badge ||
              (dipole.is_opposite_trend
                ? t.dipoleDetectedBadge
                : t.crossRegionBadge)}
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {regionAName} ↔ {regionBName}
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {dipole.verdict}
        </p>
      </div>

      <div className="flex items-center divide-x divide-[#1f1f24] border border-[#1f1f24] rounded bg-[#09090b] shrink-0 font-mono">
        <div className="px-3.5 py-2 text-center">
          <div className="text-[10px] uppercase text-zinc-500">
            {t.pearsonLabel}
          </div>
          <div className="text-sm font-semibold text-zinc-100 mt-0.5">
            {dipole.pearson_r > 0
              ? `+${dipole.pearson_r.toFixed(2)}`
              : dipole.pearson_r.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-500">
            p ={' '}
            {dipole.correlation_p_value < 0.0001
              ? '< 0.0001'
              : dipole.correlation_p_value.toFixed(4)}
          </div>
        </div>

        <div className="px-3.5 py-2 text-center">
          <div className="text-[10px] uppercase text-zinc-500">
            {t.trendContrastLabel}
          </div>
          <div className="text-xs font-semibold text-zinc-200 mt-1">
            {dipole.is_opposite_trend ? t.contrastOpposite : t.contrastSync}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            ρ ={' '}
            {dipole.spearman_r !== undefined
              ? dipole.spearman_r.toFixed(2)
              : dipole.pearson_r.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
