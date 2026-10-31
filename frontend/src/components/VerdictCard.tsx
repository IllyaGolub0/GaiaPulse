import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Sparkles,
  GitCompareArrows,
  Gauge,
  Hourglass,
  CheckCircle2,
} from 'lucide-react';
import {
  DipoleComparison,
  RegionAnalysis,
  VariableMetadata,
} from '../types/climate';

interface VerdictCardProps {
  regionKey: 'A' | 'B';
  analysis: RegionAnalysis;
  variableMeta: VariableMetadata;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  regionKey,
  analysis,
  variableMeta,
}) => {
  const { location, statistics, human_summary, data_source } = analysis;
  const isRegionA = regionKey === 'A';

  const accentBorder = isRegionA
    ? 'border-ctp-blue/45 hover:border-ctp-blue/80'
    : 'border-ctp-peach/45 hover:border-ctp-peach/80';

  const accentBadge = isRegionA
    ? 'bg-ctp-blue/15 text-ctp-blue border-ctp-blue/45'
    : 'bg-ctp-peach/15 text-ctp-peach border-ctp-peach/45';

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
    <div
      className={`rounded-2xl bg-ctp-mantle border ${accentBorder} p-5 shadow-xl transition-all duration-300 flex flex-col justify-between gap-4`}
    >
      <div>
        {/* Top Header: Region Tag + Statistical Significance Verdict Badge */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${accentBadge}`}
            >
              REGION {regionKey}
            </span>
            <div>
              <h3 className="text-base font-bold text-ctp-text leading-tight">
                {location.name}
              </h3>
              <p className="text-[11px] font-mono text-ctp-subtext0">
                {location.lat.toFixed(2)}° N, {location.lon.toFixed(2)}° E
                {statistics.season_mode
                  ? ` • Season: ${statistics.season_mode}`
                  : ''}
                {data_source ? ` • ${data_source}` : ''}
              </p>
            </div>
          </div>

          {/* Statistical Significance Badge */}
          {statistics.is_significant ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ctp-green/15 border border-ctp-green/55 text-ctp-green text-xs font-mono font-bold shadow-[0_0_15px_rgba(166,227,161,0.18)]">
              <ShieldCheck className="w-4 h-4 text-ctp-green shrink-0" />
              <span>
                SIGNIFICANT: p = {formattedPValue} ({statistics.confidence_level})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ctp-yellow/15 border border-ctp-yellow/50 text-ctp-yellow text-xs font-mono font-bold">
              <AlertTriangle className="w-4 h-4 text-ctp-yellow shrink-0" />
              <span>p = {formattedPValue} ≥ 0.05 (NOT YET SIGNIFICANT)</span>
            </div>
          )}
        </div>

        {/* Hero Metric: Rate of Change (per Decade & per Year) + 95% CI */}
        <div className="p-4 rounded-xl bg-ctp-crust border border-ctp-surface0 mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ctp-subtext0 font-semibold mb-1">
              Rate of Change (Sen&apos;s Slope / Decade &amp; Year)
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${
                  slopeDecade > 0
                    ? isRegionA
                      ? 'text-ctp-blue'
                      : 'text-ctp-peach'
                    : slopeDecade < 0
                    ? 'text-ctp-red'
                    : 'text-ctp-text'
                }`}
              >
                {slopeSign}
                {slopeDecade.toFixed(3)}
              </span>
              <span className="text-xs font-mono text-ctp-subtext0">
                {variableMeta.unit} / декаду ({yearSign}
                {slopeYear.toFixed(4)} / рік)
              </span>
            </div>
            {statistics.slope_ci_lower_decade !== undefined &&
              statistics.slope_ci_upper_decade !== undefined && (
                <div className="text-[11px] text-ctp-subtext0 mt-1 font-mono">
                  95% CI нахилу: [
                  {statistics.slope_ci_lower_decade > 0 ? '+' : ''}
                  {statistics.slope_ci_lower_decade.toFixed(3)},{' '}
                  {statistics.slope_ci_upper_decade > 0 ? '+' : ''}
                  {statistics.slope_ci_upper_decade.toFixed(3)}]{' '}
                  {variableMeta.unit}/дек
                </div>
              )}
          </div>

          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
              statistics.mk_trend === 'increasing'
                ? 'bg-ctp-blue/15 border-ctp-blue/45 text-ctp-blue'
                : statistics.mk_trend === 'decreasing'
                ? 'bg-ctp-peach/15 border-ctp-peach/45 text-ctp-peach'
                : 'bg-ctp-surface0 border-ctp-surface1 text-ctp-subtext0'
            }`}
          >
            {statistics.mk_trend === 'increasing' && (
              <TrendingUp className="w-6 h-6" />
            )}
            {statistics.mk_trend === 'decreasing' && (
              <TrendingDown className="w-6 h-6" />
            )}
            {statistics.mk_trend !== 'increasing' &&
              statistics.mk_trend !== 'decreasing' && (
                <Minus className="w-6 h-6" />
              )}
          </div>
        </div>

        {/* 4-Column Telemetry Metric Grid: Mann-Kendall, Student's t-test, SNR, Total Delta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-ctp-crust border border-ctp-surface0">
            <div className="text-[10px] uppercase text-ctp-subtext0 font-semibold">
              Mann-Kendall Z
            </div>
            <div className="text-sm font-mono font-bold text-ctp-text mt-0.5">
              {statistics.z_score > 0
                ? `+${statistics.z_score.toFixed(2)}`
                : statistics.z_score.toFixed(2)}{' '}
              σ
            </div>
            <div className="text-[10px] font-mono text-ctp-subtext0">
              p = {formattedPValue}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-ctp-crust border border-ctp-surface0">
            <div className="text-[10px] uppercase text-ctp-subtext0 font-semibold">
              Student&apos;s t-test
            </div>
            <div className="text-sm font-mono font-bold text-ctp-lavender mt-0.5">
              t = {tStat > 0 ? `+${tStat.toFixed(2)}` : tStat.toFixed(2)}
            </div>
            <div className="text-[10px] font-mono text-ctp-subtext0">
              p = {formattedTPValue}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-ctp-crust border border-ctp-surface0">
            <div className="text-[10px] uppercase text-ctp-subtext0 font-semibold">
              Сигнал / Шум (SNR)
            </div>
            <div className="text-sm font-mono font-bold text-ctp-text mt-0.5 flex items-center gap-1.5">
              <span>{statistics.signal_to_noise_ratio.toFixed(2)}</span>
              <Gauge className="w-3.5 h-3.5 text-ctp-teal" />
            </div>
            <div className="w-full h-1.5 bg-ctp-surface0 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full ${
                  statistics.signal_to_noise_ratio >= 1.5
                    ? 'bg-ctp-green'
                    : statistics.signal_to_noise_ratio >= 0.8
                    ? 'bg-ctp-blue'
                    : 'bg-ctp-yellow'
                }`}
                style={{ width: `${snrPercent}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-ctp-crust border border-ctp-surface0">
            <div className="text-[10px] uppercase text-ctp-subtext0 font-semibold">
              Сумарний зсув (Δ)
            </div>
            <div className="text-sm font-mono font-bold text-ctp-text mt-0.5">
              {absDeltaSign}
              {statistics.total_change_abs.toFixed(2)} {variableMeta.unit}
            </div>
            <div className="text-[10px] font-mono text-ctp-subtext0">
              R² ={' '}
              {statistics.ols_r_squared !== undefined
                ? statistics.ols_r_squared.toFixed(2)
                : '—'}
            </div>
          </div>
        </div>

        {/* Time-to-Significance Calculator Box */}
        {tts && (
          <div
            className={`p-3 rounded-xl border mb-3 flex items-start gap-2.5 ${
              tts.is_already_significant
                ? 'bg-ctp-green/10 border-ctp-green/40 text-ctp-green'
                : 'bg-ctp-yellow/10 border-ctp-yellow/45 text-ctp-yellow'
            }`}
          >
            {tts.is_already_significant ? (
              <CheckCircle2 className="w-4 h-4 text-ctp-green shrink-0 mt-0.5" />
            ) : (
              <Hourglass className="w-4 h-4 text-ctp-yellow shrink-0 mt-0.5 animate-pulse" />
            )}
            <div className="text-xs leading-relaxed">
              <div className="font-mono font-bold uppercase tracking-wider text-[10px] mb-0.5">
                Time-to-Significance Calculator (Поріг p &lt; 0.05)
              </div>
              <p className="text-ctp-text text-xs">{tts.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Detective Human-Readable Scientific Summary */}
      <div className="p-3.5 rounded-xl bg-ctp-surface0/45 border border-ctp-surface1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ctp-mauve mb-1">
          <Sparkles className="w-3.5 h-3.5 text-ctp-mauve" />
          <span>Вердикт Кліматичного Детектива</span>
        </div>
        <p className="text-xs sm:text-sm text-ctp-text leading-relaxed">
          {human_summary}
        </p>
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
  const isStrongDipole = dipole.is_opposite_trend || dipole.pearson_r < -0.4;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isStrongDipole
          ? 'bg-gradient-to-r from-ctp-blue/15 via-ctp-mantle to-ctp-peach/15 border-ctp-mauve/60 shadow-[0_0_30px_rgba(203,166,247,0.12)]'
          : 'bg-ctp-mantle border-ctp-surface0'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-ctp-mauve/20 text-ctp-mauve border border-ctp-mauve/50">
              <GitCompareArrows className="w-3.5 h-3.5" />
              {dipole.badge ||
                (dipole.is_opposite_trend
                  ? 'Виявлено кліматичний диполь (Opposite Trends)'
                  : 'Крос-регіональне порівняння')}
            </span>
            <span className="text-xs text-ctp-subtext0 font-mono">
              {regionAName} ↔ {regionBName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ctp-text leading-relaxed">
            {dipole.verdict}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-ctp-crust border border-ctp-surface0 text-center min-w-[115px]">
            <div className="text-[10px] uppercase text-ctp-subtext0 font-semibold">
              Кореляція Пірсона (r)
            </div>
            <div
              className={`text-lg font-mono font-extrabold ${
                dipole.pearson_r < -0.45
                  ? 'text-ctp-mauve'
                  : dipole.pearson_r > 0.45
                  ? 'text-ctp-peach'
                  : 'text-ctp-text'
              }`}
            >
              {dipole.pearson_r > 0
                ? `+${dipole.pearson_r.toFixed(2)}`
                : dipole.pearson_r.toFixed(2)}
            </div>
            <div className="text-[10px] font-mono text-ctp-subtext0">
              p ={' '}
              {dipole.correlation_p_value < 0.0001
                ? '< 0.0001'
                : dipole.correlation_p_value.toFixed(4)}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-ctp-crust border border-ctp-surface0 text-center min-w-[115px]">
            <div className="text-[10px] uppercase text-ctp-subtext0 font-semibold">
              Контраст Трендів
            </div>
            <div className="text-sm font-mono font-bold text-ctp-text mt-1 flex items-center justify-center gap-1">
              <Activity className="w-4 h-4 text-ctp-green" />
              <span>{dipole.is_opposite_trend ? 'ПРОТИЛЕЖНІ' : 'СИНХРОННІ'}</span>
            </div>
            <div className="text-[10px] font-mono text-ctp-subtext0 mt-0.5">
              Spearman ρ ={' '}
              {dipole.spearman_r !== undefined
                ? dipole.spearman_r.toFixed(2)
                : dipole.pearson_r.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
