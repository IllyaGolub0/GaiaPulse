import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface TourStep {
  /** Value of the data-tour attribute to highlight; omit for a centered step. */
  target?: string;
  title: string;
  body: string;
  /** Runs when the step becomes active: use it to demonstrate a feature. */
  onEnter?: () => void;
}

interface GuidedTourProps {
  steps: TourStep[];
  stepIndex: number;
  lang: 'ua' | 'en';
  onStepChange: (index: number) => void;
  onClose: () => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const CARD_W = 360;
const GAP = 14;

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const node of Array.from(nodes)) {
    const r = node.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return node;
  }
  return null;
}

/**
 * Step-by-step product tour: dims the page, spotlights one element per step
 * and shows a card with the explanation. Steps may change the app state to
 * demonstrate a feature.
 */
export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  stepIndex,
  lang,
  onStepChange,
  onClose,
}) => {
  const step = steps[stepIndex];
  const en = lang === 'en';
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [box, setBox] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardH, setCardH] = useState<number>(220);
  const isLast = stepIndex === steps.length - 1;

  // Run the step's demo action and bring the target into view
  useEffect(() => {
    step?.onEnter?.();
    const timer = window.setTimeout(() => {
      findTarget(step?.target)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }, 120);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Track the target rectangle: the layout keeps changing while data loads
  useEffect(() => {
    const measure = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const el = findTarget(step?.target);
      if (!el) {
        setBox(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, window.innerHeight);
      setBox((prev) => {
        const next = {
          top,
          left: r.left,
          width: r.width,
          height: Math.max(bottom - top, 0),
        };
        if (
          prev &&
          Math.abs(prev.top - next.top) < 1 &&
          Math.abs(prev.left - next.left) < 1 &&
          Math.abs(prev.width - next.width) < 1 &&
          Math.abs(prev.height - next.height) < 1
        ) {
          return prev;
        }
        return next;
      });
    };
    measure();
    const interval = window.setInterval(measure, 200);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', measure);
    };
  }, [stepIndex, step?.target]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [stepIndex, viewport.w, step?.body]);

  // Keyboard: arrows to move, Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLast) onClose();
        else onStepChange(stepIndex + 1);
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        onStepChange(stepIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepIndex, isLast, onClose, onStepChange]);

  if (!step) return null;

  const narrow = viewport.w < 768;
  const cardW = narrow ? viewport.w - 24 : CARD_W;
  let cardStyle: React.CSSProperties;

  if (!box) {
    cardStyle = {
      top: Math.max((viewport.h - cardH) / 2, 12),
      left: (viewport.w - cardW) / 2,
      width: cardW,
    };
  } else if (narrow) {
    // Dock to the half of the screen the target does not occupy
    const targetCenter = box.top + box.height / 2;
    cardStyle =
      targetCenter > viewport.h / 2
        ? { top: 60, left: 12, width: cardW }
        : { bottom: 68, left: 12, width: cardW };
  } else {
    const spaceRight = viewport.w - (box.left + box.width);
    const spaceLeft = box.left;
    const spaceBelow = viewport.h - (box.top + box.height);
    const spaceAbove = box.top;
    const clampTop = (v: number) =>
      Math.min(Math.max(v, 12), Math.max(viewport.h - cardH - 12, 12));
    const clampLeft = (v: number) =>
      Math.min(Math.max(v, 12), Math.max(viewport.w - cardW - 12, 12));

    if (spaceBelow >= cardH + GAP + 12) {
      cardStyle = {
        top: box.top + box.height + GAP,
        left: clampLeft(box.left + box.width / 2 - cardW / 2),
        width: cardW,
      };
    } else if (spaceAbove >= cardH + GAP + 12) {
      cardStyle = {
        top: box.top - cardH - GAP,
        left: clampLeft(box.left + box.width / 2 - cardW / 2),
        width: cardW,
      };
    } else if (spaceRight >= cardW + GAP + 12) {
      cardStyle = {
        top: clampTop(box.top + 24),
        left: box.left + box.width + GAP,
        width: cardW,
      };
    } else if (spaceLeft >= cardW + GAP + 12) {
      cardStyle = {
        top: clampTop(box.top + 24),
        left: box.left - cardW - GAP,
        width: cardW,
      };
    } else {
      // Target fills the screen: place the card inside its lower right corner
      cardStyle = {
        top: clampTop(box.top + box.height - cardH - 24),
        left: clampLeft(box.left + box.width - cardW - 24),
        width: cardW,
      };
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2800]"
      role="dialog"
      aria-modal="true"
      aria-label={en ? 'Guided tour' : 'Гід по сайту'}
    >
      {/* Click shield: the page under the tour is not interactive */}
      <div className="absolute inset-0" />

      {box ? (
        <div
          className="absolute rounded-lg border-2 border-[#597B8A] pointer-events-none transition-all duration-200"
          style={{
            top: box.top - PAD,
            left: box.left - PAD,
            width: box.width + PAD * 2,
            height: box.height + PAD * 2,
            boxShadow: isLight
              ? '0 0 0 9999px rgba(15, 23, 42, 0.45)'
              : '0 0 0 9999px rgba(0, 0, 0, 0.66)',
          }}
        />
      ) : (
        <div
          className={`absolute inset-0 pointer-events-none ${
            isLight ? 'bg-slate-900/40' : 'bg-black/70'
          }`}
        />
      )}

      <div
        ref={cardRef}
        className={`absolute rounded-xl shadow-2xl p-4 space-y-3 transition-all duration-200 border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-[#101014] border-[#34343e] text-zinc-100'
        }`}
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs text-[#597B8A] font-semibold tracking-wide">
              {en ? 'Step' : 'Крок'} {stepIndex + 1} {en ? 'of' : 'з'}{' '}
              {steps.length}
            </div>
            <h2
              className={`text-base font-semibold leading-snug ${
                isLight ? 'text-slate-900' : 'text-zinc-50'
              }`}
            >
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={en ? 'Close the tour' : 'Закрити гід'}
            className={`shrink-0 w-9 h-9 -mt-1 -mr-1 rounded-md flex items-center justify-center transition ${
              isLight
                ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'
                : 'hover:bg-[#1f1f24] text-zinc-300 hover:text-zinc-50'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p
          className={`text-sm leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-zinc-200'
          }`}
        >
          {step.body}
        </p>

        <div className="flex items-center gap-1" aria-hidden="true">
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 flex-1 rounded-full ${
                idx <= stepIndex
                  ? 'bg-[#597B8A]'
                  : isLight
                  ? 'bg-slate-200'
                  : 'bg-[#2a2a32]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onStepChange(stepIndex - 1)}
            disabled={stepIndex === 0}
            className={`h-10 md:h-9 px-3 rounded-md border text-sm transition inline-flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-[#2a2a32] text-zinc-200 hover:text-zinc-50 hover:border-zinc-500'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{en ? 'Back' : 'Назад'}</span>
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onClose() : onStepChange(stepIndex + 1))}
            autoFocus
            className="h-10 md:h-9 px-4 rounded-md bg-[#597B8A] hover:bg-[#486775] text-white text-sm font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>
              {isLast ? (en ? 'Finish' : 'Завершити') : en ? 'Next' : 'Далі'}
            </span>
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
