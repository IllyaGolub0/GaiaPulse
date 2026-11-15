import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../i18n/translations';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const en = lang === 'en';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const options: { mode: ThemeMode; label: string; subLabel: string; icon: React.ReactNode }[] = [
    {
      mode: 'system',
      label: en ? 'System default' : 'Як на пристрої',
      subLabel: en ? 'Auto' : 'Авто',
      icon: <Monitor className="w-4 h-4" />,
    },
    {
      mode: 'light',
      label: en ? 'Light theme' : 'Світла тема',
      subLabel: en ? 'Light' : 'Світла',
      icon: <Sun className="w-4 h-4" />,
    },
    {
      mode: 'dark',
      label: en ? 'Dark theme' : 'Темна тема',
      subLabel: en ? 'Dark' : 'Темна',
      icon: <Moon className="w-4 h-4" />,
    },
  ];

  const currentIcon =
    theme === 'system' ? (
      <Monitor className="w-4 h-4 md:w-5 md:h-5" />
    ) : resolvedTheme === 'light' ? (
      <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-300" />
    ) : (
      <Moon className="w-4 h-4 md:w-5 md:h-5 text-sky-200" />
    );

  const tooltipText = en
    ? `Theme: ${
        theme === 'system'
          ? `System (${resolvedTheme})`
          : theme === 'light'
          ? 'Light'
          : 'Dark'
      }`
    : `Тема: ${
        theme === 'system'
          ? `Системна (${resolvedTheme === 'light' ? 'світла' : 'темна'})`
          : theme === 'light'
          ? 'Світла'
          : 'Темна'
      }`;

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        title={tooltipText}
        className="h-9 md:h-11 px-2.5 md:px-3 rounded-lg bg-black/35 hover:bg-black/60 text-white font-nav uppercase text-base xl:text-lg transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-white/40"
      >
        {currentIcon}
        <span className="hidden xl:inline text-xs font-mono font-medium opacity-90">
          {theme === 'system'
            ? en
              ? 'Auto'
              : 'Авто'
            : theme === 'light'
            ? en
              ? 'Light'
              : 'Світла'
            : en
            ? 'Dark'
            : 'Темна'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg bg-[#111115] border border-[#27272a] shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1 text-sm font-sans">
          <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 border-b border-[#24242b]">
            {en ? 'Appearance' : 'Оформлення'}
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  setTheme(opt.mode);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center justify-between text-left transition ${
                  isSelected
                    ? 'bg-sky-500/15 text-sky-300 font-medium'
                    : 'text-zinc-200 hover:bg-[#1a1a22]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isSelected ? 'text-sky-400' : 'text-zinc-400'}>
                    {opt.icon}
                  </span>
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
