import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Satellite,
  Download,
  RefreshCw,
  GitCompareArrows,
  Compass,
  MapPin,
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
  Table2,
  Crosshair,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  EyeOff,
  Eye,
  Search,
  Link2,
  Check,
  X,
  Printer,
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
import {
  formatDipoleVerdictI18n,
  getBiomeOptionsI18n,
  getScenarioTextI18n,
  getSeasonModesI18n,
  getVariableDefinitionI18n,
  useLanguage,
} from './i18n/translations';
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

export type SplitLayoutMode =
  | 'balanced'
  | 'wide-globe'
  | 'wide-chart'
  | 'only-globe'
  | 'only-chart';

const QUICK_YEAR_PRESETS: Array<{
  label: string;
  start: number;
  end: number;
}> = [
  { label: '1985–2026', start: 1985, end: 2026 },
  { label: '2002–2026', start: 2002, end: 2026 },
  { label: '2006–2026', start: 2006, end: 2026 },
  { label: '2015–2026', start: 2015, end: 2026 },
];

/**
 * Minimalist Monochrome SVG Sparkline
 */
const MiniSparkline: React.FC<{
  values: number[];
  trendValues?: number[];
  color?: string;
}> = ({ values, trendValues, color = '#d4d4d8' }) => {
  if (!values || values.length < 2) return null;
  const width = 148;
  const height = 32;
  const minVal = Math.min(...values, ...(trendValues || []));
  const maxVal = Math.max(...values, ...(trendValues || []));
  const span = maxVal - minVal || 1;

  const toCoords = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / (arr.length - 1)) * (width - 4) + 2;
        const y = height - 3 - ((v - minVal) / span) * (height - 6);
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
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={toCoords(values)}
      />
      {trendValues && trendValues.length === values.length && (
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.25"
          strokeDasharray="2 2"
          points={toCoords(trendValues)}
        />
      )}
    </svg>
  );
};

export const App: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  // Workbench Navigation & Split Layout State
  const [activeView, setActiveView] = useState<WorkbenchView>('split');
  const [splitLayout, setSplitLayout] = useState<SplitLayoutMode>('balanced');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('charts');
  const [controlsExpanded, setControlsExpanded] = useState<boolean>(true);
  const [coordEditorOpen, setCoordEditorOpen] = useState<boolean>(false);
  const [cameraTrigger, setCameraTrigger] = useState<number>(1);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [commandQuery, setCommandQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [spatialBoxAveraging, setSpatialBoxAveraging] = useState<boolean>(false);
  const [missionBriefOpen, setMissionBriefOpen] = useState<boolean>(false);

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

  // Hydrate initial state from URL query parameters if present
  const initialUrlParams = useMemo(
    () =>
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams(),
    []
  );

  // Active Query State
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    initialUrlParams.get('scenario') || FALLBACK_PHENOMENA_SCENARIOS[0].id
  );
  const [mode, setMode] = useState<AnalysisMode>(
    (initialUrlParams.get('mode') as AnalysisMode) ||
      FALLBACK_PHENOMENA_SCENARIOS[0].mode
  );
  const [selectedBiome, setSelectedBiome] = useState<BiomeType | 'all'>('all');
  const [variable, setVariable] = useState<ClimateVariableCode>(
    (initialUrlParams.get('var') as ClimateVariableCode) ||
      FALLBACK_PHENOMENA_SCENARIOS[0].variable
  );
  const [seasonMode, setSeasonMode] = useState<SeasonMode>(
    (initialUrlParams.get('season') as SeasonMode) ||
      FALLBACK_PHENOMENA_SCENARIOS[0].season_mode
  );
  const [startYear, setStartYear] = useState<number>(() => {
    const p = Number(initialUrlParams.get('start'));
    return p >= 1981 && p <= 2025 ? p : FALLBACK_PHENOMENA_SCENARIOS[0].start_year;
  });
  const [endYear, setEndYear] = useState<number>(() => {
    const p = Number(initialUrlParams.get('end'));
    return p >= 1982 && p <= 2026 ? p : FALLBACK_PHENOMENA_SCENARIOS[0].end_year;
  });
  const [regionA, setRegionA] = useState<RegionLocation>(() => {
    const lat = parseFloat(initialUrlParams.get('lat') || '');
    const lon = parseFloat(initialUrlParams.get('lon') || '');
    const name = initialUrlParams.get('name');
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return {
        name: name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
        lat,
        lon,
      };
    }
    return FALLBACK_PHENOMENA_SCENARIOS[0].region_a;
  });
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync active investigation state to URL query parameters (shareable reproducible links)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('var', variable);
    params.set('season', seasonMode);
    params.set('start', String(startYear));
    params.set('end', String(endYear));
    params.set('mode', mode);
    params.set('lat', regionA.lat.toFixed(2));
    params.set('lon', regionA.lon.toFixed(2));
    params.set('name', regionA.name);
    if (activeScenarioId && activeScenarioId !== 'custom') {
      params.set('scenario', activeScenarioId);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [variable, seasonMode, startYear, endYear, mode, regionA, activeScenarioId]);

  const handleCopyShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  // Trigger resize event when splitLayout or sidebarCollapsed changes
  useEffect(() => {
    const t1 = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    const t2 = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 240);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [splitLayout, sidebarCollapsed, activeView]);

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

  // Keyboard shortcuts for Workbench views (1-6, '[' to toggle sidebar, Ctrl+K / Cmd+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
        return;
      }
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
  }, [commandPaletteOpen]);

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

  const runAnalysis = useCallback(
    async (opts?: { forceRefresh?: boolean }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setErrorMsg(null);
      try {
        const response = await analyzeTrendApi(
          {
            variable,
            start_year: startYear,
            end_year: endYear,
            season_mode: seasonMode,
            region_a: regionA,
            region_b: mode === 'dipole' ? regionB : null,
            prefer_live_api: true,
            spatial_box_averaging: spatialBoxAveraging,
          },
          {
            signal: controller.signal,
            forceRefresh: opts?.forceRefresh,
          }
        );
        if (!controller.signal.aborted) {
          setAnalysisResult(response);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setErrorMsg(
          err?.message || 'Помилка з’єднання з NASA / статистичним сервером.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      variable,
      startYear,
      endYear,
      seasonMode,
      regionA,
      regionB,
      mode,
      spatialBoxAveraging,
    ]
  );

  // Debounce automatic slider/coordinate updates by 140ms to prevent request storms
  useEffect(() => {
    const timer = window.setTimeout(() => {
      runAnalysis();
    }, 140);
    return () => window.clearTimeout(timer);
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
  const seasonModesList = useMemo(() => getSeasonModesI18n(lang), [lang]);
  const biomeOptionsList = useMemo(() => getBiomeOptionsI18n(lang), [lang]);

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
  }> = [
    {
      id: 'split',
      shortcut: '1',
      label: t.navSplitLabel,
      subtitle: t.navSplitSub,
      icon: <Columns className="w-3.5 h-3.5" />,
    },
    {
      id: 'map',
      shortcut: '2',
      label: t.navMapLabel,
      subtitle: t.navMapSub,
      icon: <Globe2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'analytics',
      shortcut: '3',
      label: t.navAnalyticsLabel,
      subtitle: t.navAnalyticsSub,
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: 'phenomena',
      shortcut: '4',
      label: t.navPhenomenaLabel,
      subtitle: t.navPhenomenaSub,
      icon: <Satellite className="w-3.5 h-3.5" />,
    },
    {
      id: 'csv',
      shortcut: '5',
      label: t.navCsvLabel,
      subtitle: t.navCsvSub,
      icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    },
    {
      id: 'resources',
      shortcut: '6',
      label: t.navResourcesLabel,
      subtitle: t.navResourcesSub,
      icon: <Library className="w-3.5 h-3.5" />,
    },
  ];

  // Minimalist Swiss-Grid Instrument Panel
  const renderMissionControlPanel = () => (
    <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] overflow-hidden">
      {/* Slim Header Bar */}
      <div className="px-3.5 py-2 bg-[#09090b] border-b border-[#1f1f24] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
            {t.missionParamsTitle}
          </span>

          <span className="text-zinc-700">|</span>

          {/* Single vs Dipole Segmented Switch */}
          <div className="inline-flex rounded bg-[#121216] p-0.5 border border-[#1f1f24]">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                mode === 'single'
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.singleRegionBtn}
            </button>
            <button
              type="button"
              onClick={() => setMode('dipole')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                mode === 'dipole'
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.dipoleModeBtn}
            </button>
          </div>

          {/* Coordinate Editor Trigger */}
          <button
            type="button"
            onClick={() => setCoordEditorOpen((prev) => !prev)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1 ${
              coordEditorOpen
                ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                : 'bg-[#121216] text-zinc-400 border-[#1f1f24] hover:text-zinc-200'
            }`}
            title={t.manualCoordsTitle}
          >
            <Crosshair className="w-3 h-3" />
            <span>
              {regionA.lat.toFixed(2)}°, {regionA.lon.toFixed(2)}°
            </span>
          </button>

          {/* Spatial Bounding-Box ROI 5-Point Grid Averaging Toggle */}
          <button
            type="button"
            onClick={() => setSpatialBoxAveraging((prev) => !prev)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1.5 ${
              spatialBoxAveraging
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#121216] text-zinc-400 border-[#1f1f24] hover:text-zinc-200'
            }`}
            title={
              lang === 'en'
                ? 'Toggle 5-point Bounding Box (±1.5°) spatial averaging to suppress sub-grid satellite pixel noise'
                : 'Полігональне усереднення по 5-точковій сітці ROI (±1.5° lat/lon) для зменшення локального шуму супутника'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                spatialBoxAveraging ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span>
              {spatialBoxAveraging
                ? lang === 'en'
                  ? 'ROI Box ±1.5° (5-pt)'
                  : 'ROI Бокс ±1.5° (5-точ)'
                : lang === 'en'
                ? 'Point (1-pt)'
                : 'Точка (1-pt)'}
            </span>
          </button>

          {/* Biome Filter Pills */}
          <div className="hidden 2xl:flex items-center gap-1 pl-1 border-l border-[#1f1f24]">
            {biomeOptionsList.map((biome) => {
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
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    isSelected
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {biome.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => runAnalysis({ forceRefresh: true })}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-[#141419] hover:bg-zinc-800 text-zinc-200 font-mono text-[11px] transition flex items-center gap-1.5 border border-[#24242b]"
          >
            <RefreshCw
              className={`w-3 h-3 text-zinc-400 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>{t.reAnalyzeBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setControlsExpanded((prev) => !prev)}
            className="px-2 py-1 rounded bg-[#141419] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono flex items-center gap-1 border border-[#24242b]"
          >
            {controlsExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>{t.collapseBtn}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>{t.expandParamsBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Manual Coordinate Editor Drawer */}
      {coordEditorOpen && (
        <div className="px-3.5 py-2.5 bg-[#09090b] border-b border-[#1f1f24] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded bg-[#0c0c0f] border border-[#1f1f24] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium text-sky-400 text-[11px]">
                {t.regionACoordsTitle}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {t.regionACoordsHint}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={regionA.name}
                onChange={(e) =>
                  setRegionA({ ...regionA, name: e.target.value })
                }
                placeholder={t.regionANamePlaceholder}
                className="col-span-3 sm:col-span-1 px-2 py-1 rounded bg-[#09090b] border border-[#24242b] text-zinc-100 font-mono text-[11px]"
              />
              <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                <span className="text-[10px] font-mono text-zinc-500">
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
                  className="w-full bg-transparent text-zinc-100 font-mono text-[11px] focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                <span className="text-[10px] font-mono text-zinc-500">
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
                  className="w-full bg-transparent text-zinc-100 font-mono text-[11px] focus:outline-none"
                />
              </label>
            </div>
          </div>

          {mode === 'dipole' && (
            <div className="p-2.5 rounded bg-[#0c0c0f] border border-[#1f1f24] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium text-orange-400 text-[11px]">
                  {t.regionBCoordsTitle}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {t.regionBCoordsHint}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={regionB.name}
                  onChange={(e) =>
                    setRegionB({ ...regionB, name: e.target.value })
                  }
                  placeholder={t.regionBNamePlaceholder}
                  className="col-span-3 sm:col-span-1 px-2 py-1 rounded bg-[#09090b] border border-[#24242b] text-zinc-100 font-mono text-[11px]"
                />
                <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                  <span className="text-[10px] font-mono text-zinc-500">
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
                    className="w-full bg-transparent text-zinc-100 font-mono text-[11px] focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                  <span className="text-[10px] font-mono text-zinc-500">
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
                    className="w-full bg-transparent text-zinc-100 font-mono text-[11px] focus:outline-none"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flush 3-Column Swiss Instrument Grid */}
      {controlsExpanded && (
        <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-[#1f1f24]">
          {/* Col 1: Variable Selector + Compact Definition (5 cols) */}
          <div className="xl:col-span-5 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span>
                {t.satelliteVarLabel} ({filteredVariables.length} {t.of13Label})
              </span>
              <span className="text-zinc-400">
                {currentVarMeta.satellite_badge || currentVarMeta.source}
              </span>
            </div>
            <select
              value={variable}
              onChange={(e) => {
                setVariable(e.target.value as ClimateVariableCode);
                setActiveScenarioId('custom');
              }}
              className="w-full rounded bg-[#09090b] border border-[#24242b] px-2.5 py-1.5 text-xs text-zinc-100 font-medium focus:outline-none focus:border-zinc-500"
            >
              {filteredVariables.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.code} — {lang === 'ua' ? v.name_ua || v.name : v.name} (
                  {v.unit})
                </option>
              ))}
            </select>
            {currentVarMeta?.student_definition && (
              <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                {getVariableDefinitionI18n(
                  currentVarMeta.code,
                  lang,
                  currentVarMeta.student_definition
                )}
              </p>
            )}
          </div>

          {/* Col 2: Seasonal Filter Segmented Grid (4 cols) */}
          <div className="xl:col-span-4 p-3 space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              {t.seasonalFilterLabel}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {seasonModesList.map((sm) => {
                const selected = seasonMode === sm.id;
                return (
                  <button
                    key={sm.id}
                    type="button"
                    onClick={() => setSeasonMode(sm.id)}
                    title={sm.hint}
                    className={`px-2 py-1.5 rounded text-[11px] font-mono transition border text-center truncate ${
                      selected
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                        : 'bg-[#09090b] text-zinc-400 border-[#1f1f24] hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {sm.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 3: Time Window Presets + Sliders (3 cols) */}
          <div className="xl:col-span-3 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="uppercase">{t.periodLabel}</span>
              <span className="text-zinc-200 font-medium">
                {startYear}–{endYear} ({endYear - startYear + 1} {t.yearsShort})
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
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
                    className={`py-0.5 rounded text-[10px] font-mono border transition text-center ${
                      isCurrent
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-medium'
                        : 'bg-[#09090b] text-zinc-500 border-[#1f1f24] hover:text-zinc-300'
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
                className="w-full accent-zinc-200 cursor-pointer h-1"
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
                className="w-full accent-zinc-400 cursor-pointer h-1"
              />
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
      <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#09090b] border-b border-[#1f1f24] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table2 className="w-3.5 h-3.5 text-zinc-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-medium text-zinc-300">
              {t.annualTableTitle} ({seriesA.length} {t.yearsCountLabel})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            {maxPoint && (
              <span className="px-2 py-0.5 rounded bg-[#141419] text-zinc-300 border border-[#24242b]">
                {t.peakLabel}:{' '}
                <strong className="text-rose-400">{maxPoint.year}</strong> (
                {maxPoint.value.toFixed(3)} {currentVarMeta.unit})
              </span>
            )}
            {minPoint && (
              <span className="px-2 py-0.5 rounded bg-[#141419] text-zinc-300 border border-[#24242b]">
                {t.minLabel}:{' '}
                <strong className="text-sky-400">{minPoint.year}</strong> (
                {minPoint.value.toFixed(3)} {currentVarMeta.unit})
              </span>
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="sticky top-0 bg-[#09090b] text-zinc-500 border-b border-[#1f1f24] text-[11px]">
              <tr>
                <th className="py-2 px-4 font-medium">{t.colYear}</th>
                <th className="py-2 px-4 font-medium">
                  {t.colRegionA} ({currentVarMeta.unit})
                </th>
                <th className="py-2 px-4 font-medium">{t.colAnomalyA}</th>
                <th className="py-2 px-4 font-medium">{t.colSensTrendA}</th>
                <th className="py-2 px-4 font-medium">{t.colCiBand}</th>
                {mode === 'dipole' && seriesB.length > 0 && (
                  <>
                    <th className="py-2 px-4 font-medium text-orange-400">
                      {t.colRegionB} ({currentVarMeta.unit})
                    </th>
                    <th className="py-2 px-4 font-medium text-orange-400">
                      {t.colAnomalyB}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18181c]">
              {[...seriesA].reverse().map((row) => {
                const rb = seriesB.find((b) => b.year === row.year);
                return (
                  <tr
                    key={row.year}
                    className="hover:bg-[#121216] transition"
                  >
                    <td className="py-1.5 px-4 font-medium text-zinc-200">
                      {row.year}
                    </td>
                    <td className="py-1.5 px-4 text-sky-400">
                      {row.value.toFixed(3)}
                    </td>
                    <td
                      className={`py-1.5 px-4 ${
                        row.anomaly >= 0 ? 'text-rose-400' : 'text-sky-400'
                      }`}
                    >
                      {row.anomaly >= 0 ? '+' : ''}
                      {row.anomaly.toFixed(3)}
                    </td>
                    <td className="py-1.5 px-4 text-zinc-300">
                      {row.trend_line.toFixed(3)}
                    </td>
                    <td className="py-1.5 px-4 text-zinc-500">
                      {row.ci_lower !== undefined && row.ci_upper !== undefined
                        ? `[${row.ci_lower.toFixed(2)}, ${row.ci_upper.toFixed(
                            2
                          )}]`
                        : '—'}
                    </td>
                    {mode === 'dipole' && seriesB.length > 0 && (
                      <>
                        <td className="py-1.5 px-4 text-orange-400">
                          {rb ? rb.value.toFixed(3) : '—'}
                        </td>
                        <td className="py-1.5 px-4 text-zinc-400">
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

  // Compute grid column spans for Split Studio
  const globeColSpanClass =
    splitLayout === 'only-globe'
      ? 'lg:col-span-12'
      : splitLayout === 'wide-globe'
      ? 'lg:col-span-8'
      : splitLayout === 'wide-chart'
      ? 'lg:col-span-4'
      : 'lg:col-span-6';

  const chartColSpanClass =
    splitLayout === 'only-chart'
      ? 'lg:col-span-12'
      : splitLayout === 'wide-globe'
      ? 'lg:col-span-4'
      : splitLayout === 'wide-chart'
      ? 'lg:col-span-8'
      : 'lg:col-span-6';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex selection:bg-zinc-200 selection:text-zinc-950">
      {/* =====================================================================
          MINIMALIST LEFT NAVIGATION RAIL (LINEAR / VERCEL GEIST STYLE)
         ===================================================================== */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-13' : 'w-56'
        } shrink-0 bg-[#070709] border-r border-[#1f1f24] flex flex-col justify-between sticky top-0 h-screen z-40 transition-all duration-150 select-none`}
      >
        <div>
          {/* Top Brand Header (h-11 to align with top command bar) */}
          <div className="h-11 px-3 border-b border-[#1f1f24] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                GP
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-xs font-semibold tracking-tight text-zinc-100 truncate">
                    GaiaPulse
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    NASA
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="p-1 rounded hover:bg-[#16161b] text-zinc-500 hover:text-zinc-200 transition shrink-0"
              title={t.toggleSidebarTitle}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftClose className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Primary Workspace Views */}
          <div className="p-2 space-y-0.5">
            {!sidebarCollapsed && (
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <span>{t.workspacesHeader}</span>
                <span>1–6</span>
              </div>
            )}

            {navItems.map((item) => {
              const isSelected = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  title={`${item.label} — ${item.subtitle} (${item.shortcut})`}
                  className={`w-full rounded px-2.5 py-1.5 transition flex items-center justify-between gap-2 text-xs ${
                    isSelected
                      ? 'bg-[#16161b] text-zinc-100 font-medium border-l-2 border-zinc-100'
                      : 'text-zinc-400 hover:bg-[#111115] hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 ${
                        isSelected ? 'text-zinc-100' : 'text-zinc-500'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!sidebarCollapsed && (
                    <span className="text-[10px] font-mono text-zinc-600">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick 1-Click Curated Scenarios in Sidebar */}
          {!sidebarCollapsed && (
            <div className="px-2 pt-2 mt-1 border-t border-[#1f1f24]">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <span>{t.quickCasesHeader}</span>
              </div>
              <div className="space-y-0.5 max-h-60 overflow-y-auto pr-0.5">
                {scenarios.slice(0, 7).map((sc) => {
                  const isCurrent = activeScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => applyScenario(sc)}
                      className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition flex items-center justify-between gap-1.5 ${
                        isCurrent
                          ? 'bg-[#16161b] text-zinc-100 font-medium'
                          : 'text-zinc-500 hover:bg-[#111115] hover:text-zinc-300'
                      }`}
                    >
                      <span className="truncate">{sc.title}</span>
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                        {sc.variable}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Telemetry Sparkline */}
        <div className="p-2.5 border-t border-[#1f1f24] bg-[#09090b]">
          {!sidebarCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      eonetIsLive ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span>{eonetIsLive ? t.eonetLive : t.eonetCache}</span>
                </span>
                {statsA && (
                  <span className="text-zinc-300">
                    p={statsA.p_value.toFixed(4)}
                  </span>
                )}
              </div>

              {statsA && (
                <div className="pt-0.5">
                  <MiniSparkline
                    values={seriesA.map((d) => d.value)}
                    trendValues={seriesA.map((d) => d.trend_line)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span
                className={`w-2 h-2 rounded-full ${
                  eonetIsLive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
          )}
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKBENCH STAGE
         ===================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* SLIM 44px TOP COMMAND BAR */}
        <header className="sticky top-0 z-30 h-11 border-b border-[#1f1f24] bg-[#09090b]/90 backdrop-blur-md px-4 flex items-center justify-between gap-3">
          {/* Left: Breadcrumb Telemetry Readout */}
          <div className="flex items-center gap-2 min-w-0 text-xs font-mono">
            <span className="text-zinc-200 font-medium truncate max-w-[200px]">
              {regionA.name}
            </span>

            {mode === 'dipole' && (
              <>
                <span className="text-zinc-600">↔</span>
                <span className="text-orange-400 font-medium truncate max-w-[180px]">
                  {regionB.name}
                </span>
              </>
            )}

            <span className="text-zinc-700">/</span>

            <span className="text-zinc-400 hidden md:inline">
              {variable} · {seasonMode} · {startYear}–{endYear}
            </span>

            {/* Minimalist Statistical Verdict Indicator */}
            {statsA && (
              <button
                type="button"
                onClick={() => {
                  if (activeView === 'split') setInspectorTab('verdict');
                  else setActiveView('analytics');
                }}
                className="ml-1 px-2 py-0.5 rounded bg-[#121216] hover:bg-zinc-800 border border-[#24242b] text-[11px] font-mono transition flex items-center gap-1.5"
                title={t.verdictTooltip}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    statsA.is_significant ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span className="text-zinc-200">
                  p = {statsA.p_value.toFixed(4)}
                </span>
                <span className="text-zinc-600">·</span>
                <span
                  className={
                    statsA.change_per_decade >= 0
                      ? 'text-sky-400'
                      : 'text-orange-400'
                  }
                >
                  {statsA.change_per_decade >= 0 ? '+' : ''}
                  {statsA.change_per_decade.toFixed(3)}
                  {t.perDecadeShort}
                </span>
              </button>
            )}
          </div>

          {/* Right: Language Switcher (UA / EN) + Clean Monochrome Actions */}
          <div className="flex items-center gap-1.5">
            {/* Command Palette Trigger (Ctrl+K) */}
            <button
              type="button"
              onClick={() => {
                setCommandQuery('');
                setCommandPaletteOpen(true);
              }}
              className="hidden md:flex items-center gap-2 px-2 py-1 rounded bg-[#121216] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono transition border border-[#1f1f24]"
              title={
                lang === 'en'
                  ? 'Quick Command Palette (Ctrl+K)'
                  : 'Швидкий пошук та команди (Ctrl+K)'
              }
            >
              <Search className="w-3 h-3 text-zinc-500" />
              <span>{lang === 'en' ? 'Search' : 'Пошук'}</span>
              <span className="px-1 py-0.2 rounded bg-[#09090b] border border-[#24242b] text-[9px] text-zinc-500">
                Ctrl K
              </span>
            </button>

            {/* Share Reproducible Investigation Link */}
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-[#121216] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono transition border border-[#1f1f24]"
              title={
                lang === 'en'
                  ? 'Copy shareable URL with current coordinates & parameters'
                  : 'Скопіювати посилання на поточне дослідження (URL)'
              }
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">
                    {lang === 'en' ? 'Copied' : 'Скопійовано'}
                  </span>
                </>
              ) : (
                <>
                  <Link2 className="w-3 h-3 text-zinc-500" />
                  <span>{lang === 'en' ? 'Share' : 'Лінк'}</span>
                </>
              )}
            </button>

            {/* UA / EN Switcher */}
            <div
              className="inline-flex items-center rounded bg-[#121216] p-0.5 border border-[#1f1f24]"
              title={t.languageToggleTitle}
            >
              <button
                type="button"
                onClick={() => setLang('ua')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition ${
                  lang === 'ua'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                UA
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition ${
                  lang === 'en'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenPhenomenaDrawer}
              className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition flex items-center gap-1.5"
            >
              <span>{t.fetchScenariosBtn}</span>
              <span className="px-1 py-0.2 rounded bg-zinc-950/15 text-zinc-950 font-mono text-[10px]">
                {scenarios.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCsvModalOpen(true)}
              className="px-2.5 py-1 rounded bg-[#121216] hover:bg-zinc-800 text-zinc-200 font-mono text-xs transition flex items-center gap-1.5 border border-[#24242b]"
            >
              <FileSpreadsheet className="w-3 h-3 text-zinc-400" />
              <span>{t.importCsvBtn}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMissionBriefOpen(true)}
                disabled={!analysisResult}
                className="px-2 py-1 rounded bg-[#121216] hover:bg-zinc-800 text-zinc-200 text-[11px] font-mono transition flex items-center gap-1 border border-[#24242b]"
                title={
                  lang === 'en'
                    ? 'Open Printable NASA Scientific Mission Brief (PDF)'
                    : 'Відкрити односторінковий науковий звіт (PDF Brief)'
                }
              >
                <Printer className="w-3 h-3 text-sky-400" />
                <span>{lang === 'en' ? 'PDF Brief' : 'PDF Звіт'}</span>
              </button>
              <button
                type="button"
                onClick={() => exportData('csv')}
                disabled={!analysisResult}
                className="px-2 py-1 rounded bg-[#121216] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono transition flex items-center gap-1 border border-[#1f1f24]"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => exportData('json')}
                disabled={!analysisResult}
                className="px-2 py-1 rounded bg-[#121216] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-mono transition flex items-center gap-1 border border-[#1f1f24]"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </header>

        {/* Slim Contextual Reference Bar */}
        <div className="px-4 bg-[#09090b]">
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
          <div className="mx-4 mt-3 rounded bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400 font-mono">
            {errorMsg}
          </div>
        )}

        {/* =================================================================
            ACTIVE WORKSPACE VIEWPORT
           ================================================================= */}
        <main className="flex-1 p-4 space-y-3">
          {/* ---------------------------------------------------------------
              VIEW 1: SPLIT STUDIO
             --------------------------------------------------------------- */}
          {activeView === 'split' && (
            <div className="space-y-3">
              {renderMissionControlPanel()}

              {/* Minimalist Split Proportion & Zone Collapse Strip */}
              <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1.5">
                    {t.layoutToolbarLabel}
                  </span>

                  <div className="inline-flex rounded bg-[#09090b] p-0.5 border border-[#1f1f24]">
                    <button
                      type="button"
                      onClick={() => setSplitLayout('balanced')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                        splitLayout === 'balanced'
                          ? 'bg-zinc-100 text-zinc-950 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.layoutBalanced}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitLayout('wide-globe')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                        splitLayout === 'wide-globe'
                          ? 'bg-zinc-100 text-zinc-950 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.layoutWideGlobe}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitLayout('wide-chart')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                        splitLayout === 'wide-chart'
                          ? 'bg-zinc-100 text-zinc-950 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.layoutWideChart}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {splitLayout === 'only-chart' ? (
                    <button
                      type="button"
                      onClick={() => setSplitLayout('balanced')}
                      className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-950 text-[11px] font-mono font-medium transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{t.expandGlobeBtn}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSplitLayout('only-chart')}
                      className="px-2.5 py-1 rounded bg-[#09090b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-[#1f1f24] text-[11px] font-mono transition flex items-center gap-1.5"
                      title={t.maximizeChartTitle}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>{t.collapseGlobeBtn}</span>
                    </button>
                  )}

                  {splitLayout === 'only-globe' ? (
                    <button
                      type="button"
                      onClick={() => setSplitLayout('balanced')}
                      className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-950 text-[11px] font-mono font-medium transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{t.expandChartBtn}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSplitLayout('only-globe')}
                      className="px-2.5 py-1 rounded bg-[#09090b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-[#1f1f24] text-[11px] font-mono transition flex items-center gap-1.5"
                      title={t.maximizeGlobeTitle}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>{t.collapseChartBtn}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsed Globe Restore Strip */}
              {splitLayout === 'only-chart' && (
                <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Globe2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{t.globeCollapsedBanner}</span>
                    <span className="text-zinc-200">
                      [{regionA.name}: {regionA.lat.toFixed(2)}°,{' '}
                      {regionA.lon.toFixed(2)}°]
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSplitLayout('balanced')}
                    className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-950 font-mono font-medium text-[11px] transition flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>{t.expandGlobeBtn}</span>
                  </button>
                </div>
              )}

              {/* Collapsed Chart Restore Strip */}
              {splitLayout === 'only-globe' && (
                <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{t.chartCollapsedBanner}</span>
                    {statsA && (
                      <span className="text-zinc-200">
                        [p = {statsA.p_value.toFixed(4)} ·{' '}
                        {statsA.change_per_decade >= 0 ? '+' : ''}
                        {statsA.change_per_decade.toFixed(3)}{' '}
                        {currentVarMeta.unit}
                        {t.perDecadeShort}]
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSplitLayout('balanced')}
                    className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-950 font-mono font-medium text-[11px] transition flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>{t.expandChartBtn}</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                {/* LEFT ZONE: Interactive 2D/3D Map + Active Scenario Note */}
                {splitLayout !== 'only-chart' && (
                  <div className={`${globeColSpanClass} space-y-3`}>
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

                    {/* Minimalist Active Case Footnote under Map */}
                    {activeScenario && (
                      <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#16161b] text-zinc-300 border border-[#24242b]">
                              {t.activeCaseBadge}
                            </span>
                            <span className="text-xs font-semibold text-zinc-100">
                              {activeScenario.title}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {getScenarioTextI18n(activeScenario, lang).summary}
                          </p>
                        </div>

                        {seasonMode === 'raw' &&
                          activeScenario.season_mode !== 'raw' && (
                            <button
                              type="button"
                              onClick={() =>
                                setSeasonMode(activeScenario.season_mode)
                              }
                              className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-medium shrink-0 transition"
                            >
                              {t.switchToSeasonBtn} {activeScenario.season_mode}
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* RIGHT ZONE: Live Detective Inspector Dock */}
                {splitLayout !== 'only-globe' && (
                  <div
                    className={`${chartColSpanClass} rounded-md bg-[#0c0c0f] border border-[#1f1f24] flex flex-col overflow-hidden`}
                  >
                    {/* Minimalist Segmented Inspector Header */}
                    <div className="px-3.5 py-2 bg-[#09090b] border-b border-[#1f1f24] flex items-center justify-between gap-2">
                      <div className="inline-flex items-center p-0.5 rounded bg-[#121216] border border-[#1f1f24]">
                        <button
                          type="button"
                          onClick={() => setInspectorTab('charts')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                            inspectorTab === 'charts'
                              ? 'bg-zinc-100 text-zinc-950'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>{t.tabCharts}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInspectorTab('verdict')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                            inspectorTab === 'verdict'
                              ? 'bg-zinc-100 text-zinc-950'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.tabVerdict}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInspectorTab('guide')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                            inspectorTab === 'guide'
                              ? 'bg-zinc-100 text-zinc-950'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>{t.tabGuide}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveView('analytics')}
                        className="px-2 py-1 rounded bg-[#121216] hover:bg-zinc-800 border border-[#1f1f24] text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition"
                        title={t.fullLabTitle}
                      >
                        {t.fullLabBtn} ↗
                      </button>
                    </div>

                    {/* Inspector Body */}
                    <div
                      className={`p-3.5 ${
                        splitLayout === 'only-chart'
                          ? ''
                          : 'max-h-[720px] overflow-y-auto'
                      } space-y-3`}
                    >
                      {!analysisResult ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-500">
                          <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                          <span className="text-xs font-mono">
                            {t.calculatingMsg}
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* TAB 1: CHARTS & TREND */}
                          {inspectorTab === 'charts' && (
                            <div className="space-y-3">
                              {/* Swiss 3-Cell Telemetry Strip */}
                              {statsA && (
                                <div className="grid grid-cols-3 divide-x divide-[#1f1f24] rounded bg-[#09090b] border border-[#1f1f24]">
                                  <div className="p-2.5">
                                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                                      p-value (MK)
                                    </div>
                                    <div
                                      className={`text-sm font-mono font-semibold mt-0.5 ${
                                        statsA.is_significant
                                          ? 'text-emerald-400'
                                          : 'text-amber-400'
                                      }`}
                                    >
                                      {statsA.p_value < 0.0001
                                        ? '< 0.0001'
                                        : statsA.p_value.toFixed(4)}
                                    </div>
                                    <div className="text-[10px] text-zinc-500">
                                      {statsA.is_significant
                                        ? t.provenTrend
                                        : t.noiseVariability}
                                    </div>
                                  </div>

                                  <div className="p-2.5">
                                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                                      Sen&apos;s Slope / Dec
                                    </div>
                                    <div className="text-sm font-mono font-semibold text-zinc-100 mt-0.5">
                                      {statsA.change_per_decade >= 0 ? '+' : ''}
                                      {statsA.change_per_decade.toFixed(3)}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 truncate">
                                      {currentVarMeta.unit} ({t.per10Yrs})
                                    </div>
                                  </div>

                                  <div className="p-2.5">
                                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                                      {t.timeToSigLabel}
                                    </div>
                                    <div className="text-sm font-mono font-semibold text-zinc-200 mt-0.5">
                                      {statsA.is_significant
                                        ? t.alreadyReached
                                        : `+${
                                            statsA.time_to_significance
                                              ?.additional_years_needed ?? '—'
                                          } ${t.yrsNeeded}`}
                                    </div>
                                    <div className="text-[10px] text-zinc-500">
                                      SNR: {statsA.signal_to_noise_ratio}
                                    </div>
                                  </div>
                                </div>
                              )}

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
                                  <div className="rounded bg-[#09090b] border border-[#1f1f24] p-3 space-y-1">
                                    <div className="flex items-center justify-between text-xs font-mono">
                                      <span className="text-zinc-200 font-medium">
                                        Dipole Correlation (r ={' '}
                                        {analysisResult.dipole_comparison.pearson_r.toFixed(
                                          3
                                        )}
                                        )
                                      </span>
                                      <span className="text-zinc-500">
                                        p ={' '}
                                        {analysisResult.dipole_comparison.correlation_p_value.toFixed(
                                          4
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-400">
                                      {
                                        formatDipoleVerdictI18n(
                                          analysisResult.dipole_comparison,
                                          regionA.name,
                                          regionB?.name || 'Region B',
                                          lang
                                        ).verdict
                                      }
                                    </p>
                                  </div>
                                )}

                              <VerdictCard
                                regionKey="A"
                                analysis={analysisResult.region_a_analysis}
                                variableMeta={analysisResult.variable_metadata}
                                onSelectSeasonMode={(s) => setSeasonMode(s)}
                              />

                              {mode === 'dipole' &&
                                analysisResult.region_b_analysis && (
                                  <VerdictCard
                                    regionKey="B"
                                    analysis={analysisResult.region_b_analysis}
                                    variableMeta={
                                      analysisResult.variable_metadata
                                    }
                                    onSelectSeasonMode={(s) => setSeasonMode(s)}
                                  />
                                )}
                            </div>
                          )}

                          {/* TAB 3: SCENARIO DETAILS & DETECTIVE GUIDE */}
                          {inspectorTab === 'guide' && (
                            <div className="space-y-3">
                              {activeScenario ? (
                                <div className="rounded bg-[#09090b] border border-[#1f1f24] p-3.5 space-y-2.5">
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-zinc-300">
                                      {activeScenario.satellite_badge}
                                    </span>
                                    <span className="text-amber-400">
                                      Season: {activeScenario.season_mode}
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-semibold text-zinc-100">
                                    {activeScenario.title}
                                  </h3>
                                  <p className="text-xs text-zinc-400 leading-relaxed">
                                    {
                                      getScenarioTextI18n(activeScenario, lang)
                                        .summary
                                    }
                                  </p>
                                  {getScenarioTextI18n(activeScenario, lang)
                                    .note && (
                                    <div className="border-l-2 border-zinc-700 pl-3 py-0.5 text-xs text-zinc-400">
                                      <span className="font-medium text-zinc-200">
                                        {t.studentTipLabel}
                                      </span>
                                      {
                                        getScenarioTextI18n(
                                          activeScenario,
                                          lang
                                        ).note
                                      }
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded bg-[#09090b] border border-[#1f1f24] p-3.5 text-xs text-zinc-400">
                                  {t.customPointHint}
                                </div>
                              )}

                              <div className="rounded bg-[#09090b] border border-[#1f1f24] p-3.5 space-y-2 text-xs text-zinc-400">
                                <div className="font-medium text-zinc-200">
                                  {t.howToUseTitle}
                                </div>
                                <ul className="space-y-1.5 list-disc list-inside">
                                  <li>{t.howToUseTip1}</li>
                                  <li>{t.howToUseTip2}</li>
                                  <li>{t.howToUseTip3}</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
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

                {/* Minimalist Floating Telemetry HUD on the Map */}
                {statsA && (
                  <div className="mt-3 lg:mt-0 lg:absolute lg:bottom-4 lg:right-4 z-[500] lg:w-72 rounded-md bg-[#09090b]/92 backdrop-blur-md border border-[#24242b] p-3 shadow-2xl space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="uppercase tracking-wider text-zinc-500">
                        {t.liveMapHudTitle}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          statsA.is_significant
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            statsA.is_significant
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        {statsA.is_significant ? 'p < 0.05 SIG' : 'NOISE'}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-zinc-100 truncate">
                      {regionA.name}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-mono space-y-0.5 text-zinc-400">
                        <div>
                          Slope:{' '}
                          <span className="text-zinc-100 font-medium">
                            {statsA.change_per_decade >= 0 ? '+' : ''}
                            {statsA.change_per_decade.toFixed(3)}{' '}
                            {currentVarMeta.unit}
                            {t.perDecadeShort}
                          </span>
                        </div>
                        <div>
                          p-value:{' '}
                          <span className="text-zinc-100 font-medium">
                            {statsA.p_value.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <MiniSparkline
                        values={seriesA.map((d) => d.value)}
                        trendValues={seriesA.map((d) => d.trend_line)}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveView('split')}
                        className="flex-1 py-1 px-2 rounded bg-zinc-100 text-zinc-950 font-medium text-[11px] transition text-center"
                      >
                        {t.splitViewBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView('analytics')}
                        className="flex-1 py-1 px-2 rounded bg-[#141419] hover:bg-zinc-800 text-zinc-200 border border-[#24242b] text-[11px] transition text-center"
                      >
                        {t.fullChartsBtn}
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
            <div className="space-y-3">
              {renderMissionControlPanel()}

              {analysisResult && (
                <>
                  {/* Dipole Correlation Banner */}
                  {mode === 'dipole' && analysisResult.dipole_comparison && (
                    <div className="rounded-md p-3.5 bg-[#0c0c0f] border border-[#1f1f24] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <GitCompareArrows className="w-4 h-4 text-zinc-400" />
                          <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-medium">
                            Dipole Teleconnection Verdict
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141419] text-zinc-300 border border-[#24242b]">
                            {
                              formatDipoleVerdictI18n(
                                analysisResult.dipole_comparison,
                                regionA.name,
                                regionB?.name || 'Region B',
                                lang
                              ).badge
                            }
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">
                          {
                            formatDipoleVerdictI18n(
                              analysisResult.dipole_comparison,
                              regionA.name,
                              regionB?.name || 'Region B',
                              lang
                            ).verdict
                          }
                        </p>
                      </div>

                      <div className="flex items-center divide-x divide-[#1f1f24] rounded bg-[#09090b] border border-[#1f1f24] shrink-0 font-mono text-xs">
                        <div className="px-3 py-1.5">
                          <span className="text-zinc-500 block text-[10px]">
                            Pearson r
                          </span>
                          <span className="text-sm font-semibold text-zinc-100">
                            {analysisResult.dipole_comparison.pearson_r}
                          </span>
                        </div>
                        <div className="px-3 py-1.5">
                          <span className="text-zinc-500 block text-[10px]">
                            Corr p-value
                          </span>
                          <span className="text-sm font-semibold text-zinc-100">
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
                    } gap-3`}
                  >
                    <VerdictCard
                      regionKey="A"
                      analysis={analysisResult.region_a_analysis}
                      variableMeta={analysisResult.variable_metadata}
                      onSelectSeasonMode={(s) => setSeasonMode(s)}
                    />
                    {mode === 'dipole' && analysisResult.region_b_analysis && (
                      <VerdictCard
                        regionKey="B"
                        analysis={analysisResult.region_b_analysis}
                        variableMeta={analysisResult.variable_metadata}
                        onSelectSeasonMode={(s) => setSeasonMode(s)}
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
              VIEW 4: PHENOMENA & LIVE NASA EONET ARCHIVE
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
              VIEW 5: CSV TIME-SERIES LAB
             --------------------------------------------------------------- */}
          {activeView === 'csv' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
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

              <div className="xl:col-span-6 space-y-3">
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
              VIEW 6: 13 OFFICIAL RESOURCES HUB
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

        {/* Minimalist Footer */}
        <footer className="mt-auto border-t border-[#1f1f24] bg-[#070709] px-4 py-2.5 text-[11px] text-zinc-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="text-zinc-300 font-medium">
                GaiaPulse // Earth System Trend Detective
              </span>
              <span>·</span>
              <span>
                Mann-Kendall · Sen&apos;s Slope · Student&apos;s t-test · STL
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 max-w-2xl leading-relaxed">
              {NASA_OFFICIAL_DISCLAIMER}
            </p>
          </div>
        </footer>
      </div>

      {/* Modal Overlays */}
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

      {/* Minimalist Command Palette (Ctrl+K / Cmd+K) */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-md bg-[#0c0c0f] border border-[#24242b] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Header */}
            <div className="px-3.5 py-2.5 border-b border-[#1f1f24] flex items-center gap-2.5 bg-[#09090b]">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="text"
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Jump to variable (AOD, SWOT_WSE...), phenomenon, season, or view...'
                    : 'Швидкий перехід: змінна (AOD, SWOT_WSE...), феномен, сезон або вкладка...'
                }
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="px-1.5 py-0.5 rounded bg-[#141419] border border-[#24242b] text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
              >
                ESC
              </button>
            </div>

            {/* Filtered Results */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-3 text-xs">
              {/* 1. Variables */}
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  {lang === 'en'
                    ? 'Satellite & Reanalysis Variables (13)'
                    : 'Супутникові змінні NASA та CSA (13)'}
                </div>
                <div className="space-y-0.5">
                  {variables
                    .filter((v) => {
                      const q = commandQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        v.code.toLowerCase().includes(q) ||
                        v.name.toLowerCase().includes(q) ||
                        (v.name_ua || '').toLowerCase().includes(q) ||
                        (v.satellite_badge || '').toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 6)
                    .map((v) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => {
                          setVariable(v.code as ClimateVariableCode);
                          setActiveScenarioId('custom');
                          setCommandPaletteOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between gap-2 text-left transition ${
                          variable === v.code
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'hover:bg-[#141419] text-zinc-300'
                        }`}
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-mono font-medium text-sky-400 mr-2">
                            {v.code}
                          </span>
                          <span>
                            {lang === 'en' ? v.name : v.name_ua || v.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {v.unit}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 2. Curated & Live EONET Scenarios */}
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  {lang === 'en'
                    ? 'Curated Phenomena & Live EONET Cases'
                    : 'Наукові сценарії та події NASA EONET'}
                </div>
                <div className="space-y-0.5">
                  {scenarios
                    .filter((s) => {
                      const q = commandQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        s.title.toLowerCase().includes(q) ||
                        s.variable.toLowerCase().includes(q) ||
                        s.region_a.name.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 6)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          applyScenario(s);
                          setCommandPaletteOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between gap-2 text-left transition ${
                          activeScenarioId === s.id
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'hover:bg-[#141419] text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{s.title}</span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {s.variable} · {s.season_mode}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 3. Workspace Views */}
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  {lang === 'en' ? 'Workbench Views' : 'Робочі простори (1–6)'}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveView(item.id);
                        setCommandPaletteOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded hover:bg-[#141419] text-zinc-300 flex items-center justify-between text-left"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        [{item.shortcut}]
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable NASA Earth System Scientific Mission Brief Modal (PDF Report) */}
      {missionBriefOpen && analysisResult && statsA && (
        <div
          className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setMissionBriefOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-md bg-[#0c0c0f] border border-[#24242b] shadow-2xl p-6 space-y-5 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header + Print Action */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1f1f24] pb-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
                  NASA Space Apps Challenge 2026 · Earth System Trend Detective
                </div>
                <h2 className="text-base font-semibold text-zinc-100 mt-1">
                  {lang === 'en'
                    ? 'Scientific Trend & Significance Mission Brief'
                    : 'Науковий звіт аналізу кліматичного тренду та статистичної значущості'}
                </h2>
                <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
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
                  className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-mono font-medium text-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en' ? 'Print / Save as PDF' : 'Друкувати / PDF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMissionBriefOpen(false)}
                  className="p-1.5 rounded bg-[#141419] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-[#24242b]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 1. Primary Statistical Verdict Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
                <div className="text-[10px] uppercase text-zinc-500">
                  Sen&apos;s Slope / Decade
                </div>
                <div className="text-sm font-semibold text-sky-400 mt-1">
                  {statsA.change_per_decade >= 0 ? '+' : ''}
                  {statsA.change_per_decade.toFixed(4)} {currentVarMeta.unit}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  95% CI: [{statsA.slope_ci_lower_decade?.toFixed(3)},{' '}
                  {statsA.slope_ci_upper_decade?.toFixed(3)}]
                </div>
              </div>

              <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
                <div className="text-[10px] uppercase text-zinc-500">
                  Mann-Kendall &amp; Student t
                </div>
                <div className="text-sm font-semibold text-zinc-100 mt-1">
                  p = {statsA.p_value.toFixed(4)} · Z ={' '}
                  {statsA.z_score >= 0 ? '+' : ''}
                  {statsA.z_score.toFixed(2)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Student t ={' '}
                  {statsA.student_t_test?.t_stat.toFixed(2) ?? '—'} (df=
                  {statsA.student_t_test?.degrees_of_freedom ?? '—'})
                </div>
              </div>

              <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
                <div className="text-[10px] uppercase text-zinc-500">
                  Pettitt Regime Shift
                </div>
                <div className="text-sm font-semibold text-amber-400 mt-1">
                  {statsA.regime_shift?.change_point_year ?? '—'} (Δ{' '}
                  {(statsA.regime_shift?.step_delta ?? 0) >= 0 ? '+' : ''}
                  {statsA.regime_shift?.step_delta.toFixed(3)})
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Pettitt p ={' '}
                  {statsA.regime_shift?.p_value.toFixed(4) ?? '—'}
                </div>
              </div>

              <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
                <div className="text-[10px] uppercase text-zinc-500">
                  AR(1) &amp; Hamed-Rao MK
                </div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">
                  r₁ = {statsA.autocorrelation?.lag1_r.toFixed(2) ?? '0.00'} ·
                  N_eff = {statsA.autocorrelation?.effective_sample_size ?? '—'}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Adjusted p* ={' '}
                  {statsA.autocorrelation?.hamed_rao_p_value.toFixed(4) ?? '—'}
                </div>
              </div>
            </div>

            {/* 2. Executive Detective Summary */}
            <div className="p-3.5 rounded bg-[#09090b] border border-[#1f1f24] space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                {lang === 'en'
                  ? 'Executive Statistical Conclusion'
                  : 'Науковий висновок детективу'}
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {lang === 'en'
                  ? `In "${regionA.name}" over ${startYear}–${endYear} (mode: ${seasonMode}), ${currentVarMeta.name} exhibits ${
                      statsA.is_significant
                        ? `a statistically significant ${statsA.mk_trend} trend`
                        : `an emerging ${statsA.mk_trend} signal not yet crossing p < 0.05`
                    } (${
                      statsA.change_per_decade >= 0 ? '+' : ''
                    }${statsA.change_per_decade.toFixed(4)} ${
                      currentVarMeta.unit
                    }/decade, Mann-Kendall p = ${statsA.p_value.toFixed(
                      4
                    )}, Student's t = ${
                      statsA.student_t_test?.t_stat.toFixed(2) ?? '0.00'
                    }, SNR = ${statsA.signal_to_noise_ratio.toFixed(2)}).`
                  : analysisResult.region_a_analysis.human_summary}
              </p>
              {statsA.time_to_significance && (
                <p className="text-[11px] font-mono text-zinc-400">
                  Time-to-Significance (Weatherhead et al., 1998):{' '}
                  {lang === 'en'
                    ? statsA.time_to_significance.is_already_significant
                      ? `Trend already exceeds the 95% confidence threshold (p = ${statsA.p_value.toFixed(
                          4
                        )} < 0.05) across ${
                          statsA.time_to_significance.current_years
                        } observed years.`
                      : `At the current slope and variance, ~${statsA.time_to_significance.additional_years_needed} additional years of satellite observations are needed (~${statsA.time_to_significance.total_years_required} years total) to cross p < 0.05.`
                    : statsA.time_to_significance.message}
                </p>
              )}
            </div>

            {/* 3. Multi-Season Fingerprint Table */}
            {statsA.seasonal_matrix && statsA.seasonal_matrix.length > 0 && (
              <div className="rounded bg-[#09090b] border border-[#1f1f24] overflow-hidden">
                <div className="px-3.5 py-2 border-b border-[#1f1f24] text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  {lang === 'en'
                    ? '6-Mode Seasonal Fingerprint Comparison'
                    : 'Порівняльна таблиця всіх 6 сезонних режимів (DJF, MAM, JJA, SON, Deseasonalized, Raw)'}
                </div>
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-[#0c0c0f] text-zinc-500 border-b border-[#1f1f24]">
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
                          {row.change_per_decade.toFixed(4)}{' '}
                          {currentVarMeta.unit}
                        </td>
                        <td className="py-1.5 px-3">
                          {row.z_score >= 0 ? '+' : ''}
                          {row.z_score.toFixed(2)}σ
                        </td>
                        <td className="py-1.5 px-3">
                          {row.p_value.toFixed(5)}
                        </td>
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
            <div className="pt-2 border-t border-[#1f1f24] text-[10px] font-mono text-zinc-500 space-y-1">
              <div>
                Primary Source: {analysisResult.region_a_analysis.data_source} ·
                Reference Methodology: NASA NTRS 20090042747 (Dr. James Acker)
              </div>
              <div>{NASA_OFFICIAL_DISCLAIMER}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
