import React, { useMemo, useState } from 'react';
import {
  X,
  ArrowUpRight,
  Satellite,
  GitCompareArrows,
  MapPin,
  Flame,
  Radio,
  RefreshCw,
  Calendar,
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
  JJA: 'Summer · JJA',
  DJF: 'Winter · DJF',
  MAM: 'Spring · MAM',
  SON: 'Autumn · SON',
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
      className={`rounded-md p-4 border transition flex flex-col justify-between gap-3 ${
        isActive
          ? 'bg-[#121217] border-zinc-300'
          : 'bg-[#09090b] border-[#1f1f24] hover:border-zinc-700'
      }`}
    >
      <div className="space-y-2.5">
        {/* Top Row: Satellite Badge + Mode Badge + Live/Curated Tag */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141419] text-zinc-300 border border-[#24242b]">
              <Satellite className="w-3 h-3 text-sky-400" />
              {scenario.satellite_badge}
            </span>

            {isDipole ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/25">
                <GitCompareArrows className="w-3 h-3" />
                Dipole
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-[#141419] border border-[#24242b]">
                <MapPin className="w-3 h-3" />
                Single
              </span>
            )}
          </div>

          {isLiveEonet ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
              <Radio className="w-2.5 h-2.5" />
              EONET {scenario.event_date ? `· ${scenario.event_date}` : 'LIVE'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
              Curated Case
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-zinc-100 leading-snug">
          {scenario.title}
        </h3>

        {/* Telemetry Metadata Strip */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <span className="px-1.5 py-0.5 rounded bg-[#141419] text-zinc-200 border border-[#24242b]">
            {scenario.variable}
            {scenario.secondary_variable
              ? ` / ${scenario.secondary_variable}`
              : ''}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#141419] border border-[#24242b] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-500" />
            {scenario.start_year}–{scenario.end_year}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#141419] text-amber-400 border border-[#24242b]">
            {SEASON_DISPLAY_BADGE[scenario.season_mode] || scenario.season_mode}
          </span>
        </div>

        {/* Coordinates Preview */}
        <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 bg-[#0c0c0f] px-2.5 py-1.5 rounded border border-[#1f1f24]">
          <div className="truncate">
            <span className="text-sky-400 font-medium">A:</span>{' '}
            {scenario.region_a.name} ({scenario.region_a.lat.toFixed(2)}°,{' '}
            {scenario.region_a.lon.toFixed(2)}°)
          </div>
          {isDipole && scenario.region_b && (
            <div className="truncate">
              <span className="text-orange-400 font-medium">B:</span>{' '}
              {scenario.region_b.name} ({scenario.region_b.lat.toFixed(2)}°,{' '}
              {scenario.region_b.lon.toFixed(2)}°)
            </div>
          )}
        </div>

        {/* Scientific Explanation */}
        <p className="text-xs text-zinc-400 leading-relaxed">
          {scenario.scientific_summary}
        </p>

        {scenario.student_note && (
          <div className="text-[11px] text-zinc-400 border-l-2 border-zinc-700 pl-2.5 py-0.5">
            {scenario.student_note}
          </div>
        )}

        {scenario.source_url && (
          <a
            href={scenario.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300 hover:text-white underline decoration-zinc-600 transition"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {scenario.source_label || 'NASA / CSA Primary Source'}
            </span>
          </a>
        )}
      </div>

      {/* Minimalist High-Contrast Action Button */}
      <button
        type="button"
        onClick={() => onLoadAndRun(scenario)}
        className={`w-full py-2 px-3 rounded text-xs font-mono font-medium transition flex items-center justify-between ${
          isActive
            ? 'bg-zinc-100 text-zinc-950'
            : 'bg-[#141419] hover:bg-zinc-100 text-zinc-200 hover:text-zinc-950 border border-[#24242b]'
        }`}
      >
        <span>Load Scenario</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface PhenomenaDrawerProps {
  isOpen: boolean;
  isModal?: boolean;
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
  isModal = true,
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
      label: 'All Scenarios',
      icon: <Layers className="w-3.5 h-3.5" />,
      count: scenarios.length,
    },
    {
      id: 'acker_video',
      label: 'Dr. Acker & CSA Cases',
      icon: <Flame className="w-3.5 h-3.5" />,
      count: scenarios.filter(
        (s) => s.source_type === 'curated' || s.tags.includes('acker_video')
      ).length,
    },
    {
      id: 'dipole',
      label: 'Regional Dipoles',
      icon: <GitCompareArrows className="w-3.5 h-3.5" />,
      count: scenarios.filter(
        (s) => s.mode === 'dipole' || s.tags.includes('dipole')
      ).length,
    },
    {
      id: 'eonet_live',
      label: 'NASA EONET Live',
      icon: <Satellite className="w-3.5 h-3.5" />,
      count: scenarios.filter((s) => s.source_type === 'eonet_live').length,
    },
  ];

  const innerPanel = (
    <div
      className={
        isModal
          ? 'w-full max-w-6xl max-h-[90vh] rounded-md bg-[#0c0c0f] border border-[#24242b] shadow-2xl flex flex-col overflow-hidden'
          : 'w-full rounded-md bg-[#0c0c0f] border border-[#1f1f24] flex flex-col overflow-hidden'
      }
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#09090b] border-b border-[#1f1f24] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Satellite className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Historical Earth Phenomena &amp; Live NASA EONET Events
          </h2>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              eonetIsLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {eonetIsLive ? 'EONET v3 · LIVE' : 'EONET v3 · CACHE'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-[#141419] hover:bg-[#1c1c22] text-zinc-200 text-xs font-mono transition flex items-center gap-1.5 border border-[#24242b]"
          >
            <RefreshCw
              className={`w-3 h-3 text-zinc-400 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>Sync EONET</span>
          </button>

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded bg-[#141419] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition border border-[#24242b]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="px-4 py-2 bg-[#0c0c0f] border-b border-[#1f1f24] flex flex-wrap items-center gap-1.5">
        {filterTabs.map((tab) => {
          const selected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 border ${
                selected
                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                  : 'bg-[#09090b] text-zinc-400 border-[#1f1f24] hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  selected
                    ? 'bg-zinc-900/15 text-zinc-950'
                    : 'bg-[#141419] text-zinc-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Phenomenon Cards Grid */}
      <div className={isModal ? 'flex-1 overflow-y-auto p-4' : 'p-4'}>
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
            <p className="text-xs font-mono">
              Fetching NASA EONET v3 &amp; curated scenarios...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
  );

  if (!isModal) {
    return innerPanel;
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
      {innerPanel}
    </div>
  );
};
