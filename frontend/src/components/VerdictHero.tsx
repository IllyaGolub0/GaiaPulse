import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { RegionAnalysis, VariableMetadata } from '../types/climate';
import { formatP, formatSigned } from '../utils/format';

type Lang = 'ua' | 'en';
type Reliability = 'high' | 'weak' | 'none';

interface VerdictHeroProps {
  analysis: RegionAnalysis;
  variableMeta: VariableMetadata;
  lang: Lang;
  seasonLabel: string;
  regionKey?: 'A' | 'B';
  showRegionBadge?: boolean;
  compact?: boolean;
}

const RELIABILITY_COPY: Record<
  Reliability,
  { ua: string; en: string; hintUa: string; hintEn: string }
> = {
  high: {
    ua: 'Надійно',
    en: 'Reliable',
    hintUa: 'Зміна навряд чи випадкова',
    hintEn: 'The change is unlikely to be random',
  },
  weak: {
    ua: 'Слабко',
    en: 'Weak',
    hintUa: 'Є ознаки зміни, але доказів замало',
    hintEn: 'There are signs of change, but not enough evidence',
  },
  none: {
    ua: 'Не доведено',
    en: 'Not proven',
    hintUa: 'Коливання не відрізняються від звичайного шуму',
    hintEn: 'Fluctuations look like ordinary noise',
  },
};

/**
 * Plain-language verdict: one sentence, the size of the change with units,
 * a three-step reliability scale and the regime-shift year when found.
 */
export const VerdictHero: React.FC<VerdictHeroProps> = ({
  analysis,
  variableMeta,
  lang,
  seasonLabel,
  regionKey = 'A',
  showRegionBadge = false,
  compact = false,
}) => {
  const { statistics, location, time_series } = analysis;
  const en = lang === 'en';
  const p = statistics.p_value;
  const reliability: Reliability = p < 0.05 ? 'high' : p < 0.1 ? 'weak' : 'none';
  const rising = statistics.change_per_decade >= 0;
  const varName = en
    ? variableMeta.name
    : variableMeta.name_ua || variableMeta.name;

  const firstYear = time_series[0]?.year;
  const lastYear = time_series[time_series.length - 1]?.year;
  const yearsCount = time_series.length;

  let headline: string;
  if (reliability === 'high') {
    headline = en
      ? `${varName} in ${location.name} is ${rising ? 'rising' : 'falling'}`
      : `${varName}: у регіоні «${location.name}» показник ${
          rising ? 'зростає' : 'знижується'
        }`;
  } else if (reliability === 'weak') {
    headline = en
      ? `${varName} in ${location.name} may be ${
          rising ? 'rising' : 'falling'
        }, but the evidence is weak`
      : `${varName}: у регіоні «${location.name}» показник, імовірно, ${
          rising ? 'зростає' : 'знижується'
        }, але доказів замало`;
  } else {
    headline = en
      ? `No steady trend found for ${varName} in ${location.name}`
      : `${varName}: у регіоні «${location.name}» стійкого тренду не виявлено`;
  }

  const toneClass =
    reliability === 'none'
      ? 'text-zinc-200'
      : rising
      ? 'text-rose-400'
      : 'text-teal-300';
  const ToneIcon = reliability === 'none' ? Minus : rising ? ArrowUpRight : ArrowDownRight;
  const directionWord =
    reliability === 'none'
      ? en
        ? 'No trend'
        : 'Без тренду'
      : rising
      ? en
        ? 'Rising'
        : 'Зростання'
      : en
      ? 'Falling'
      : 'Спад';

  const steps: Reliability[] = ['none', 'weak', 'high'];
  const activeIndex = steps.indexOf(reliability);
  const stepColor =
    reliability === 'high'
      ? 'bg-emerald-400'
      : reliability === 'weak'
      ? 'bg-amber-400'
      : 'bg-zinc-400';
  const copy = RELIABILITY_COPY[reliability];
  const shift = statistics.regime_shift;
  const regionColor = regionKey === 'A' ? 'bg-sky-400' : 'bg-orange-400';

  return (
    <section
      className={`rounded-md bg-[#09090b] border border-[#24242b] ${
        compact ? 'p-3 space-y-2.5' : 'p-4 space-y-3.5'
      }`}
      aria-label={en ? 'Verdict' : 'Вердикт'}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 shrink-0 inline-flex items-center justify-center rounded-md bg-[#16161b] border border-[#24242b] ${
            compact ? 'w-8 h-8' : 'w-10 h-10'
          } ${toneClass}`}
        >
          <ToneIcon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {showRegionBadge && (
              <span className="inline-flex items-center gap-1.5 text-zinc-200 font-medium">
                <span className={`w-2 h-2 rounded-full ${regionColor}`} />
                {en ? 'Point' : 'Точка'} {regionKey}
              </span>
            )}
            <span className={`font-medium ${toneClass}`}>{directionWord}</span>
            <span>
              {seasonLabel}
              {firstYear && lastYear ? `, ${firstYear}–${lastYear}` : ''}
            </span>
          </div>
          <h2
            className={`font-semibold text-zinc-50 leading-snug ${
              compact ? 'text-base' : 'text-xl'
            }`}
          >
            {headline}
          </h2>
        </div>
      </div>

      <div
        className={`grid gap-3 ${
          compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] px-3 py-2.5">
          <div className="text-xs text-zinc-400">
            {en ? 'Size of the change' : 'Величина зміни'}
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-semibold font-mono text-zinc-50">
              {formatSigned(statistics.change_per_decade)} {variableMeta.unit}
            </span>
            <span className="text-sm text-zinc-300">
              {en ? 'per decade' : 'за десятиліття'}
            </span>
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">
            {en ? 'In total' : 'Усього'}{' '}
            <span className="font-mono text-zinc-200">
              {formatSigned(statistics.total_change_abs, 2)} {variableMeta.unit}
            </span>{' '}
            {en ? `over ${yearsCount} years` : `за ${yearsCount} р.`}
          </div>
        </div>

        <div className="rounded-md bg-[#0c0c0f] border border-[#1f1f24] px-3 py-2.5">
          <div className="text-xs text-zinc-400">
            {en ? 'How reliable is the result' : 'Наскільки надійний результат'}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex items-center gap-1" aria-hidden="true">
              {steps.map((step, idx) => (
                <span
                  key={step}
                  className={`h-2 w-7 rounded-full ${
                    idx <= activeIndex ? stepColor : 'bg-[#2a2a32]'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-zinc-50">
              {en ? copy.en : copy.ua}
            </span>
          </div>
          <div
            className="text-xs text-zinc-400 mt-1"
            title={
              en
                ? 'p-value of the Mann-Kendall test: the chance to see such a trend in random noise. Below 0.05 is treated as reliable.'
                : 'p-значення тесту Манна-Кендалла: імовірність побачити такий тренд у випадковому шумі. Менше 0.05 вважається надійним.'
            }
          >
            {en ? copy.hintEn : copy.hintUa} (p {formatP(p).startsWith('<') ? '' : '= '}
            {formatP(p)})
          </div>
        </div>
      </div>

      {shift && shift.is_significant && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            {en ? 'Regime shift' : 'Зміна режиму'}
          </span>
          <span>
            {en
              ? `Around ${shift.change_point_year} the average level changed by `
              : `Близько ${shift.change_point_year} року середній рівень змінився на `}
            <span className="font-mono text-zinc-100">
              {formatSigned(shift.step_delta, 2)} {variableMeta.unit}
            </span>
          </span>
        </div>
      )}
    </section>
  );
};
