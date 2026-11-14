import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Satellite,
  Download,
  RefreshCw,
  GitCompareArrows,
  Sliders,
  Compass,
  Info,
  HelpCircle,
  BookOpen,
  MapPin,
  Sparkles,
  FileSpreadsheet,
  Columns,
  Globe2,
  BarChart3,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Activity,
  Table2,
  Crosshair,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AnalysisMode,
  AnalyzeCsvRequest,
  AnalyzeTrendResponse,
  BiomeType,
  ClimateVariableCode,
  PhenomenonScenario,
  RegionLocation,
  SeasonMode,
  VariableMetadata,
} from './types/climate';
import {
  analyzeCsvTimeSeries,
  analyzeTrendApi,
  DEFAULT_VARIABLES,
  FALLBACK_PHENOMENA_SCENARIOS,
  fetchPhenomenaV2,
  fetchPresetsFromApi,
  NASA_OFFICIAL_DISCLAIMER,
} from './services/api';
import { EarthMap } from './components/EarthMap';
import { TrendCharts } from './components/TrendCharts';
import { VerdictCard } from './components/VerdictCard';
import { PhenomenaDrawer } from './components/PhenomenaDrawer';
import {
  ContextDeepLinksBar,
  CsvImporterModal,
  OfficialResourcesHub,
} from './components/OfficialResourcesHub';

export type WorkbenchView =
  | 'split'
  | 'map'
  | 'analytics'
  | 'phenomena'
  | 'csv'
  | 'resources';

export type InspectorTab = 'charts' | 'verdict' | 'guide';

const SEASON_MODES: Array<{
  id: SeasonMode;
  label: string;
  shortLabel: string;
  badge: string;
  hint: string;
}> = [
  {
    id: 'raw',
    label: 'All Months (Raw)',
    shortLabel: 'Raw',
    badge: 'ANN',
    hint: 'Річні середні без фільтрації сезонів',
  },
  {
    id: 'deseasonalized',
    label: 'Deseasonalized',
    shortLabel: 'Deseason',
    badge: 'STL',
    hint: 'Видалено річний сезонний цикл (STL)',
  },
  {
    id: 'JJA',
    label: 'Summer (JJA)',
    shortLabel: 'Summer JJA',
    badge: 'JJA',
    hint: 'Червень–Серпень (лісові пожежі та посухи)',
  },
  {
    id: 'DJF',
    label: 'Winter (DJF)',
    shortLabel: 'Winter DJF',
    badge: 'DJF',
    hint: 'Грудень–Лютий (зимові аномалії та ENSO)',
  },
  {
    id: 'MAM',
    label: 'Spring (MAM)',
    shortLabel: 'Spring MAM',
    badge: 'MAM',
    hint: 'Березень–Травень (весняне танення та паводки)',
  },
  {
    id: 'SON',
    label: 'Autumn (SON)',
    shortLabel: 'Autumn SON',
    badge: 'SON',
    hint: 'Вересень–Листопад (осінній сезон)',
  },
];

const BIOME_QUIZ_OPTIONS: Array<{
  id: BiomeType | 'all';
  title: string;
  subtitle: string;
}> = [
  {
    id: 'all',
    title: 'Усі біоми Землі',
    subtitle: 'Повний каталог (13 змінних NASA / CSA)',
  },
  {
    id: 'tidal_estuary',
    title: 'Узбережжя та Естуарії',
    subtitle: 'Хлорофіл SeaWiFS, SWOT рівень води, стік річок',
  },
  {
    id: 'rain_forest',
    title: 'Ліси та Рослинність',
    subtitle: 'Евапотранспірація, дим пожеж (AOD), ґрунт',
  },
  {
    id: 'desert',
    title: 'Посушливі Степи',
    subtitle: 'Сонячна радіація, пил, дефіцит вологи',
  },
  {
    id: 'cryosphere',
    title: 'Кріосфера та Арктика',
    subtitle: 'Радар льоду RADARSAT, глибина снігу, T2M',
  },
];

const QUICK_YEAR_PRESETS: Array<{
  label: string;
  start: number;
  end: number;
  tag: string;
}> = [
  { label: 'Full Record (1985–2026)', start: 1985, end: 2026, tag: '42 yrs' },
  { label: 'MODIS Era (2002–2026)', start: 2002, end: 2026, tag: '25 yrs' },
  { label: 'Recent 20 Yrs (2006–2026)', start: 2006, end: 2026, tag: '21 yrs' },
  { label: 'Recent Decade (2015–2026)', start: 2015, end: 2026, tag: '12 yrs' },
];

/**
 * Compact SVG Sparkline for floating map HUD and sidebar telemetry card
 */
const MiniSparkline: React.FC<{
  values: number[];
  trendValues?: number[];
  color?: string;
}> = ({ values, trendValues, color = '#89b4fa' }) => {
  if (!values || values.length < 2) return null;
  const width = 150;
  const height = 38;
  const minVal = Math.min(...values, ...(trendValues || []));
  const maxVal = Math.max(...values, ...(trendValues || []));
  const span = maxVal - minVal || 1;

  const toCoords = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / (arr.length - 1)) * (width - 6) + 3;
        const y = height - 4 - ((v - minVal) / span) * (height - 8);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={toCoords(values)}
      />
      {trendValues && trendValues.length === values.length && (
        <polyline
          fill="none"
          stroke="#a6e3a1"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          points={toCoords(trendValues)}
        />
      )}
    </svg>
  );
};

export const App: React.FC = () => {
  // Workbench Navigation State
  const [activeView, setActiveView] = useState<WorkbenchView>('split');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('charts');
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(true);
  const [coordEditorOpen, setCoordEditorOpen] = useState<boolean>(false);
  const [cameraTrigger, setCameraTrigger] = useState<number>(1);

  // Catalog & Phenomenon Scenarios State
  const [variables, setVariables] =
    useState<VariableMetadata[]>(DEFAULT_VARIABLES);
  const [scenarios, setScenarios] = useState<PhenomenonScenario[]>(
    FALLBACK_PHENOMENA_SCENARIOS
  );
  const [eonetIsLive, setEonetIsLive] = useState<boolean>(false);
  const [phenomenaDrawerOpen, setPhenomenaDrawerOpen] =
    useState<boolean>(false);
  const [csvModalOpen, setCsvModalOpen] = useState<boolean>(false);
  const [phenomenaLoading, setPhenomenaLoading] = useState<boolean>(false);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);

  // Active Query State (Defaults to Case 1: Wisconsin Wildfire Smoke in JJA)
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    FALLBACK_PHENOMENA_SCENARIOS[0].id
  );
  const [mode, setMode] = useState<AnalysisMode>(
    FALLBACK_PHENOMENA_SCENARIOS[0].mode
  );
  const [selectedBiome, setSelectedBiome] = useState<BiomeType | 'all'>('all');
  const [variable, setVariable] = useState<ClimateVariableCode>(
    FALLBACK_PHENOMENA_SCENARIOS[0].variable
  );
  const [seasonMode, setSeasonMode] = useState<SeasonMode>(
    FALLBACK_PHENOMENA_SCENARIOS[0].season_mode
  );
  const [startYear, setStartYear] = useState<number>(
    FALLBACK_PHENOMENA_SCENARIOS[0].start_year
  );
  const [endYear, setEndYear] = useState<number>(
    FALLBACK_PHENOMENA_SCENARIOS[0].end_year
  );
  const [regionA, setRegionA] = useState<RegionLocation>(
    FALLBACK_PHENOMENA_SCENARIOS[0].region_a
  );
  const [regionB, setRegionB] = useState<RegionLocation>(
    FALLBACK_PHENOMENA_SCENARIOS[0].region_b || {
      name: 'Northern Ontario Forest, Canada',
      lat: 50.5,
      lon: -86.0,
    }
  );
  const [activeTarget, setActiveTarget] = useState<'A' | 'B'>('A');

  // Analysis Execution State
  const [analysisResult, setAnalysisResult] =
    useState<AnalyzeTrendResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load variable catalog & phenomena archive on mount
  useEffect(() => {
    let mounted = true;
    fetchPresetsFromApi().then(({ available_variables }) => {
      if (!mounted) return;
      if (available_variables.length > 0) setVariables(available_variables);
    });
    fetchPhenomenaV2().then((res) => {
      if (!mounted) return;
      if (res.scenarios.length > 0) setScenarios(res.scenarios);
      setEonetIsLive(res.eonet_is_live);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Keyboard shortcuts for Workbench views (1-6 and '[' to toggle sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '1') setActiveView('split');
      else if (e.key === '2') setActiveView('map');
      else if (e.key === '3') setActiveView('analytics');
      else if (e.key === '4') setActiveView('phenomena');
      else if (e.key === '5') setActiveView('csv');
      else if (e.key === '6') setActiveView('resources');
      else if (e.key === '[') setSidebarCollapsed((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenPhenomenaDrawer = async () => {
    setPhenomenaDrawerOpen(true);
    setPhenomenaLoading(true);
    try {
      const res = await fetchPhenomenaV2();
      if (res.scenarios.length > 0) setScenarios(res.scenarios);
      setEonetIsLive(res.eonet_is_live);
    } finally {
      setPhenomenaLoading(false);
    }
  };

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await analyzeTrendApi({
        variable,
        start_year: startYear,
        end_year: endYear,
        season_mode: seasonMode,
        region_a: regionA,
        region_b: mode === 'dipole' ? regionB : null,
        prefer_live_api: true,
      });
      setAnalysisResult(response);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Помилка з’єднання з NASA / статистичним сервером.'
      );
    } finally {
      setLoading(false);
    }
  }, [variable, startYear, endYear, seasonMode, regionA, regionB, mode]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleRunCsvAnalysis = async (payload: AnalyzeCsvRequest) => {
    setCsvLoading(true);
    setErrorMsg(null);
    try {
      const res = await analyzeCsvTimeSeries(payload);
      setAnalysisResult(res);
      setMode('single');
      setActiveScenarioId('csv-custom');
      if (payload.season_mode) {
        setSeasonMode(payload.season_mode);
      }
      if (payload.lat !== undefined && payload.lon !== undefined) {
        setRegionA({
          name: `${payload.dataset_name} (CSV)`,
          lat: payload.lat,
          lon: payload.lon,
        });
      }
      setCameraTrigger((c) => c + 1);
    } finally {
      setCsvLoading(false);
    }
  };

  // Apply a Phenomenon Scenario (1-Click Auto-Configuration)
  const applyScenario = (scenario: PhenomenonScenario) => {
    setActiveScenarioId(scenario.id);
    setMode(scenario.mode);
    setVariable(scenario.variable);
    setSeasonMode(scenario.season_mode);
    setStartYear(scenario.start_year);
    setEndYear(scenario.end_year);
    setRegionA(scenario.region_a);
    if (scenario.region_b) {
      setRegionB(scenario.region_b);
    }
    setActiveTarget('A');
    setCameraTrigger((c) => c + 1);
    setPhenomenaDrawerOpen(false);
    if (activeView === 'phenomena') {
      setActiveView('split');
    }
  };

  const handleMapClickRegion = (target: 'A' | 'B', loc: RegionLocation) => {
    setActiveScenarioId('custom');
    if (target === 'A') {
      setRegionA(loc);
    } else {
      setRegionB(loc);
    }
  };

  const filteredVariables = useMemo(() => {
    if (selectedBiome === 'all') return variables;
    return variables.filter(
      (v) => !v.biomes || v.biomes.includes(selectedBiome)
    );
  }, [variables, selectedBiome]);

  const currentVarMeta =
    variables.find((v) => v.code === variable) ||
    analysisResult?.variable_metadata ||
    DEFAULT_VARIABLES[0];

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  const exportData = (format: 'json' | 'csv') => {
    if (!analysisResult) return;
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(analysisResult, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nasa_trend_${variable}_${seasonMode}_${startYear}_${endYear}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rowsA = analysisResult.region_a_analysis.time_series;
      const rowsB = analysisResult.region_b_analysis?.time_series || [];
      const header = [
        'year',
        'season_mode',
        'region_a_value',
        'region_a_anomaly',
        'region_a_trend',
        'region_a_ci_lower',
        'region_a_ci_upper',
        ...(rowsB.length
          ? ['region_b_value', 'region_b_anomaly', 'region_b_trend']
          : []),
      ].join(',');

      const lines = rowsA.map((r, idx) => {
        const rb = rowsB[idx];
        return [
          r.year,
          seasonMode,
          r.value,
          r.anomaly,
          r.trend_line,
          r.ci_lower ?? '',
          r.ci_upper ?? '',
          ...(rb ? [rb.value, rb.anomaly, rb.trend_line] : []),
        ].join(',');
      });

      const blob = new Blob([[header, ...lines].join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nasa_trend_${variable}_${seasonMode}_${startYear}_${endYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const statsA = analysisResult?.region_a_analysis.statistics;
  const seriesA = analysisResult?.region_a_analysis.time_series || [];

  const navItems: Array<{
    id: WorkbenchView;
    shortcut: string;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    badge?: string;
    accent?: string;
  }> = [
    {
      id: 'split',
      shortcut: '1',
      label: 'Split Studio',
      subtitle: 'Мапа + Графіки поруч',
      icon: <Columns className="w-4 h-4" />,
      badge: 'DEFAULT',
      accent: 'text-ctp-mauve',
    },
    {
      id: 'map',
      shortcut: '2',
      label: 'Full Geo-Stage',
      subtitle: '2D Карта / 3D Глобус + HUD',
      icon: <Globe2 className="w-4 h-4" />,
      accent: 'text-ctp-blue',
    },
    {
      id: 'analytics',
      shortcut: '3',
      label: 'Statistical Lab',
      subtitle: 'Вердикти, STL та таблиця',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: statsA ? (statsA.is_significant ? 'SIG' : 'NOISE') : undefined,
      accent: 'text-ctp-green',
    },
    {
      id: 'phenomena',
      shortcut: '4',
      label: 'Phenomena & EONET',
      subtitle: 'Кейси Екера, CSA та події',
      icon: <Satellite className="w-4 h-4" />,
      badge: `${scenarios.length}`,
      accent: 'text-ctp-sapphire',
    },
    {
      id: 'csv',
      shortcut: '5',
      label: 'CSV Time-Series Lab',
      subtitle: 'Імпорт Giovanni / AppEEARS',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      accent: 'text-ctp-teal',
    },
    {
      id: 'resources',
      shortcut: '6',
      label: 'Official Resources',
      subtitle: '13 порталів NASA / CSA / NOAA',
      icon: <Library className="w-4 h-4" />,
      badge: '13',
      accent: 'text-ctp-peach',
    },
  ];

  // Shared Mission Parameters Control Panel (used in Split, Map, and Analytics views)
  const renderMissionControlPanel = () => (
    <div className="rounded-2xl bg-ctp-mantle/95 border border-ctp-surface0 shadow-lg overflow-hidden">
      {/* Compact Header Bar of Mission Control */}
      <div className="px-4 py-2.5 bg-ctp-crust/80 border-b border-ctp-surface0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ctp-mauve font-bold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Mission Parameters</span>
          </span>

          {/* Single vs Dipole Mode Toggle */}
          <div className="inline-flex rounded-lg bg-ctp-mantle p-0.5 border border-ctp-surface0">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                mode === 'single'
                  ? 'bg-ctp-blue text-ctp-crust font-bold'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Single Region</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('dipole')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                mode === 'dipole'
                  ? 'bg-ctp-mauve text-ctp-crust font-bold'
                  : 'text-ctp-subtext0 hover:text-ctp-text'
              }`}
            >
              <GitCompareArrows className="w-3 h-3" />
              <span>Dipole (A vs B)</span>
            </button>
          </div>

          {/* Manual Coordinate Editor Toggle */}
          <button
            type="button"
            onClick={() => setCoordEditorOpen((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition flex items-center gap-1 ${
              coordEditorOpen
                ? 'bg-ctp-sapphire/20 text-ctp-sapphire border-ctp-sapphire/50'
                : 'bg-ctp-surface0/50 text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
            }`}
            title="Ручне введення точних координат Lat / Lon"
          >
            <Crosshair className="w-3 h-3" />
            <span>
              {regionA.lat.toFixed(2)}°, {regionA.lon.toFixed(2)}°
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-ctp-blue hover:bg-ctp-sapphire text-ctp-crust font-bold text-[11px] transition flex items-center gap-1"
          >
            <RefreshCw
              className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Re-Analyze</span>
          </button>

          <button
            type="button"
            onClick={() => setControlsExpanded((prev) => !prev)}
            className="px-2 py-1 rounded-lg bg-ctp-surface0/60 hover:bg-ctp-surface0 text-ctp-subtext1 text-[11px] font-mono flex items-center gap-1 border border-ctp-surface0"
          >
            {controlsExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Згорнути</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Параметри</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Manual Coordinate Editor Drawer */}
      {coordEditorOpen && (
        <div className="px-4 py-3 bg-ctp-crust/95 border-b border-ctp-surface0 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-ctp-mantle border border-ctp-blue/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-ctp-blue">
                Region A Coordinates
              </span>
              <span className="text-[10px] font-mono text-ctp-subtext0">
                Клік на мапі або ручний ввід
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={regionA.name}
                onChange={(e) =>
                  setRegionA({ ...regionA, name: e.target.value })
                }
                placeholder="Назва точки А"
                className="col-span-3 sm:col-span-1 px-2 py-1 rounded-lg bg-ctp-crust border border-ctp-surface0 text-ctp-text font-mono text-[11px]"
              />
              <label className="flex items-center gap-1 bg-ctp-crust px-2 py-1 rounded-lg border border-ctp-surface0">
                <span className="text-[10px] font-mono text-ctp-subtext0">
                  Lat:
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="-90"
                  max="90"
                  value={regionA.lat}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isNaN(val) && val >= -90 && val <= 90) {
                      setRegionA({ ...regionA, lat: val });
                      setCameraTrigger((c) => c + 1);
                    }
                  }}
                  className="w-full bg-transparent text-ctp-text font-mono text-[11px] focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-1 bg-ctp-crust px-2 py-1 rounded-lg border border-ctp-surface0">
                <span className="text-[10px] font-mono text-ctp-subtext0">
                  Lon:
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="-180"
                  max="180"
                  value={regionA.lon}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isNaN(val) && val >= -180 && val <= 180) {
                      setRegionA({ ...regionA, lon: val });
                      setCameraTrigger((c) => c + 1);
                    }
                  }}
                  className="w-full bg-transparent text-ctp-text font-mono text-[11px] focus:outline-none"
                />
              </label>
            </div>
          </div>

          {mode === 'dipole' && (
            <div className="p-2.5 rounded-xl bg-ctp-mantle border border-ctp-peach/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-ctp-peach">
                  Region B Coordinates (Dipole Pair)
                </span>
                <span className="text-[10px] font-mono text-ctp-subtext0">
                  Другий полюс порівняння
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={regionB.name}
                  onChange={(e) =>
                    setRegionB({ ...regionB, name: e.target.value })
                  }
                  placeholder="Назва точки B"
                  className="col-span-3 sm:col-span-1 px-2 py-1 rounded-lg bg-ctp-crust border border-ctp-surface0 text-ctp-text font-mono text-[11px]"
                />
                <label className="flex items-center gap-1 bg-ctp-crust px-2 py-1 rounded-lg border border-ctp-surface0">
                  <span className="text-[10px] font-mono text-ctp-subtext0">
                    Lat:
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="-90"
                    max="90"
                    value={regionB.lat}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!Number.isNaN(val) && val >= -90 && val <= 90) {
                        setRegionB({ ...regionB, lat: val });
                        setCameraTrigger((c) => c + 1);
                      }
                    }}
                    className="w-full bg-transparent text-ctp-text font-mono text-[11px] focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 bg-ctp-crust px-2 py-1 rounded-lg border border-ctp-surface0">
                  <span className="text-[10px] font-mono text-ctp-subtext0">
                    Lon:
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="-180"
                    max="180"
                    value={regionB.lon}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!Number.isNaN(val) && val >= -180 && val <= 180) {
                        setRegionB({ ...regionB, lon: val });
                        setCameraTrigger((c) => c + 1);
                      }
                    }}
                    className="w-full bg-transparent text-ctp-text font-mono text-[11px] focus:outline-none"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expandable Controls Grid */}
      {controlsExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Biome Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ctp-subtext0 flex items-center gap-1 mr-1">
              <HelpCircle className="w-3 h-3 text-ctp-yellow" />
              <span>Біом:</span>
            </span>
            {BIOME_QUIZ_OPTIONS.map((biome) => {
              const isSelected = selectedBiome === biome.id;
              return (
                <button
                  key={biome.id}
                  type="button"
                  onClick={() => {
                    setSelectedBiome(biome.id);
                    if (biome.id !== 'all') {
                      const firstMatch = variables.find((v) =>
                        v.biomes?.includes(biome.id as BiomeType)
                      );
                      if (firstMatch) {
                        setVariable(firstMatch.code as ClimateVariableCode);
                      }
                    }
                  }}
                  title={biome.subtitle}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                    isSelected
                      ? 'bg-ctp-yellow/15 border-ctp-yellow text-ctp-yellow'
                      : 'bg-ctp-crust/70 border-ctp-surface0 text-ctp-subtext0 hover:text-ctp-text hover:border-ctp-surface1'
                  }`}
                >
                  {biome.title}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
            {/* Variable Selector + Student Note (5 cols) */}
            <div className="xl:col-span-5 space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ctp-subtext0">
                Супутникова змінна NASA / CSA ({filteredVariables.length} з 13)
              </label>
              <select
                value={variable}
                onChange={(e) => {
                  setVariable(e.target.value as ClimateVariableCode);
                  setActiveScenarioId('custom');
                }}
                className="w-full rounded-xl bg-ctp-crust border border-ctp-surface1 px-3 py-2 text-xs text-ctp-text font-semibold focus:outline-none focus:border-ctp-blue"
              >
                {filteredVariables.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.code} — {v.name} ({v.unit})
                  </option>
                ))}
              </select>

              {currentVarMeta?.student_definition && (
                <div className="rounded-xl bg-ctp-crust/80 border border-ctp-surface0 px-2.5 py-1.5 flex items-start gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-ctp-sapphire shrink-0 mt-0.5" />
                  <p className="text-[11px] text-ctp-subtext0 leading-relaxed">
                    <span className="font-bold text-ctp-sapphire">
                      {currentVarMeta.satellite_badge || currentVarMeta.source}:{' '}
                    </span>
                    {currentVarMeta.student_definition}
                  </p>
                </div>
              )}
            </div>

            {/* Seasonal Filter Buttons (4 cols) */}
            <div className="xl:col-span-4 space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ctp-subtext0">
                Сезонний зріз (Seasonal Filter)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SEASON_MODES.map((sm) => {
                  const selected = seasonMode === sm.id;
                  return (
                    <button
                      key={sm.id}
                      type="button"
                      onClick={() => setSeasonMode(sm.id)}
                      title={sm.hint}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-mono transition border text-center truncate ${
                        selected
                          ? 'bg-ctp-yellow/20 text-ctp-yellow border-ctp-yellow font-bold shadow-[0_0_10px_rgba(249,226,175,0.18)]'
                          : 'bg-ctp-crust text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
                      }`}
                    >
                      {sm.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Window Presets + Sliders (3 cols) */}
            <div className="xl:col-span-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-ctp-subtext0">
                <span className="uppercase">Період</span>
                <span className="text-ctp-blue font-bold">
                  {startYear}–{endYear} ({endYear - startYear + 1} р.)
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {QUICK_YEAR_PRESETS.map((preset) => {
                  const isCurrent =
                    startYear === preset.start && endYear === preset.end;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setStartYear(preset.start);
                        setEndYear(preset.end);
                      }}
                      title={preset.label}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                        isCurrent
                          ? 'bg-ctp-blue/20 text-ctp-blue border-ctp-blue/50 font-bold'
                          : 'bg-ctp-crust text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
                      }`}
                    >
                      {preset.start}–{String(preset.end).slice(2)}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 pt-0.5">
                <input
                  type="range"
                  min={1985}
                  max={2021}
                  value={startYear}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStartYear(Math.min(val, endYear - 5));
                  }}
                  className="w-full accent-ctp-blue cursor-pointer h-1.5"
                />
                <input
                  type="range"
                  min={1990}
                  max={2026}
                  value={endYear}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEndYear(Math.max(val, startYear + 5));
                  }}
                  className="w-full accent-ctp-mauve cursor-pointer h-1.5"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Annual Observations & Extremes Table for Statistical Lab
  const renderAnnualDataTable = () => {
    if (!analysisResult || seriesA.length === 0) return null;
    const seriesB = analysisResult.region_b_analysis?.time_series || [];
    const sortedByVal = [...seriesA].sort((a, b) => b.value - a.value);
    const maxPoint = sortedByVal[0];
    const minPoint = sortedByVal[sortedByVal.length - 1];

    return (
      <div className="rounded-2xl bg-ctp-mantle/90 border border-ctp-surface0 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-ctp-crust/80 border-b border-ctp-surface0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-ctp-sapphire" />
            <h3 className="text-sm font-bold text-ctp-text">
              Annual Satellite Observations &amp; Anomalies Matrix (
              {seriesA.length} Years)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {maxPoint && (
              <span className="px-2.5 py-1 rounded-lg bg-ctp-red/15 text-ctp-red border border-ctp-red/30">
                Peak: {maxPoint.year} ({maxPoint.value.toFixed(3)}{' '}
                {currentVarMeta.unit})
              </span>
            )}
            {minPoint && (
              <span className="px-2.5 py-1 rounded-lg bg-ctp-blue/15 text-ctp-blue border border-ctp-blue/30">
                Min: {minPoint.year} ({minPoint.value.toFixed(3)}{' '}
                {currentVarMeta.unit})
              </span>
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="sticky top-0 bg-ctp-crust text-ctp-subtext0 border-b border-ctp-surface0">
              <tr>
                <th className="py-2.5 px-4">Year</th>
                <th className="py-2.5 px-4">
                  Region A ({currentVarMeta.unit})
                </th>
                <th className="py-2.5 px-4">Anomaly A</th>
                <th className="py-2.5 px-4">Sen&apos;s Trend A</th>
                <th className="py-2.5 px-4">95% CI Band</th>
                {mode === 'dipole' && seriesB.length > 0 && (
                  <>
                    <th className="py-2.5 px-4 text-ctp-peach">
                      Region B ({currentVarMeta.unit})
                    </th>
                    <th className="py-2.5 px-4 text-ctp-peach">Anomaly B</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ctp-surface0/50">
              {[...seriesA].reverse().map((row) => {
                const rb = seriesB.find((b) => b.year === row.year);
                return (
                  <tr
                    key={row.year}
                    className="hover:bg-ctp-surface0/30 transition"
                  >
                    <td className="py-2 px-4 font-bold text-ctp-text">
                      {row.year}
                    </td>
                    <td className="py-2 px-4 text-ctp-blue font-semibold">
                      {row.value.toFixed(3)}
                    </td>
                    <td
                      className={`py-2 px-4 font-semibold ${
                        row.anomaly >= 0 ? 'text-ctp-red' : 'text-ctp-sapphire'
                      }`}
                    >
                      {row.anomaly >= 0 ? '+' : ''}
                      {row.anomaly.toFixed(3)}
                    </td>
                    <td className="py-2 px-4 text-ctp-green">
                      {row.trend_line.toFixed(3)}
                    </td>
                    <td className="py-2 px-4 text-ctp-subtext0">
                      {row.ci_lower !== undefined && row.ci_upper !== undefined
                        ? `[${row.ci_lower.toFixed(2)}, ${row.ci_upper.toFixed(
                            2
                          )}]`
                        : '—'}
                    </td>
                    {mode === 'dipole' && seriesB.length > 0 && (
                      <>
                        <td className="py-2 px-4 text-ctp-peach font-semibold">
                          {rb ? rb.value.toFixed(3) : '—'}
                        </td>
                        <td className="py-2 px-4 text-ctp-subtext1">
                          {rb
                            ? `${rb.anomaly >= 0 ? '+' : ''}${rb.anomaly.toFixed(
                                3
                              )}`
                            : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ctp-base text-ctp-text flex selection:bg-ctp-mauve selection:text-ctp-crust">
      {/* =====================================================================
          LEFT PERSISTENT WORKBENCH SIDEBAR (NO MORE VERTICAL SCROLLING)
         ===================================================================== */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } shrink-0 bg-ctp-crust border-r border-ctp-surface0 flex flex-col justify-between sticky top-0 h-screen z-40 transition-all duration-200 select-none`}
      >
        {/* Top Brand + Collapse Button */}
        <div>
          <div className="p-3.5 border-b border-ctp-surface0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ctp-mauve/30 via-ctp-blue/25 to-ctp-sapphire/25 border border-ctp-mauve/50 flex items-center justify-center text-ctp-mauve shrink-0 shadow-[0_0_15px_rgba(203,166,247,0.2)]">
                <Satellite className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold tracking-tight text-ctp-text truncate">
                      Trend Detective
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-ctp-mauve/20 text-ctp-mauve border border-ctp-mauve/40">
                      STUDIO
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-ctp-subtext0 truncate">
                    NASA Space Apps 2026
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg bg-ctp-mantle hover:bg-ctp-surface0 text-ctp-subtext0 hover:text-ctp-text border border-ctp-surface0 transition shrink-0"
              title="Згорнути / Розгорнути бічну панель (клавіша [ )"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Primary Workspace Views Navigation */}
          <div className="p-2.5 space-y-1">
            {!sidebarCollapsed && (
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-ctp-subtext0">
                <span>Робочі простори</span>
                <span>Keys 1–6</span>
              </div>
            )}

            {navItems.map((item) => {
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  title={`${item.label} — ${item.subtitle} (Клавіша ${item.shortcut})`}
                  className={`w-full rounded-xl px-2.5 py-2 transition flex items-center justify-between gap-2 border ${
                    isSelected
                      ? 'bg-ctp-surface0/90 text-ctp-text border-ctp-mauve/60 shadow-[0_0_16px_rgba(203,166,247,0.16)]'
                      : 'bg-transparent text-ctp-subtext0 border-transparent hover:bg-ctp-mantle hover:text-ctp-text hover:border-ctp-surface0'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 ${
                        isSelected ? 'text-ctp-mauve' : item.accent
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold leading-tight truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-ctp-subtext0 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    )}
                  </div>

                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-1 shrink-0">
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            isSelected
                              ? 'bg-ctp-mauve/25 text-ctp-mauve'
                              : 'bg-ctp-mantle text-ctp-subtext0 border border-ctp-surface0'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-ctp-overlay0 px-1">
                        {item.shortcut}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick 1-Click Curated Scenarios in Sidebar */}
          {!sidebarCollapsed && (
            <div className="px-2.5 pt-2 border-t border-ctp-surface0/70">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-ctp-subtext0">
                <span>Швидкі кейси NASA / CSA</span>
                <span className="text-ctp-mauve font-bold">1-Click</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                {scenarios.slice(0, 7).map((sc) => {
                  const isCurrent = activeScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => applyScenario(sc)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition flex items-center justify-between gap-1.5 border ${
                        isCurrent
                          ? 'bg-ctp-blue/15 text-ctp-blue border-ctp-blue/50 font-bold'
                          : 'bg-ctp-mantle/60 text-ctp-subtext0 border-ctp-surface0/60 hover:text-ctp-text hover:border-ctp-surface1'
                      }`}
                    >
                      <span className="truncate">{sc.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-ctp-crust text-ctp-lavender shrink-0">
                        {sc.variable}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Live Telemetry Mini Card in Sidebar */}
        <div className="p-2.5 border-t border-ctp-surface0 bg-ctp-mantle/60">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-ctp-subtext0 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-ctp-green" />
                  <span>LIVE TELEMETRY</span>
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold ${
                    eonetIsLive
                      ? 'bg-ctp-green/15 text-ctp-green'
                      : 'bg-ctp-yellow/15 text-ctp-yellow'
                  }`}
                >
                  {eonetIsLive ? 'EONET LIVE' : 'CACHE'}
                </span>
              </div>

              {statsA && (
                <div className="rounded-xl bg-ctp-crust p-2 border border-ctp-surface0 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-ctp-subtext0 truncate">
                      {regionA.name}
                    </span>
                    <span
                      className={`font-bold ${
                        statsA.is_significant
                          ? 'text-ctp-green'
                          : 'text-ctp-yellow'
                      }`}
                    >
                      p={statsA.p_value.toFixed(4)}
                    </span>
                  </div>
                  <MiniSparkline
                    values={seriesA.map((d) => d.value)}
                    trendValues={seriesA.map((d) => d.trend_line)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPhenomenaDrawer}
                title="Відкрити каталог феноменів NASA"
                className="p-2 rounded-xl bg-ctp-mauve/20 text-ctp-mauve hover:bg-ctp-mauve/30 transition"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKBENCH STAGE (TOP TELEMETRY HEADER + ACTIVE VIEWPORT)
         ===================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* TOP LIVE TELEMETRY HUD HEADER */}
        <header className="sticky top-0 z-30 border-b border-ctp-surface0 bg-ctp-mantle/90 backdrop-blur-md px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Active Case / Coordinates & Live Statistical Verdict Pill */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="px-2.5 py-1 rounded-lg bg-ctp-crust border border-ctp-surface0 text-xs font-mono font-bold text-ctp-blue flex items-center gap-1.5 truncate max-w-xs">
                <MapPin className="w-3.5 h-3.5 text-ctp-blue shrink-0" />
                <span className="truncate">{regionA.name}</span>
              </span>

              {mode === 'dipole' && (
                <span className="px-2.5 py-1 rounded-lg bg-ctp-crust border border-ctp-peach/40 text-xs font-mono font-bold text-ctp-peach flex items-center gap-1.5 truncate max-w-xs">
                  <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{regionB.name}</span>
                </span>
              )}

              <span className="px-2 py-1 rounded-lg bg-ctp-surface0/70 text-[11px] font-mono text-ctp-lavender font-semibold">
                {variable} • {seasonMode} • {startYear}–{endYear}
              </span>

              {/* Instant Verdict Badge in Header */}
              {statsA && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeView === 'split') setInspectorTab('verdict');
                    else setActiveView('analytics');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition flex items-center gap-1.5 ${
                    statsA.is_significant
                      ? 'bg-ctp-green/15 text-ctp-green border-ctp-green/50 hover:bg-ctp-green/25'
                      : 'bg-ctp-yellow/15 text-ctp-yellow border-ctp-yellow/50 hover:bg-ctp-yellow/25'
                  }`}
                  title="Натисніть для перегляду статистичного доказу"
                >
                  {statsA.is_significant ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {statsA.is_significant
                      ? `SIGNIFICANT (p = ${statsA.p_value.toFixed(4)})`
                      : `EMERGING (p = ${statsA.p_value.toFixed(3)}${
                          statsA.time_to_significance?.additional_years_needed
                            ? ` • +${statsA.time_to_significance.additional_years_needed} yrs`
                            : ''
                        })`}
                  </span>
                  {statsA.change_per_decade >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {statsA.change_per_decade >= 0 ? '+' : ''}
                    {statsA.change_per_decade.toFixed(3)}/dec
                  </span>
                </button>
              )}
            </div>

            {/* Right: Quick Action Buttons (Phenomena Modal, CSV Modal, Export) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPhenomenaDrawer}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-ctp-mauve via-ctp-blue to-ctp-sapphire hover:brightness-110 text-ctp-crust font-extrabold text-xs transition flex items-center gap-1.5 shadow-[0_0_18px_rgba(203,166,247,0.3)]"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Fetch Scenarios &amp; EONET</span>
                <span className="px-1.5 py-0.2 rounded-full bg-ctp-crust/25 text-ctp-crust font-mono text-[10px]">
                  {scenarios.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCsvModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-sapphire font-mono font-bold text-xs transition flex items-center gap-1.5 border border-ctp-sapphire/40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import CSV</span>
              </button>

              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => exportData('csv')}
                  disabled={!analysisResult}
                  className="px-2.5 py-1.5 rounded-lg bg-ctp-crust hover:bg-ctp-surface0 text-ctp-subtext1 text-[11px] font-mono transition flex items-center gap-1 border border-ctp-surface0"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportData('json')}
                  disabled={!analysisResult}
                  className="px-2.5 py-1.5 rounded-lg bg-ctp-crust hover:bg-ctp-surface0 text-ctp-subtext1 text-[11px] font-mono transition flex items-center gap-1 border border-ctp-surface0"
                >
                  <Download className="w-3 h-3" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contextual Deep Links Bar (Giovanni, AppEEARS, KNMI, GES DISC, NOAA CDO, CSA) */}
        <div className="px-4">
          <ContextDeepLinksBar
            variable={variable}
            regionA={regionA}
            startYear={startYear}
            endYear={endYear}
            onOpenResourcesModal={() => setActiveView('resources')}
          />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-4 mt-3 rounded-xl bg-ctp-red/15 border border-ctp-red p-3 text-xs text-ctp-red">
            {errorMsg}
          </div>
        )}

        {/* =================================================================
            ACTIVE WORKSPACE VIEWPORT
           ================================================================= */}
        <main className="flex-1 p-4 space-y-4">
          {/* ---------------------------------------------------------------
              VIEW 1: SPLIT STUDIO (DEFAULT — MAP + LIVE INSPECTOR SIDE-BY-SIDE)
             --------------------------------------------------------------- */}
          {activeView === 'split' && (
            <div className="space-y-3">
              {renderMissionControlPanel()}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left Column (7 cols): Interactive 2D/3D Map + Active Scenario Banner */}
                <div className="lg:col-span-7 space-y-3">
                  <EarthMap
                    mode={mode}
                    variable={variable}
                    regionA={regionA}
                    regionB={regionB}
                    activeTarget={activeTarget}
                    cameraTrigger={cameraTrigger}
                    onMapClickRegion={handleMapClickRegion}
                    onToggleActiveTarget={setActiveTarget}
                  />

                  {/* Compact Scenario Context Strip under Map */}
                  {activeScenario && (
                    <div className="rounded-2xl bg-ctp-mantle/90 border border-ctp-mauve/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-ctp-mauve/20 text-ctp-mauve font-bold">
                            Active Case
                          </span>
                          <span className="text-xs font-bold text-ctp-text">
                            {activeScenario.title}
                          </span>
                        </div>
                        <p className="text-xs text-ctp-subtext0 leading-relaxed">
                          {activeScenario.scientific_summary}
                        </p>
                      </div>

                      {seasonMode === 'raw' &&
                        activeScenario.season_mode !== 'raw' && (
                          <button
                            type="button"
                            onClick={() =>
                              setSeasonMode(activeScenario.season_mode)
                            }
                            className="px-3 py-1.5 rounded-xl bg-ctp-yellow/20 hover:bg-ctp-yellow/30 text-ctp-yellow border border-ctp-yellow/50 text-xs font-mono font-bold shrink-0 transition"
                          >
                            Switch to {activeScenario.season_mode}
                          </button>
                        )}
                    </div>
                  )}
                </div>

                {/* Right Column (5 cols): Live Detective Inspector Dock */}
                <div className="lg:col-span-5 rounded-2xl bg-ctp-mantle/95 border border-ctp-surface0 shadow-xl flex flex-col overflow-hidden">
                  {/* Inspector Dock Tab Header */}
                  <div className="px-3.5 py-2.5 bg-ctp-crust border-b border-ctp-surface0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInspectorTab('charts')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          inspectorTab === 'charts'
                            ? 'bg-ctp-blue text-ctp-crust shadow-sm'
                            : 'text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0/50'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Charts &amp; Trend</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectorTab('verdict')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          inspectorTab === 'verdict'
                            ? 'bg-ctp-mauve text-ctp-crust shadow-sm'
                            : 'text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0/50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verdict &amp; Proof</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectorTab('guide')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          inspectorTab === 'guide'
                            ? 'bg-ctp-sapphire text-ctp-crust shadow-sm'
                            : 'text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0/50'
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Case &amp; Guide</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveView('analytics')}
                      className="px-2 py-1 rounded-lg bg-ctp-surface0/70 hover:bg-ctp-surface1 text-[10px] font-mono text-ctp-subtext1 transition shrink-0"
                      title="Розгорнути на весь екран у Statistical Lab"
                    >
                      Full Lab
                    </button>
                  </div>

                  {/* Inspector Body */}
                  <div className="p-3.5 max-h-[680px] overflow-y-auto space-y-3">
                    {!analysisResult ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-2 text-ctp-subtext0">
                        <RefreshCw className="w-6 h-6 animate-spin text-ctp-blue" />
                        <span className="text-xs font-mono">
                          Обчислення тренду Сена та p-value...
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* TAB 1: CHARTS & TREND (Side-by-side with map!) */}
                        {inspectorTab === 'charts' && (
                          <div className="space-y-3">
                            {/* Compact Quick Metrics Strip */}
                            {statsA && (
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl bg-ctp-crust p-2.5 border border-ctp-surface0">
                                  <div className="text-[10px] font-mono text-ctp-subtext0">
                                    p-value (MK)
                                  </div>
                                  <div
                                    className={`text-sm font-mono font-extrabold ${
                                      statsA.is_significant
                                        ? 'text-ctp-green'
                                        : 'text-ctp-yellow'
                                    }`}
                                  >
                                    {statsA.p_value < 0.0001
                                      ? '< 0.0001'
                                      : statsA.p_value.toFixed(4)}
                                  </div>
                                  <div className="text-[10px] text-ctp-subtext0">
                                    {statsA.is_significant
                                      ? 'Доведений тренд'
                                      : 'Шум / Мінливість'}
                                  </div>
                                </div>

                                <div className="rounded-xl bg-ctp-crust p-2.5 border border-ctp-surface0">
                                  <div className="text-[10px] font-mono text-ctp-subtext0">
                                    Sen&apos;s Slope / Dec
                                  </div>
                                  <div className="text-sm font-mono font-extrabold text-ctp-blue">
                                    {statsA.change_per_decade >= 0 ? '+' : ''}
                                    {statsA.change_per_decade.toFixed(3)}
                                  </div>
                                  <div className="text-[10px] text-ctp-subtext0 truncate">
                                    {currentVarMeta.unit} / 10 р.
                                  </div>
                                </div>

                                <div className="rounded-xl bg-ctp-crust p-2.5 border border-ctp-surface0">
                                  <div className="text-[10px] font-mono text-ctp-subtext0">
                                    Час до p &lt; 0.05
                                  </div>
                                  <div className="text-sm font-mono font-extrabold text-ctp-mauve">
                                    {statsA.is_significant
                                      ? '0 р. (Вже є)'
                                      : `+${
                                          statsA.time_to_significance
                                            ?.additional_years_needed ?? '—'
                                        } р.`}
                                  </div>
                                  <div className="text-[10px] text-ctp-subtext0">
                                    SNR: {statsA.signal_to_noise_ratio}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Interactive Plotly Chart right next to the map */}
                            <TrendCharts
                              mode={mode}
                              seasonMode={seasonMode}
                              variableMeta={analysisResult.variable_metadata}
                              regionA={analysisResult.region_a_analysis}
                              regionB={analysisResult.region_b_analysis}
                              onOpenResourcesModal={() =>
                                setActiveView('resources')
                              }
                            />
                          </div>
                        )}

                        {/* TAB 2: VERDICT & STATISTICAL PROOF */}
                        {inspectorTab === 'verdict' && (
                          <div className="space-y-3">
                            {mode === 'dipole' &&
                              analysisResult.dipole_comparison && (
                                <div className="rounded-xl bg-ctp-crust border border-ctp-mauve/50 p-3 space-y-1">
                                  <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="text-ctp-mauve font-bold">
                                      Dipole Correlation (r ={' '}
                                      {analysisResult.dipole_comparison.pearson_r.toFixed(
                                        3
                                      )}
                                      )
                                    </span>
                                    <span className="text-ctp-subtext0">
                                      p ={' '}
                                      {analysisResult.dipole_comparison.correlation_p_value.toFixed(
                                        4
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-xs text-ctp-subtext1">
                                    {analysisResult.dipole_comparison.verdict}
                                  </p>
                                </div>
                              )}

                            <VerdictCard
                              regionKey="A"
                              analysis={analysisResult.region_a_analysis}
                              variableMeta={analysisResult.variable_metadata}
                            />

                            {mode === 'dipole' &&
                              analysisResult.region_b_analysis && (
                                <VerdictCard
                                  regionKey="B"
                                  analysis={analysisResult.region_b_analysis}
                                  variableMeta={
                                    analysisResult.variable_metadata
                                  }
                                />
                              )}
                          </div>
                        )}

                        {/* TAB 3: SCENARIO DETAILS & DETECTIVE GUIDE */}
                        {inspectorTab === 'guide' && (
                          <div className="space-y-3">
                            {activeScenario ? (
                              <div className="rounded-xl bg-ctp-crust border border-ctp-surface0 p-3.5 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded bg-ctp-mauve/20 text-ctp-mauve font-mono text-[10px] font-bold">
                                    {activeScenario.satellite_badge}
                                  </span>
                                  <span className="text-[11px] font-mono text-ctp-yellow">
                                    Recommended: {activeScenario.season_mode}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-ctp-text">
                                  {activeScenario.title}
                                </h3>
                                <p className="text-xs text-ctp-subtext1 leading-relaxed">
                                  {activeScenario.scientific_summary}
                                </p>
                                {activeScenario.student_note && (
                                  <div className="rounded-lg bg-ctp-mantle p-2.5 border border-ctp-surface0 text-xs text-ctp-subtext0">
                                    <span className="font-bold text-ctp-mauve">
                                      Підказка для студента:{' '}
                                    </span>
                                    {activeScenario.student_note}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl bg-ctp-crust border border-ctp-surface0 p-3.5 text-xs text-ctp-subtext0">
                                Ви досліджуєте власну точку на карті. Спробуйте
                                перемикати сезонні зрізи (Raw, JJA, DJF,
                                Deseasonalized), щоб перевірити, чи ховається
                                статистично значущий тренд в окремому сезоні.
                              </div>
                            )}

                            <div className="rounded-xl bg-ctp-crust border border-ctp-surface0 p-3.5 space-y-2 text-xs text-ctp-subtext0">
                              <div className="font-bold text-ctp-text flex items-center gap-1.5">
                                <Info className="w-4 h-4 text-ctp-blue" />
                                <span>
                                  Як користуватися Workbench-інтерфейсом:
                                </span>
                              </div>
                              <ul className="space-y-1.5 list-disc list-inside">
                                <li>
                                  Клікайте будь-де на мапі зліва — графік та
                                  статистичний вердикт справа оновлюються
                                  миттєво без прокрутки сторінки.
                                </li>
                                <li>
                                  Перемикайтеся між вкладками лівого меню
                                  (клавіші{' '}
                                  <code className="text-ctp-mauve">1</code>–
                                  <code className="text-ctp-mauve">6</code>) для
                                  повноекранної карти, лабораторії таблиць або
                                  каталогу 13 ресурсів NASA/CSA.
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              VIEW 2: FULL GEO-STAGE (FULL-WIDTH MAP/3D GLOBE + FLOATING HUD)
             --------------------------------------------------------------- */}
          {activeView === 'map' && (
            <div className="space-y-3">
              {renderMissionControlPanel()}

              <div className="relative">
                <EarthMap
                  mode={mode}
                  variable={variable}
                  regionA={regionA}
                  regionB={regionB}
                  activeTarget={activeTarget}
                  cameraTrigger={cameraTrigger}
                  onMapClickRegion={handleMapClickRegion}
                  onToggleActiveTarget={setActiveTarget}
                />

                {/* Floating Glassmorphic Telemetry HUD on the Map */}
                {statsA && (
                  <div className="mt-3 lg:mt-0 lg:absolute lg:bottom-5 lg:right-5 z-[500] lg:w-80 rounded-2xl bg-ctp-crust/90 backdrop-blur-md border border-ctp-surface1 p-3.5 shadow-2xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ctp-mauve font-bold">
                        Live Map Telemetry HUD
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          statsA.is_significant
                            ? 'bg-ctp-green/20 text-ctp-green'
                            : 'bg-ctp-yellow/20 text-ctp-yellow'
                        }`}
                      >
                        {statsA.is_significant ? 'p < 0.05 SIG' : 'NOISE'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-ctp-text truncate">
                      {regionA.name}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-mono space-y-0.5">
                        <div className="text-ctp-subtext0">
                          Slope:{' '}
                          <span className="text-ctp-blue font-bold">
                            {statsA.change_per_decade >= 0 ? '+' : ''}
                            {statsA.change_per_decade.toFixed(3)}{' '}
                            {currentVarMeta.unit}/dec
                          </span>
                        </div>
                        <div className="text-ctp-subtext0">
                          p-value:{' '}
                          <span className="text-ctp-text font-bold">
                            {statsA.p_value.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <MiniSparkline
                        values={seriesA.map((d) => d.value)}
                        trendValues={seriesA.map((d) => d.trend_line)}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveView('split')}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-ctp-blue text-ctp-crust font-bold text-[11px] transition text-center"
                      >
                        Split View
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView('analytics')}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text font-semibold text-[11px] transition text-center"
                      >
                        Full Charts
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              VIEW 3: STATISTICAL LAB (FULL CHARTS + VERDICTS + DATA TABLE)
             --------------------------------------------------------------- */}
          {activeView === 'analytics' && (
            <div className="space-y-4">
              {renderMissionControlPanel()}

              {analysisResult && (
                <>
                  {/* Dipole Correlation Banner */}
                  {mode === 'dipole' && analysisResult.dipole_comparison && (
                    <div
                      className={`rounded-2xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        analysisResult.dipole_comparison.is_opposite_trend
                          ? 'bg-ctp-mauve/10 border-ctp-mauve'
                          : 'bg-ctp-surface0/40 border-ctp-surface1'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <GitCompareArrows className="w-5 h-5 text-ctp-mauve" />
                          <span className="text-xs font-mono uppercase tracking-wider text-ctp-mauve font-bold">
                            Dipole Teleconnection Verdict
                          </span>
                          {analysisResult.dipole_comparison.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-ctp-mauve/20 text-ctp-mauve border border-ctp-mauve/40">
                              {analysisResult.dipole_comparison.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ctp-text font-medium">
                          {analysisResult.dipole_comparison.verdict}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                        <div className="px-3 py-2 rounded-xl bg-ctp-crust border border-ctp-surface0">
                          <span className="text-ctp-subtext0 block text-[10px]">
                            Pearson r
                          </span>
                          <span className="text-sm font-bold text-ctp-text">
                            {analysisResult.dipole_comparison.pearson_r}
                          </span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-ctp-crust border border-ctp-surface0">
                          <span className="text-ctp-subtext0 block text-[10px]">
                            Corr p-value
                          </span>
                          <span className="text-sm font-bold text-ctp-text">
                            {
                              analysisResult.dipole_comparison
                                .correlation_p_value
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verdict Cards Grid */}
                  <div
                    className={`grid grid-cols-1 ${
                      mode === 'dipole' && analysisResult.region_b_analysis
                        ? 'lg:grid-cols-2'
                        : 'lg:grid-cols-1'
                    } gap-4`}
                  >
                    <VerdictCard
                      regionKey="A"
                      analysis={analysisResult.region_a_analysis}
                      variableMeta={analysisResult.variable_metadata}
                    />
                    {mode === 'dipole' && analysisResult.region_b_analysis && (
                      <VerdictCard
                        regionKey="B"
                        analysis={analysisResult.region_b_analysis}
                        variableMeta={analysisResult.variable_metadata}
                      />
                    )}
                  </div>

                  {/* Full-Width Interactive Plotly Chart */}
                  <TrendCharts
                    mode={mode}
                    seasonMode={seasonMode}
                    variableMeta={analysisResult.variable_metadata}
                    regionA={analysisResult.region_a_analysis}
                    regionB={analysisResult.region_b_analysis}
                    onOpenResourcesModal={() => setActiveView('resources')}
                  />

                  {/* Annual Data Table & Extremes Matrix */}
                  {renderAnnualDataTable()}
                </>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------
              VIEW 4: PHENOMENA & LIVE NASA EONET ARCHIVE (EMBEDDED VIEW)
             --------------------------------------------------------------- */}
          {activeView === 'phenomena' && (
            <PhenomenaDrawer
              isOpen={true}
              isModal={false}
              loading={phenomenaLoading}
              scenarios={scenarios}
              eonetIsLive={eonetIsLive}
              activeScenarioId={activeScenarioId}
              onClose={() => setActiveView('split')}
              onRefresh={async () => {
                setPhenomenaLoading(true);
                try {
                  const res = await fetchPhenomenaV2();
                  if (res.scenarios.length > 0) setScenarios(res.scenarios);
                  setEonetIsLive(res.eonet_is_live);
                } finally {
                  setPhenomenaLoading(false);
                }
              }}
              onSelectScenario={applyScenario}
            />
          )}

          {/* ---------------------------------------------------------------
              VIEW 5: CSV TIME-SERIES LAB (GIOVANNI / APPEEARS / NOAA CDO)
             --------------------------------------------------------------- */}
          {activeView === 'csv' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              <div className="xl:col-span-6">
                <CsvImporterModal
                  isOpen={true}
                  isModal={false}
                  loading={csvLoading}
                  defaultSeasonMode={seasonMode}
                  onClose={() => setActiveView('split')}
                  onRunCsvAnalysis={handleRunCsvAnalysis}
                />
              </div>

              <div className="xl:col-span-6 space-y-4">
                {analysisResult && (
                  <>
                    <VerdictCard
                      regionKey="A"
                      analysis={analysisResult.region_a_analysis}
                      variableMeta={analysisResult.variable_metadata}
                    />
                    <TrendCharts
                      mode="single"
                      seasonMode={seasonMode}
                      variableMeta={analysisResult.variable_metadata}
                      regionA={analysisResult.region_a_analysis}
                      onOpenResourcesModal={() => setActiveView('resources')}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              VIEW 6: 13 OFFICIAL RESOURCES HUB (NASA / CSA / KNMI / NOAA)
             --------------------------------------------------------------- */}
          {activeView === 'resources' && (
            <OfficialResourcesHub
              activeVariable={variable}
              onSelectVariable={(varCode) => {
                setVariable(varCode);
                setActiveScenarioId('custom');
                setActiveView('split');
              }}
            />
          )}
        </main>

        {/* Compact Footer with Official NASA Disclaimer */}
        <footer className="mt-auto border-t border-ctp-surface0 bg-ctp-crust/90 px-4 py-3 text-[11px] text-ctp-subtext0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <span className="text-ctp-mauve font-bold">
                Earth System Trend Detective (Workbench UI)
              </span>
              <span>•</span>
              <span>
                Mann-Kendall • Sen&apos;s Slope • Student&apos;s t-test • STL
              </span>
            </div>
            <p className="text-[10px] text-ctp-subtext0 max-w-2xl leading-relaxed">
              {NASA_OFFICIAL_DISCLAIMER}
            </p>
          </div>
        </footer>
      </div>

      {/* Modal Overlays (accessible from any view via Header buttons) */}
      <PhenomenaDrawer
        isOpen={phenomenaDrawerOpen}
        isModal={true}
        loading={phenomenaLoading}
        scenarios={scenarios}
        eonetIsLive={eonetIsLive}
        activeScenarioId={activeScenarioId}
        onClose={() => setPhenomenaDrawerOpen(false)}
        onRefresh={handleOpenPhenomenaDrawer}
        onSelectScenario={applyScenario}
      />

      <CsvImporterModal
        isOpen={csvModalOpen}
        isModal={true}
        loading={csvLoading}
        defaultSeasonMode={seasonMode}
        onClose={() => setCsvModalOpen(false)}
        onRunCsvAnalysis={handleRunCsvAnalysis}
      />
    </div>
  );
};

export default App;
