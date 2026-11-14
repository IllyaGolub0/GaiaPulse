import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import {
  LineChart,
  Flame,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AnalysisMode,
  RegionAnalysis,
  SeasonMode,
  VariableMetadata,
} from '../types/climate';
import { useLanguage } from '../i18n/translations';

interface TrendChartsProps {
  mode: AnalysisMode;
  seasonMode: SeasonMode;
  variableMeta: VariableMetadata;
  regionA: RegionAnalysis;
  regionB?: RegionAnalysis | null;
  onOpenResourcesModal?: () => void;
}

type ChartTab = 'timeseries' | 'stripes' | 'decomposition';
type DipoleViewMode = 'anomalies' | 'absolute';

const CLIMATE_STRIPES_COLORSCALE: Array<[number, string]> = [
  [0.0, '#0c4a6e'],
  [0.25, '#0284c7'],
  [0.42, '#38bdf8'],
  [0.5, '#18181b'],
  [0.65, '#f59e0b'],
  [0.82, '#f97316'],
  [1.0, '#ef4444'],
];

export const TrendCharts: React.FC<TrendChartsProps> = ({
  mode,
  seasonMode,
  variableMeta,
  regionA,
  regionB,
}) => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<ChartTab>('timeseries');
  const [dipoleView, setDipoleView] = useState<DipoleViewMode>('anomalies');
  const [decompRegion, setDecompRegion] = useState<'A' | 'B'>('A');
  const [showRegimeShift, setShowRegimeShift] = useState<boolean>(true);
  const regimeShiftA = regionA.statistics.regime_shift;

  const yearsA = regionA.time_series.map((d) => d.year);
  const valuesA = regionA.time_series.map((d) => d.value);
  const anomaliesA = regionA.time_series.map((d) => d.anomaly);
  const trendA = regionA.time_series.map((d) => d.trend_line);
  const loessA = regionA.time_series.map((d) => d.loess_trend ?? d.trend_line);
  const ciUpperA = regionA.time_series.map((d) => d.ci_upper ?? d.trend_line);
  const ciLowerA = regionA.time_series.map((d) => d.ci_lower ?? d.trend_line);

  const baseMeanA = regionA.statistics.baseline_mean ?? 0;
  const trendAnomA = trendA.map((v) => Number((v - baseMeanA).toFixed(4)));
  const ciUpperAnomA = ciUpperA.map((v) => Number((v - baseMeanA).toFixed(4)));
  const ciLowerAnomA = ciLowerA.map((v) => Number((v - baseMeanA).toFixed(4)));

  const hasRegionB = mode === 'dipole' && Boolean(regionB);
  const yearsB = regionB ? regionB.time_series.map((d) => d.year) : [];
  const valuesB = regionB ? regionB.time_series.map((d) => d.value) : [];
  const anomaliesB = regionB ? regionB.time_series.map((d) => d.anomaly) : [];
  const trendB = regionB ? regionB.time_series.map((d) => d.trend_line) : [];
  const ciUpperB = regionB
    ? regionB.time_series.map((d) => d.ci_upper ?? d.trend_line)
    : [];
  const ciLowerB = regionB
    ? regionB.time_series.map((d) => d.ci_lower ?? d.trend_line)
    : [];

  const baseMeanB = regionB?.statistics.baseline_mean ?? 0;
  const trendAnomB = trendB.map((v) => Number((v - baseMeanB).toFixed(4)));
  const ciUpperAnomB = ciUpperB.map((v) => Number((v - baseMeanB).toFixed(4)));
  const ciLowerAnomB = ciLowerB.map((v) => Number((v - baseMeanB).toFixed(4)));

  const useAnomalyAxis = hasRegionB && dipoleView === 'anomalies';

  const ySeriesA = useAnomalyAxis ? anomaliesA : valuesA;
  const yTrendA = useAnomalyAxis ? trendAnomA : trendA;
  const yCiUpperA = useAnomalyAxis ? ciUpperAnomA : ciUpperA;
  const yCiLowerA = useAnomalyAxis ? ciLowerAnomA : ciLowerA;

  const ySeriesB = useAnomalyAxis ? anomaliesB : valuesB;
  const yTrendB = useAnomalyAxis ? trendAnomB : trendB;
  const yCiUpperB = useAnomalyAxis ? ciUpperAnomB : ciUpperB;
  const yCiLowerB = useAnomalyAxis ? ciLowerAnomB : ciLowerB;

  const targetDecompAnalysis =
    hasRegionB && decompRegion === 'B' && regionB ? regionB : regionA;
  const targetDecompColor =
    hasRegionB && decompRegion === 'B' ? '#f97316' : '#38bdf8';

  return (
    <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] overflow-hidden">
      {/* Top Bar: Minimalist Segmented Chart Tabs */}
      <div className="px-4 py-2.5 bg-[#09090b] border-b border-[#1f1f24] flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center p-0.5 rounded bg-[#121216] border border-[#1f1f24]">
          <button
            type="button"
            onClick={() => setActiveTab('timeseries')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
              activeTab === 'timeseries'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>{t.chartTabTimeSeries}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stripes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
              activeTab === 'stripes'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{t.chartTabStripes}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decomposition')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
              activeTab === 'decomposition'
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.chartTabDecomp}</span>
          </button>
        </div>

        {/* Contextual Switcher for Dipole Comparison or Decomposition Region */}
        {activeTab === 'timeseries' && hasRegionB && (
          <div className="inline-flex items-center gap-1 bg-[#121216] p-0.5 rounded border border-[#1f1f24] text-xs">
            <SlidersHorizontal className="w-3 h-3 text-zinc-500 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setDipoleView('anomalies')}
              className={`px-2 py-1 rounded font-mono text-[11px] transition ${
                dipoleView === 'anomalies'
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.chartAnomaliesToggle}
            </button>
            <button
              type="button"
              onClick={() => setDipoleView('absolute')}
              className={`px-2 py-1 rounded font-mono text-[11px] transition ${
                dipoleView === 'absolute'
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.chartAbsoluteToggle} ({variableMeta.unit})
            </button>
          </div>
        )}

        {activeTab === 'decomposition' && hasRegionB && (
          <div className="inline-flex items-center gap-1 bg-[#121216] p-0.5 rounded border border-[#1f1f24] text-xs">
            <button
              type="button"
              onClick={() => setDecompRegion('A')}
              className={`px-2 py-1 rounded font-mono text-[11px] transition ${
                decompRegion === 'A'
                  ? 'bg-sky-500/15 text-sky-400 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.chartRegionABtn}: {regionA.location.name}
            </button>
            <button
              type="button"
              onClick={() => setDecompRegion('B')}
              className={`px-2 py-1 rounded font-mono text-[11px] transition ${
                decompRegion === 'B'
                  ? 'bg-orange-500/15 text-orange-400 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.chartRegionBBtn}: {regionB?.location.name}
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* TAB 1: TIME SERIES + SEN'S TREND + 95% CONFIDENCE INTERVAL */}
        {activeTab === 'timeseries' && (
          <div className="w-full space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h4 className="text-xs font-mono font-medium text-zinc-200">
                {useAnomalyAxis
                  ? `${t.chartTitleDivergence} — ${
                      lang === 'en'
                        ? variableMeta.name
                        : variableMeta.name_ua || variableMeta.name
                    } (${variableMeta.unit})`
                  : `${t.chartTitleDynamics} — ${
                      lang === 'en'
                        ? variableMeta.name
                        : variableMeta.name_ua || variableMeta.name
                    } (${variableMeta.unit})`}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500">
                {regimeShiftA && (
                  <button
                    type="button"
                    onClick={() => setShowRegimeShift((prev) => !prev)}
                    className={`px-2 py-0.5 rounded border text-[10px] transition ${
                      showRegimeShift
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-[#09090b] text-zinc-500 border-[#1f1f24] hover:text-zinc-300'
                    }`}
                  >
                    {lang === 'en' ? 'Pettitt Shift' : 'Злам режиму'}:{' '}
                    {regimeShiftA.change_point_year}
                  </button>
                )}
                <span>
                  {t.verdictSeasonLabel}:{' '}
                  <strong className="text-zinc-300">{seasonMode}</strong>
                </span>
                <span>·</span>
                <span>95% Student-t CI</span>
              </div>
            </div>

            <Plot
              data={[
                // Region A 95% Confidence Band
                {
                  x: [...yearsA, ...[...yearsA].reverse()],
                  y: [...yCiUpperA, ...[...yCiLowerA].reverse()],
                  fill: 'toself',
                  fillcolor: 'rgba(56, 189, 248, 0.10)',
                  line: { color: 'transparent' },
                  name: `${t.chartCiBandLegend} (A)`,
                  hoverinfo: 'skip',
                  showlegend: true,
                  type: 'scatter',
                },
                // Region A Observations
                {
                  x: yearsA,
                  y: ySeriesA,
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: `${regionA.location.name} (${t.chartObsLegend})`,
                  line: {
                    color: 'rgba(56, 189, 248, 0.45)',
                    width: 1.5,
                  },
                  marker: {
                    color: '#38bdf8',
                    size: 5,
                    opacity: 0.85,
                  },
                },
                // Region A LOESS Smoothed Trend (only in Single mode)
                ...(!hasRegionB
                  ? [
                      {
                        x: yearsA,
                        y: loessA,
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: `${regionA.location.name} (${t.chartLoessLegend})`,
                        line: {
                          color: '#a1a1aa',
                          width: 1.75,
                          dash: 'dot' as const,
                        },
                      },
                    ]
                  : []),
                // Region A Sen's Robust Trend Line
                {
                  x: yearsA,
                  y: yTrendA,
                  type: 'scatter',
                  mode: 'lines',
                  name: `${t.chartSensLegend} A (${regionA.statistics.change_per_decade >= 0 ? '+' : ''}${regionA.statistics.change_per_decade.toFixed(3)} ${variableMeta.unit}/dec)`,
                  line: {
                    color: '#38bdf8',
                    width: 2.5,
                  },
                },
                // Region B Traces if Dipole Comparison mode is active
                ...(hasRegionB && regionB
                  ? [
                      {
                        x: [...yearsB, ...[...yearsB].reverse()],
                        y: [...yCiUpperB, ...[...yCiLowerB].reverse()],
                        fill: 'toself' as const,
                        fillcolor: 'rgba(249, 115, 22, 0.10)',
                        line: { color: 'transparent' },
                        name: `${t.chartCiBandLegend} (B)`,
                        hoverinfo: 'skip' as const,
                        showlegend: true,
                        type: 'scatter' as const,
                      },
                      {
                        x: yearsB,
                        y: ySeriesB,
                        type: 'scatter' as const,
                        mode: 'lines+markers' as const,
                        name: `${regionB.location.name} (${t.chartObsLegend})`,
                        line: {
                          color: 'rgba(249, 115, 22, 0.45)',
                          width: 1.5,
                        },
                        marker: {
                          color: '#f97316',
                          size: 5,
                          opacity: 0.85,
                        },
                      },
                      {
                        x: yearsB,
                        y: yTrendB,
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: `${t.chartSensLegend} B (${regionB.statistics.change_per_decade >= 0 ? '+' : ''}${regionB.statistics.change_per_decade.toFixed(3)} ${variableMeta.unit}/dec)`,
                        line: {
                          color: '#f97316',
                          width: 2.5,
                        },
                      },
                    ]
                  : []),
              ]}
              layout={{
                autosize: true,
                height: 410,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: '#09090b',
                font: {
                  family: 'JetBrains Mono, Inter, sans-serif',
                  color: '#a1a1aa',
                  size: 11,
                },
                margin: { l: 58, r: 20, t: 48, b: 44 },
                xaxis: {
                  title: { text: `Year (${seasonMode})` },
                  gridcolor: '#18181c',
                  zerolinecolor: '#27272a',
                },
                yaxis: {
                  title: {
                    text: useAnomalyAxis
                      ? `Anomaly (${variableMeta.unit})`
                      : `${variableMeta.code} (${variableMeta.unit})`,
                  },
                  gridcolor: '#18181c',
                  zeroline: true,
                  zerolinecolor: '#27272a',
                  zerolinewidth: 1,
                },
                legend: {
                  orientation: 'h',
                  yanchor: 'bottom',
                  y: 1.02,
                  xanchor: 'left',
                  x: 0,
                  bgcolor: 'rgba(9, 9, 11, 0.85)',
                },
                shapes:
                  showRegimeShift && regimeShiftA
                    ? [
                        {
                          type: 'line',
                          x0: regimeShiftA.change_point_year,
                          x1: regimeShiftA.change_point_year,
                          y0: 0,
                          y1: 1,
                          yref: 'paper',
                          line: {
                            color: regimeShiftA.is_significant
                              ? '#f59e0b'
                              : '#52525b',
                            width: 1.5,
                            dash: 'dash',
                          },
                        },
                      ]
                    : [],
                annotations:
                  showRegimeShift && regimeShiftA
                    ? [
                        {
                          x: regimeShiftA.change_point_year,
                          y: 0.98,
                          yref: 'paper',
                          text: `${lang === 'en' ? 'Shift' : 'Злам'} ${regimeShiftA.change_point_year} (Δ${regimeShiftA.step_delta >= 0 ? '+' : ''}${regimeShiftA.step_delta.toFixed(2)})`,
                          showarrow: false,
                          xanchor: 'left',
                          xshift: 5,
                          font: {
                            size: 10,
                            color: regimeShiftA.is_significant
                              ? '#fbbf24'
                              : '#a1a1aa',
                            family: 'JetBrains Mono, monospace',
                          },
                          bgcolor: 'rgba(9, 9, 11, 0.85)',
                          borderpad: 2,
                        },
                      ]
                    : [],
                hovermode: 'x unified',
              }}
              config={{
                responsive: true,
                displaylogo: false,
              }}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* TAB 2: CLIMATE STRIPES & ANOMALY HEATMAP */}
        {activeTab === 'stripes' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-mono font-medium text-sky-400">
                  CLIMATE STRIPES — REGION A: {regionA.location.name}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Baseline: {regionA.statistics.baseline_mean?.toFixed(3)}{' '}
                  {variableMeta.unit}
                </span>
              </div>
              <Plot
                data={[
                  {
                    x: yearsA,
                    y: ['Anomaly (A)'],
                    z: [anomaliesA],
                    type: 'heatmap',
                    colorscale: CLIMATE_STRIPES_COLORSCALE,
                    zmid: 0,
                    showscale: true,
                    colorbar: {
                      title: { text: variableMeta.unit, side: 'right' },
                      thickness: 10,
                      len: 0.9,
                    },
                    hovertemplate:
                      'Year: %{x}<br>Anomaly: %{z:+.3f} ' +
                      variableMeta.unit +
                      '<extra></extra>',
                  },
                ]}
                layout={{
                  autosize: true,
                  height: 145,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: '#09090b',
                  font: {
                    family: 'JetBrains Mono, monospace',
                    color: '#a1a1aa',
                    size: 11,
                  },
                  margin: { l: 90, r: 60, t: 8, b: 30 },
                  xaxis: { gridcolor: 'transparent' },
                  yaxis: { gridcolor: 'transparent' },
                }}
                config={{ responsive: true, displaylogo: false }}
                style={{ width: '100%' }}
              />
            </div>

            {hasRegionB && regionB && (
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-mono font-medium text-orange-400">
                    CLIMATE STRIPES — REGION B: {regionB.location.name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Baseline: {regionB.statistics.baseline_mean?.toFixed(3)}{' '}
                    {variableMeta.unit}
                  </span>
                </div>
                <Plot
                  data={[
                    {
                      x: yearsB,
                      y: ['Anomaly (B)'],
                      z: [anomaliesB],
                      type: 'heatmap',
                      colorscale: CLIMATE_STRIPES_COLORSCALE,
                      zmid: 0,
                      showscale: true,
                      colorbar: {
                        title: { text: variableMeta.unit, side: 'right' },
                        thickness: 10,
                        len: 0.9,
                      },
                      hovertemplate:
                        'Year: %{x}<br>Anomaly: %{z:+.3f} ' +
                        variableMeta.unit +
                        '<extra></extra>',
                    },
                  ]}
                  layout={{
                    autosize: true,
                    height: 145,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: '#09090b',
                    font: {
                      family: 'JetBrains Mono, monospace',
                      color: '#a1a1aa',
                      size: 11,
                    },
                    margin: { l: 90, r: 60, t: 8, b: 30 },
                    xaxis: { gridcolor: 'transparent' },
                    yaxis: { gridcolor: 'transparent' },
                  }}
                  config={{ responsive: true, displaylogo: false }}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="px-1 text-xs font-mono font-medium text-zinc-300">
                Annual Anomalies vs. Baseline ({variableMeta.unit})
              </div>
              <Plot
                data={[
                  {
                    x: yearsA,
                    y: anomaliesA,
                    type: 'bar',
                    name: `Anomaly A (${regionA.location.name})`,
                    marker: {
                      color: anomaliesA.map((val) =>
                        val >= 0 ? '#38bdf8' : '#0284c7'
                      ),
                      opacity: 0.85,
                    },
                  },
                  ...(hasRegionB && regionB
                    ? [
                        {
                          x: yearsB,
                          y: anomaliesB,
                          type: 'bar' as const,
                          name: `Anomaly B (${regionB.location.name})`,
                          marker: {
                            color: anomaliesB.map((val) =>
                              val >= 0 ? '#f97316' : '#ef4444'
                            ),
                            opacity: 0.85,
                          },
                        },
                      ]
                    : []),
                ]}
                layout={{
                  autosize: true,
                  height: 240,
                  barmode: 'group',
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: '#09090b',
                  font: {
                    family: 'JetBrains Mono, monospace',
                    color: '#a1a1aa',
                    size: 11,
                  },
                  margin: { l: 54, r: 20, t: 36, b: 36 },
                  xaxis: { gridcolor: '#18181c' },
                  yaxis: {
                    title: { text: `Δ (${variableMeta.unit})` },
                    gridcolor: '#18181c',
                    zeroline: true,
                    zerolinecolor: '#3f3f46',
                  },
                  legend: {
                    orientation: 'h',
                    yanchor: 'bottom',
                    y: 1.02,
                    xanchor: 'left',
                    x: 0,
                  },
                }}
                config={{ responsive: true, displaylogo: false }}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: STL DECOMPOSITION (TREND, SEASONALITY, RESIDUAL NOISE) */}
        {activeTab === 'decomposition' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded bg-[#09090b] border border-[#1f1f24] p-3 space-y-2">
              <div className="text-xs font-mono font-medium text-zinc-300 px-1">
                STL Trend &amp; Residuals — {targetDecompAnalysis.location.name}
              </div>
              <Plot
                data={[
                  {
                    x: targetDecompAnalysis.time_series.map((d) => d.year),
                    y: targetDecompAnalysis.time_series.map((d) => d.value),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Observed',
                    line: { color: 'rgba(161, 161, 170, 0.45)', width: 1.25 },
                  },
                  {
                    x: targetDecompAnalysis.time_series.map((d) => d.year),
                    y: targetDecompAnalysis.time_series.map(
                      (d) => d.loess_trend ?? d.trend_line
                    ),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'STL Trend (LOESS)',
                    line: { color: targetDecompColor, width: 2.5 },
                  },
                  {
                    x: targetDecompAnalysis.time_series.map((d) => d.year),
                    y: targetDecompAnalysis.time_series.map(
                      (d) => d.residual ?? 0
                    ),
                    type: 'bar',
                    name: 'Residuals',
                    marker: { color: '#52525b', opacity: 0.55 },
                    yaxis: 'y2',
                  },
                ]}
                layout={{
                  autosize: true,
                  height: 340,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: '#09090b',
                  font: {
                    family: 'JetBrains Mono, monospace',
                    color: '#a1a1aa',
                    size: 11,
                  },
                  margin: { l: 50, r: 50, t: 38, b: 38 },
                  xaxis: {
                    title: { text: 'Year' },
                    gridcolor: '#18181c',
                  },
                  yaxis: {
                    title: { text: `Trend (${variableMeta.unit})` },
                    gridcolor: '#18181c',
                  },
                  yaxis2: {
                    title: { text: 'Residuals' },
                    overlaying: 'y',
                    side: 'right',
                    showgrid: false,
                    zeroline: true,
                    zerolinecolor: '#27272a',
                  },
                  legend: {
                    orientation: 'h',
                    yanchor: 'bottom',
                    y: 1.02,
                    xanchor: 'left',
                    x: 0,
                  },
                  hovermode: 'x unified',
                }}
                config={{ responsive: true, displaylogo: false }}
                style={{ width: '100%' }}
              />
            </div>

            <div className="rounded bg-[#09090b] border border-[#1f1f24] p-3 space-y-2">
              <div className="text-xs font-mono font-medium text-zinc-300 px-1">
                12-Month Seasonal Harmonic Profile —{' '}
                {targetDecompAnalysis.location.name}
              </div>
              <Plot
                data={[
                  {
                    x:
                      targetDecompAnalysis.stl_decomposition?.annual_seasonal_cycle?.map(
                        (c) => {
                          const enMonths = [
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun',
                            'Jul',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                          ];
                          return lang === 'en'
                            ? enMonths[(c.month - 1) % 12] || c.month_name
                            : c.month_name;
                        }
                      ) || [
                        'Jan',
                        'Feb',
                        'Mar',
                        'Apr',
                        'May',
                        'Jun',
                        'Jul',
                        'Aug',
                        'Sep',
                        'Oct',
                        'Nov',
                        'Dec',
                      ],
                    y:
                      targetDecompAnalysis.stl_decomposition?.annual_seasonal_cycle?.map(
                        (c) => c.seasonal_effect
                      ) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    type: 'scatter',
                    mode: 'lines+markers',
                    fill: 'tozeroy',
                    fillcolor:
                      decompRegion === 'B' && hasRegionB
                        ? 'rgba(249, 115, 22, 0.12)'
                        : 'rgba(56, 189, 248, 0.12)',
                    name: 'STL Seasonal Harmonic',
                    line: {
                      color: targetDecompColor,
                      width: 2.2,
                      shape: 'spline',
                    },
                    marker: {
                      color: targetDecompColor,
                      size: 6,
                    },
                  },
                ]}
                layout={{
                  autosize: true,
                  height: 340,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: '#09090b',
                  font: {
                    family: 'JetBrains Mono, monospace',
                    color: '#a1a1aa',
                    size: 11,
                  },
                  margin: { l: 50, r: 20, t: 38, b: 38 },
                  xaxis: {
                    title: { text: 'Month' },
                    gridcolor: '#18181c',
                  },
                  yaxis: {
                    title: {
                      text: `Seasonal Effect (${variableMeta.unit})`,
                    },
                    gridcolor: '#18181c',
                    zeroline: true,
                    zerolinecolor: '#27272a',
                  },
                  legend: {
                    orientation: 'h',
                    yanchor: 'bottom',
                    y: 1.02,
                    xanchor: 'left',
                    x: 0,
                  },
                }}
                config={{ responsive: true, displaylogo: false }}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
