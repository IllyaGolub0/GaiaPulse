import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  AnalyzeTrendResponse,
  RegionLocation,
  SeasonMode,
  TrendStatistics,
  VariableMetadata,
} from '../types/climate';
import { Language } from '../i18n/translations';
import { NASA_OFFICIAL_DISCLAIMER } from '../services/api';
import { formatP } from '../utils/format';

interface MissionBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionA: RegionLocation;
  currentVarMeta: VariableMetadata;
  seasonMode: SeasonMode;
  startYear: number;
  endYear: number;
  spatialBoxAveraging: boolean;
  analysisResult: AnalyzeTrendResponse | null;
  statsA: TrendStatistics | null;
  lang: Language;
}

export const MissionBriefModal: React.FC<MissionBriefModalProps> = ({
  isOpen,
  onClose,
  regionA,
  currentVarMeta,
  seasonMode,
  startYear,
  endYear,
  spatialBoxAveraging,
  analysisResult,
  statsA,
  lang,
}) => {
  if (!isOpen || !analysisResult || !statsA) return null;

  return (
    <div
      className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-md bg-[#0c0c0f] border border-[#24242b] shadow-2xl p-6 space-y-5 text-sm mission-brief-printable print:max-h-none print:overflow-visible print:border-zinc-300 print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Print Action */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1f1f24] pb-4">
          <div>
            <div className="text-xs font-monost text-[#597B8A]">
              NASA Space Apps Challenge 2026 · Earth System Trend Detective
            </div>
            <h2 className="text-base font-semibold text-zinc-100 mt-1">
              {lang === 'en'
                ? 'Scientific Trend & Significance Mission Brief'
                : 'Науковий звіт аналізу кліматичного тренду та статистичної значущості'}
            </h2>
            <p className="text-[13px] font-mono text-zinc-400 mt-0.5">
              {regionA.name} ({regionA.lat.toFixed(2)}°N,{' '}
              {regionA.lon.toFixed(2)}°E) · {currentVarMeta.code} (
              {currentVarMeta.unit}) · {seasonMode} · {startYear}–{endYear}
              {spatialBoxAveraging ? ' · ROI 5-pt Box (±1.5°)' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-mono font-medium text-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {lang === 'en' ? 'Print / Save as PDF' : 'Друкувати / PDF'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded bg-[#141419] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-[#24242b]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. Primary Statistical Verdict Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
            <div className="text-xs text-zinc-400">
              Sen&apos;s Slope / Decade
            </div>
            <div className="text-sm font-semibold text-[#597B8A] mt-1">
              {statsA.change_per_decade >= 0 ? '+' : ''}
              {statsA.change_per_decade.toFixed(4)} {currentVarMeta.unit}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              95% CI: [{statsA.slope_ci_lower_decade?.toFixed(3)},{' '}
              {statsA.slope_ci_upper_decade?.toFixed(3)}]
            </div>
          </div>

          <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
            <div className="text-xs text-zinc-400">
              Mann-Kendall &amp; Student t
            </div>
            <div className="text-sm font-semibold text-zinc-100 mt-1">
              p {formatP(statsA.p_value)} · Z ={' '}
              {statsA.z_score >= 0 ? '+' : ''}
              {statsA.z_score.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Student t ={' '}
              {statsA.student_t_test?.t_stat.toFixed(2) ?? '—'} (df=
              {statsA.student_t_test?.degrees_of_freedom ?? '—'})
            </div>
          </div>

          <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
            <div className="text-xs text-zinc-400">Pettitt Regime Shift</div>
            <div className="text-sm font-semibold text-amber-400 mt-1">
              {statsA.regime_shift?.change_point_year ?? '—'} (Δ{' '}
              {(statsA.regime_shift?.step_delta ?? 0) >= 0 ? '+' : ''}
              {statsA.regime_shift?.step_delta.toFixed(3)})
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Pettitt p = {statsA.regime_shift?.p_value.toFixed(4) ?? '—'}
            </div>
          </div>

          <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
            <div className="text-xs text-zinc-400">AR(1) &amp; Hamed-Rao MK</div>
            <div className="text-sm font-semibold text-emerald-400 mt-1">
              r₁ = {statsA.autocorrelation?.lag1_r.toFixed(2) ?? '0.00'} ·
              N_eff = {statsA.autocorrelation?.effective_sample_size ?? '—'}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Adjusted p* ={' '}
              {statsA.autocorrelation?.hamed_rao_p_value.toFixed(4) ?? '—'}
            </div>
          </div>
        </div>

        {/* 2. Executive Detective Summary */}
        <div className="p-3.5 rounded bg-[#09090b] border border-[#1f1f24] space-y-1.5">
          <div className="text-xs font-mono text-zinc-400">
            {lang === 'en'
              ? 'Executive Statistical Conclusion'
              : 'Науковий висновок детективу'}
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {analysisResult.region_a_analysis.human_summary}
          </p>
          {statsA.time_to_significance && (
            <p className="text-[13px] font-mono text-zinc-400">
              Time-to-Significance (Weatherhead et al., 1998):{' '}
              {statsA.time_to_significance.message}
            </p>
          )}
        </div>

        {/* 3. Multi-Season Fingerprint Table */}
        {statsA.seasonal_matrix && statsA.seasonal_matrix.length > 0 && (
          <div className="rounded bg-[#09090b] border border-[#1f1f24] overflow-hidden">
            <div className="px-3.5 py-2 border-b border-[#1f1f24] text-xs font-mono text-zinc-400">
              {lang === 'en'
                ? '6-Mode Seasonal Fingerprint Comparison'
                : 'Порівняльна таблиця всіх 6 сезонних режимів (DJF, MAM, JJA, SON, Deseasonalized, Raw)'}
            </div>
            <table className="w-full text-left font-mono text-[13px]">
              <thead className="bg-[#0c0c0f] text-zinc-400 border-b border-[#1f1f24]">
                <tr>
                  <th className="py-2 px-3">Season Mode</th>
                  <th className="py-2 px-3">Sen&apos;s Slope / Dec</th>
                  <th className="py-2 px-3">MK Z-score</th>
                  <th className="py-2 px-3">p-value</th>
                  <th className="py-2 px-3">SNR</th>
                  <th className="py-2 px-3">Verdict (α = 0.05)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f24]">
                {statsA.seasonal_matrix.map((row) => (
                  <tr key={row.season_mode} className="text-zinc-300">
                    <td className="py-1.5 px-3 font-semibold">
                      {row.season_mode}
                    </td>
                    <td className="py-1.5 px-3">
                      {row.change_per_decade >= 0 ? '+' : ''}
                      {row.change_per_decade.toFixed(4)} {currentVarMeta.unit}
                    </td>
                    <td className="py-1.5 px-3">
                      {row.z_score >= 0 ? '+' : ''}
                      {row.z_score.toFixed(2)}σ
                    </td>
                    <td className="py-1.5 px-3">{row.p_value.toFixed(5)}</td>
                    <td className="py-1.5 px-3">{row.snr.toFixed(2)}</td>
                    <td className="py-1.5 px-3">
                      <span
                        className={
                          row.is_significant
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        {row.is_significant
                          ? 'SIGNIFICANT (p < 0.05)'
                          : 'NOISE / EMERGING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Data Provenance & Disclaimer */}
        <div className="pt-2 border-t border-[#1f1f24] text-xs font-mono text-zinc-400 space-y-1">
          <div>
            Primary Source: {analysisResult.region_a_analysis.data_source} ·
            Reference Methodology: NASA NTRS 20090042747 (Dr. James Acker)
          </div>
          <div>{NASA_OFFICIAL_DISCLAIMER}</div>
        </div>
      </div>
    </div>
  );
};
