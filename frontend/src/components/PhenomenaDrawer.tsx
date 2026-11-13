import React, { useMemo, useState } from 'react';
import {
  X,
  Zap,
  Satellite,
  GitCompareArrows,
  MapPin,
  Flame,
  Radio,
  RefreshCw,
  Calendar,
  GraduationCap,
  Sparkles,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { PhenomenonScenario, SeasonMode } from '../types/climate';

export type PhenomenaFilterTab =
  | 'all'
  | 'acker_video'
  | 'dipole'
  | 'eonet_live';

const SEASON_DISPLAY_BADGE: Record<SeasonMode, string> = {
  raw: 'All Months (Raw)',
  deseasonalized: 'Deseasonalized',
  JJA: 'Summer Only — JJA',
  DJF: 'Winter Only — DJF',
  MAM: 'Spring Only — MAM',
  SON: 'Autumn Only — SON',
};

interface PhenomenonCardProps {
  scenario: PhenomenonScenario;
  isActive: boolean;
  onLoadAndRun: (scenario: PhenomenonScenario) => void;
}

export const PhenomenonCard: React.FC<PhenomenonCardProps> = ({
  scenario,
  isActive,
  onLoadAndRun,
}) => {
  const isDipole = scenario.mode === 'dipole' && Boolean(scenario.region_b);
  const isLiveEonet = scenario.source_type === 'eonet_live';

  return (
    <div
      className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between gap-3 ${
        isActive
          ? 'bg-ctp-surface0/70 border-ctp-green shadow-[0_0_24px_rgba(166,227,161,0.18)]'
          : 'bg-ctp-crust/90 border-ctp-surface0 hover:border-ctp-mauve/60 hover:bg-ctp-mantle'
      }`}
    >
      <div className="space-y-2.5">
        {/* Top Row: Satellite Badge + Mode Badge + Live/Curated Tag */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Satellite / Model Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-ctp-blue/15 text-ctp-blue border border-ctp-blue/40">
              <Satellite className="w-3 h-3" />
              {scenario.satellite_badge}
            </span>

            {/* Single Region vs Dipole: Opposite Trends */}
            {isDipole ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-ctp-mauve/15 text-ctp-mauve border border-ctp-mauve/40">
                <GitCompareArrows className="w-3 h-3" />
                Dipole: Opposite Trends
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-ctp-teal/15 text-ctp-teal border border-ctp-teal/40">
                <MapPin className="w-3 h-3" />
                Single Region
              </span>
            )}
          </div>

          {isLiveEonet ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ctp-peach/15 text-ctp-peach border border-ctp-peach/40">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              EONET {scenario.event_date ? `• ${scenario.event_date}` : 'LIVE'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ctp-green/15 text-ctp-green border border-ctp-green/40">
              <Sparkles className="w-2.5 h-2.5" />
              Dr. Acker Curated
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-ctp-text leading-snug">
          {scenario.title}
        </h3>

        {/* Telemetry Metadata Strip: Variable, Period, Season Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-ctp-surface0 text-ctp-lavender font-semibold">
            Var: {scenario.variable}
            {scenario.secondary_variable
              ? ` / ${scenario.secondary_variable}`
              : ''}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-ctp-surface0 text-ctp-subtext1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-ctp-sapphire" />
            {scenario.start_year}–{scenario.end_year}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-ctp-yellow/15 text-ctp-yellow border border-ctp-yellow/30 font-semibold">
            {SEASON_DISPLAY_BADGE[scenario.season_mode] || scenario.season_mode}
          </span>
        </div>

        {/* Coordinates Preview */}
        <div className="text-[11px] font-mono text-ctp-subtext0 space-y-0.5 bg-ctp-mantle/80 px-2.5 py-1.5 rounded-lg border border-ctp-surface0/70">
          <div className="truncate">
            <span className="text-ctp-blue font-bold">Region A:</span>{' '}
            {scenario.region_a.name} ({scenario.region_a.lat.toFixed(2)}°,{' '}
            {scenario.region_a.lon.toFixed(2)}°)
          </div>
          {isDipole && scenario.region_b && (
            <div className="truncate">
              <span className="text-ctp-peach font-bold">Region B:</span>{' '}
              {scenario.region_b.name} ({scenario.region_b.lat.toFixed(2)}°,{' '}
              {scenario.region_b.lon.toFixed(2)}°)
            </div>
          )}
        </div>

        {/* Student Scientific Explanation */}
        <p className="text-xs text-ctp-subtext1 leading-relaxed">
          {scenario.scientific_summary}
        </p>

        {scenario.student_note && (
          <div className="flex items-start gap-1.5 text-[11px] text-ctp-subtext0 bg-ctp-surface0/35 px-2.5 py-1.5 rounded-lg border border-ctp-surface0">
            <GraduationCap className="w-3.5 h-3.5 text-ctp-mauve shrink-0 mt-0.5" />
            <span>{scenario.student_note}</span>
          </div>
        )}

        {scenario.source_url && (
          <a
            href={scenario.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-ctp-sapphire hover:text-ctp-blue underline decoration-ctp-sapphire/50 transition"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {scenario.source_label || 'Офіційне першоджерело NASA / CSA'}
            </span>
          </a>
        )}
      </div>

      {/* 1-Click Auto-Configuration & Trend Execution Button */}
      <button
        type="button"
        onClick={() => onLoadAndRun(scenario)}
        className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-ctp-mauve via-ctp-blue to-ctp-sapphire hover:brightness-110 text-ctp-crust font-extrabold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(137,180,250,0.28)]"
      >
        <Zap className="w-4 h-4 fill-current" />
        <span>Load &amp; Run Trend Analysis</span>
      </button>
    </div>
  );
};

interface PhenomenaDrawerProps {
  isOpen: boolean;
  loading: boolean;
  scenarios: PhenomenonScenario[];
  eonetIsLive: boolean;
  activeScenarioId: string;
  onClose: () => void;
  onRefresh: () => void;
  onSelectScenario: (scenario: PhenomenonScenario) => void;
}

export const PhenomenaDrawer: React.FC<PhenomenaDrawerProps> = ({
  isOpen,
  loading,
  scenarios,
  eonetIsLive,
  activeScenarioId,
  onClose,
  onRefresh,
  onSelectScenario,
}) => {
  const [activeFilter, setActiveFilter] = useState<PhenomenaFilterTab>('all');

  const filteredScenarios = useMemo(() => {
    if (activeFilter === 'all') return scenarios;
    if (activeFilter === 'acker_video') {
      return scenarios.filter(
        (s) =>
          s.source_type === 'curated' || s.tags.includes('acker_video')
      );
    }
    if (activeFilter === 'dipole') {
      return scenarios.filter(
        (s) => s.mode === 'dipole' || s.tags.includes('dipole')
      );
    }
    return scenarios.filter((s) => s.source_type === 'eonet_live');
  }, [scenarios, activeFilter]);

  if (!isOpen) return null;

  const filterTabs: Array<{
    id: PhenomenaFilterTab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    {
      id: 'all',
      label: 'All Phenomena',
      icon: <Layers className="w-3.5 h-3.5" />,
      count: scenarios.length,
    },
    {
      id: 'acker_video',
      label: "Dr. Acker's Video Cases",
      icon: <Flame className="w-3.5 h-3.5" />,
      count: scenarios.filter(
        (s) => s.source_type === 'curated' || s.tags.includes('acker_video')
      ).length,
    },
    {
      id: 'dipole',
      label: 'Regional Dipoles (Opposite Trends)',
      icon: <GitCompareArrows className="w-3.5 h-3.5" />,
      count: scenarios.filter(
        (s) => s.mode === 'dipole' || s.tags.includes('dipole')
      ).length,
    },
    {
      id: 'eonet_live',
      label: 'Live NASA EONET Events',
      icon: <Satellite className="w-3.5 h-3.5" />,
      count: scenarios.filter((s) => s.source_type === 'eonet_live').length,
    },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-ctp-crust/80 backdrop-blur-md">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-3xl bg-ctp-base border border-ctp-surface1 shadow-[0_25px_70px_rgba(17,17,27,0.95)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-ctp-mantle border-b border-ctp-surface0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ctp-mauve/15 border border-ctp-mauve/50 flex items-center justify-center text-ctp-mauve">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-ctp-text">
                  Historical Earth Phenomena &amp; Live NASA EONET Events
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    eonetIsLive
                      ? 'bg-ctp-green/15 text-ctp-green border-ctp-green/40'
                      : 'bg-ctp-yellow/15 text-ctp-yellow border-ctp-yellow/40'
                  }`}
                >
                  {eonetIsLive
                    ? 'EONET v3 API: LIVE CONNECTED'
                    : 'EONET v3: OFFLINE CACHE'}
                </span>
              </div>
              <p className="text-xs text-ctp-subtext0">
                Оберіть науковий кейс д-ра Джеймса Екера (NASA Goddard) або живу супутникову подію EONET для миттєвої автоконфігурації та перевірки тренду
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text text-xs font-mono font-semibold transition flex items-center gap-1.5 border border-ctp-surface1"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-ctp-blue ${
                  loading ? 'animate-spin' : ''
                }`}
              />
              <span>Re-Fetch NASA</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-ctp-surface0 hover:bg-ctp-red/20 text-ctp-subtext1 hover:text-ctp-red transition border border-ctp-surface1"
              title="Закрити панель феноменів"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Category Filter Tabs */}
        <div className="px-5 py-3 bg-ctp-mantle/60 border-b border-ctp-surface0 flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => {
            const selected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 border ${
                  selected
                    ? 'bg-ctp-mauve/20 text-ctp-mauve border-ctp-mauve/60 shadow-[0_0_15px_rgba(203,166,247,0.18)]'
                    : 'bg-ctp-crust text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text hover:border-ctp-surface1'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    selected
                      ? 'bg-ctp-mauve/25 text-ctp-text'
                      : 'bg-ctp-surface0 text-ctp-subtext0'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Phenomenon Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-ctp-subtext0">
              <RefreshCw className="w-8 h-8 animate-spin text-ctp-mauve" />
              <p className="text-sm font-mono">
                Опитування архіву феноменів та живого потоку NASA EONET v3 API...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredScenarios.map((scenario) => (
                <PhenomenonCard
                  key={scenario.id}
                  scenario={scenario}
                  isActive={activeScenarioId === scenario.id}
                  onLoadAndRun={onSelectScenario}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
