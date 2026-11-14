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
