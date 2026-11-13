import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Satellite,
  Radar,
  Loader2,
  Sparkles,
  Calendar,
  Activity,
  RefreshCw,
  Globe2,
  GitCompareArrows,
  MapPin,
  Info,
  Thermometer,
  CloudRain,
  Droplets,
  Sun,
  Wind,
  Flame,
  Snowflake,
  Waves,
  Download,
  FileSpreadsheet,
  Filter,
  Upload,
  BookOpen,
  ExternalLink,
  GraduationCap,
  ShieldAlert,
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
  analyzeTrendV2,
  BIOME_FILTER_OPTIONS,
  DEFAULT_VARIABLES,
  FALLBACK_PHENOMENA_SCENARIOS,
  fetchPhenomenaV2,
  fetchPresetsFromApi,
  getVariableMetaLocal,
  NASA_OFFICIAL_DISCLAIMER,
  SEASON_MODE_OPTIONS,
} from './services/api';
import { EarthMap } from './components/EarthMap';
import { VerdictCard, DipoleVerdictBanner } from './components/VerdictCard';
import { TrendCharts } from './components/TrendCharts';
import { DetectiveStepper } from './components/DetectiveStepper';
import { PhenomenaDrawer } from './components/PhenomenaDrawer';
import {
  CsvImporterModal,
  OfficialResourcesHub,
} from './components/OfficialResourcesHub';

const VARIABLE_ICONS: Record<string, React.ReactNode> = {
  SEAWIFS_CHLA: <Waves className="w-4 h-4 text-ctp-green" />,
  SWOT_WSE: <Waves className="w-4 h-4 text-ctp-sapphire" />,
  RCM_SAR_BACKSCATTER: <Radar className="w-4 h-4 text-ctp-teal" />,
  T2M: <Thermometer className="w-4 h-4 text-ctp-blue" />,
  SST: <Waves className="w-4 h-4 text-ctp-sapphire" />,
  PRECTOTCORR: <CloudRain className="w-4 h-4 text-ctp-sky" />,
  QRUNOFF: <Waves className="w-4 h-4 text-ctp-teal" />,
  GWETROOT: <Droplets className="w-4 h-4 text-ctp-green" />,
  EVPTRNS: <Wind className="w-4 h-4 text-ctp-teal" />,
  ALLSKY_SFC_SW_DWN: <Sun className="w-4 h-4 text-ctp-yellow" />,
  AOD: <Flame className="w-4 h-4 text-ctp-peach" />,
  SO2: <Flame className="w-4 h-4 text-ctp-mauve" />,
  SNODP: <Snowflake className="w-4 h-4 text-ctp-lavender" />,
};

const BIOME_BADGE_LABELS: Record<BiomeType, string> = {
  tidal_estuary: 'Tidal Estuary & Coast',
  cryosphere: 'Cryosphere & Ice',
  rain_forest: 'Forests & Tropics',
  desert: 'Arid & Steppe',
};

export const App: React.FC = () => {
  const [variables, setVariables] =
    useState<VariableMetadata[]>(DEFAULT_VARIABLES);
  const [selectedBiome, setSelectedBiome] = useState<'all' | BiomeType>('all');

  // Phenomena Drawer & Modals State
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [resourcesModalOpen, setResourcesModalOpen] = useState<boolean>(false);
  const [csvModalOpen, setCsvModalOpen] = useState<boolean>(false);
  const [phenomenaLoading, setPhenomenaLoading] = useState<boolean>(false);
  const [scenarios, setScenarios] = useState<PhenomenonScenario[]>(
    FALLBACK_PHENOMENA_SCENARIOS
  );
  const [eonetIsLive, setEonetIsLive] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] =
    useState<PhenomenonScenario | null>(FALLBACK_PHENOMENA_SCENARIOS[0]);

  // Core Scientific Control State
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [variable, setVariable] = useState<ClimateVariableCode>('AOD');
  const [seasonMode, setSeasonMode] = useState<SeasonMode>('JJA');
  const [startYear, setStartYear] = useState<number>(2002);
  const [endYear, setEndYear] = useState<number>(2026);

  const [regionA, setRegionA] = useState<RegionLocation>({
    name: 'Wisconsin, USA',
    lat: 44.5,
    lon: -89.5,
  });
  const [regionB, setRegionB] = useState<RegionLocation>({
    name: 'Open Gulf of Mexico Shelf',
    lat: 26.0,
    lon: -90.0,
  });

  const [activeTarget, setActiveTarget] = useState<'A' | 'B'>('A');
  const [cameraTrigger, setCameraTrigger] = useState<number>(1);
  const quickCsvInputRef = useRef<HTMLInputElement | null>(null);

  // Analysis Results State
  const [analysisData, setAnalysisData] =
    useState<AnalyzeTrendResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const executeAnalysis = useCallback(
    async (params: {
      mode: AnalysisMode;
      variable: ClimateVariableCode;
      seasonMode: SeasonMode;
      startYear: number;
      endYear: number;
      regionA: RegionLocation;
      regionB: RegionLocation | null;
    }) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const result = await analyzeTrendV2({
          variable: params.variable,
          start_year: params.startYear,
          end_year: params.endYear,
          season_mode: params.seasonMode,
          region_a: params.regionA,
          region_b: params.mode === 'dipole' ? params.regionB : null,
          prefer_live_api: true,
        });
        setAnalysisData(result);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Не вдалося з’єднатися з FastAPI бекендом (http://localhost:8000).';
        setErrorMsg(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial mount: load variables catalog + run Dr. Acker's #1 Wisconsin Wildfire Smoke case
  useEffect(() => {
    fetchPresetsFromApi().then(({ available_variables }) => {
      if (available_variables.length > 0) setVariables(available_variables);
    });

    executeAnalysis({
      mode: 'single',
      variable: 'AOD',
      seasonMode: 'JJA',
      startYear: 2002,
      endYear: 2026,
      regionA: { name: 'Wisconsin, USA', lat: 44.5, lon: -89.5 },
      regionB: null,
    });
  }, [executeAnalysis]);

  // Header Button Handler: Fetch Scenarios & NASA Phenomena
  const handleFetchPhenomenaClick = async () => {
    setPhenomenaLoading(true);
    setDrawerOpen(true);
    try {
      const data = await fetchPhenomenaV2();
      if (data.scenarios && data.scenarios.length > 0) {
        setScenarios(data.scenarios);
      }
      setEonetIsLive(Boolean(data.eonet_is_live));
    } finally {
      setPhenomenaLoading(false);
    }
  };

  // 1-Click Auto-Configuration from PhenomenonCard ("Load & Run Trend Analysis")
  const handleLoadPhenomenonScenario = (scenario: PhenomenonScenario) => {
    setActiveScenario(scenario);
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
    setDrawerOpen(false);
    setCameraTrigger((prev) => prev + 1);

    executeAnalysis({
      mode: scenario.mode,
      variable: scenario.variable,
      seasonMode: scenario.season_mode,
      startYear: scenario.start_year,
      endYear: scenario.end_year,
      regionA: scenario.region_a,
      regionB: scenario.mode === 'dipole' ? scenario.region_b || regionB : null,
    });
  };

  // CSV Analysis Handler (from CsvImporterModal or quick sidebar file dropzone)
  const handleRunCsvAnalysis = async (csvReq: AnalyzeCsvRequest) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await analyzeCsvTimeSeries(csvReq);
      setActiveScenario(null);
      setMode('single');
      setSeasonMode(
        (result.season_mode as SeasonMode) || csvReq.season_mode || 'deseasonalized'
      );
      if (result.csv_import_metadata) {
        setStartYear(result.csv_import_metadata.start_year);
        setEndYear(result.csv_import_metadata.end_year);
      }
      setRegionA(result.region_a_analysis.location);
      setAnalysisData(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Помилка аналізу CSV-файлу.';
      setErrorMsg(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Quick sidebar file upload handler
  const handleQuickCsvFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = String(ev.target?.result || '');
      if (!text.trim()) return;
      const cleanName = file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ');
      await handleRunCsvAnalysis({
        csv_text: text,
        dataset_name: cleanName || 'Imported NASA/NOAA CSV',
        variable_code: variable,
        unit: getVariableMetaLocal(variable).unit,
        season_mode: seasonMode,
        lat: regionA.lat,
        lon: regionA.lon,
      });
    };
    reader.readAsText(file);
  };

  // Map Click Handler
  const handleMapClickRegion = (target: 'A' | 'B', location: RegionLocation) => {
    setActiveScenario(null);
    if (mode === 'single' || target === 'A') {
      setRegionA(location);
      if (mode === 'dipole') {
        setActiveTarget('B');
      }
      executeAnalysis({
        mode,
        variable,
        seasonMode,
        startYear,
        endYear,
        regionA: location,
        regionB: mode === 'dipole' ? regionB : null,
      });
    } else {
      setRegionB(location);
      setActiveTarget('A');
      executeAnalysis({
        mode,
        variable,
        seasonMode,
        startYear,
        endYear,
        regionA,
        regionB: location,
      });
    }
  };

  const handleManualAnalyze = () => {
    setCameraTrigger((prev) => prev + 1);
    executeAnalysis({
      mode,
      variable,
      seasonMode,
      startYear,
      endYear,
      regionA,
      regionB: mode === 'dipole' ? regionB : null,
    });
  };

  // Export scientific report as JSON or CSV
  const handleExportJSON = () => {
    if (!analysisData) return;
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earth_trend_detective_${variable}_${seasonMode}_${startYear}_${endYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!analysisData) return;
    const tsA = analysisData.region_a_analysis.time_series;
    const tsBMap = new Map(
      (analysisData.region_b_analysis?.time_series || []).map((row) => [
        row.year,
        row,
      ])
    );

    const headers = [
      'year',
      'season_mode',
      'region_a_name',
      'region_a_value',
      'region_a_anomaly',
      'region_a_sens_trend',
      'region_a_ci_lower',
      'region_a_ci_upper',
      ...(analysisData.region_b_analysis
        ? [
            'region_b_name',
            'region_b_value',
            'region_b_anomaly',
            'region_b_sens_trend',
          ]
        : []),
    ];

    const rows = tsA.map((rA) => {
      const rB = tsBMap.get(rA.year);
      const baseCols: Array<string | number> = [
        rA.year,
        seasonMode,
        `"${analysisData.region_a_analysis.location.name}"`,
        rA.value,
        rA.anomaly,
        rA.trend_line,
        rA.ci_lower ?? '',
        rA.ci_upper ?? '',
      ];
      if (analysisData.region_b_analysis) {
        baseCols.push(
          `"${analysisData.region_b_analysis.location.name}"`,
          rB ? rB.value : '',
          rB ? rB.anomaly : '',
          rB ? rB.trend_line : ''
        );
      }
      return baseCols.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earth_trend_detective_${variable}_${seasonMode}_${startYear}_${endYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentVarMeta =
    analysisData?.variable_metadata || getVariableMetaLocal(variable);

  const filteredVariables = useMemo(() => {
    if (selectedBiome === 'all') return variables;
    return variables.filter(
      (v) => !v.biomes || v.biomes.includes(selectedBiome)
    );
  }, [variables, selectedBiome]);

  const curatedQuickList = scenarios.filter((s) => s.source_type === 'curated');

  return (
    <div className="min-h-screen bg-ctp-base text-ctp-text flex flex-col">
      {/* Top Catppuccin Mocha NASA Header */}
      <header className="sticky top-0 z-[1100] bg-ctp-mantle/95 backdrop-blur-xl border-b border-ctp-surface0 px-4 lg:px-8 py-3 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ctp-mauve/15 border border-ctp-mauve/50 flex items-center justify-center shadow-[0_0_20px_rgba(203,166,247,0.22)]">
              <Satellite className="w-5 h-5 text-ctp-mauve" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-ctp-text">
                  EARTH SYSTEM TREND DETECTIVE
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/45">
                  NASA • NOAA • KNMI • CSA
                </span>
              </div>
              <p className="text-xs text-ctp-subtext0">
                GaiaPulse v2.1 — SeaWiFS, SWOT, CSA RADARSAT (RCM), імпорт CSV (Giovanni / AppEEARS / CDO) та живі події EONET
              </p>
            </div>
          </div>

          {/* Right Header Controls: Fetch Phenomena + Import CSV + Official Resources Hub + Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PRIMARY FEATURE BUTTON: Fetch Scenarios & NASA Phenomena */}
            <button
              type="button"
              onClick={handleFetchPhenomenaClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-ctp-mauve via-ctp-blue to-ctp-sapphire hover:brightness-110 text-ctp-crust font-extrabold text-xs sm:text-sm tracking-tight transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(203,166,247,0.35)]"
            >
              {phenomenaLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Radar className="w-4 h-4" />
              )}
              <span>Fetch Scenarios &amp; Phenomena</span>
            </button>

            {/* FEATURE BUTTON: Import NASA/NOAA CSV */}
            <button
              type="button"
              onClick={() => setCsvModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-ctp-green/15 hover:bg-ctp-green/25 text-ctp-green border border-ctp-green/45 text-xs font-mono font-bold transition flex items-center gap-1.5"
              title="Імпортувати CSV часовий ряд із NASA Giovanni, AppEEARS, GES DISC або NOAA CDO"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import NASA/NOAA CSV</span>
            </button>

            {/* FEATURE BUTTON: Official Resources & External Tools Hub */}
            <button
              type="button"
              onClick={() => setResourcesModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-lavender border border-ctp-mauve/40 text-xs font-mono font-bold transition flex items-center gap-1.5"
              title="Відкрити хаб із 13 офіційних ресурсів NASA, NOAA, KNMI та CSA"
            >
              <BookOpen className="w-3.5 h-3.5 text-ctp-mauve" />
              <span>Official Resources (13)</span>
            </button>

            {/* Quick Curated Case Pills */}
            <div className="hidden 2xl:flex items-center gap-1.5 pl-2 border-l border-ctp-surface0">
              {curatedQuickList.slice(0, 3).map((sc) => {
                const isSelected = activeScenario?.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleLoadPhenomenonScenario(sc)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-ctp-green/15 text-ctp-green border-ctp-green/55'
                        : 'bg-ctp-crust text-ctp-subtext1 border-ctp-surface0 hover:border-ctp-surface1 hover:text-ctp-text'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-ctp-mauve" />
                    <span className="truncate max-w-[140px]">
                      {sc.title.split('(')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Export Controls (CSV / JSON) */}
            {analysisData && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-ctp-surface0">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-surface0 border border-ctp-surface0 text-xs font-mono text-ctp-subtext1 hover:text-ctp-green transition flex items-center gap-1"
                  title="Експортувати часові ряди у CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-ctp-green" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-2.5 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-surface0 border border-ctp-surface0 text-xs font-mono text-ctp-subtext1 hover:text-ctp-blue transition flex items-center gap-1"
                  title="Експортувати повний статистичний звіт у JSON"
                >
                  <Download className="w-3.5 h-3.5 text-ctp-blue" />
                  <span>JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Phenomena Interactive Modal / Drawer */}
      <PhenomenaDrawer
        isOpen={drawerOpen}
        loading={phenomenaLoading}
        scenarios={scenarios}
        eonetIsLive={eonetIsLive}
        activeScenarioId={activeScenario?.id || ''}
        onClose={() => setDrawerOpen(false)}
        onRefresh={handleFetchPhenomenaClick}
        onSelectScenario={handleLoadPhenomenonScenario}
      />

      {/* CSV Importer Modal (Giovanni / AppEEARS / NOAA CDO) */}
      <CsvImporterModal
        isOpen={csvModalOpen}
        loading={loading}
        defaultSeasonMode={seasonMode}
        onClose={() => setCsvModalOpen(false)}
        onRunCsvAnalysis={handleRunCsvAnalysis}
      />

      {/* Official NASA & Space Agency Resources Hub Modal */}
      {resourcesModalOpen && (
        <OfficialResourcesHub
          isModal={true}
          activeVariable={variable}
          onCloseModal={() => setResourcesModalOpen(false)}
          onSelectVariable={(newVar) => {
            setVariable(newVar);
            setResourcesModalOpen(false);
            executeAnalysis({
              mode,
              variable: newVar,
              seasonMode,
              startYear,
              endYear,
              regionA,
              regionB: mode === 'dipole' ? regionB : null,
            });
          }}
        />
      )}

      {/* Main Catppuccin Mocha Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-8 py-5 space-y-5">
        {/* 5-Step NASA Detective Status Bar */}
        <DetectiveStepper
          variableCode={variable}
          mode={mode}
          regionA={regionA}
          regionB={mode === 'dipole' ? regionB : null}
          startYear={startYear}
          endYear={endYear}
          seasonMode={seasonMode}
          analysisData={analysisData}
          loading={loading}
        />

        {/* Active Phenomenon Scientific Context Banner */}
        {activeScenario && (
          <div className="rounded-2xl bg-ctp-mantle border border-ctp-mauve/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-ctp-mauve">
                <Info className="w-4 h-4 shrink-0" />
                <span>ACTIVE SCENARIO: {activeScenario.title}</span>
                <span className="px-2 py-0.5 rounded bg-ctp-blue/15 text-ctp-blue border border-ctp-blue/35">
                  {activeScenario.satellite_badge}
                </span>
                {activeScenario.source_url && (
                  <a
                    href={activeScenario.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ctp-sapphire/15 text-ctp-sapphire border border-ctp-sapphire/40 hover:bg-ctp-sapphire/25 transition"
                  >
                    <span>
                      {activeScenario.source_label || 'Official Source'}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs sm:text-sm text-ctp-subtext1 leading-relaxed">
                {activeScenario.scientific_summary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeScenario.secondary_variable && (
                <button
                  type="button"
                  onClick={() => {
                    const nextVar =
                      variable === activeScenario.variable
                        ? activeScenario.secondary_variable!
                        : activeScenario.variable;
                    setVariable(nextVar);
                    executeAnalysis({
                      mode,
                      variable: nextVar,
                      seasonMode,
                      startYear,
                      endYear,
                      regionA,
                      regionB: mode === 'dipole' ? regionB : null,
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-ctp-surface0 hover:bg-ctp-surface1 border border-ctp-mauve/40 text-xs font-mono font-semibold text-ctp-lavender transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-ctp-mauve" />
                  <span>
                    Перемкнути змінну ({activeScenario.variable} ↔{' '}
                    {activeScenario.secondary_variable})
                  </span>
                </button>
              )}
              {activeScenario.student_note && (
                <div className="px-3 py-2 rounded-xl bg-ctp-crust border border-ctp-surface0 text-xs font-mono text-ctp-subtext0 max-w-md">
                  {activeScenario.student_note}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Grid: Left Control Sidebar (4 cols) + Right Interactive Map (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Mission Control Sidebar */}
          <aside className="lg:col-span-4 rounded-2xl bg-ctp-mantle border border-ctp-surface0 p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="space-y-3.5">
              {/* 1. Mode Switcher */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ctp-subtext0 mb-1.5">
                  1. Режим Дослідження (Single vs Dipole)
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-ctp-crust border border-ctp-surface0">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('single');
                      executeAnalysis({
                        mode: 'single',
                        variable,
                        seasonMode,
                        startYear,
                        endYear,
                        regionA,
                        regionB: null,
                      });
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                      mode === 'single'
                        ? 'bg-ctp-blue/20 text-ctp-blue border border-ctp-blue/50 shadow'
                        : 'text-ctp-subtext0 hover:text-ctp-text'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Single Region</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('dipole');
                      executeAnalysis({
                        mode: 'dipole',
                        variable,
                        seasonMode,
                        startYear,
                        endYear,
                        regionA,
                        regionB,
                      });
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                      mode === 'dipole'
                        ? 'bg-ctp-mauve/20 text-ctp-mauve border border-ctp-mauve/50 shadow'
                        : 'text-ctp-subtext0 hover:text-ctp-text'
                    }`}
                  >
                    <GitCompareArrows className="w-3.5 h-3.5" />
                    <span>Dipole (Opposite)</span>
                  </button>
                </div>
              </div>

              {/* 2. NASA & CSA Satellite Variable Catalog + Biome Questionnaire Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-ctp-subtext0">
                    2. Каталог змінних NASA &amp; CSA (13 місій)
                  </label>
                  <select
                    value={selectedBiome}
                    onChange={(e) =>
                      setSelectedBiome(e.target.value as 'all' | BiomeType)
                    }
                    className="bg-ctp-crust text-ctp-blue border border-ctp-surface0 rounded-lg px-2 py-0.5 text-[10px] font-mono focus:outline-none focus:border-ctp-blue"
                    title="Фільтр за біомом опитувальника челенджу"
                  >
                    {BIOME_FILTER_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-[195px] overflow-y-auto pr-1 space-y-1.5">
                  {filteredVariables.map((v) => {
                    const selected = variable === v.code;
                    return (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => {
                          const newVar = v.code as ClimateVariableCode;
                          setVariable(newVar);
                          executeAnalysis({
                            mode,
                            variable: newVar,
                            seasonMode,
                            startYear,
                            endYear,
                            regionA,
                            regionB: mode === 'dipole' ? regionB : null,
                          });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-center justify-between ${
                          selected
                            ? 'bg-ctp-blue/15 border-ctp-blue/60 text-ctp-text shadow-[0_0_12px_rgba(137,180,250,0.14)]'
                            : 'bg-ctp-crust border-ctp-surface0 text-ctp-subtext1 hover:border-ctp-surface1 hover:text-ctp-text'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {VARIABLE_ICONS[v.code] || (
                            <Activity className="w-4 h-4 text-ctp-blue" />
                          )}
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">
                              {v.name_ua || v.name}
                            </div>
                            <div className="text-[10px] font-mono text-ctp-subtext0 truncate">
                              {v.code}
                              {v.satellite_badge ? ` • ${v.satellite_badge}` : ''}
                            </div>
                          </div>
                        </div>
                        <span className="ml-2 px-2 py-0.5 rounded bg-ctp-surface0 text-[10px] font-mono text-ctp-blue shrink-0 max-w-[110px] truncate">
                          {v.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Student Definition & Biome Tags for Selected Variable */}
                {currentVarMeta.student_definition && (
                  <div className="p-2.5 rounded-xl bg-ctp-crust/90 border border-ctp-surface0 space-y-1.5">
                    <div className="flex items-start gap-1.5 text-[11px] text-ctp-subtext1 leading-relaxed">
                      <GraduationCap className="w-3.5 h-3.5 text-ctp-mauve shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-ctp-lavender">
                          Пояснення для студентів:{' '}
                        </strong>
                        {currentVarMeta.student_definition}
                      </span>
                    </div>
                    {currentVarMeta.biomes &&
                      currentVarMeta.biomes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[10px] font-mono text-ctp-subtext0">
                            Біоми:
                          </span>
                          {currentVarMeta.biomes.map((bKey) => (
                            <span
                              key={bKey}
                              className="px-1.5 py-0.5 rounded bg-ctp-surface0 text-[10px] font-mono text-ctp-teal"
                            >
                              {BIOME_BADGE_LABELS[bKey] || bKey}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* 3. Seasonal & Deseasonalized Filter (`season_mode`) */}
              <div className="p-3 rounded-xl bg-ctp-crust border border-ctp-surface0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ctp-subtext0 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-ctp-yellow" />
                    <span>3. Сезонний зріз (Season Mode)</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-ctp-yellow">
                    {seasonMode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {SEASON_MODE_OPTIONS.map((opt) => {
                    const active = seasonMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.fullLabel}
                        onClick={() => {
                          setSeasonMode(opt.value);
                          executeAnalysis({
                            mode,
                            variable,
                            seasonMode: opt.value,
                            startYear,
                            endYear,
                            regionA,
                            regionB: mode === 'dipole' ? regionB : null,
                          });
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition border text-center truncate ${
                          active
                            ? 'bg-ctp-yellow/20 text-ctp-yellow border-ctp-yellow/55'
                            : 'bg-ctp-mantle text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text'
                        }`}
                      >
                        {opt.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Temporal Range Sliders */}
              <div className="p-3 rounded-xl bg-ctp-crust border border-ctp-surface0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ctp-subtext0 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-ctp-blue" />
                    <span>4. Часове вікно</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-ctp-blue">
                    {startYear} — {endYear} ({endYear - startYear + 1} р.)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-ctp-subtext0 mb-1">
                      Початок: {startYear}
                    </label>
                    <input
                      type="range"
                      min={1981}
                      max={endYear - 5}
                      value={startYear}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                      className="w-full accent-ctp-blue cursor-pointer h-1.5 bg-ctp-surface0 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-ctp-subtext0 mb-1">
                      Кінець: {endYear}
                    </label>
                    <input
                      type="range"
                      min={startYear + 5}
                      max={2026}
                      value={endYear}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                      className="w-full accent-ctp-blue cursor-pointer h-1.5 bg-ctp-surface0 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Compact CSV Dropzone (Giovanni / AppEEARS / NOAA CDO) */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleQuickCsvFileSelect(file);
                }}
                className="p-2.5 rounded-xl bg-ctp-crust border border-dashed border-ctp-green/45 hover:border-ctp-green flex items-center justify-between gap-2 transition"
              >
                <input
                  ref={quickCsvInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleQuickCsvFileSelect(file);
                  }}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-ctp-green shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-ctp-green truncate">
                      Import NASA / NOAA CSV
                    </div>
                    <div className="text-[10px] font-mono text-ctp-subtext0 truncate">
                      Giovanni • AppEEARS • GES DISC • CDO
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => quickCsvInputRef.current?.click()}
                    className="px-2 py-1 rounded-lg bg-ctp-green/15 hover:bg-ctp-green/25 text-ctp-green border border-ctp-green/40 text-[10px] font-mono font-bold transition"
                  >
                    Файл
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvModalOpen(true)}
                    className="px-2 py-1 rounded-lg bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text text-[10px] font-mono font-semibold transition"
                  >
                    Шаблони
                  </button>
                </div>
              </div>

              {/* 6. Selected Regions Telemetry Summary */}
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-ctp-crust border border-ctp-blue/35 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-ctp-blue shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-ctp-blue truncate">
                        Region A: {regionA.name}
                      </div>
                      <div className="font-mono text-[11px] text-ctp-subtext0">
                        lat {regionA.lat.toFixed(2)}°, lon{' '}
                        {regionA.lon.toFixed(2)}°
                      </div>
                    </div>
                  </div>
                </div>

                {mode === 'dipole' && (
                  <div className="p-2.5 rounded-xl bg-ctp-crust border border-ctp-peach/35 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-ctp-peach shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-ctp-peach truncate">
                          Region B: {regionB.name}
                        </div>
                        <div className="font-mono text-[11px] text-ctp-subtext0">
                          lat {regionB.lat.toFixed(2)}°, lon{' '}
                          {regionB.lon.toFixed(2)}°
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Execute Button */}
            <button
              type="button"
              onClick={handleManualAnalyze}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-ctp-blue to-ctp-sapphire hover:brightness-110 disabled:opacity-50 text-ctp-crust font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(137,180,250,0.3)]"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span>
                {loading
                  ? 'Обчислення t-тесту та Манна-Кендалла...'
                  : 'Запустити аналіз тренду'}
              </span>
            </button>
          </aside>

          {/* Right Interactive Earth Map / 3D Globe */}
          <div className="lg:col-span-8">
            <EarthMap
              mode={mode}
              variable={variable}
              regionA={regionA}
              regionB={mode === 'dipole' ? regionB : null}
              activeTarget={activeTarget}
              cameraTrigger={cameraTrigger}
              onMapClickRegion={handleMapClickRegion}
              onToggleActiveTarget={setActiveTarget}
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl bg-ctp-red/15 border border-ctp-red/50 p-4 text-xs font-mono text-ctp-red flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={handleManualAnalyze}
              className="px-3 py-1 rounded bg-ctp-red/20 border border-ctp-red/50 text-ctp-text hover:bg-ctp-red/30"
            >
              Повторити запит
            </button>
          </div>
        )}

        {/* Dipole Cross-Regional Verdict Banner */}
        {mode === 'dipole' &&
          analysisData?.dipole_comparison &&
          analysisData?.region_b_analysis && (
            <DipoleVerdictBanner
              dipole={analysisData.dipole_comparison}
              regionAName={analysisData.region_a_analysis.location.name}
              regionBName={analysisData.region_b_analysis.location.name}
            />
          )}

        {/* Detective Verdict Cards */}
        {analysisData && (
          <section
            className={`grid grid-cols-1 ${
              mode === 'dipole' && analysisData.region_b_analysis
                ? 'lg:grid-cols-2'
                : 'lg:grid-cols-1'
            } gap-6`}
          >
            <VerdictCard
              regionKey="A"
              analysis={analysisData.region_a_analysis}
              variableMeta={currentVarMeta}
            />

            {mode === 'dipole' && analysisData.region_b_analysis && (
              <VerdictCard
                regionKey="B"
                analysis={analysisData.region_b_analysis}
                variableMeta={currentVarMeta}
              />
            )}
          </section>
        )}

        {/* Scientific Plotly Charts Section + Context Deep-Links */}
        {analysisData && (
          <section>
            <TrendCharts
              mode={mode}
              seasonMode={seasonMode}
              variableMeta={currentVarMeta}
              regionA={analysisData.region_a_analysis}
              regionB={
                mode === 'dipole' ? analysisData.region_b_analysis : null
              }
              onOpenResourcesModal={() => setResourcesModalOpen(true)}
            />
          </section>
        )}

        {/* Interactive Official NASA, NOAA, KNMI & CSA Space Agency Resources Hub */}
        <section id="official-resources-hub">
          <OfficialResourcesHub
            activeVariable={variable}
            onSelectVariable={(newVar) => {
              setVariable(newVar);
              executeAnalysis({
                mode,
                variable: newVar,
                seasonMode,
                startYear,
                endYear,
                regionA,
                regionB: mode === 'dipole' ? regionB : null,
              });
            }}
          />
        </section>
      </main>

      {/* Application Footer with Mandatory Official NASA Disclaimer */}
      <footer className="mt-8 bg-ctp-mantle border-t border-ctp-surface0 px-4 lg:px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 max-w-4xl">
            <ShieldAlert className="w-4 h-4 text-ctp-yellow shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-ctp-subtext0 leading-relaxed">
              {NASA_OFFICIAL_DISCLAIMER}
            </p>
          </div>
          <div className="text-xs font-mono text-ctp-subtext0 shrink-0">
            GaiaPulse v2.1 • NASA Space Apps Challenge 2026 • Earth System Trend Detective
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
