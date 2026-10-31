import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  AnalysisMode,
  AnalyzeTrendResponse,
  RegionLocation,
  SeasonMode,
} from '../types/climate';

interface DetectiveStepperProps {
  variableCode: string;
  mode: AnalysisMode;
  regionA: RegionLocation;
  regionB: RegionLocation | null;
  startYear: number;
  endYear: number;
  seasonMode: SeasonMode;
  analysisData: AnalyzeTrendResponse | null;
  loading: boolean;
}

export const DetectiveStepper: React.FC<DetectiveStepperProps> = ({
  variableCode,
  mode,
  regionA,
  regionB,
  startYear,
  endYear,
  seasonMode,
  analysisData,
  loading,
}) => {
  const step1Done = Boolean(variableCode);
  const step2Done =
    Boolean(regionA) && (mode === 'single' || Boolean(regionB));
  const step3Done = endYear - startYear >= 4 && Boolean(seasonMode);
  const step4Done =
    !loading &&
    Boolean(
      analysisData &&
        analysisData.region_a_analysis.time_series.length > 0
    );

  const statsA = analysisData?.region_a_analysis.statistics;
  const statsB = analysisData?.region_b_analysis?.statistics;
  const isSignificantAchieved =
    step4Done &&
    Boolean(statsA?.is_significant || statsB?.is_significant);
  const isEmergingOrNoise = step4Done && !isSignificantAchieved;

  const steps = [
    {
      num: 1,
      title: '1. Variable',
      detail: variableCode,
      done: step1Done,
      warning: false,
    },
    {
      num: 2,
      title: '2. Region',
      detail:
        mode === 'dipole' && regionB
          ? `${regionA.name.split(',')[0]} ↔ ${regionB.name.split(',')[0]}`
          : regionA.name.split(',')[0],
      done: step2Done,
      warning: false,
    },
    {
      num: 3,
      title: '3. Time & Season',
      detail: `${startYear}–${endYear} • ${seasonMode}`,
      done: step3Done,
      warning: false,
    },
    {
      num: 4,
      title: '4. Time Series',
      detail: loading
        ? 'Fetching NASA...'
        : step4Done
        ? `${analysisData?.region_a_analysis.time_series.length || 0} pts ready`
        : 'Pending',
      done: step4Done,
      warning: false,
    },
    {
      num: 5,
      title: '5. Significance p < 0.05',
      detail: loading
        ? 'Testing...'
        : isSignificantAchieved
        ? `Confirmed (p = ${
            (statsA?.p_value ?? 1) < 0.0001
              ? '<0.0001'
              : (statsA?.p_value ?? 0).toFixed(4)
          })`
        : isEmergingOrNoise
        ? `p = ${(statsA?.p_value ?? 1).toFixed(3)} (+${
            statsA?.time_to_significance?.additional_years_needed ?? '?'
          } yrs)`
        : 'Awaiting test',
      done: isSignificantAchieved,
      warning: isEmergingOrNoise,
    },
  ];

  return (
    <div className="rounded-2xl bg-ctp-mantle border border-ctp-surface0 px-4 py-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-ctp-subtext0 font-bold mr-1">
          NASA Detective Protocol:
        </div>

        <div className="flex-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {steps.map((step, idx) => {
            const pillStyle = step.done
              ? 'bg-ctp-green/15 border-ctp-green/60 text-ctp-green shadow-[0_0_14px_rgba(166,227,161,0.16)]'
              : step.warning
              ? 'bg-ctp-yellow/15 border-ctp-yellow/60 text-ctp-yellow'
              : 'bg-ctp-crust border-ctp-surface0 text-ctp-subtext0';

            return (
              <React.Fragment key={step.num}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${pillStyle}`}
                >
                  {loading && (step.num === 4 || step.num === 5) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-ctp-blue shrink-0" />
                  ) : step.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-ctp-green shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-ctp-yellow shrink-0" />
                  )}

                  <div className="leading-tight">
                    <div className="text-[11px] font-mono font-bold">
                      {step.title}
                    </div>
                    <div className="text-[10px] font-mono opacity-85 truncate max-w-[165px]">
                      {step.detail}
                    </div>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-ctp-surface2 hidden md:block shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
