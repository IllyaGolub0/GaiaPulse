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
import { VerdictHero } from './components/VerdictHero';
import { formatP } from './utils/format';
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
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [splitPct, setSplitPct] = useState<number>(52);
  const [draggingSplit, setDraggingSplit] = useState<boolean>(false);
  const [slowLoading, setSlowLoading] = useState<boolean>(false);
  const [hintDismissed, setHintDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('gp_hint_dismissed') === '1';
    } catch {
      return false;
    }
  });
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Keyboard shortcuts ('[' to toggle sidebar, Ctrl+K / Cmd+K for Command Palette)
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

      if (e.key === '[') setSidebarCollapsed((prev) => !prev);
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

  const L = (ua: string, en: string) => (lang === 'en' ? en : ua);

  // After 10 seconds of waiting explain that the server may be waking up
  useEffect(() => {
    if (!loading) {
      setSlowLoading(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowLoading(true), 10000);
    return () => window.clearTimeout(timer);
  }, [loading]);
  const isAnalysisView =
    activeView === 'split' || activeView === 'map' || activeView === 'analytics';
  const isFixedView = activeView === 'split' || activeView === 'map';

  const navItems: Array<{
    id: WorkbenchView;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'split',
      label: t.navSplitLabel,
      subtitle: L('Карта, вердикт і графіки', 'Map, verdict and charts'),
      icon: <Columns className="w-4 h-4" />,
    },
    {
      id: 'phenomena',
      label: t.navPhenomenaLabel,
      subtitle: L('Готові кейси та живі події NASA', 'Curated cases and live NASA events'),
      icon: <Satellite className="w-4 h-4" />,
    },
    {
      id: 'csv',
      label: t.navCsvLabel,
      subtitle: L('Аналіз власного CSV-ряду', 'Analyze your own CSV series'),
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'resources',
      label: t.navResourcesLabel,
      subtitle: L('Офіційні портали даних', 'Official data portals'),
      icon: <Library className="w-4 h-4" />,
    },
  ];

  const viewModes: Array<{ id: WorkbenchView; label: string; icon: React.ReactNode }> = [
    {
      id: 'split',
      label: L('Карта і результат', 'Map and result'),
      icon: <Columns className="w-4 h-4" />,
    },
    {
      id: 'map',
      label: L('Лише карта', 'Map only'),
      icon: <Globe2 className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: L('Уся статистика', 'All statistics'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  const dismissHint = () => {
    setHintDismissed(true);
    try {
      window.localStorage.setItem('gp_hint_dismissed', '1');
    } catch {
      /* storage unavailable */
    }
  };

  const startSplitDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingSplit(true);
    const onMove = (ev: MouseEvent) => {
      const box = splitContainerRef.current?.getBoundingClientRect();
      if (!box || box.width === 0) return;
      const pct = ((ev.clientX - box.left) / box.width) * 100;
      setSplitPct(Math.min(70, Math.max(30, pct)));
    };
    const onUp = () => {
      setDraggingSplit(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.dispatchEvent(new Event('resize'));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const seasonLabelFull =
    seasonModesList.find((s) => s.id === seasonMode)?.label || seasonMode;
  const varDisplayName =
    lang === 'ua'
      ? currentVarMeta.name_ua || currentVarMeta.name
      : currentVarMeta.name;
  const periodPresetValue =
    QUICK_YEAR_PRESETS.find((p) => p.start === startYear && p.end === endYear)
      ?.label || 'custom';
  const fieldLabelCls = 'block text-xs text-zinc-400 mb-1';
  const fieldCtlCls =
    'h-9 w-full rounded-md bg-[#09090b] border border-[#2a2a32] px-2.5 text-sm text-zinc-100 focus:outline-none focus:border-sky-500';

  // Compact parameter bar: Where / What / When, everything else under "Advanced"
  const renderMissionControlPanel = () => (
    <div className="shrink-0 rounded-md bg-[#0c0c0f] border border-[#1f1f24]">
      <div className="px-3 py-2.5 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <span className={fieldLabelCls}>{L('Де', 'Where')}</span>
          <button
            type="button"
            onClick={() => setAdvancedOpen(true)}
            title={L(
              'Клацніть на карті, щоб обрати місце, або відкрийте точні координати',
              'Click the map to pick a place, or open exact coordinates'
            )}
            className={`${fieldCtlCls} flex items-center gap-2 text-left hover:border-zinc-500 transition`}
          >
            <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">
              {regionA.name}
              {mode === 'dipole' ? ` ↔ ${regionB.name}` : ''}
            </span>
          </button>
        </div>

        <label className="min-w-[280px] flex-[2]">
          <span className={fieldLabelCls}>{L('Що вимірюємо', 'What we measure')}</span>
          <select
            value={variable}
            onChange={(e) => {
              setVariable(e.target.value as ClimateVariableCode);
              setActiveScenarioId('custom');
            }}
            title={
              currentVarMeta?.student_definition
                ? getVariableDefinitionI18n(
                    currentVarMeta.code,
                    lang,
                    currentVarMeta.student_definition
                  )
                : undefined
            }
            className={fieldCtlCls}
          >
            {filteredVariables.map((v) => (
              <option key={v.code} value={v.code}>
                {lang === 'ua' ? v.name_ua || v.name : v.name} ({v.unit})
              </option>
            ))}
          </select>
        </label>

        <label className="w-64">
          <span className={fieldLabelCls}>{L('Сезон', 'Season')}</span>
          <select
            value={seasonMode}
            onChange={(e) => setSeasonMode(e.target.value as SeasonMode)}
            className={fieldCtlCls}
          >
            {seasonModesList.map((sm) => (
              <option key={sm.id} value={sm.id} title={sm.hint}>
                {sm.label}
              </option>
            ))}
          </select>
        </label>

        <label className="w-40">
          <span className={fieldLabelCls}>{L('Період', 'Period')}</span>
          <select
            value={periodPresetValue}
            onChange={(e) => {
              const preset = QUICK_YEAR_PRESETS.find(
                (p) => p.label === e.target.value
              );
              if (preset) {
                setStartYear(preset.start);
                setEndYear(preset.end);
              }
            }}
            className={fieldCtlCls}
          >
            {periodPresetValue === 'custom' && (
              <option value="custom">
                {startYear}–{endYear}
              </option>
            )}
            {QUICK_YEAR_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            aria-expanded={advancedOpen}
            className={`h-9 px-3 rounded-md text-sm border transition flex items-center gap-1.5 ${
              advancedOpen
                ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                : 'bg-[#121216] text-zinc-300 border-[#2a2a32] hover:text-zinc-100 hover:border-zinc-500'
            }`}
          >
            <span>{L('Додатково', 'Advanced')}</span>
            {advancedOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => runAnalysis({ forceRefresh: true })}
            disabled={loading}
            title={t.reAnalyzeBtn}
            aria-label={t.reAnalyzeBtn}
            className="h-9 w-9 rounded-md bg-[#121216] hover:bg-zinc-800 text-zinc-300 border border-[#2a2a32] transition flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {advancedOpen && (
        <div className="border-t border-[#1f1f24]">
          <div className="px-3 py-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span className={fieldLabelCls}>{L('Режим аналізу', 'Analysis mode')}</span>
              <div className="inline-flex rounded-md bg-[#121216] p-0.5 border border-[#2a2a32]">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`h-8 px-3 rounded text-sm transition ${
                    mode === 'single'
                      ? 'bg-zinc-100 text-zinc-950 font-medium'
                      : 'text-zinc-300 hover:text-zinc-100'
                  }`}
                >
                  {L('Одна точка', 'One point')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dipole')}
                  className={`h-8 px-3 rounded text-sm transition ${
                    mode === 'dipole'
                      ? 'bg-zinc-100 text-zinc-950 font-medium'
                      : 'text-zinc-300 hover:text-zinc-100'
                  }`}
                >
                  {L('Порівняти дві точки', 'Compare two points')}
                </button>
              </div>
              <label
                className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer"
                title={L(
                  'Усереднення по 5 точках у межах ±1.5° зменшує випадковий шум окремого пікселя супутника',
                  'Averaging 5 points within ±1.5° reduces the random noise of a single satellite pixel'
                )}
              >
                <input
                  type="checkbox"
                  checked={spatialBoxAveraging}
                  onChange={(e) => setSpatialBoxAveraging(e.target.checked)}
                  className="w-4 h-4 accent-sky-500"
                />
                <span>{L('Усереднювати по області ±1.5°', 'Average over a ±1.5° area')}</span>
              </label>
            </div>

            <div className="space-y-2">
              <span className={fieldLabelCls}>
                {L('Показники за типом середовища', 'Variables by environment')}
              </span>
              <div className="flex flex-wrap gap-1.5">
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
                      className={`h-8 px-2.5 rounded-md text-sm border transition ${
                        isSelected
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-medium'
                          : 'text-zinc-300 border-[#2a2a32] hover:text-zinc-100 hover:border-zinc-500'
                      }`}
                    >
                      {biome.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className={fieldLabelCls}>
                {L('Довільний період', 'Custom period')}:{' '}
                <span className="text-zinc-100 font-mono">
                  {startYear}–{endYear} ({endYear - startYear + 1} {t.yearsShort})
                </span>
              </span>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-16">{L('Початок', 'Start')}</span>
                <input
                  type="range"
                  min={1985}
                  max={2021}
                  value={startYear}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStartYear(Math.min(val, endYear - 5));
                  }}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-16">{L('Кінець', 'End')}</span>
                <input
                  type="range"
                  min={1990}
                  max={2026}
                  value={endYear}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEndYear(Math.max(val, startYear + 5));
                  }}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </label>
            </div>
          </div>


        <div className="px-3.5 py-2.5 bg-[#09090b] border-b border-[#1f1f24] grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-2.5 rounded bg-[#0c0c0f] border border-[#1f1f24] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium text-sky-400 text-[13px]">
                {t.regionACoordsTitle}
              </span>
              <span className="text-xs font-mono text-zinc-400">
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
                className="col-span-3 sm:col-span-1 px-2 py-1 rounded bg-[#09090b] border border-[#24242b] text-zinc-100 font-mono text-[13px]"
              />
              <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                <span className="text-xs font-mono text-zinc-400">
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
                  className="w-full bg-transparent text-zinc-100 font-mono text-[13px] focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                <span className="text-xs font-mono text-zinc-400">
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
                  className="w-full bg-transparent text-zinc-100 font-mono text-[13px] focus:outline-none"
                />
              </label>
            </div>
          </div>

          {mode === 'dipole' && (
            <div className="p-2.5 rounded bg-[#0c0c0f] border border-[#1f1f24] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium text-orange-400 text-[13px]">
                  {t.regionBCoordsTitle}
                </span>
                <span className="text-xs font-mono text-zinc-400">
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
                  className="col-span-3 sm:col-span-1 px-2 py-1 rounded bg-[#09090b] border border-[#24242b] text-zinc-100 font-mono text-[13px]"
                />
                <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                  <span className="text-xs font-mono text-zinc-400">
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
                    className="w-full bg-transparent text-zinc-100 font-mono text-[13px] focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#24242b]">
                  <span className="text-xs font-mono text-zinc-400">
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
                    className="w-full bg-transparent text-zinc-100 font-mono text-[13px] focus:outline-none"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        </div>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <div className="space-y-3" aria-busy="true">
      <div className="rounded-md bg-[#09090b] border border-[#24242b] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-200">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <span>{L('Запитуємо дані NASA', 'Requesting NASA data')}</span>
        </div>
        {slowLoading && (
          <p className="text-sm text-zinc-400">
            {L(
              'Сервер прокидається після простою. Перший запит може тривати до хвилини.',
              'The server is waking up after idle time. The first request can take up to a minute.'
            )}
          </p>
        )}
        <div className="h-6 w-3/4 rounded bg-[#16161b] animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded bg-[#16161b] animate-pulse" />
          <div className="h-16 rounded bg-[#16161b] animate-pulse" />
        </div>
      </div>
      <div className="h-64 rounded-md bg-[#101014] border border-[#1f1f24] animate-pulse" />
    </div>
  );

  const renderErrorState = () => (
    <div
      role="alert"
      className="rounded-md bg-rose-500/10 border border-rose-500/30 p-4 space-y-2"
    >
      <div className="text-base font-semibold text-rose-300">
        {L('Не вдалося отримати дані', 'Could not load the data')}
      </div>
      <p className="text-sm text-zinc-200">{errorMsg}</p>
      <p className="text-sm text-zinc-400">
        {L(
          'Перевірте з’єднання або спробуйте іншу точку чи період.',
          'Check your connection or try another point or period.'
        )}
      </p>
      <button
        type="button"
        onClick={() => runAnalysis({ forceRefresh: true })}
        className="h-9 px-3 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium transition inline-flex items-center gap-1.5"
      >
        <RefreshCw className="w-4 h-4" />
        <span>{L('Повторити', 'Try again')}</span>
      </button>
    </div>
  );

  const renderVerdictHeroes = (compact = false) => {
    if (!analysisResult) return null;
    const showB = mode === 'dipole' && !!analysisResult.region_b_analysis;
    return (
      <div className={`space-y-3 transition ${loading ? 'opacity-60' : ''}`}>
        <VerdictHero
          analysis={analysisResult.region_a_analysis}
          variableMeta={analysisResult.variable_metadata}
          lang={lang}
          seasonLabel={seasonLabelFull}
          regionKey="A"
          showRegionBadge={showB}
          compact={compact || showB}
        />
        {showB && analysisResult.region_b_analysis && (
          <VerdictHero
            analysis={analysisResult.region_b_analysis}
            variableMeta={analysisResult.variable_metadata}
            lang={lang}
            seasonLabel={seasonLabelFull}
            regionKey="B"
            showRegionBadge
            compact
          />
        )}
        {showB && analysisResult.dipole_comparison && (
          <p className="text-sm text-zinc-200 rounded-md bg-[#09090b] border border-[#24242b] px-3 py-2.5">
            {
              formatDipoleVerdictI18n(
                analysisResult.dipole_comparison,
                regionA.name,
                regionB?.name || 'Region B',
                lang
              ).verdict
            }
          </p>
        )}
      </div>
    );
  };

  const renderResultsPanel = () => (
    <div className="p-3 space-y-3">
      {!hintDismissed && (
        <div className="rounded-md bg-sky-500/10 border border-sky-500/30 px-3 py-2.5 flex items-start justify-between gap-3">
          <ol className="text-sm text-zinc-100 space-y-0.5 list-decimal list-inside">
            <li>{L('Клацніть на карті, щоб обрати місце.', 'Click the map to pick a place.')}</li>
            <li>{L('Оберіть показник, сезон і період угорі.', 'Choose the variable, season and period above.')}</li>
            <li>{L('Прочитайте вердикт і перевірте його на графіку.', 'Read the verdict and check it on the chart.')}</li>
          </ol>
          <button
            type="button"
            onClick={dismissHint}
            aria-label={L('Закрити підказку', 'Dismiss hint')}
            className="shrink-0 w-8 h-8 rounded-md hover:bg-sky-500/20 text-zinc-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg ? (
        renderErrorState()
      ) : !analysisResult ? (
        renderLoadingState()
      ) : (
        <>
          {renderVerdictHeroes()}

          <div className="flex items-center gap-1 border-b border-[#1f1f24]">
            {(
              [
                { id: 'charts', label: L('Графіки', 'Charts'), icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'verdict', label: L('Повна статистика', 'Full statistics'), icon: <CheckCircle2 className="w-4 h-4" /> },
                { id: 'guide', label: L('Про кейс', 'About the case'), icon: <Compass className="w-4 h-4" /> },
              ] as Array<{ id: InspectorTab; label: string; icon: React.ReactNode }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInspectorTab(tab.id)}
                className={`h-9 px-3 -mb-px text-sm border-b-2 transition flex items-center gap-1.5 ${
                  inspectorTab === tab.id
                    ? 'border-sky-400 text-zinc-50 font-medium'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {inspectorTab === 'charts' && (
            <TrendCharts
              mode={mode}
              seasonMode={seasonMode}
              variableMeta={analysisResult.variable_metadata}
              regionA={analysisResult.region_a_analysis}
              regionB={analysisResult.region_b_analysis}
              onOpenResourcesModal={() => setActiveView('resources')}
            />
          )}

          {inspectorTab === 'verdict' && (
            <div className="space-y-3">
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
          )}

          {inspectorTab === 'guide' && (
            <div className="space-y-3">
              {activeScenario ? (
                <div className="rounded-md bg-[#09090b] border border-[#1f1f24] p-4 space-y-2.5">
                  <div className="text-xs text-zinc-400">
                    {activeScenario.satellite_badge}
                  </div>
                  <h3 className="text-base font-semibold text-zinc-50">
                    {activeScenario.title}
                  </h3>
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    {getScenarioTextI18n(activeScenario, lang).summary}
                  </p>
                  {getScenarioTextI18n(activeScenario, lang).note && (
                    <div className="border-l-2 border-zinc-600 pl-3 py-0.5 text-sm text-zinc-300">
                      <span className="font-medium text-zinc-100">
                        {t.studentTipLabel}
                      </span>
                      {getScenarioTextI18n(activeScenario, lang).note}
                    </div>
                  )}
                  {seasonMode !== activeScenario.season_mode && (
                    <button
                      type="button"
                      onClick={() => setSeasonMode(activeScenario.season_mode)}
                      className="h-9 px-3 rounded-md bg-[#16161b] hover:bg-zinc-800 border border-[#2a2a32] text-sm text-zinc-100 transition"
                    >
                      {L('Повернути сезон кейсу', 'Restore the case season')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-[#09090b] border border-[#1f1f24] p-4 text-sm text-zinc-300">
                  {t.customPointHint}
                </div>
              )}
              <button
                type="button"
                onClick={() => setActiveView('phenomena')}
                className="h-9 px-3 rounded-md bg-[#16161b] hover:bg-zinc-800 border border-[#2a2a32] text-sm text-zinc-100 transition inline-flex items-center gap-1.5"
              >
                <Satellite className="w-4 h-4" />
                <span>{L('Усі кейси та події', 'All cases and events')}</span>
              </button>
            </div>
          )}
        </>
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
            <h3 className="text-sm font-mono font-medium text-zinc-300">
              {t.annualTableTitle} ({seriesA.length} {t.yearsCountLabel})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[13px] font-mono">
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
          <table className="w-full text-left border-collapse text-sm font-mono">
            <thead className="sticky top-0 bg-[#09090b] text-zinc-400 border-b border-[#1f1f24] text-[13px]">
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
                    <td className="py-1.5 px-4 text-zinc-400">
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
    <div className="h-screen overflow-hidden bg-[#09090b] text-zinc-100 flex selection:bg-zinc-200 selection:text-zinc-950">
      <aside
        className={`${
          sidebarCollapsed ? 'w-14' : 'w-52'
        } shrink-0 bg-[#070709] border-r border-[#1f1f24] flex flex-col justify-between h-screen z-40 transition-all duration-150 select-none`}
      >
        <div>
          <div className="h-12 px-3 border-b border-[#1f1f24] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0">
                GP
              </div>
              {!sidebarCollapsed && (
                <span className="text-base font-semibold tracking-tight text-zinc-50 truncate">
                  GaiaPulse
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="w-8 h-8 rounded-md hover:bg-[#16161b] text-zinc-400 hover:text-zinc-100 transition shrink-0 flex items-center justify-center"
                title={t.toggleSidebarTitle}
                aria-label={t.toggleSidebarTitle}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="p-2 space-y-1">
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="w-full h-9 rounded-md hover:bg-[#16161b] text-zinc-400 hover:text-zinc-100 transition flex items-center justify-center"
                title={t.toggleSidebarTitle}
                aria-label={t.toggleSidebarTitle}
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            {navItems.map((item) => {
              const isSelected =
                activeView === item.id || (item.id === 'split' && isAnalysisView);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  title={`${item.label}: ${item.subtitle}`}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`w-full h-10 rounded-md px-2.5 transition flex items-center gap-2.5 text-sm ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    isSelected
                      ? 'bg-[#1a1a20] text-zinc-50 font-medium'
                      : 'text-zinc-300 hover:bg-[#111115] hover:text-zinc-50'
                  }`}
                >
                  <span className={isSelected ? 'text-sky-400' : 'text-zinc-400'}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-[#1f1f24] flex items-center gap-2 text-xs text-zinc-400">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              eonetIsLive ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          {!sidebarCollapsed && (
            <span>{eonetIsLive ? t.eonetLive : t.eonetCache}</span>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <header className="relative z-30 h-12 shrink-0 border-b border-[#1f1f24] bg-[#09090b] px-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="text-base font-semibold text-zinc-50 whitespace-nowrap">
              {regionA.name}
              {mode === 'dipole' && (
                <span className="text-orange-400"> ↔ {regionB.name}</span>
              )}
            </h1>
            {!isAnalysisView && (
              <span className="text-[13px] text-zinc-400 truncate hidden lg:inline">
                {varDisplayName} · {seasonLabelFull} · {startYear}–{endYear}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAnalysisView && (
              <div
                className="inline-flex items-center rounded-md bg-[#121216] p-0.5 border border-[#2a2a32]"
                role="group"
                aria-label={L('Вигляд', 'View')}
              >
                {viewModes.map((vm) => (
                  <button
                    key={vm.id}
                    type="button"
                    onClick={() => setActiveView(vm.id)}
                    title={vm.label}
                    aria-pressed={activeView === vm.id}
                    className={`h-8 px-2.5 rounded text-sm transition flex items-center gap-1.5 ${
                      activeView === vm.id
                        ? 'bg-zinc-100 text-zinc-950 font-medium'
                        : 'text-zinc-300 hover:text-zinc-50'
                    }`}
                  >
                    {vm.icon}
                    <span className="hidden xl:inline">{vm.label}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setCommandQuery('');
                setCommandPaletteOpen(true);
              }}
              className="h-9 px-2.5 rounded-md bg-[#121216] hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 text-sm transition border border-[#2a2a32] flex items-center gap-2"
              title={L('Пошук показників, кейсів і розділів (Ctrl+K)', 'Search variables, cases and sections (Ctrl+K)')}
            >
              <Search className="w-4 h-4" />
              <span className="hidden 2xl:inline">{L('Пошук', 'Search')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="h-9 px-2.5 rounded-md bg-[#121216] hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 text-sm transition border border-[#2a2a32] flex items-center gap-2"
              title={L('Скопіювати посилання на це дослідження', 'Copy a link to this investigation')}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{L('Скопійовано', 'Copied')}</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>{L('Поділитися', 'Share')}</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                disabled={!analysisResult}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                className="h-9 px-2.5 rounded-md bg-[#121216] hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 text-sm transition border border-[#2a2a32] flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{L('Експорт', 'Export')}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {exportOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[1100]"
                    onClick={() => setExportOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 z-[1200] w-56 rounded-md bg-[#0c0c0f] border border-[#2a2a32] shadow-2xl p-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setExportOpen(false);
                        setMissionBriefOpen(true);
                      }}
                      className="w-full h-9 px-2.5 rounded text-sm text-left text-zinc-100 hover:bg-[#1a1a20] flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-zinc-400" />
                      <span>{L('Звіт у PDF', 'PDF report')}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setExportOpen(false);
                        exportData('csv');
                      }}
                      className="w-full h-9 px-2.5 rounded text-sm text-left text-zinc-100 hover:bg-[#1a1a20] flex items-center gap-2"
                    >
                      <Table2 className="w-4 h-4 text-zinc-400" />
                      <span>{L('Дані у CSV', 'Data as CSV')}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setExportOpen(false);
                        exportData('json');
                      }}
                      className="w-full h-9 px-2.5 rounded text-sm text-left text-zinc-100 hover:bg-[#1a1a20] flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-zinc-400" />
                      <span>{L('Дані у JSON', 'Data as JSON')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div
              className="inline-flex items-center rounded-md bg-[#121216] p-0.5 border border-[#2a2a32]"
              title={t.languageToggleTitle}
            >
              {(['ua', 'en'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={`h-8 px-2 rounded text-xs font-medium transition ${
                    lang === code
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'text-zinc-300 hover:text-zinc-50'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        {errorMsg && activeView !== 'split' && (
          <div className="mx-4 mt-3 shrink-0">{renderErrorState()}</div>
        )}

        {/* =================================================================
            ACTIVE WORKSPACE VIEWPORT
           ================================================================= */}
        <main
          className={
            isFixedView
              ? 'flex-1 min-h-0 p-3 flex flex-col gap-3 overflow-hidden'
              : 'flex-1 min-h-0 p-4 space-y-3 overflow-y-auto'
          }
        >
          {/* VIEW: MAP + RESULT (default) */}
          {activeView === 'split' && (
            <>
              {renderMissionControlPanel()}

              <div ref={splitContainerRef} className="flex-1 min-h-0 flex">
                <div
                  style={{ width: `${splitPct}%` }}
                  className="min-w-0 h-full"
                >
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
                </div>

                <div
                  role="separator"
                  aria-orientation="vertical"
                  onMouseDown={startSplitDrag}
                  onDoubleClick={() => {
                    setSplitPct(52);
                    window.setTimeout(
                      () => window.dispatchEvent(new Event('resize')),
                      60
                    );
                  }}
                  title={L(
                    'Перетягніть, щоб змінити ширину карти',
                    'Drag to resize the map'
                  )}
                  className="w-3 shrink-0 cursor-col-resize flex items-center justify-center group"
                >
                  <span
                    className={`w-1 h-14 rounded-full transition ${
                      draggingSplit
                        ? 'bg-sky-400'
                        : 'bg-[#2a2a32] group-hover:bg-sky-400'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0 h-full overflow-y-auto rounded-md bg-[#0c0c0f] border border-[#1f1f24]">
                  {renderResultsPanel()}
                </div>
              </div>

              {draggingSplit && (
                <div className="fixed inset-0 z-[2500] cursor-col-resize" />
              )}
            </>
          )}

          {/* VIEW: MAP ONLY */}
          {activeView === 'map' && (
            <>
              {renderMissionControlPanel()}

              <div className="relative flex-1 min-h-0">
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

                {analysisResult && !errorMsg && (
                  <div className="absolute bottom-4 right-16 z-[500] w-[380px] max-w-[calc(100%-5rem)] shadow-2xl">
                    {renderVerdictHeroes(true)}
                  </div>
                )}
              </div>
            </>
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
                          <span className="text-sm font-mono text-zinc-300 font-medium">
                            Dipole Teleconnection Verdict
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#141419] text-zinc-300 border border-[#24242b]">
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
                        <p className="text-sm text-zinc-300">
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

                      <div className="flex items-center divide-x divide-[#1f1f24] rounded bg-[#09090b] border border-[#1f1f24] shrink-0 font-mono text-sm">
                        <div className="px-3 py-1.5">
                          <span className="text-zinc-400 block text-xs">
                            Pearson r
                          </span>
                          <span className="text-sm font-semibold text-zinc-100">
                            {analysisResult.dipole_comparison.pearson_r}
                          </span>
                        </div>
                        <div className="px-3 py-1.5">
                          <span className="text-zinc-400 block text-xs">
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
        {!isFixedView && (
        <footer className="mt-auto border-t border-[#1f1f24] bg-[#070709] px-4 py-2.5 text-[13px] text-zinc-400">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="text-zinc-300 font-medium">
                GaiaPulse // Earth System Trend Detective
              </span>
              <span>·</span>
              <span>
                Mann-Kendall · Sen&apos;s Slope · Student&apos;s t-test · STL
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              {NASA_OFFICIAL_DISCLAIMER}
            </p>
          </div>
        </footer>
        )}
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
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
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
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="px-1.5 py-0.5 rounded bg-[#141419] border border-[#24242b] text-xs font-mono text-zinc-400 hover:text-zinc-200"
              >
                ESC
              </button>
            </div>

            {/* Filtered Results */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-3 text-sm">
              {/* 1. Variables */}
              <div>
                <div className="px-2 py-1 text-xs font-mono text-zinc-400">
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
                        <span className="text-xs font-mono text-zinc-400 shrink-0">
                          {v.unit}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 2. Curated & Live EONET Scenarios */}
              <div>
                <div className="px-2 py-1 text-xs font-mono text-zinc-400">
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
                        <span className="text-xs font-mono text-zinc-400 shrink-0">
                          {s.variable} · {s.season_mode}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 3. Workspace Views */}
              <div>
                <div className="px-2 py-1 text-xs font-mono text-zinc-400">
                  {lang === 'en' ? 'Sections' : 'Розділи'}
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
                      <span className="text-xs font-mono text-zinc-400">
                        {item.subtitle}
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
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-md bg-[#0c0c0f] border border-[#24242b] shadow-2xl p-6 space-y-5 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header + Print Action */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1f1f24] pb-4">
              <div>
                <div className="text-xs font-monost text-sky-400">
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
                <div className="text-xs text-zinc-400">
                  Sen&apos;s Slope / Decade
                </div>
                <div className="text-sm font-semibold text-sky-400 mt-1">
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
                <div className="text-xs text-zinc-400">
                  Pettitt Regime Shift
                </div>
                <div className="text-sm font-semibold text-amber-400 mt-1">
                  {statsA.regime_shift?.change_point_year ?? '—'} (Δ{' '}
                  {(statsA.regime_shift?.step_delta ?? 0) >= 0 ? '+' : ''}
                  {statsA.regime_shift?.step_delta.toFixed(3)})
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Pettitt p ={' '}
                  {statsA.regime_shift?.p_value.toFixed(4) ?? '—'}
                </div>
              </div>

              <div className="p-3 rounded bg-[#09090b] border border-[#1f1f24]">
                <div className="text-xs text-zinc-400">
                  AR(1) &amp; Hamed-Rao MK
                </div>
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
                <p className="text-[13px] font-mono text-zinc-400">
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
            <div className="pt-2 border-t border-[#1f1f24] text-xs font-mono text-zinc-400 space-y-1">
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
