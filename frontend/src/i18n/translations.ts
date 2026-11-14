import React, { createContext, useContext, useState, useEffect } from 'react';
import { BiomeType, SeasonMode } from '../types/climate';

export type Language = 'ua' | 'en';

export interface Translations {
  // Brand & Sidebar
  appTitle: string;
  appSubtitle: string;
  workspacesHeader: string;
  keysHint: string;
  quickCasesHeader: string;
  oneClickBadge: string;
  liveTelemetry: string;
  eonetLive: string;
  eonetCache: string;
  toggleSidebarTitle: string;
  openPhenomenaTitle: string;

  // Navigation items
  navSplitLabel: string;
  navSplitSub: string;
  navMapLabel: string;
  navMapSub: string;
  navAnalyticsLabel: string;
  navAnalyticsSub: string;
  navPhenomenaLabel: string;
  navPhenomenaSub: string;
  navCsvLabel: string;
  navCsvSub: string;
  navResourcesLabel: string;
  navResourcesSub: string;

  // Top Header & Actions
  significantBadge: string;
  emergingBadge: string;
  yrsNeeded: string;
  perDecadeShort: string;
  verdictTooltip: string;
  fetchScenariosBtn: string;
  importCsvBtn: string;
  languageToggleTitle: string;

  // Split Studio Zone Collapse / Expand Bar
  layoutToolbarLabel: string;
  layoutBalanced: string;
  layoutWideGlobe: string;
  layoutWideChart: string;
  layoutOnlyGlobe: string;
  layoutOnlyChart: string;
  collapseGlobeBtn: string;
  expandGlobeBtn: string;
  collapseChartBtn: string;
  expandChartBtn: string;
  maximizeGlobeTitle: string;
  restoreSplitTitle: string;
  maximizeChartTitle: string;
  globeCollapsedBanner: string;
  chartCollapsedBanner: string;
  globeZoneTitle: string;
  inspectorZoneTitle: string;

  // Mission Control Panel
  missionParamsTitle: string;
  singleRegionBtn: string;
  dipoleModeBtn: string;
  manualCoordsTitle: string;
  reAnalyzeBtn: string;
  collapseBtn: string;
  expandParamsBtn: string;
  regionACoordsTitle: string;
  regionACoordsHint: string;
  regionANamePlaceholder: string;
  regionBCoordsTitle: string;
  regionBCoordsHint: string;
  regionBNamePlaceholder: string;
  biomeLabel: string;
  satelliteVarLabel: string;
  of13Label: string;
  seasonalFilterLabel: string;
  periodLabel: string;
  yearsShort: string;

  // Inspector Dock
  tabCharts: string;
  tabVerdict: string;
  tabGuide: string;
  fullLabBtn: string;
  fullLabTitle: string;
  calculatingMsg: string;
  provenTrend: string;
  noiseVariability: string;
  per10Yrs: string;
  timeToSigLabel: string;
  alreadyReached: string;
  activeCaseBadge: string;
  switchToSeasonBtn: string;
  studentTipLabel: string;
  customPointHint: string;
  howToUseTitle: string;
  howToUseTip1: string;
  howToUseTip2: string;
  howToUseTip3: string;

  // Floating Map HUD
  liveMapHudTitle: string;
  splitViewBtn: string;
  fullChartsBtn: string;

  // Annual Table
  annualTableTitle: string;
  yearsCountLabel: string;
  peakLabel: string;
  minLabel: string;
  colYear: string;
  colRegionA: string;
  colAnomalyA: string;
  colSensTrendA: string;
  colCiBand: string;
  colRegionB: string;
  colAnomalyB: string;

  // VerdictCard
  verdictRegionLabel: string;
  verdictSeasonLabel: string;
  verdictSignificant: string;
  verdictNotYetSig: string;
  verdictRateTitle: string;
  verdictPerDecade: string;
  verdictPerYear: string;
  verdictSlopeCi: string;
  verdictSnrLabel: string;
  verdictTotalDelta: string;
  verdictTtsTitle: string;
  verdictSummaryTitle: string;
  dipoleDetectedBadge: string;
  crossRegionBadge: string;
  pearsonLabel: string;
  trendContrastLabel: string;
  contrastOpposite: string;
  contrastSync: string;

  // TrendCharts
  chartTabTimeSeries: string;
  chartTabStripes: string;
  chartTabDecomp: string;
  chartAnomaliesToggle: string;
  chartAbsoluteToggle: string;
  chartRegionABtn: string;
  chartRegionBBtn: string;
  chartTitleDivergence: string;
  chartTitleDynamics: string;
  chartCiBandLegend: string;
  chartObsLegend: string;
  chartLoessLegend: string;
  chartSensLegend: string;

  // ContextDeepLinksBar
  externalVerifyLabel: string;
  all13ResourcesBtn: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ua: {
    appTitle: 'Trend Detective',
    appSubtitle: 'NASA Space Apps 2026',
    workspacesHeader: 'Робочі простори',
    keysHint: 'Клавіші 1–6',
    quickCasesHeader: 'Швидкі кейси NASA / CSA',
    oneClickBadge: '1-Клік',
    liveTelemetry: 'ЖИВА ТЕЛЕМЕТРІЯ',
    eonetLive: 'EONET LIVE',
    eonetCache: 'CACHE',
    toggleSidebarTitle: 'Згорнути / Розгорнути бічну панель (клавіша [ )',
    openPhenomenaTitle: 'Відкрити каталог феноменів NASA',

    navSplitLabel: 'Split Studio',
    navSplitSub: 'Глобус + Графіки поруч',
    navMapLabel: 'Full Geo-Stage',
    navMapSub: '2D Карта / 3D Глобус + HUD',
    navAnalyticsLabel: 'Statistical Lab',
    navAnalyticsSub: 'Вердикти, STL та таблиця',
    navPhenomenaLabel: 'Phenomena & EONET',
    navPhenomenaSub: 'Кейси Екера, CSA та події',
    navCsvLabel: 'CSV Time-Series Lab',
    navCsvSub: 'Імпорт Giovanni / AppEEARS',
    navResourcesLabel: 'Official Resources',
    navResourcesSub: '13 порталів NASA / CSA / NOAA',

    significantBadge: 'ЗНАЧУЩИЙ ТРЕНД',
    emergingBadge: 'ФОРМУЄТЬСЯ',
    yrsNeeded: 'р.',
    perDecadeShort: '/дек',
    verdictTooltip: 'Натисніть для перегляду статистичного доказу',
    fetchScenariosBtn: 'Феномени та EONET',
    importCsvBtn: 'Імпорт CSV',
    languageToggleTitle: 'Перемкнути мову інтерфейсу (Українська / English)',

    layoutToolbarLabel: 'Розмір зон:',
    layoutBalanced: '50/50 Поруч',
    layoutWideGlobe: 'Великий Глобус (70/30)',
    layoutWideChart: 'Великий Графік (35/65)',
    layoutOnlyGlobe: 'На весь екран: Глобус',
    layoutOnlyChart: 'На весь екран: Графік',
    collapseGlobeBtn: 'Згорнути глобус',
    expandGlobeBtn: 'Розгорнути глобус',
    collapseChartBtn: 'Згорнути графік',
    expandChartBtn: 'Розгорнути графік',
    maximizeGlobeTitle: 'Розгорнути глобус/карту на всю ширину (згорнути графік)',
    restoreSplitTitle: 'Повернути двоколонковий режим (Глобус + Графік поруч)',
    maximizeChartTitle: 'Розгорнути графік та аналітику на всю ширину (згорнути глобус)',
    globeCollapsedBanner: '2D Карта / 3D Глобус згорнуто — Графік розгорнуто на всю ширину',
    chartCollapsedBanner: 'Графік та Інспектор згорнуто — Глобус/Карту розгорнуто на всю ширину',
    globeZoneTitle: 'Інтерактивна 2D Карта та 3D Глобус Землі',
    inspectorZoneTitle: 'Графіки тренду, Статистичний Вердикт та Гід',

    missionParamsTitle: 'Параметри місії',
    singleRegionBtn: 'Один регіон',
    dipoleModeBtn: 'Диполь (A проти B)',
    manualCoordsTitle: 'Ручне введення точних координат Lat / Lon',
    reAnalyzeBtn: 'Оновити аналіз',
    collapseBtn: 'Згорнути',
    expandParamsBtn: 'Параметри',
    regionACoordsTitle: 'Координати Регіону A',
    regionACoordsHint: 'Клік на мапі або ручний ввід',
    regionANamePlaceholder: 'Назва точки А',
    regionBCoordsTitle: 'Координати Регіону B (Диполь)',
    regionBCoordsHint: 'Другий полюс порівняння',
    regionBNamePlaceholder: 'Назва точки B',
    biomeLabel: 'Біом:',
    satelliteVarLabel: 'Супутникова змінна NASA / CSA',
    of13Label: 'з 13',
    seasonalFilterLabel: 'Сезонний зріз (Seasonal Filter)',
    periodLabel: 'Період',
    yearsShort: 'р.',

    tabCharts: 'Графіки і Тренд',
    tabVerdict: 'Вердикт і Доказ',
    tabGuide: 'Кейс і Гід',
    fullLabBtn: 'Весь екран',
    fullLabTitle: 'Відкрити у повній статистичній лабораторії',
    calculatingMsg: 'Обчислення тренду Сена та p-value...',
    provenTrend: 'Доведений тренд',
    noiseVariability: 'Шум / Мінливість',
    per10Yrs: 'за 10 р.',
    timeToSigLabel: 'Час до p < 0.05',
    alreadyReached: '0 р. (Вже є)',
    activeCaseBadge: 'Активний кейс',
    switchToSeasonBtn: 'Увімкнути сезон',
    studentTipLabel: 'Підказка для студента: ',
    customPointHint:
      'Ви досліджуєте власну точку на карті. Спробуйте перемикати сезонні зрізи (Raw, JJA, DJF, Deseasonalized), щоб перевірити, чи ховається статистично значущий тренд в окремому сезоні.',
    howToUseTitle: 'Як користуватися Workbench-інтерфейсом:',
    howToUseTip1:
      'Клікайте будь-де на мапі зліва — графік та статистичний вердикт справа оновлюються миттєво без прокрутки сторінки.',
    howToUseTip2:
      'Використовуйте кнопки «Згорнути глобус» або «Згорнути графік» над панелями, щоб розгорнути потрібну зону на весь екран.',
    howToUseTip3:
      'Перемикайтеся між вкладками лівого меню (клавіші 1–6) для повноекранної карти, лабораторії таблиць або каталогу 13 ресурсів NASA/CSA.',

    liveMapHudTitle: 'Жива телеметрія карти',
    splitViewBtn: 'Split-режим',
    fullChartsBtn: 'Усі графіки',

    annualTableTitle: 'Матриця річних супутникових спостережень та аномалій',
    yearsCountLabel: 'років',
    peakLabel: 'Пік',
    minLabel: 'Мін',
    colYear: 'Рік',
    colRegionA: 'Регіон A',
    colAnomalyA: 'Аномалія A',
    colSensTrendA: 'Тренд Сена A',
    colCiBand: '95% Довірчий інтервал',
    colRegionB: 'Регіон B',
    colAnomalyB: 'Аномалія B',

    verdictRegionLabel: 'РЕГІОН',
    verdictSeasonLabel: 'Сезон',
    verdictSignificant: 'ЗНАЧУЩИЙ ТРЕНД',
    verdictNotYetSig: 'ЩЕ НЕ ЗНАЧУЩИЙ (ШУМ)',
    verdictRateTitle: 'Швидкість зміни (Нахил Сена за декаду та рік)',
    verdictPerDecade: 'декаду',
    verdictPerYear: 'рік',
    verdictSlopeCi: '95% CI нахилу',
    verdictSnrLabel: 'Сигнал / Шум (SNR)',
    verdictTotalDelta: 'Сумарний зсув (Δ)',
    verdictTtsTitle: 'Time-to-Significance Calculator (Поріг p < 0.05)',
    verdictSummaryTitle: 'Вердикт Кліматичного Детектива',
    dipoleDetectedBadge: 'Виявлено кліматичний диполь (Протилежні тренди)',
    crossRegionBadge: 'Крос-регіональне порівняння',
    pearsonLabel: 'Кореляція Пірсона (r)',
    trendContrastLabel: 'Контраст Трендів',
    contrastOpposite: 'ПРОТИЛЕЖНІ',
    contrastSync: 'СИНХРОННІ',

    chartTabTimeSeries: 'Часовий ряд + Тренд Сена (95% CI)',
    chartTabStripes: 'Climate Stripes (Теплова шкала аномалій)',
    chartTabDecomp: 'STL-Декомпозиція (Тренд / Сезонність / Шум)',
    chartAnomaliesToggle: 'Аномалії («Ножиці трендів»)',
    chartAbsoluteToggle: 'Абсолютні',
    chartRegionABtn: 'Регіон А',
    chartRegionBBtn: 'Регіон Б',
    chartTitleDivergence: 'Дивергенція аномалій («Ножиці трендів»)',
    chartTitleDynamics: 'Динаміка показника та Лінія Тренду Сена',
    chartCiBandLegend: '95% Довірчий інтервал',
    chartObsLegend: 'Спостереження',
    chartLoessLegend: 'LOESS згладжений',
    chartSensLegend: 'Лінія Сена',

    externalVerifyLabel: 'Зовнішня верифікація для',
    all13ResourcesBtn: 'Усі 13 ресурсів',
  },

  en: {
    appTitle: 'Trend Detective',
    appSubtitle: 'NASA Space Apps 2026',
    workspacesHeader: 'Workspaces',
    keysHint: 'Keys 1–6',
    quickCasesHeader: 'Quick NASA / CSA Cases',
    oneClickBadge: '1-Click',
    liveTelemetry: 'LIVE TELEMETRY',
    eonetLive: 'EONET LIVE',
    eonetCache: 'CACHE',
    toggleSidebarTitle: 'Collapse / Expand Sidebar (Key [ )',
    openPhenomenaTitle: 'Open NASA Phenomena Catalog',

    navSplitLabel: 'Split Studio',
    navSplitSub: 'Globe + Charts Side-by-Side',
    navMapLabel: 'Full Geo-Stage',
    navMapSub: '2D Map / 3D Globe + HUD',
    navAnalyticsLabel: 'Statistical Lab',
    navAnalyticsSub: 'Verdicts, STL & Data Matrix',
    navPhenomenaLabel: 'Phenomena & EONET',
    navPhenomenaSub: 'Acker Cases, CSA & Live Events',
    navCsvLabel: 'CSV Time-Series Lab',
    navCsvSub: 'Import Giovanni / AppEEARS',
    navResourcesLabel: 'Official Resources',
    navResourcesSub: '13 NASA / CSA / NOAA Portals',

    significantBadge: 'SIGNIFICANT',
    emergingBadge: 'EMERGING',
    yrsNeeded: 'yrs',
    perDecadeShort: '/dec',
    verdictTooltip: 'Click to inspect statistical proof',
    fetchScenariosBtn: 'Fetch Scenarios & EONET',
    importCsvBtn: 'Import CSV',
    languageToggleTitle: 'Switch interface language (Ukrainian / English)',

    layoutToolbarLabel: 'Zone Size:',
    layoutBalanced: '50/50 Split',
    layoutWideGlobe: 'Large Globe (70/30)',
    layoutWideChart: 'Large Chart (35/65)',
    layoutOnlyGlobe: 'Full Width: Globe',
    layoutOnlyChart: 'Full Width: Chart',
    collapseGlobeBtn: 'Collapse Globe',
    expandGlobeBtn: 'Expand Globe',
    collapseChartBtn: 'Collapse Chart',
    expandChartBtn: 'Expand Chart',
    maximizeGlobeTitle: 'Maximize Globe/Map to full width (collapse chart)',
    restoreSplitTitle: 'Restore side-by-side Split View (Globe + Chart)',
    maximizeChartTitle: 'Maximize Chart & Analytics to full width (collapse globe)',
    globeCollapsedBanner: '2D Map / 3D Globe collapsed — Chart expanded to full width',
    chartCollapsedBanner: 'Chart & Inspector collapsed — Globe/Map expanded to full width',
    globeZoneTitle: 'Interactive 2D Map & 3D Earth Globe',
    inspectorZoneTitle: 'Trend Charts, Statistical Verdict & Guide',

    missionParamsTitle: 'Mission Parameters',
    singleRegionBtn: 'Single Region',
    dipoleModeBtn: 'Dipole (A vs B)',
    manualCoordsTitle: 'Manually enter exact Lat / Lon coordinates',
    reAnalyzeBtn: 'Re-Analyze',
    collapseBtn: 'Collapse',
    expandParamsBtn: 'Parameters',
    regionACoordsTitle: 'Region A Coordinates',
    regionACoordsHint: 'Click map or enter manually',
    regionANamePlaceholder: 'Region A Name',
    regionBCoordsTitle: 'Region B Coordinates (Dipole)',
    regionBCoordsHint: 'Counterpart comparison pole',
    regionBNamePlaceholder: 'Region B Name',
    biomeLabel: 'Biome:',
    satelliteVarLabel: 'NASA / CSA Satellite Variable',
    of13Label: 'of 13',
    seasonalFilterLabel: 'Seasonal Filter Slice',
    periodLabel: 'Time Window',
    yearsShort: 'yrs',

    tabCharts: 'Charts & Trend',
    tabVerdict: 'Verdict & Proof',
    tabGuide: 'Case & Guide',
    fullLabBtn: 'Full Lab',
    fullLabTitle: 'Open in full-width Statistical Lab',
    calculatingMsg: "Computing Sen's Slope and Mann-Kendall p-value...",
    provenTrend: 'Statistically Proven',
    noiseVariability: 'Noise / Variability',
    per10Yrs: 'per 10 yrs',
    timeToSigLabel: 'Time to p < 0.05',
    alreadyReached: '0 yrs (Reached)',
    activeCaseBadge: 'Active Case',
    switchToSeasonBtn: 'Switch to',
    studentTipLabel: 'Student Note: ',
    customPointHint:
      'You are exploring a custom location. Try switching seasonal slices (Raw, JJA, DJF, Deseasonalized) to test whether a statistically significant trend emerges in a specific season.',
    howToUseTitle: 'How to use the Workbench Studio:',
    howToUseTip1:
      'Click anywhere on the map/globe on the left — the Plotly chart and statistical verdict on the right update immediately without scrolling.',
    howToUseTip2:
      'Use the "Collapse Globe" or "Collapse Chart" buttons above either zone to view the map or the chart in a full-width large area.',
    howToUseTip3:
      'Use the Left Sidebar (or keys 1–6) to jump between Split Studio, Full Geo-Stage, Statistical Lab, Phenomena, CSV Lab, and 13 Official Resources.',

    liveMapHudTitle: 'Live Map Telemetry HUD',
    splitViewBtn: 'Split View',
    fullChartsBtn: 'Full Charts',

    annualTableTitle: 'Annual Satellite Observations & Anomalies Matrix',
    yearsCountLabel: 'Years',
    peakLabel: 'Peak',
    minLabel: 'Min',
    colYear: 'Year',
    colRegionA: 'Region A',
    colAnomalyA: 'Anomaly A',
    colSensTrendA: "Sen's Trend A",
    colCiBand: '95% CI Band',
    colRegionB: 'Region B',
    colAnomalyB: 'Anomaly B',

    verdictRegionLabel: 'REGION',
    verdictSeasonLabel: 'Season',
    verdictSignificant: 'SIGNIFICANT',
    verdictNotYetSig: 'NOT YET SIGNIFICANT',
    verdictRateTitle: "Rate of Change (Sen's Slope / Decade & Year)",
    verdictPerDecade: 'decade',
    verdictPerYear: 'year',
    verdictSlopeCi: '95% Slope CI',
    verdictSnrLabel: 'Signal / Noise (SNR)',
    verdictTotalDelta: 'Total Shift (Δ)',
    verdictTtsTitle: 'Time-to-Significance Calculator (p < 0.05 Threshold)',
    verdictSummaryTitle: 'Climate Detective Verdict',
    dipoleDetectedBadge: 'Climate Dipole Detected (Opposite Trends)',
    crossRegionBadge: 'Cross-Regional Comparison',
    pearsonLabel: 'Pearson Correlation (r)',
    trendContrastLabel: 'Trend Contrast',
    contrastOpposite: 'OPPOSITE',
    contrastSync: 'SYNCHRONOUS',

    chartTabTimeSeries: "Time Series + Sen's Trend (95% CI)",
    chartTabStripes: 'Climate Stripes (Anomaly Heatmap)',
    chartTabDecomp: 'STL Decomposition (Trend / Seasonal / Noise)',
    chartAnomaliesToggle: 'Anomalies ("Trend Scissors")',
    chartAbsoluteToggle: 'Absolute',
    chartRegionABtn: 'Region A',
    chartRegionBBtn: 'Region B',
    chartTitleDivergence: 'Anomaly Divergence ("Trend Scissors")',
    chartTitleDynamics: "Indicator Dynamics & Sen's Trend Line",
    chartCiBandLegend: '95% Confidence Interval',
    chartObsLegend: 'Observations',
    chartLoessLegend: 'LOESS Smoothed',
    chartSensLegend: "Sen's Slope",

    externalVerifyLabel: 'External Verification for',
    all13ResourcesBtn: 'All 13 Resources',
  },
};

export function getSeasonModesI18n(lang: Language): Array<{
  id: SeasonMode;
  label: string;
  shortLabel: string;
  badge: string;
  hint: string;
}> {
  if (lang === 'en') {
    return [
      {
        id: 'raw',
        label: 'All Months (Raw)',
        shortLabel: 'Raw',
        badge: 'ANN',
        hint: 'Annual averages across all months without seasonal filtering',
      },
      {
        id: 'deseasonalized',
        label: 'Deseasonalized',
        shortLabel: 'Deseason',
        badge: 'STL',
        hint: 'Annual seasonal cycle removed via STL decomposition',
      },
      {
        id: 'JJA',
        label: 'Summer (JJA)',
        shortLabel: 'Summer JJA',
        badge: 'JJA',
        hint: 'June–August (wildfire smoke transport & summer droughts)',
      },
      {
        id: 'DJF',
        label: 'Winter (DJF)',
        shortLabel: 'Winter DJF',
        badge: 'DJF',
        hint: 'December–February (winter anomalies & ENSO peak)',
      },
      {
        id: 'MAM',
        label: 'Spring (MAM)',
        shortLabel: 'Spring MAM',
        badge: 'MAM',
        hint: 'March–May (spring snowmelt & river runoff)',
      },
      {
        id: 'SON',
        label: 'Autumn (SON)',
        shortLabel: 'Autumn SON',
        badge: 'SON',
        hint: 'September–November (autumn transition season)',
      },
    ];
  }
  return [
    {
      id: 'raw',
      label: 'Усі місяці (Raw)',
      shortLabel: 'Raw (Усі)',
      badge: 'ANN',
      hint: 'Річні середні без фільтрації сезонів',
    },
    {
      id: 'deseasonalized',
      label: 'Десезоналізований',
      shortLabel: 'Десезон.',
      badge: 'STL',
      hint: 'Видалено річний сезонний цикл (STL)',
    },
    {
      id: 'JJA',
      label: 'Літо (JJA)',
      shortLabel: 'Літо JJA',
      badge: 'JJA',
      hint: 'Червень–Серпень (лісові пожежі та посухи)',
    },
    {
      id: 'DJF',
      label: 'Зима (DJF)',
      shortLabel: 'Зима DJF',
      badge: 'DJF',
      hint: 'Грудень–Лютий (зимові аномалії та ENSO)',
    },
    {
      id: 'MAM',
      label: 'Весна (MAM)',
      shortLabel: 'Весна MAM',
      badge: 'MAM',
      hint: 'Березень–Травень (весняне танення та паводки)',
    },
    {
      id: 'SON',
      label: 'Осінь (SON)',
      shortLabel: 'Осінь SON',
      badge: 'SON',
      hint: 'Вересень–Листопад (осінній сезон)',
    },
  ];
}

export function getBiomeOptionsI18n(lang: Language): Array<{
  id: BiomeType | 'all';
  title: string;
  subtitle: string;
}> {
  if (lang === 'en') {
    return [
      {
        id: 'all',
        title: 'All Earth Biomes',
        subtitle: 'Full catalog (13 NASA / CSA variables)',
      },
      {
        id: 'tidal_estuary',
        title: 'Coasts & Estuaries',
        subtitle: 'SeaWiFS Chlorophyll-a, SWOT Water Level, River Runoff',
      },
      {
        id: 'rain_forest',
        title: 'Forests & Vegetation',
        subtitle: 'Evapotranspiration, Wildfire Smoke (AOD), Root Soil Moisture',
      },
      {
        id: 'desert',
        title: 'Arid Steppes & Deserts',
        subtitle: 'Solar Radiation, Dust Aerosols, Moisture Deficit',
      },
      {
        id: 'cryosphere',
        title: 'Cryosphere & Arctic',
        subtitle: 'RADARSAT SAR Ice Backscatter, Snow Depth, Arctic T2M',
      },
    ];
  }
  return [
    {
      id: 'all',
      title: 'Усі біоми Землі',
      subtitle: 'Повний каталог (13 змінних NASA / CSA)',
    },
    {
      id: 'tidal_estuary',
      title: 'Узбережжя та Естуарії',
      subtitle: 'Хлорофіл SeaWiFS, SWOT рівень води, стік річок',
    },
    {
      id: 'rain_forest',
      title: 'Ліси та Рослинність',
      subtitle: 'Евапотранспірація, дим пожеж (AOD), ґрунт',
    },
    {
      id: 'desert',
      title: 'Посушливі Степи',
      subtitle: 'Сонячна радіація, пил, дефіцит вологи',
    },
    {
      id: 'cryosphere',
      title: 'Кріосфера та Арктика',
      subtitle: 'Радар льоду RADARSAT, глибина снігу, T2M',
    },
  ];
}

const VARIABLE_DEFINITIONS_EN: Record<string, string> = {
  T2M: 'Near-surface air temperature at 2 meters height (NASA MERRA-2 & Aqua AIRS). Core indicator for global warming, Arctic amplification, and thermal dipoles.',
  PRECTOTCORR:
    'Daily mean bias-corrected precipitation rate from NASA GPM IMERG & MERRA-2 satellites. Tracks monsoons, tropical cyclones, and El Niño (ENSO) hydrological dipoles.',
  GWETROOT:
    'Root zone soil moisture fraction (0 to 1) from NASA GLDAS & SMAP radar. Direct indicator of agricultural drought and steppe or forest ecosystem stress.',
  ALLSKY_SFC_SW_DWN:
    'Downward shortwave solar radiation flux reaching Earth’s surface through clouds, wildfire smoke plumes, and volcanic sulfate aerosols (NASA CERES).',
  AOD: 'Dimensionless measure of solar light extinction by wildfire smoke, desert dust, and sulfate haze at 550 nm (NASA MODIS Aqua).',
  SO2: 'Total atmospheric column sulfur dioxide concentration in Dobson Units (NASA Aura OMI). In the stratosphere, SO₂ oxidizes into reflective sulfate droplets.',
  EVPTRNS:
    'Total evapotranspiration water vapor flux rising into the atmosphere from soil surfaces and plant canopy transpiration (NASA GLDAS Noah).',
  QRUNOFF:
    'Surface and subsurface hydrological streamflow runoff rate (NASA GLDAS). Drives river discharge, flood pulses, and coastal nutrient transport into estuaries.',
  SNODP:
    'Mean terrestrial and cryospheric snow depth (NASA MODIS / MERRA-2), governing surface albedo across polar and alpine regions.',
  SST: 'Radiometric skin and sea surface temperature of the upper ocean layer from infrared satellites (NASA GHRSST / MODIS Aqua).',
  SEAWIFS_CHLA:
    'Chlorophyll-a concentration in coastal waters and river estuaries (NASA SeaWiFS / MODIS Aqua Ocean Color via Giovanni), tracking nutrient-driven phytoplankton blooms.',
  SWOT_WSE:
    'Water Surface Elevation of lakes, rivers, reservoirs, and estuaries measured from space via KaRIn radar interferometry (NASA / CNES / CSA SWOT Mission).',
  RCM_SAR_BACKSCATTER:
    'Normalized C-band Synthetic Aperture Radar backscatter (σ°, dB) from the CSA RADARSAT Constellation Mission (RCM), imaging sea ice, floods, and wetlands day or night through clouds.',
};

export function getVariableDefinitionI18n(
  code: string,
  lang: Language,
  fallbackUa?: string
): string {
  if (lang === 'en') {
    const key = code.trim().toUpperCase();
    return (
      VARIABLE_DEFINITIONS_EN[key] ||
      fallbackUa ||
      `Satellite Earth observation parameter (${code}).`
    );
  }
  return fallbackUa || '';
}

const SCENARIO_TEXT_EN: Record<
  string,
  { summary: string; note?: string }
> = {
  'wisconsin-wildfire-smoke': {
    summary:
      'Long-range transport of boreal wildfire smoke from central Canada into the Upper Midwest USA. Winter months show baseline noise, whereas the summer slice (JJA — June to August) reveals a statistically significant upward trend in Aerosol Optical Depth (p < 0.05).',
    note: 'Dr. Acker’s Tip: Switch the seasonal filter from JJA (Summer) to DJF (Winter) to see how seasonal filtering isolates the wildfire signal from winter background noise!',
  },
  'ackers-seawifs-coastal-study': {
    summary:
      'Based on Challenge Author Dr. James Acker’s research paper (NASA NTRS 20090042747): river runoff (QRUNOFF from GES DISC Hydrology) delivers agricultural nutrients into the Mississippi River plume and Chesapeake Bay, driving a significant rise in Chlorophyll-a (SEAWIFS_CHLA in NASA Giovanni), while the open Gulf of Mexico shelf exhibits contrasting oligotrophic dynamics.',
    note: 'Click the variable toggle button (SEAWIFS_CHLA ↔ QRUNOFF) to compare coastal phytoplankton blooms directly against river runoff!',
  },
  'csa-swot-radarsat-water-ice': {
    summary:
      'Combines Canadian Space Agency RADARSAT Constellation Mission (RCM) C-band SAR imagery and SWOT KaRIn radar altimetry to detect boreal lake water level shifts (SWOT_WSE) and Hudson Bay sea-ice retreat (RCM_SAR_BACKSCATTER) regardless of cloud cover or polar darkness.',
    note: 'Toggle between SWOT_WSE (water surface elevation in meters) and RCM_SAR_BACKSCATTER (SAR radar backscatter in dB).',
  },
  'kasatochi-volcanic-cooling': {
    summary:
      'The August 2008 Kasatochi eruption in the Aleutian Islands injected massive amounts of sulfur dioxide (SO₂) into the stratosphere. Reflective sulfate aerosols blocked incoming solar radiation, triggering a regional radiative cooling trap followed by multi-year relaxation.',
    note: 'Observe the extreme August 2008 SO₂ spike and subsequent stratospheric decay on the deseasonalized Aura OMI series.',
  },
  'enso-pacific-dipole': {
    summary:
      'A single planetary ocean-atmosphere oscillation (ENSO) drives two opposite regional hydrological trends: intensifying convective rainfall along the Peru/Ecuador coast versus deepening drought across Indonesia and Northern Australia during the peak DJF season.',
    note: 'Core challenge benchmark: comparing two regions with opposite trends and strong negative correlation (r < -0.5).',
  },
  'arctic-atlantic-dipole': {
    summary:
      'Sea-ice loss accelerates High Arctic warming over Svalbard (p < 0.001, deseasonalized trend), while Greenland meltwater flux slows the Atlantic Meridional Overturning Circulation (AMOC), creating the subpolar North Atlantic Warming Hole.',
    note: 'Deseasonalizing the temperature series removes the annual summer-winter swing and sharpens the t-test signal.',
  },
  'ukraine-steppe-soil-moisture': {
    summary:
      'Demonstrates an emerging trend near the statistical significance threshold (p ≈ 0.07): summer root-zone soil moisture across the Southern Ukrainian Steppe shows a clear drying slope, and the Time-to-Significance calculator estimates how many additional years of satellite observation are needed to reach p < 0.05.',
    note: 'Illustrates why a real physical drying process over a 20-year window can yield p = 0.06–0.08 before crossing the formal 95% confidence threshold.',
  },
  'eonet-fallback-wildfires-canada': {
    summary:
      'NASA EONET catalog event (Wildfires): evaluating the multi-decadal trend in smoke Aerosol Optical Depth (MODIS Aqua AOD) during the peak summer wildfire season (JJA, 2002–2026).',
    note: 'Automatically generated scenario anchored to NASA EONET event coordinates (Wildfires -> MODIS Aqua AOD).',
  },
  'eonet-fallback-volcano-reykjanes': {
    summary:
      'NASA EONET catalog event (Volcanoes): monitoring atmospheric sulfur dioxide column emissions (Aura OMI SO₂) with seasonal cycle removal (deseasonalized).',
    note: 'Automatically mapped from NASA EONET API (Volcanoes -> Aura OMI SO₂).',
  },
  'eonet-fallback-storm-atlantic': {
    summary:
      'NASA EONET catalog event (Severe Storms): testing the long-term trend in extreme cyclone precipitation rate (NASA GPM IMERG) during the peak Atlantic hurricane season (SON).',
    note: 'Automatically mapped from NASA EONET API (Severe Storms -> GPM Precipitation).',
  },
  'eonet-fallback-drought-amazon': {
    summary:
      'NASA EONET catalog event (Drought): analyzing root-zone soil moisture depletion (NASA GLDAS GWETROOT) during the Amazon Basin dry season.',
    note: 'Automatically mapped from NASA EONET API (Drought -> GLDAS GWETROOT).',
  },
};

export function getScenarioTextI18n(
  scenario: {
    id: string;
    eonet_id?: string | null;
    title?: string;
    category?: string;
    variable: string;
    satellite_badge?: string;
    season_mode: string;
    start_year: number;
    end_year: number;
    event_date?: string | null;
    scientific_summary: string;
    student_note?: string | null;
  },
  lang: Language
): { summary: string; note?: string } {
  if (lang === 'ua') {
    return {
      summary: scenario.scientific_summary,
      note: scenario.student_note || undefined,
    };
  }
  const known = SCENARIO_TEXT_EN[scenario.id];
  if (known) {
    return known;
  }
  if (scenario.eonet_id || scenario.id.startsWith('eonet-')) {
    const evId = scenario.eonet_id || scenario.id.toUpperCase();
    const cat = scenario.category || 'Earth Event';
    const sat = scenario.satellite_badge || 'NASA Satellite';
    return {
      summary: `Live NASA EONET event (${evId} • ${cat}): automatically paired with ${scenario.variable} (${sat}) using seasonal filter "${scenario.season_mode}" over ${scenario.start_year}–${scenario.end_year} to test the multi-decadal climate background.`,
      note: `Satellite detection date: ${scenario.event_date || 'Live'}. Check whether this event is part of a statistically significant long-term trend (p < 0.05)!`,
    };
  }
  return {
    summary: scenario.scientific_summary,
    note: scenario.student_note || undefined,
  };
}

const RESOURCE_ROLE_EN: Record<string, string> = {
  'nasa-giovanni':
    'Primary portal for satellite Earth observation time series (MODIS AOD, SeaWiFS Chlorophyll-a, AIRS, Aura OMI, GPM).',
  'ges-disc-hydrology':
    'Source of GLDAS/NLDAS hydrological time series (root zone soil moisture, evapotranspiration, streamflow runoff).',
  'nasa-appeears':
    'Geospatial point and polygon time-series extraction and transformation across NASA Earthdata Cloud.',
  'noaa-cdo':
    'Historical ground weather station records used to cross-validate satellite-derived climate trends.',
  'nasa-ntrs-seawifs-paper':
    'Reference methodology by Dr. James Acker for constructing coastal time series and testing trend significance in estuaries.',
  'knmi-climate-explorer':
    'Reference research platform for climate field correlation and teleconnection dipole analysis.',
  'statistical-test-methods-medium':
    'Theoretical foundation for our statistical engine (Mann-Kendall test, Sen’s slope estimator, Student’s t-test).',
  'statsig-statistical-significance':
    'Educational guide for interpreting p-value < 0.05 thresholds, signal-to-noise ratios, and 95% confidence intervals.',
  'csa-rcm-data':
    'All-weather day/night C-band SAR monitoring of sea ice, coastal flooding, wetlands, and surface moisture.',
  'canada-geoca':
    'Canada’s open geospatial data hub for regional environmental monitoring (boreal wildfires, surface water, cryosphere).',
  'csa-swot-mission':
    'High-precision KaRIn radar interferometry measuring water surface elevation across 90% of global lakes, rivers, and reservoirs.',
  'csa-monitoring-ecosystems':
    'Educational framework on how spaceborne sensors monitor and protect terrestrial and marine ecosystems.',
  'csa-sar-python-tutorial':
    'Python methods for processing Synthetic Aperture Radar (SAR) backscatter imagery to detect surface change.',
};

export function getResourceRoleI18n(
  id: string,
  lang: Language,
  fallbackUa: string
): string {
  if (lang === 'en') {
    return RESOURCE_ROLE_EN[id] || fallbackUa;
  }
  return fallbackUa;
}

export function formatDipoleVerdictI18n(
  dipole: {
    pearson_r: number;
    correlation_p_value: number;
    is_opposite_trend: boolean;
    badge?: string;
    verdict: string;
  },
  nameA: string,
  nameB: string,
  lang: Language
): { badge: string; verdict: string } {
  if (lang === 'ua') {
    return {
      badge:
        dipole.badge ||
        (dipole.is_opposite_trend ? 'ПРОТИЛЕЖНИЙ ДИПОЛЬ' : 'СИНХРОННИЙ РУХ'),
      verdict: dipole.verdict,
    };
  }
  const rStr = `${dipole.pearson_r >= 0 ? '+' : ''}${dipole.pearson_r.toFixed(2)}`;
  const pStr = dipole.correlation_p_value.toFixed(4);
  if (dipole.is_opposite_trend && dipole.pearson_r < -0.3) {
    return {
      badge: 'STRONG REGIONAL DIPOLE',
      verdict: `Strong regional dipole contrast detected: "${nameA}" and "${nameB}" exhibit opposite trends with negative correlation (r = ${rStr}, p = ${pStr}).`,
    };
  }
  if (dipole.is_opposite_trend) {
    return {
      badge: 'OPPOSITE TRENDS',
      verdict: `Opposite trend directions detected between "${nameA}" and "${nameB}" (r = ${rStr}, p = ${pStr}).`,
    };
  }
  if (dipole.pearson_r > 0.4) {
    return {
      badge: 'SYNCHRONOUS VARIABILITY',
      verdict: `Both regions ("${nameA}" and "${nameB}") co-vary synchronously in the same direction (r = ${rStr}, p = ${pStr}).`,
    };
  }
  return {
    badge: 'INDEPENDENT DYNAMICS',
    verdict: `Weak or independent regional correlation between "${nameA}" and "${nameB}" (r = ${rStr}, p = ${pStr}).`,
  };
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ua',
  setLang: () => {},
  toggleLang: () => {},
  t: TRANSLATIONS.ua,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('gaia_lang');
      if (saved === 'en' || saved === 'ua') return saved;
    } catch {
      // ignore storage errors
    }
    return 'ua';
  });

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem('gaia_lang', next);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === 'ua' ? 'en' : 'ua');
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'ua' ? 'uk' : 'en';
  }, [lang]);

  return React.createElement(
    LanguageContext.Provider,
    {
      value: {
        lang,
        setLang,
        toggleLang,
        t: TRANSLATIONS[lang],
      },
    },
    children
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
