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

interface TrendChartsProps {
  mode: AnalysisMode;
  seasonMode: SeasonMode;
  variableMeta: VariableMetadata;
  regionA: RegionAnalysis;
  regionB?: RegionAnalysis | null;
}

type ChartTab = 'timeseries' | 'stripes' | 'decomposition';
type DipoleViewMode = 'anomalies' | 'absolute';

const CLIMATE_STRIPES_COLORSCALE: Array<[number, string]> = [
  [0.0, '#1e3a8a'],
  [0.2, '#3b82f6'],
  [0.38, '#89b4fa'],
  [0.5, '#313244'],
  [0.65, '#f9e2af'],
  [0.82, '#fab387'],
  [1.0, '#f38ba8'],
];

export const TrendCharts: React.FC<TrendChartsProps> = ({
  mode,
  seasonMode,
  variableMeta,
  regionA,
  regionB,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('timeseries');
  const [dipoleView, setDipoleView] = useState<DipoleViewMode>('anomalies');
  const [decompRegion, setDecompRegion] = useState<'A' | 'B'>('A');

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
    hasRegionB && decompRegion === 'B' ? '#fab387' : '#89b4fa';

  return (
    <div className="rounded-2xl bg-ctp-mantle border border-ctp-surface0 p-5 shadow-xl">
      {/* Top Bar: Chart Tabs & Contextual Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-ctp-surface0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('timeseries')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'timeseries'
                ? 'bg-ctp-blue/20 text-ctp-blue border-ctp-blue/55 shadow-[0_0_15px_rgba(137,180,250,0.16)]'
                : 'bg-ctp-crust text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>Часовий ряд + Тренд Сена (95% CI)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stripes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'stripes'
                ? 'bg-ctp-mauve/20 text-ctp-mauve border-ctp-mauve/55 shadow-[0_0_15px_rgba(203,166,247,0.16)]'
                : 'bg-ctp-crust text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Climate Stripes (Теплова шкала аномалій)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decomposition')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'decomposition'
                ? 'bg-ctp-teal/20 text-ctp-teal border-ctp-teal/55 shadow-[0_0_15px_rgba(148,226,213,0.16)]'
                : 'bg-ctp-crust text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>STL-Декомпозиція (Тренд / Сезонність / Шум)</span>
          </button>
        </div>

        {/* Contextual Switcher for Dipole Comparison or Decomposition Region */}
        {activeTab === 'timeseries' && hasRegionB && (
          <div className="flex items-center gap-1.5 bg-ctp-crust p-1 rounded-xl border border-ctp-surface0 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-ctp-subtext0 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setDipoleView('anomalies')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                dipoleView === 'anomalies'
                  ? 'bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/45 font-semibold'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              Аномалії («Ножиці трендів»)
            </button>
            <button
              type="button"
              onClick={() => setDipoleView('absolute')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                dipoleView === 'absolute'
                  ? 'bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/45 font-semibold'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              Абсолютні ({variableMeta.unit})
            </button>
          </div>
        )}

        {activeTab === 'decomposition' && hasRegionB && (
          <div className="flex items-center gap-1.5 bg-ctp-crust p-1 rounded-xl border border-ctp-surface0 text-xs">
            <button
              type="button"
              onClick={() => setDecompRegion('A')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                decompRegion === 'A'
                  ? 'bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/45 font-semibold'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              Регіон А: {regionA.location.name}
            </button>
            <button
              type="button"
              onClick={() => setDecompRegion('B')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                decompRegion === 'B'
                  ? 'bg-ctp-peach/20 text-ctp-peach border border-ctp-peach/45 font-semibold'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              Регіон Б: {regionB?.location.name}
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: TIME SERIES + SEN'S TREND + 95% CONFIDENCE INTERVAL */}
      {activeTab === 'timeseries' && (
        <div className="w-full space-y-2">
          {/* Dedicated HTML Title Bar to prevent collision with Plotly legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h4 className="text-xs sm:text-sm font-mono font-bold text-ctp-text">
              {useAnomalyAxis
                ? `Дивергенція аномалій («Ножиці трендів») — ${variableMeta.name_ua || variableMeta.name} (${variableMeta.unit})`
                : `Динаміка показника та Лінія Тренду Сена — ${variableMeta.name_ua || variableMeta.name} (${variableMeta.unit})`}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-ctp-yellow/15 text-ctp-yellow border border-ctp-yellow/35 font-semibold">
                Season: {seasonMode}
              </span>
              <span className="text-ctp-subtext0">
                95% Student-t Confidence Band
              </span>
            </div>
          </div>

          <Plot
            data={[
              // Region A 95% Confidence Band
              {
                x: [...yearsA, ...[...yearsA].reverse()],
                y: [...yCiUpperA, ...[...yCiLowerA].reverse()],
                fill: 'toself',
                fillcolor: 'rgba(137, 180, 250, 0.14)',
                line: { color: 'transparent' },
                name: '95% Довірчий інтервал (A)',
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
                name: `${regionA.location.name} (Спостереження)`,
                line: {
                  color: 'rgba(137, 180, 250, 0.5)',
                  width: 1.6,
                },
                marker: {
                  color: '#89b4fa',
                  size: 5.5,
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
                      name: `${regionA.location.name} (LOESS згладжений)`,
                      line: {
                        color: '#cba6f7',
                        width: 2,
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
                name: `Тренд Сена A (${regionA.statistics.change_per_decade >= 0 ? '+' : ''}${regionA.statistics.change_per_decade.toFixed(3)} ${variableMeta.unit}/дек)`,
                line: {
                  color: '#89b4fa',
                  width: 3.2,
                },
              },
              // Region B Traces if Dipole Comparison mode is active
              ...(hasRegionB && regionB
                ? [
                    {
                      x: [...yearsB, ...[...yearsB].reverse()],
                      y: [...yCiUpperB, ...[...yCiLowerB].reverse()],
                      fill: 'toself' as const,
                      fillcolor: 'rgba(250, 179, 135, 0.14)',
                      line: { color: 'transparent' },
                      name: '95% Довірчий інтервал (B)',
                      hoverinfo: 'skip' as const,
                      showlegend: true,
                      type: 'scatter' as const,
                    },
                    {
                      x: yearsB,
                      y: ySeriesB,
                      type: 'scatter' as const,
                      mode: 'lines+markers' as const,
                      name: `${regionB.location.name} (Спостереження)`,
                      line: {
                        color: 'rgba(250, 179, 135, 0.5)',
                        width: 1.6,
                      },
                      marker: {
                        color: '#fab387',
                        size: 5.5,
                        opacity: 0.85,
                      },
                    },
                    {
                      x: yearsB,
                      y: yTrendB,
                      type: 'scatter' as const,
                      mode: 'lines' as const,
                      name: `Тренд Сена B (${regionB.statistics.change_per_decade >= 0 ? '+' : ''}${regionB.statistics.change_per_decade.toFixed(3)} ${variableMeta.unit}/дек)`,
                      line: {
                        color: '#fab387',
                        width: 3.2,
                      },
                    },
                  ]
                : []),
            ]}
            layout={{
              autosize: true,
              height: 420,
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(17,17,27,0.75)',
              font: {
                family: 'JetBrains Mono, Inter, sans-serif',
                color: '#cdd6f4',
                size: 11,
              },
              margin: { l: 62, r: 24, t: 54, b: 48 },
              xaxis: {
                title: { text: `Рік спостереження (Season: ${seasonMode})` },
                gridcolor: 'rgba(69, 71, 90, 0.4)',
                zerolinecolor: 'rgba(88, 91, 112, 0.6)',
              },
              yaxis: {
                title: {
                  text: useAnomalyAxis
                    ? `Аномалія (${variableMeta.unit})`
                    : `${variableMeta.name} (${variableMeta.unit})`,
                },
                gridcolor: 'rgba(69, 71, 90, 0.4)',
                zeroline: true,
                zerolinecolor: 'rgba(166, 173, 200, 0.4)',
                zerolinewidth: 1.4,
              },
              legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: 1.03,
                xanchor: 'left',
                x: 0,
                bgcolor: 'rgba(24, 24, 37, 0.85)',
              },
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
              <span className="text-xs font-mono font-bold text-ctp-blue">
                CLIMATE STRIPES — REGION A: {regionA.location.name}
              </span>
              <span className="text-[11px] font-mono text-ctp-subtext0">
                Базова норма: {regionA.statistics.baseline_mean?.toFixed(3)}{' '}
                {variableMeta.unit}
              </span>
            </div>
            <Plot
              data={[
                {
                  x: yearsA,
                  y: ['Аномалія (A)'],
                  z: [anomaliesA],
                  type: 'heatmap',
                  colorscale: CLIMATE_STRIPES_COLORSCALE,
                  zmid: 0,
                  showscale: true,
                  colorbar: {
                    title: { text: variableMeta.unit, side: 'right' },
                    thickness: 12,
                    len: 0.9,
                  },
                  hovertemplate:
                    'Рік: %{x}<br>Аномалія: %{z:+.3f} ' +
                    variableMeta.unit +
                    '<extra></extra>',
                },
              ]}
              layout={{
                autosize: true,
                height: 155,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(17,17,27,0.85)',
                font: {
                  family: 'JetBrains Mono, monospace',
                  color: '#cdd6f4',
                  size: 11,
                },
                margin: { l: 95, r: 65, t: 10, b: 32 },
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
                <span className="text-xs font-mono font-bold text-ctp-peach">
                  CLIMATE STRIPES — REGION B: {regionB.location.name}
                </span>
                <span className="text-[11px] font-mono text-ctp-subtext0">
                  Базова норма: {regionB.statistics.baseline_mean?.toFixed(3)}{' '}
                  {variableMeta.unit}
                </span>
              </div>
              <Plot
                data={[
                  {
                    x: yearsB,
                    y: ['Аномалія (B)'],
                    z: [anomaliesB],
                    type: 'heatmap',
                    colorscale: CLIMATE_STRIPES_COLORSCALE,
                    zmid: 0,
                    showscale: true,
                    colorbar: {
                      title: { text: variableMeta.unit, side: 'right' },
                      thickness: 12,
                      len: 0.9,
                    },
                    hovertemplate:
                      'Рік: %{x}<br>Аномалія: %{z:+.3f} ' +
                      variableMeta.unit +
                      '<extra></extra>',
                  },
                ]}
                layout={{
                  autosize: true,
                  height: 155,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(17,17,27,0.85)',
                  font: {
                    family: 'JetBrains Mono, monospace',
                    color: '#cdd6f4',
                    size: 11,
                  },
                  margin: { l: 95, r: 65, t: 10, b: 32 },
                  xaxis: { gridcolor: 'transparent' },
                  yaxis: { gridcolor: 'transparent' },
                }}
                config={{ responsive: true, displaylogo: false }}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="px-1 text-xs font-mono font-bold text-ctp-text">
              Щорічні кліматичні аномалії відносно базової норми ({variableMeta.unit})
            </div>
            <Plot
              data={[
                {
                  x: yearsA,
                  y: anomaliesA,
                  type: 'bar',
                  name: `Аномалія А (${regionA.location.name})`,
                  marker: {
                    color: anomaliesA.map((val) =>
                      val >= 0 ? '#89b4fa' : '#74c7ec'
                    ),
                    opacity: 0.88,
                  },
                },
                ...(hasRegionB && regionB
                  ? [
                      {
                        x: yearsB,
                        y: anomaliesB,
                        type: 'bar' as const,
                        name: `Аномалія Б (${regionB.location.name})`,
                        marker: {
                          color: anomaliesB.map((val) =>
                            val >= 0 ? '#fab387' : '#f38ba8'
                          ),
                          opacity: 0.85,
                        },
                      },
                    ]
                  : []),
              ]}
              layout={{
                autosize: true,
                height: 250,
                barmode: 'group',
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(17,17,27,0.75)',
                font: {
                  family: 'JetBrains Mono, monospace',
                  color: '#cdd6f4',
                  size: 11,
                },
                margin: { l: 58, r: 24, t: 38, b: 38 },
                xaxis: { gridcolor: 'rgba(69, 71, 90, 0.35)' },
                yaxis: {
                  title: { text: `Δ (${variableMeta.unit})` },
                  gridcolor: 'rgba(69, 71, 90, 0.35)',
                  zeroline: true,
                  zerolinecolor: '#a6adc8',
                },
                legend: {
                  orientation: 'h',
                  yanchor: 'bottom',
                  y: 1.03,
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
          <div className="rounded-xl bg-ctp-crust border border-ctp-surface0 p-3.5 space-y-2">
            <div className="text-xs font-mono font-bold text-ctp-text px-1">
              Чистий тренд STL та Залишковий шум — {targetDecompAnalysis.location.name}
            </div>
            <Plot
              data={[
                {
                  x: targetDecompAnalysis.time_series.map((d) => d.year),
                  y: targetDecompAnalysis.time_series.map((d) => d.value),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Спостережуваний ряд',
                  line: { color: 'rgba(166, 173, 200, 0.45)', width: 1.5 },
                },
                {
                  x: targetDecompAnalysis.time_series.map((d) => d.year),
                  y: targetDecompAnalysis.time_series.map(
                    (d) => d.loess_trend ?? d.trend_line
                  ),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'STL Тренд (LOESS)',
                  line: { color: targetDecompColor, width: 3 },
                },
                {
                  x: targetDecompAnalysis.time_series.map((d) => d.year),
                  y: targetDecompAnalysis.time_series.map(
                    (d) => d.residual ?? 0
                  ),
                  type: 'bar',
                  name: 'Шум (Residuals)',
                  marker: { color: '#6c7086', opacity: 0.6 },
                  yaxis: 'y2',
                },
              ]}
              layout={{
                autosize: true,
                height: 350,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(17,17,27,0.75)',
                font: {
                  family: 'JetBrains Mono, monospace',
                  color: '#cdd6f4',
                  size: 11,
                },
                margin: { l: 54, r: 54, t: 42, b: 42 },
                xaxis: {
                  title: { text: 'Рік' },
                  gridcolor: 'rgba(69, 71, 90, 0.35)',
                },
                yaxis: {
                  title: { text: `Тренд (${variableMeta.unit})` },
                  gridcolor: 'rgba(69, 71, 90, 0.35)',
                },
                yaxis2: {
                  title: { text: 'Шум (Residuals)' },
                  overlaying: 'y',
                  side: 'right',
                  showgrid: false,
                  zeroline: true,
                  zerolinecolor: 'rgba(166,173,200,0.25)',
                },
                legend: {
                  orientation: 'h',
                  yanchor: 'bottom',
                  y: 1.03,
                  xanchor: 'left',
                  x: 0,
                },
                hovermode: 'x unified',
              }}
              config={{ responsive: true, displaylogo: false }}
              style={{ width: '100%' }}
            />
          </div>

          <div className="rounded-xl bg-ctp-crust border border-ctp-surface0 p-3.5 space-y-2">
            <div className="text-xs font-mono font-bold text-ctp-text px-1">
              Сезонна хвиля (12-місячний кліматичний профіль) —{' '}
              {targetDecompAnalysis.location.name}
            </div>
            <Plot
              data={[
                {
                  x:
                    targetDecompAnalysis.stl_decomposition?.annual_seasonal_cycle?.map(
                      (c) => c.month_name
                    ) || [
                      'Січ',
                      'Лют',
                      'Бер',
                      'Кві',
                      'Тра',
                      'Чер',
                      'Лип',
                      'Сер',
                      'Вер',
                      'Жов',
                      'Лис',
                      'Гру',
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
                      ? 'rgba(250, 179, 135, 0.16)'
                      : 'rgba(137, 180, 250, 0.16)',
                  name: 'Сезонна гармоніка (STL Seasonal)',
                  line: {
                    color: targetDecompColor,
                    width: 3,
                    shape: 'spline',
                  },
                  marker: {
                    color: targetDecompColor,
                    size: 7,
                  },
                },
              ]}
              layout={{
                autosize: true,
                height: 350,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(17,17,27,0.75)',
                font: {
                  family: 'JetBrains Mono, monospace',
                  color: '#cdd6f4',
                  size: 11,
                },
                margin: { l: 54, r: 24, t: 42, b: 42 },
                xaxis: {
                  title: { text: 'Місяць року' },
                  gridcolor: 'rgba(69, 71, 90, 0.35)',
                },
                yaxis: {
                  title: {
                    text: `Сезонний внесок (${variableMeta.unit})`,
                  },
                  gridcolor: 'rgba(69, 71, 90, 0.35)',
                  zeroline: true,
                  zerolinecolor: 'rgba(166,173,200,0.4)',
                },
                legend: {
                  orientation: 'h',
                  yanchor: 'bottom',
                  y: 1.03,
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
  );
};
