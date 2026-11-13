import React, { useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Globe,
  BookOpen,
  Satellite,
  ShieldAlert,
  Search,
  Layers,
  X,
  Upload,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import {
  AnalyzeCsvRequest,
  ClimateVariableCode,
  OfficialResourceCategory,
  OfficialResourceItem,
  RegionLocation,
  SeasonMode,
} from '../types/climate';
import {
  NASA_OFFICIAL_DISCLAIMER,
  OFFICIAL_RESOURCES_LIST,
  SAMPLE_CSV_TEMPLATES,
  SEASON_MODE_OPTIONS,
} from '../services/api';

type ResourceFilterTab = 'all' | OfficialResourceCategory;

interface OfficialResourcesHubProps {
  activeVariable: ClimateVariableCode;
  onSelectVariable?: (variable: ClimateVariableCode) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const OfficialResourcesHub: React.FC<OfficialResourcesHubProps> = ({
  activeVariable,
  onSelectVariable,
  isModal = false,
  onCloseModal,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<ResourceFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoryTabs: Array<{
    id: ResourceFilterTab;
    label: string;
    shortBadge: string;
    count: number;
  }> = [
    {
      id: 'all',
      label: 'Усі офіційні ресурси (13)',
      shortBadge: 'ALL 13',
      count: OFFICIAL_RESOURCES_LIST.length,
    },
    {
      id: 'nasa_data',
      label: '1. NASA & NOAA Data Resources',
      shortBadge: 'NASA / NOAA',
      count: OFFICIAL_RESOURCES_LIST.filter((r) => r.category === 'nasa_data')
        .length,
    },
    {
      id: 'partner_methodology',
      label: '2. Partner & Statistical Methodology',
      shortBadge: 'KNMI / STATS',
      count: OFFICIAL_RESOURCES_LIST.filter(
        (r) => r.category === 'partner_methodology'
      ).length,
    },
    {
      id: 'csa_resources',
      label: '3. CSA (Canadian Space Agency)',
      shortBadge: 'CSA / ASC',
      count: OFFICIAL_RESOURCES_LIST.filter(
        (r) => r.category === 'csa_resources'
      ).length,
    },
  ];

  const filteredResources = useMemo(() => {
    return OFFICIAL_RESOURCES_LIST.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.agency_badge.toLowerCase().includes(q) ||
        item.role_in_app.toLowerCase().includes(q) ||
        (item.supported_variables || []).some((v) =>
          v.toLowerCase().includes(q)
        )
      );
    });
  }, [activeCategory, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const groups: Array<{
      key: OfficialResourceCategory;
      title: string;
      subtitle: string;
      items: OfficialResourceItem[];
    }> = [
      {
        key: 'nasa_data',
        title: 'Категорія 1: NASA Data & Resources (NASA + NOAA)',
        subtitle:
          'Офіційні супутникові архіви NASA GSFC, GES DISC, LP DAAC AppEEARS, метеостанції NOAA CDO та наукова публікація NASA NTRS',
        items: filteredResources.filter((r) => r.category === 'nasa_data'),
      },
      {
        key: 'partner_methodology',
        title: 'Категорія 2: Space Agency Partner & Methodology Resources',
        subtitle:
          'Кліматична кореляція KNMI Climate Explorer та математична методологія перевірки статистичної значущості трендів',
        items: filteredResources.filter(
          (r) => r.category === 'partner_methodology'
        ),
      },
      {
        key: 'csa_resources',
        title: 'Категорія 3: CSA (Canadian Space Agency) Resources',
        subtitle:
          'Радарні дані RADARSAT Constellation Mission (RCM), відкритий геопортал Geo.ca, альтиметрія SWOT та SAR Python Tutorial',
        items: filteredResources.filter((r) => r.category === 'csa_resources'),
      },
    ];
    return groups.filter((g) => g.items.length > 0);
  }, [filteredResources]);

  const content = (
    <div className="rounded-2xl bg-ctp-mantle border border-ctp-surface0 p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-ctp-surface0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-ctp-blue/15 border border-ctp-blue/45 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-ctp-blue" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-ctp-text">
                Official NASA, NOAA, KNMI &amp; CSA Space Agency Resources Hub
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-ctp-green/15 text-ctp-green border border-ctp-green/40">
                13 VERIFIED AGENCY PORTALS
              </span>
            </div>
            <p className="text-xs text-ctp-subtext0 mt-0.5">
              Інтегрований каталог офіційних джерел супутникових даних, гідрологічних часових рядів, радарів SAR та статистичної методології челенджу
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ctp-subtext0 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук ресурсу або змінної..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-ctp-crust border border-ctp-surface0 text-xs text-ctp-text placeholder:text-ctp-subtext0 focus:outline-none focus:border-ctp-blue w-56"
            />
          </div>

          {isModal && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="p-2 rounded-xl bg-ctp-surface0 hover:bg-ctp-red/20 text-ctp-subtext1 hover:text-ctp-red border border-ctp-surface1 transition"
              title="Закрити вікно ресурсів"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categoryTabs.map((tab) => {
          const active = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 border ${
                active
                  ? 'bg-ctp-blue/20 text-ctp-blue border-ctp-blue/60 shadow-[0_0_14px_rgba(137,180,250,0.18)]'
                  : 'bg-ctp-crust text-ctp-subtext0 border-ctp-surface0 hover:text-ctp-text hover:border-ctp-surface1'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  active
                    ? 'bg-ctp-blue/25 text-ctp-text'
                    : 'bg-ctp-surface0 text-ctp-subtext0'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Structured 3-Category Resource Cards */}
      <div className="space-y-6">
        {groupedByCategory.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-ctp-lavender">
                {group.title}
              </h3>
              <span className="text-[11px] text-ctp-subtext0">
                {group.subtitle}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {group.items.map((res) => {
                const badgeColor =
                  res.category === 'nasa_data'
                    ? 'bg-ctp-blue/15 text-ctp-blue border-ctp-blue/40'
                    : res.category === 'csa_resources'
                    ? 'bg-ctp-teal/15 text-ctp-teal border-ctp-teal/40'
                    : 'bg-ctp-mauve/15 text-ctp-mauve border-ctp-mauve/40';

                return (
                  <div
                    key={res.id}
                    className="rounded-xl bg-ctp-crust/90 border border-ctp-surface0 hover:border-ctp-blue/55 p-4 flex flex-col justify-between gap-3 transition group"
                  >
                    <div className="space-y-2">
                      {/* Top Row: Number + Agency Badge + Gov Tag */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-ctp-surface0 text-[10px] font-mono font-bold text-ctp-subtext1">
                            #{String(res.number).padStart(2, '0')}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColor}`}
                          >
                            {res.agency_badge}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-ctp-subtext0">
                          {res.is_us_gov ? 'U.S. Gov' : 'Partner / Int’l'}
                        </span>
                      </div>

                      {/* Resource Title */}
                      <h4 className="text-sm font-bold text-ctp-text group-hover:text-ctp-blue transition leading-snug">
                        {res.title}
                      </h4>

                      {/* Role in Application */}
                      <p className="text-xs text-ctp-subtext1 leading-relaxed">
                        <span className="font-semibold text-ctp-lavender">
                          Роль у додатку:{' '}
                        </span>
                        {res.role_in_app}
                      </p>

                      {/* Supported Variables Interactive Pills */}
                      {res.supported_variables &&
                        res.supported_variables.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] font-mono text-ctp-subtext0 mr-1">
                              Змінні:
                            </span>
                            {res.supported_variables.map((vCode) => {
                              const isCurrent = activeVariable === vCode;
                              return (
                                <button
                                  key={vCode}
                                  type="button"
                                  onClick={() => {
                                    if (onSelectVariable) {
                                      onSelectVariable(
                                        vCode as ClimateVariableCode
                                      );
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition border ${
                                    isCurrent
                                      ? 'bg-ctp-green/20 text-ctp-green border-ctp-green/50'
                                      : 'bg-ctp-mantle text-ctp-subtext1 border-ctp-surface0 hover:border-ctp-blue hover:text-ctp-blue'
                                  }`}
                                  title={`Активувати змінну ${vCode} у додатку`}
                                >
                                  {vCode}
                                </button>
                              );
                            })}
                          </div>
                        )}
                    </div>

                    {/* External Link CTA */}
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 w-full py-2 px-3 rounded-lg bg-ctp-mantle hover:bg-ctp-blue/20 border border-ctp-surface0 hover:border-ctp-blue/50 text-xs font-mono font-semibold text-ctp-blue transition flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{res.url}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory Official NASA Disclaimer */}
      <div className="rounded-xl bg-ctp-crust border border-ctp-yellow/35 p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-ctp-yellow shrink-0 mt-0.5" />
        <p className="text-xs font-mono text-ctp-subtext1 leading-relaxed">
          {NASA_OFFICIAL_DISCLAIMER}
        </p>
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-6 bg-ctp-crust/80 backdrop-blur-md">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-[0_25px_70px_rgba(17,17,27,0.95)]">
        {content}
      </div>
    </div>
  );
};

interface ContextDeepLinksBarProps {
  variable: ClimateVariableCode;
  regionA: RegionLocation;
  startYear: number;
  endYear: number;
  onOpenResourcesModal: () => void;
}

export const ContextDeepLinksBar: React.FC<ContextDeepLinksBarProps> = ({
  variable,
  regionA,
  startYear,
  endYear,
  onOpenResourcesModal,
}) => {
  const bboxStr = `${(regionA.lon - 2.0).toFixed(2)},${(
    regionA.lat - 2.0
  ).toFixed(2)},${(regionA.lon + 2.0).toFixed(2)},${(
    regionA.lat + 2.0
  ).toFixed(2)}`;

  const giovanniUrl = `https://giovanni.gsfc.nasa.gov/giovanni/#service=TmAvMp&starttime=${startYear}-01-01T00:00:00Z&endtime=${endYear}-12-31T23:59:59Z&bbox=${bboxStr}`;
  const appeearsUrl = 'https://appeears.earthdatacloud.nasa.gov/';
  const knmiUrl = 'https://climexp.knmi.nl/';
  const gesDiscHydrologyUrl =
    'https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series';
  const noaaCdoUrl = 'https://www.ncei.noaa.gov/cdo-web/';
  const csaSwotRcmUrl =
    variable === 'RCM_SAR_BACKSCATTER'
      ? 'https://donnees-data.asc-csa.gc.ca/en/dataset/rcm'
      : 'https://www.asc-csa.gc.ca/eng/satellites/swot/';

  return (
    <div className="mt-4 pt-3.5 border-t border-ctp-surface0 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-mono text-ctp-subtext0">
        <Compass className="w-4 h-4 text-ctp-blue shrink-0" />
        <span>
          Зовнішня верифікація для{' '}
          <strong className="text-ctp-text">{variable}</strong> (
          {regionA.lat.toFixed(2)}°, {regionA.lon.toFixed(2)}° • {startYear}–
          {endYear}):
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={giovanniUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-blue/20 border border-ctp-blue/40 text-xs font-mono font-semibold text-ctp-blue transition flex items-center gap-1.5"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Verify in NASA Giovanni</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={appeearsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-mauve/20 border border-ctp-mauve/40 text-xs font-mono font-semibold text-ctp-mauve transition flex items-center gap-1.5"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Explore in AppEEARS</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={knmiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-teal/20 border border-ctp-teal/40 text-xs font-mono font-semibold text-ctp-teal transition flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Check in KNMI Climate Explorer</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={gesDiscHydrologyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-sapphire/20 border border-ctp-surface1 text-xs font-mono text-ctp-subtext1 hover:text-ctp-sapphire transition flex items-center gap-1.5"
        >
          <span>GES DISC Hydrology</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={noaaCdoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-green/20 border border-ctp-surface1 text-xs font-mono text-ctp-subtext1 hover:text-ctp-green transition flex items-center gap-1.5"
        >
          <span>NOAA CDO</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={csaSwotRcmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-ctp-crust hover:bg-ctp-yellow/20 border border-ctp-surface1 text-xs font-mono text-ctp-subtext1 hover:text-ctp-yellow transition flex items-center gap-1.5"
        >
          <span>CSA SWOT / RCM</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <button
          type="button"
          onClick={onOpenResourcesModal}
          className="px-3 py-1.5 rounded-xl bg-ctp-surface0 hover:bg-ctp-surface1 border border-ctp-surface1 text-xs font-mono font-bold text-ctp-lavender transition"
        >
          Усі 13 ресурсів
        </button>
      </div>
    </div>
  );
};

interface CsvImporterModalProps {
  isOpen: boolean;
  loading: boolean;
  defaultSeasonMode: SeasonMode;
  onClose: () => void;
  onRunCsvAnalysis: (request: AnalyzeCsvRequest) => Promise<void>;
}

export const CsvImporterModal: React.FC<CsvImporterModalProps> = ({
  isOpen,
  loading,
  defaultSeasonMode,
  onClose,
  onRunCsvAnalysis,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [datasetName, setDatasetName] = useState<string>(
    SAMPLE_CSV_TEMPLATES[0].datasetName
  );
  const [variableCode, setVariableCode] = useState<string>(
    SAMPLE_CSV_TEMPLATES[0].variableCode
  );
  const [unit, setUnit] = useState<string>(SAMPLE_CSV_TEMPLATES[0].unit);
  const [seasonMode, setSeasonMode] = useState<SeasonMode>(defaultSeasonMode);
  const [lat, setLat] = useState<number>(SAMPLE_CSV_TEMPLATES[0].lat);
  const [lon, setLon] = useState<number>(SAMPLE_CSV_TEMPLATES[0].lon);
  const [csvText, setCsvText] = useState<string>(
    SAMPLE_CSV_TEMPLATES[0].csvText
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setLocalError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      if (!content.trim()) {
        setLocalError('Обраний CSV-файл порожній.');
        return;
      }
      setCsvText(content);
      setUploadedFileName(file.name);
      const cleanTitle = file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ');
      setDatasetName(cleanTitle || 'Imported NASA/NOAA CSV');
    };
    reader.onerror = () => {
      setLocalError('Не вдалося прочитати CSV-файл.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!csvText.trim()) {
      setLocalError('Вставте або завантажте CSV-дані з колонками Date та Value.');
      return;
    }
    try {
      await onRunCsvAnalysis({
        csv_text: csvText,
        dataset_name: datasetName.trim() || 'Imported NASA/NOAA CSV Series',
        variable_code: variableCode.trim() || 'SEAWIFS_CHLA',
        unit: unit.trim() || 'units',
        season_mode: seasonMode,
        lat,
        lon,
      });
      onClose();
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error
          ? err.message
          : 'Помилка аналізу CSV-файлу. Перевірте формат колонок (Date, Value).'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-6 bg-ctp-crust/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-ctp-base border border-ctp-surface1 shadow-[0_25px_70px_rgba(17,17,27,0.95)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-ctp-mantle border-b border-ctp-surface0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ctp-green/15 border border-ctp-green/45 flex items-center justify-center text-ctp-green">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-ctp-text">
                Import CSV from NASA Giovanni / AppEEARS / GES DISC / NOAA CDO
              </h2>
              <p className="text-xs text-ctp-subtext0">
                Завантажте будь-який CSV-файл із колонками дати (Date / Year / time) та значення (Value / data) для автоматичної десезоналізації, t-тесту, Манна-Кендалла, 95% CI та Time-to-Significance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-ctp-surface0 hover:bg-ctp-red/20 text-ctp-subtext1 hover:text-ctp-red border border-ctp-surface1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {/* Quick Sample Templates from Official Portals */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ctp-subtext0">
              Швидкі еталонні CSV-шаблони з офіційних порталів (1-клік тест):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SAMPLE_CSV_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setDatasetName(tpl.datasetName);
                    setVariableCode(tpl.variableCode);
                    setUnit(tpl.unit);
                    setSeasonMode(tpl.seasonMode);
                    setLat(tpl.lat);
                    setLon(tpl.lon);
                    setCsvText(tpl.csvText);
                    setUploadedFileName(`${tpl.id}.csv`);
                    setLocalError(null);
                  }}
                  className="p-2.5 rounded-xl bg-ctp-crust hover:bg-ctp-surface0 border border-ctp-surface0 hover:border-ctp-blue/50 text-left transition space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-ctp-blue font-bold">
                    <span>{tpl.sourcePortal}</span>
                    <span>{tpl.variableCode}</span>
                  </div>
                  <div className="text-xs font-semibold text-ctp-text truncate">
                    {tpl.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Drag-and-Drop CSV Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-ctp-surface1 hover:border-ctp-green/60 rounded-2xl p-5 bg-ctp-crust/70 hover:bg-ctp-mantle transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <Upload className="w-6 h-6 text-ctp-green" />
            <div className="text-xs sm:text-sm font-bold text-ctp-text">
              Перетягніть сюди CSV-файл із Giovanni / AppEEARS / NOAA CDO або натисніть для вибору
            </div>
            <div className="text-[11px] font-mono text-ctp-subtext0">
              Підтримуються колонки: Date, Year, time, timestamp + Value, data, mean (коментарі # ігноруються автоматично)
            </div>
            {uploadedFileName && (
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ctp-green/15 text-ctp-green border border-ctp-green/40 text-xs font-mono font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Активний файл: {uploadedFileName}</span>
              </div>
            )}
          </div>

          {/* Metadata Configuration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ctp-subtext0 mb-1">
                Назва датасету / ряду
              </label>
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-ctp-crust border border-ctp-surface0 text-xs text-ctp-text focus:outline-none focus:border-ctp-blue"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ctp-subtext0 mb-1">
                Код змінної (NASA / CSA)
              </label>
              <input
                type="text"
                value={variableCode}
                onChange={(e) => setVariableCode(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-ctp-crust border border-ctp-surface0 text-xs font-mono text-ctp-text focus:outline-none focus:border-ctp-blue"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ctp-subtext0 mb-1">
                Одиниця вимірювання
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-ctp-crust border border-ctp-surface0 text-xs font-mono text-ctp-text focus:outline-none focus:border-ctp-blue"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ctp-subtext0 mb-1">
                Сезонний фільтр (Season Mode)
              </label>
              <select
                value={seasonMode}
                onChange={(e) => setSeasonMode(e.target.value as SeasonMode)}
                className="w-full px-3 py-1.5 rounded-xl bg-ctp-crust border border-ctp-surface0 text-xs font-mono text-ctp-text focus:outline-none focus:border-ctp-blue"
              >
                {SEASON_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.shortLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Raw CSV Preview / Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono uppercase text-ctp-subtext0">
                Вміст CSV (Date / Year / time, Value / data):
              </label>
              <span className="text-[10px] font-mono text-ctp-subtext0">
                {csvText.split(/\r?\n/).filter((l) => l.trim()).length} рядків
              </span>
            </div>
            <textarea
              rows={7}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 rounded-xl bg-ctp-crust border border-ctp-surface0 text-xs font-mono text-ctp-text focus:outline-none focus:border-ctp-blue"
              placeholder="Date,Value&#10;2002-07,0.24&#10;2003-07,0.28..."
            />
          </div>

          {localError && (
            <div className="p-3 rounded-xl bg-ctp-red/15 border border-ctp-red/50 text-xs font-mono text-ctp-red">
              {localError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ctp-surface0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-ctp-surface0 hover:bg-ctp-surface1 text-xs font-semibold text-ctp-subtext1 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-ctp-green to-ctp-teal hover:brightness-110 text-ctp-crust font-extrabold text-xs tracking-wide transition flex items-center gap-2 shadow-[0_0_20px_rgba(166,227,161,0.3)]"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? 'Обчислення тренду та p-value...'
                  : 'Run Statistical Trend Engine on CSV'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
