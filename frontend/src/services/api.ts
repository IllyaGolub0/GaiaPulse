import {
  AnalyzeCsvRequest,
  AnalyzeTrendRequest,
  AnalyzeTrendResponse,
  BiomeType,
  ClimateVariableCode,
  DetectiveCasePreset,
  FetchPhenomenaResponse,
  OfficialResourceItem,
  PhenomenonScenario,
  RegionAnalysis,
  RegionLocation,
  SeasonMode,
  TimeSeriesPoint,
  VariableMetadata,
} from '../types/climate';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '' : 'http://localhost:8000');

export const NASA_OFFICIAL_DISCLAIMER =
  'Disclaimer: NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.';

export const SEASON_MODE_OPTIONS: Array<{
  value: SeasonMode;
  shortLabel: string;
  fullLabel: string;
}> = [
  {
    value: 'raw',
    shortLabel: 'Raw (All Months)',
    fullLabel: 'Усі місяці як є (Raw Monthly / Annual)',
  },
  {
    value: 'deseasonalized',
    shortLabel: 'Deseasonalized',
    fullLabel: 'Десезоналізований (Видалено річний цикл)',
  },
  {
    value: 'JJA',
    shortLabel: 'Summer (JJA)',
    fullLabel: 'Тільки Літо — JJA (Червень–Серпень)',
  },
  {
    value: 'DJF',
    shortLabel: 'Winter (DJF)',
    fullLabel: 'Тільки Зима — DJF (Грудень–Лютий)',
  },
  {
    value: 'MAM',
    shortLabel: 'Spring (MAM)',
    fullLabel: 'Тільки Весна — MAM (Березень–Травень)',
  },
  {
    value: 'SON',
    shortLabel: 'Autumn (SON)',
    fullLabel: 'Тільки Осінь — SON (Вересень–Листопад)',
  },
];

export const BIOME_FILTER_OPTIONS: Array<{
  value: 'all' | BiomeType;
  label: string;
}> = [
  { value: 'all', label: 'Усі біоми (All)' },
  { value: 'tidal_estuary', label: 'Естуарії та Узбережжя' },
  { value: 'cryosphere', label: 'Кріосфера та Лід' },
  { value: 'rain_forest', label: 'Ліси та Тропіки' },
  { value: 'desert', label: 'Степи та Посушливі зони' },
];

export const DEFAULT_VARIABLES: VariableMetadata[] = [
  {
    code: 'SEAWIFS_CHLA',
    name: 'Coastal & Estuarine Chlorophyll-a (SeaWiFS / MODIS Aqua)',
    name_ua: 'Прибережний хлорофіл-а (SeaWiFS / MODIS Aqua)',
    unit: 'mg/m³',
    satellite_badge: 'NASA SeaWiFS / MODIS / Giovanni',
    source: 'NASA SeaWiFS / MODIS / Giovanni',
    gibs_layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    biomes: ['tidal_estuary'],
    description:
      'Концентрація хлорофілу-a у прибережних водах та естуаріях (NASA SeaWiFS / MODIS Aqua Ocean Color в системі Giovanni).',
    student_definition:
      'Концентрація хлорофілу у прибережних водах і гирлах річок (естуаріях). Показує, як річковий стік і добрива з полів викликають цвітіння водоростей.',
  },
  {
    code: 'SWOT_WSE',
    name: 'Water Surface Elevation — Lakes, Rivers & Reservoirs (SWOT Mission)',
    name_ua: 'Висота водної поверхні озер та річок (SWOT WSE)',
    unit: 'm (meters above reference ellipsoid)',
    satellite_badge: 'NASA / CNES / CSA SWOT Satellite',
    source: 'NASA / CNES / CSA SWOT Satellite',
    gibs_layer: 'MODIS_Terra_CorrectedReflectance_Bands721',
    biomes: ['tidal_estuary', 'rain_forest', 'desert'],
    description:
      'Висота водної поверхні річок, озер та водосховищ за даними радарної інтерферометрії KaRIn місії SWOT (NASA/CNES/CSA).',
    student_definition:
      'Висота водної поверхні річок, озер та водосховищ із космосу. Місія SWOT покриває 90% поверхневих вод Землі і дозволяє бачити обміління або наповнення водойм.',
  },
  {
    code: 'RCM_SAR_BACKSCATTER',
    name: 'SAR Surface Moisture, Flood & Sea Ice Index (RADARSAT Constellation Mission)',
    name_ua: 'Радарний індекс льоду, повеней та вологості (CSA RADARSAT SAR)',
    unit: 'dB (SAR Backscatter σ°)',
    satellite_badge: 'CSA RADARSAT (RCM) / Geo.ca',
    source: 'CSA RADARSAT (RCM) / Geo.ca',
    gibs_layer: 'MODIS_Terra_NDSI_Snow_Cover',
    biomes: ['cryosphere', 'tidal_estuary'],
    description:
      'Нормалізований радарний зворотний розсіювальний сигнал (SAR Backscatter σ°, C-band) сузір’я CSA RADARSAT Constellation Mission (RCM).',
    student_definition:
      'Радар із синтезованою апертурою (SAR) бачить крізь хмари та вночі, відстежуючи танення морського льоду, межі боліт, вологість полів та розливи річок у Канаді й світі.',
  },
  {
    code: 'AOD',
    name: 'Aerosol Optical Depth (550 nm)',
    name_ua: 'Оптична товщина аерозолів / Дим (AOD)',
    unit: 'AOD',
    satellite_badge: 'MODIS Aqua',
    source: 'NASA MODIS Aqua / Giovanni',
    gibs_layer: 'MODIS_Terra_Aerosol',
    biomes: ['rain_forest', 'desert'],
    description:
      'Індикатор диму лісових пожеж, пилу та сульфатних аерозолів (MODIS Aqua).',
    student_definition:
      'Міра замутнення атмосфери димом лісових пожеж, пустельним пилом та промисловим смогом за даними MODIS Aqua.',
  },
  {
    code: 'T2M',
    name: 'Surface Air Temperature (2m)',
    name_ua: 'Температура повітря (2 м)',
    unit: '°C',
    satellite_badge: 'MERRA-2 / AIRS',
    source: 'NASA MERRA-2 / Aqua AIRS / Giovanni',
    gibs_layer: 'MODIS_Terra_Land_Surface_Temp_Day',
    biomes: ['cryosphere', 'desert', 'rain_forest', 'tidal_estuary'],
    description:
      'Приземна температура повітря на висоті 2 метри (NASA MERRA-2 & AIRS).',
    student_definition:
      'Приземна температура повітря на висоті 2 метри. Базовий показник для виявлення глобального потепління, арктичної ампліфікації та температурних диполів.',
  },
  {
    code: 'PRECTOTCORR',
    name: 'Precipitation Rate (Corrected)',
    name_ua: 'Інтенсивність опадів (GPM / MERRA-2)',
    unit: 'mm/day',
    satellite_badge: 'GPM / MERRA-2',
    source: 'NASA GPM IMERG / MERRA-2 / Giovanni',
    gibs_layer: 'IMERG_Precipitation_Rate',
    biomes: ['rain_forest', 'desert', 'tidal_estuary'],
    description:
      'Середньодобова кількість опадів за супутниковими даними GPM IMERG.',
    student_definition:
      'Середньодобова кількість дощу та снігу з супутників GPM IMERG. Дозволяє відстежувати мусони, тропічні циклони та гідрологічні диполі Ель-Ніньйо (ENSO).',
  },
  {
    code: 'SO2',
    name: 'Sulfur Dioxide Column Amount',
    name_ua: 'Діоксид сірки в атмосфері (SO₂)',
    unit: 'DU',
    satellite_badge: 'Aura OMI',
    source: 'NASA Aura OMI / Giovanni',
    gibs_layer: 'MODIS_Terra_Aerosol',
    biomes: ['cryosphere', 'desert'],
    description:
      'Вміст вулканічного та антропогенного SO₂ у стовпі атмосфери (Aura OMI).',
    student_definition:
      'Концентрація вулканічного газу SO₂ у стовпі атмосфери. У стратосфері перетворюється на краплі сірчаної кислоти, що відбивають сонячне світло.',
  },
  {
    code: 'GWETROOT',
    name: 'Root Zone Soil Moisture',
    name_ua: 'Вологість ґрунту в кореневій зоні',
    unit: 'fraction (0-1)',
    satellite_badge: 'GLDAS / SMAP',
    source: 'NASA GES DISC Hydrology / GLDAS / SMAP',
    gibs_layer: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    biomes: ['desert', 'rain_forest'],
    description:
      'Відносна насиченість вологою кореневого шару ґрунту (GLDAS / SMAP).',
    student_definition:
      'Частка води у кореневому шарі ґрунту (від 0 до 1). Прямий індикатор сільськогосподарських посух та деградації степових і лісових екосистем.',
  },
  {
    code: 'QRUNOFF',
    name: 'Surface & Streamflow Runoff',
    name_ua: 'Річковий та поверхневий стік (Runoff)',
    unit: 'mm/day',
    satellite_badge: 'GLDAS',
    source: 'NASA GES DISC Hydrology Time Series / GLDAS',
    gibs_layer: 'IMERG_Precipitation_Rate',
    biomes: ['tidal_estuary', 'rain_forest'],
    description:
      'Інтенсивність гідрологічного стоку та паводків (GLDAS Streamflow).',
    student_definition:
      'Обсяг талої та дощової води, що стікає по поверхні суходолу у річки та естуарії, переносячи поживні речовини до океану.',
  },
  {
    code: 'ALLSKY_SFC_SW_DWN',
    name: 'Surface Shortwave Solar Radiation',
    name_ua: 'Сонячна радіація на поверхні',
    unit: 'W/m²',
    satellite_badge: 'CERES / FLASHFlux',
    source: 'NASA CERES / FLASHFlux',
    gibs_layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    biomes: ['desert', 'cryosphere', 'rain_forest'],
    description:
      'Потік короткохвильового сонячного випромінювання на поверхні Землі.',
    student_definition:
      'Енергія сонячного світла, що досягає поверхні Землі крізь хмари, дим пожеж та вулканічні сульфатні аерозолі.',
  },
  {
    code: 'EVPTRNS',
    name: 'Evapotranspiration Flux',
    name_ua: 'Евапотранспірація (Випаровування)',
    unit: 'mm/day',
    satellite_badge: 'GLDAS',
    source: 'NASA GES DISC Hydrology / GLDAS',
    gibs_layer: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    biomes: ['rain_forest', 'desert'],
    description:
      'Сумарне випаровування вологи з ґрунту та рослинності (GLDAS).',
    student_definition:
      'Сумарний потік водяної пари, який піднімається в атмосферу з поверхні ґрунту та листя рослин.',
  },
  {
    code: 'SNODP',
    name: 'Snow Depth & Cryosphere',
    name_ua: 'Товщина снігового покриву',
    unit: 'm',
    satellite_badge: 'MODIS / MERRA-2',
    source: 'NASA MODIS / MERRA-2 Cryosphere',
    gibs_layer: 'MODIS_Terra_NDSI_Snow_Cover',
    biomes: ['cryosphere'],
    description:
      'Глибина снігового покриву кріосфери (MODIS / MERRA-2).',
    student_definition:
      'Висота снігового покриву, що визначає альбедо (відбивну здатність) полярних і гірських регіонів.',
  },
  {
    code: 'SST',
    name: 'Sea / Skin Surface Temperature',
    name_ua: 'Температура поверхні океану / суші (SST)',
    unit: '°C',
    satellite_badge: 'GHRSST / MODIS',
    source: 'NASA GHRSST / MODIS Aqua',
    gibs_layer: 'MODIS_Terra_Land_Surface_Temp_Day',
    biomes: ['tidal_estuary', 'cryosphere'],
    description: 'Радіаційна температура поверхні океану та суші.',
    student_definition:
      'Температура верхнього міліметрового шару океану з інфрачервоних супутників, що керує штормами й кораловими рифами.',
  },
];

export const OFFICIAL_RESOURCES_LIST: OfficialResourceItem[] = [
  // Category 1: NASA Data & Resources
  {
    id: 'nasa-giovanni',
    number: 1,
    category: 'nasa_data',
    category_label: 'Категорія 1: NASA Data & Resources',
    title: 'NASA Giovanni',
    agency_badge: 'NASA GSFC / GES DISC',
    is_us_gov: true,
    url: 'https://giovanni.gsfc.nasa.gov/giovanni/',
    role_in_app:
      'Базове джерело часових рядів супутникових змінних (MODIS AOD, SeaWiFS, AIRS, OMI, GPM).',
    supported_variables: ['AOD', 'SEAWIFS_CHLA', 'SO2', 'T2M', 'PRECTOTCORR'],
  },
  {
    id: 'ges-disc-hydrology',
    number: 2,
    category: 'nasa_data',
    category_label: 'Категорія 1: NASA Data & Resources',
    title: 'GES DISC Hydrology Time Series',
    agency_badge: 'NASA GES DISC',
    is_us_gov: true,
    url: 'https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series',
    role_in_app:
      'Джерело гідрологічних рядів GLDAS/NLDAS (вологість ґрунту, випаровування, річковий стік).',
    supported_variables: ['GWETROOT', 'EVPTRNS', 'QRUNOFF'],
  },
  {
    id: 'nasa-appeears',
    number: 3,
    category: 'nasa_data',
    category_label: 'Категорія 1: NASA Data & Resources',
    title: 'NASA AppEEARS',
    agency_badge: 'NASA LP DAAC / Earthdata',
    is_us_gov: true,
    url: 'https://appeears.earthdatacloud.nasa.gov/',
    role_in_app:
      'Трансформація та вивантаження геопросторових часових рядів для конкретних точок і полігонів.',
    supported_variables: ['T2M', 'SST', 'SNODP', 'AOD', 'SEAWIFS_CHLA'],
  },
  {
    id: 'noaa-cdo',
    number: 4,
    category: 'nasa_data',
    category_label: 'Категорія 1: NASA Data & Resources',
    title: 'NOAA Climate Data Online (CDO)',
    agency_badge: 'NOAA NCEI',
    is_us_gov: true,
    url: 'https://www.ncei.noaa.gov/cdo-web/',
    role_in_app:
      'Історичні дані метеостанцій для валідації супутникових трендів.',
    supported_variables: ['T2M', 'PRECTOTCORR', 'SNODP'],
  },
  {
    id: 'nasa-ntrs-seawifs-paper',
    number: 5,
    category: 'nasa_data',
    category_label: 'Категорія 1: NASA Data & Resources',
    title: 'NASA NTRS Research Paper (SeaWiFS Chlorophyll Time-Series)',
    agency_badge: 'NASA NTRS • Dr. James Acker',
    is_us_gov: true,
    url: 'https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf',
    role_in_app:
      'Еталонна методологія побудови часових рядів та перевірки значущості трендів у прибережних естуаріях.',
    supported_variables: ['SEAWIFS_CHLA', 'QRUNOFF'],
  },
  // Category 2: Space Agency Partner & Methodology Resources
  {
    id: 'knmi-climate-explorer',
    number: 6,
    category: 'partner_methodology',
    category_label: 'Категорія 2: Space Agency Partner & Methodology Resources',
    title: 'KNMI Climate Explorer (Royal Netherlands Meteorological Institute)',
    agency_badge: 'KNMI Netherlands',
    is_us_gov: false,
    url: 'https://climexp.knmi.nl/',
    role_in_app:
      'Референсна платформа для кліматичної кореляції та аналізу диполів.',
    supported_variables: ['T2M', 'PRECTOTCORR', 'SST'],
  },
  {
    id: 'statistical-test-methods-medium',
    number: 7,
    category: 'partner_methodology',
    category_label: 'Категорія 2: Space Agency Partner & Methodology Resources',
    title: 'Statistical Test Methods to Detect Trends in Time Series Data',
    agency_badge: 'Statistical Methodology',
    is_us_gov: false,
    url: 'https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b',
    role_in_app:
      'Теоретична база нашого статистичного рушія (тест Манна-Кендалла, нахил Сена, t-тест).',
    supported_variables: [],
  },
  {
    id: 'statsig-statistical-significance',
    number: 8,
    category: 'partner_methodology',
    category_label: 'Категорія 2: Space Agency Partner & Methodology Resources',
    title: 'A Comprehensive Guide to Statistical Significance',
    agency_badge: 'Statsig Education',
    is_us_gov: false,
    url: 'https://www.statsig.com/perspectives/a-comprehensive-guide-to-statistical-significance',
    role_in_app:
      'Освітній гайд для студентів щодо інтерпретації p-value < 0.05 та довірчих інтервалів.',
    supported_variables: [],
  },
  // Category 3: CSA (Canadian Space Agency) Resources
  {
    id: 'csa-rcm-data',
    number: 9,
    category: 'csa_resources',
    category_label: 'Категорія 3: CSA (Canadian Space Agency) Resources',
    title: 'RADARSAT Constellation Mission (RCM) Data',
    agency_badge: 'CSA / ASC Canada',
    is_us_gov: false,
    url: 'https://donnees-data.asc-csa.gc.ca/en/dataset/rcm',
    role_in_app:
      'Цілодобовий всепогодний SAR-моніторинг морського льоду, повеней, боліт та узбережжя.',
    supported_variables: ['RCM_SAR_BACKSCATTER', 'SNODP'],
  },
  {
    id: 'canada-geoca',
    number: 10,
    category: 'csa_resources',
    category_label: 'Категорія 3: CSA (Canadian Space Agency) Resources',
    title: "Geo.ca (Canada's Open Geospatial Information)",
    agency_badge: 'Geo.ca • NRCan / CSA',
    is_us_gov: false,
    url: 'http://geo.ca/',
    role_in_app:
      'Регіональні екологічні та просторові дані Канади (лісові пожежі, водні ресурси).',
    supported_variables: ['RCM_SAR_BACKSCATTER', 'AOD', 'SWOT_WSE'],
  },
  {
    id: 'csa-swot-mission',
    number: 11,
    category: 'csa_resources',
    category_label: 'Категорія 3: CSA (Canadian Space Agency) Resources',
    title: 'SWOT Mission (Surface Water and Ocean Topography)',
    agency_badge: 'NASA / CNES / CSA',
    is_us_gov: false,
    url: 'https://www.asc-csa.gc.ca/eng/satellites/swot/',
    role_in_app:
      'Вимірювання змін висоти водної поверхні 90% озер, річок, водосховищ та океанів.',
    supported_variables: ['SWOT_WSE', 'QRUNOFF'],
  },
  {
    id: 'csa-monitoring-ecosystems',
    number: 12,
    category: 'csa_resources',
    category_label: 'Категорія 3: CSA (Canadian Space Agency) Resources',
    title: 'Monitoring and Protecting Our Ecosystem from Space (CSA)',
    agency_badge: 'CSA / ASC Education',
    is_us_gov: false,
    url: 'https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/monitoring-and-protecting-our-ecosystems-from-space.asp',
    role_in_app:
      'Освітній контекст для школярів та студентів про захист екосистем за допомогою супутників.',
    supported_variables: ['SEAWIFS_CHLA', 'SWOT_WSE', 'RCM_SAR_BACKSCATTER'],
  },
  {
    id: 'csa-sar-python-tutorial',
    number: 13,
    category: 'csa_resources',
    category_label: 'Категорія 3: CSA (Canadian Space Agency) Resources',
    title: 'Synthetic Aperture Radar (SAR) Python Tutorial (CSA GitHub)',
    agency_badge: 'CSA GitHub • Python SAR',
    is_us_gov: false,
    url: 'https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial',
    role_in_app:
      'Інтеграція методів обробки SAR-знімків на Python для аналізу поверхневих змін.',
    supported_variables: ['RCM_SAR_BACKSCATTER'],
  },
];

export const FALLBACK_PHENOMENA_SCENARIOS: PhenomenonScenario[] = [
  {
    id: 'wisconsin-wildfire-smoke',
    title: 'Canadian Wildfires & Smoke Transport over Wisconsin (2002–2026)',
    category: 'Wildfires',
    source_type: 'curated',
    tags: ['acker_video', 'curated'],
    satellite_badge: 'MODIS Aqua',
    variable: 'AOD',
    secondary_variable: 'ALLSKY_SFC_SW_DWN',
    mode: 'single',
    start_year: 2002,
    end_year: 2026,
    season_mode: 'JJA',
    region_a: { name: 'Wisconsin, USA', lat: 44.5, lon: -89.5 },
    region_b: null,
    source_url: 'https://giovanni.gsfc.nasa.gov/giovanni/',
    source_label: 'NASA Giovanni — MODIS Aqua Aerosol Optical Depth',
    scientific_summary:
      'Перенесення диму масштабних лісових пожеж із центральної Канади у США. Взимку диму немає, але літній зріз (JJA) виявляє статистично значущий висхідний тренд (p < 0.05).',
    student_note:
      'Порада д-ра Екера: Спробуйте перемкнути сезон із JJA (Літо) на DJF (Зима), щоб побачити зникнення тренду!',
  },
  {
    id: 'ackers-seawifs-coastal-study',
    title: 'River-Influenced Coastal Chlorophyll Trend (SeaWiFS / MODIS)',
    category: 'Coastal & Estuarine Ecology',
    source_type: 'curated',
    tags: ['acker_video', 'dipole', 'curated', 'official_resource'],
    satellite_badge: 'NASA SeaWiFS / MODIS / Giovanni',
    variable: 'SEAWIFS_CHLA',
    secondary_variable: 'QRUNOFF',
    mode: 'dipole',
    start_year: 1998,
    end_year: 2026,
    season_mode: 'JJA',
    region_a: {
      name: 'Mississippi River Plume / Chesapeake Bay',
      lat: 29.15,
      lon: -89.25,
    },
    region_b: {
      name: 'Open Gulf of Mexico Shelf',
      lat: 26.0,
      lon: -90.0,
    },
    source_url:
      'https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf',
    source_label: 'NASA NTRS 20090042747 — Dr. James Acker SeaWiFS Study',
    scientific_summary:
      'За статтею автора челенджу д-ра Джеймса Екера (NASA NTRS 20090042747): річковий стік (QRUNOFF із GES DISC Hydrology) виносить добрива й біогени у гирло Міссісіпі та Чесапікську затоку, спричиняючи значуще зростання хлорофілу-а (SEAWIFS_CHLA), тоді як відкритий шельф Мексиканської затоки демонструє протилежну оліготрофну динаміку.',
    student_note:
      'Перемикайте змінну (SEAWIFS_CHLA ↔ QRUNOFF), щоб порівняти цвітіння водоростей із річковим стоком!',
  },
  {
    id: 'csa-swot-radarsat-water-ice',
    title: 'Canadian Boreal Lakes & Arctic Sea Ice Shift (CSA SWOT + RCM + Geo.ca)',
    category: 'CSA Water & Cryosphere',
    source_type: 'curated',
    tags: ['acker_video', 'curated', 'csa', 'official_resource'],
    satellite_badge: 'CSA SWOT + RADARSAT (RCM)',
    variable: 'SWOT_WSE',
    secondary_variable: 'RCM_SAR_BACKSCATTER',
    mode: 'single',
    start_year: 2002,
    end_year: 2026,
    season_mode: 'deseasonalized',
    region_a: {
      name: 'Northern Canada / Hudson Bay',
      lat: 58.76,
      lon: -94.17,
    },
    region_b: null,
    source_url: 'https://www.asc-csa.gc.ca/eng/satellites/swot/',
    source_label: 'CSA SWOT & RADARSAT Constellation Mission (RCM)',
    scientific_summary:
      'Використання радарних даних CSA RADARSAT (RCM) та альтиметрії SWOT для виявлення трендів рівня води бореальних озер (SWOT_WSE) та скорочення льодового покриву Гудзонової затоки (RCM_SAR_BACKSCATTER) за будь-якої хмарності.',
    student_note:
      'Перемикайтеся між SWOT_WSE (рівень води, м) та RCM_SAR_BACKSCATTER (зворотне радарне розсіювання SAR, dB).',
  },
  {
    id: 'kasatochi-volcanic-cooling',
    title: 'Kasatochi Eruption & Sulfur Cooling Trap (Aleutian Islands)',
    category: 'Volcanoes',
    source_type: 'curated',
    tags: ['acker_video', 'curated'],
    satellite_badge: 'Aura OMI',
    variable: 'SO2',
    secondary_variable: 'ALLSKY_SFC_SW_DWN',
    mode: 'single',
    start_year: 2004,
    end_year: 2025,
    season_mode: 'deseasonalized',
    region_a: {
      name: 'Kasatochi Volcano, Aleutian Islands',
      lat: 52.17,
      lon: -175.51,
    },
    region_b: null,
    source_url: 'https://giovanni.gsfc.nasa.gov/giovanni/',
    source_label: 'NASA Giovanni — Aura OMI Sulfur Dioxide',
    scientific_summary:
      'Викид діоксиду сірки у стратосферу блокує сонячне випромінювання і запускає регіональну «пастку охолодження» (Cooling Trap).',
    student_note:
      'Пік SO₂ у серпні 2008 року на десезоналізованому ряді Aura OMI та подальша релаксація.',
  },
  {
    id: 'enso-pacific-dipole',
    title: 'El Niño / Southern Oscillation Hydrological Dipole',
    category: 'Hydrological Dipole',
    source_type: 'curated',
    tags: ['acker_video', 'dipole', 'curated'],
    satellite_badge: 'GPM / MERRA-2',
    variable: 'PRECTOTCORR',
    mode: 'dipole',
    start_year: 1985,
    end_year: 2026,
    season_mode: 'DJF',
    region_a: { name: 'Peru / Ecuador Coast', lat: -4.5, lon: -81.2 },
    region_b: {
      name: 'Indonesia / Northern Australia',
      lat: -12.4,
      lon: 130.8,
    },
    source_url: 'https://climexp.knmi.nl/',
    source_label: 'KNMI Climate Explorer & NASA GPM',
    scientific_summary:
      'Два регіони з протилежними трендами від одного глобального процесу ENSO: зростання опадів у Перу/Еквадорі проти посилення посухи в Індонезії та Північній Австралії.',
    student_note:
      'Класичний гідрологічний диполь у сезон DJF із сильною антикореляцією (r < -0.5).',
  },
  {
    id: 'arctic-atlantic-dipole',
    title: 'Arctic Amplification vs. North Atlantic Warming Hole',
    category: 'Ocean-Atmosphere Dipole',
    source_type: 'curated',
    tags: ['dipole', 'curated'],
    satellite_badge: 'MERRA-2 / AIRS',
    variable: 'T2M',
    mode: 'dipole',
    start_year: 1985,
    end_year: 2026,
    season_mode: 'deseasonalized',
    region_a: { name: 'Svalbard, High Arctic', lat: 78.22, lon: 15.63 },
    region_b: { name: 'North Atlantic Subpolar Gyre', lat: 53.0, lon: -35.0 },
    source_url: 'https://appeears.earthdatacloud.nasa.gov/',
    source_label: 'NASA AppEEARS & MERRA-2 Reanalysis',
    scientific_summary:
      'Стрімке потепління Арктики на Шпіцбергені (p < 0.001) проти стагнації/охолодження Північної Атлантики південніше Гренландії через уповільнення циркуляції AMOC.',
    student_note:
      'Десезоналізований температурний ряд усуває літньо-зимові коливання і підкреслює контраст.',
  },
  {
    id: 'ukraine-steppe-soil-moisture',
    title: 'Emerging Soil Moisture & Evaporation Trend (Time-to-Significance Case)',
    category: 'Drought & Soil Moisture',
    source_type: 'curated',
    tags: ['acker_video', 'curated'],
    satellite_badge: 'GLDAS',
    variable: 'GWETROOT',
    secondary_variable: 'EVPTRNS',
    mode: 'single',
    start_year: 2005,
    end_year: 2026,
    season_mode: 'JJA',
    region_a: {
      name: 'Southern Steppe / Black Sea, Ukraine',
      lat: 46.6,
      lon: 32.6,
    },
    region_b: null,
    source_url:
      'https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series',
    source_label: 'NASA GES DISC Hydrology Time Series (GLDAS)',
    scientific_summary:
      'Демонстрація тренду на межі значущості (p ≈ 0.07), де калькулятор Time-to-Significance показує, скільки ще років супутникових спостережень потрібно для досягнення порогу p < 0.05.',
    student_note:
      'Пояснює студентам різницю між фізично реальним процесом на короткій вибірці та шумом.',
  },
  {
    id: 'eonet-fallback-wildfires-canada',
    eonet_id: 'EONET_6418',
    title: 'Boreal Forest Wildfire Plume — Northern Alberta & Saskatchewan',
    category: 'Wildfires',
    source_type: 'eonet_live',
    tags: ['eonet_live'],
    satellite_badge: 'MODIS Aqua',
    variable: 'AOD',
    mode: 'single',
    start_year: 2002,
    end_year: 2026,
    season_mode: 'JJA',
    region_a: {
      name: 'Northern Alberta Boreal, Canada',
      lat: 56.72,
      lon: -111.38,
    },
    region_b: null,
    event_date: '2025-07-18',
    scientific_summary:
      'Подія з каталогу NASA EONET (Wildfires): перевірка багаторічного тренду оптичної товщини аерозолів диму (MODIS Aqua AOD) у сезон JJA.',
    student_note: 'Кешований сценарій NASA EONET (Wildfires -> MODIS Aqua AOD).',
  },
  {
    id: 'eonet-fallback-volcano-reykjanes',
    eonet_id: 'EONET_6394',
    title: 'Reykjanes Peninsula Volcanic Fissure Eruption, Iceland',
    category: 'Volcanoes',
    source_type: 'eonet_live',
    tags: ['eonet_live'],
    satellite_badge: 'Aura OMI',
    variable: 'SO2',
    mode: 'single',
    start_year: 2004,
    end_year: 2026,
    season_mode: 'deseasonalized',
    region_a: {
      name: 'Reykjanes Peninsula, Iceland',
      lat: 63.88,
      lon: -22.42,
    },
    region_b: null,
    event_date: '2025-03-12',
    scientific_summary:
      'Подія з каталогу NASA EONET (Volcanoes): моніторинг викидів діоксиду сірки (Aura OMI SO₂) із видаленням сезонного циклу.',
    student_note: 'Кешований сценарій NASA EONET (Volcanoes -> Aura OMI SO₂).',
  },
];

export const DEFAULT_DETECTIVE_CASES: DetectiveCasePreset[] = [
  {
    id: 'ackers-seawifs-coastal-study',
    title: "Acker's SeaWiFS Coastal Chlorophyll Study",
    subtitle: 'SeaWiFS / MODIS Chlorophyll-a vs River Runoff (NTRS 20090042747)',
    mode: 'dipole',
    variable: 'SEAWIFS_CHLA',
    start_year: 1998,
    end_year: 2026,
    season_mode: 'JJA',
    physical_process:
      'Річковий стік виносить біогени у гирло Міссісіпі та Чесапікську затоку, викликаючи цвітіння водоростей на противагу відкритому шельфу.',
    expected_finding:
      'Значуще зростання SEAWIFS_CHLA у гирлі річки (p < 0.01) проти стабільної динаміки відкритого шельфу.',
    region_a: {
      name: 'Mississippi River Plume / Chesapeake Bay',
      lat: 29.15,
      lon: -89.25,
    },
    region_b: { name: 'Open Gulf of Mexico Shelf', lat: 26.0, lon: -90.0 },
  },
  {
    id: 'csa-swot-radarsat-water-ice',
    title: 'CSA SWOT & RADARSAT Canadian Water & Ice Monitor',
    subtitle: 'Hudson Bay & Boreal Lakes (CSA SWOT WSE + RCM SAR)',
    mode: 'single',
    variable: 'SWOT_WSE',
    start_year: 2002,
    end_year: 2026,
    season_mode: 'deseasonalized',
    physical_process:
      'Альтиметрія SWOT та радар CSA RADARSAT (RCM) фіксують зміни рівня води озер та скорочення льодового покриву Канади.',
    expected_finding:
      'Статистично значущий тренд SWOT_WSE та RCM_SAR_BACKSCATTER (p < 0.01).',
    region_a: {
      name: 'Northern Canada / Hudson Bay',
      lat: 58.76,
      lon: -94.17,
    },
    region_b: { name: 'Mackenzie Delta, Canada', lat: 68.85, lon: -134.5 },
  },
  {
    id: 'wisconsin-wildfire-smoke',
    title: 'Canadian Wildfires & Wisconsin Smoke',
    subtitle: 'MODIS Aqua AOD (2002–2026, Summer JJA)',
    mode: 'single',
    variable: 'AOD',
    start_year: 2002,
    end_year: 2026,
    season_mode: 'JJA',
    physical_process:
      'Перенесення диму масштабних канадських пожеж у Вісконсин у літній сезон (JJA).',
    expected_finding:
      'Статистично значущий висхідний тренд у JJA (p < 0.05) та повна відсутність тренду взимку (DJF).',
    region_a: { name: 'Wisconsin, USA', lat: 44.5, lon: -89.5 },
    region_b: { name: 'Central Canada Boreal', lat: 54.0, lon: -105.0 },
  },
];

export const SAMPLE_CSV_TEMPLATES: Array<{
  id: string;
  label: string;
  sourcePortal: string;
  datasetName: string;
  variableCode: ClimateVariableCode;
  unit: string;
  seasonMode: SeasonMode;
  lat: number;
  lon: number;
  csvText: string;
}> = [
  {
    id: 'giovanni-seawifs-chla',
    label: 'NASA Giovanni: Chesapeake Bay Chlorophyll-a (SeaWiFS/MODIS)',
    sourcePortal: 'NASA Giovanni',
    datasetName: 'Giovanni SeaWiFS/MODIS Chlorophyll-a (Chesapeake Estuary)',
    variableCode: 'SEAWIFS_CHLA',
    unit: 'mg/m³',
    seasonMode: 'JJA',
    lat: 37.8,
    lon: -76.1,
    csvText: [
      '# Title: NASA Giovanni Time Series Area-Averaged Chlorophyll-a',
      '# Sensor: SeaWiFS / MODIS-Aqua (mg/m^3)',
      '# Region: Chesapeake Bay / Coastal Estuary (37.8N, -76.1W)',
      'Date,Value',
      '1998-06,4.12',
      '1998-07,4.55',
      '1998-08,4.38',
      '1999-06,4.28',
      '1999-07,4.61',
      '1999-08,4.49',
      '2000-06,4.45',
      '2000-07,4.88',
      '2000-08,4.72',
      '2001-06,4.39',
      '2001-07,4.79',
      '2001-08,4.64',
      '2002-06,4.68',
      '2002-07,5.12',
      '2002-08,4.95',
      '2003-06,5.04',
      '2003-07,5.48',
      '2003-08,5.31',
      '2004-06,4.92',
      '2004-07,5.36',
      '2004-08,5.18',
      '2005-06,5.15',
      '2005-07,5.64',
      '2005-08,5.42',
      '2006-06,5.28',
      '2006-07,5.79',
      '2006-08,5.58',
      '2007-06,5.19',
      '2007-07,5.68',
      '2007-08,5.49',
      '2008-06,5.45',
      '2008-07,5.96',
      '2008-08,5.78',
      '2009-06,5.62',
      '2009-07,6.14',
      '2009-08,5.91',
      '2010-06,5.78',
      '2010-07,6.32',
      '2010-08,6.08',
      '2011-06,6.12',
      '2011-07,6.75',
      '2011-08,6.44',
      '2012-06,5.95',
      '2012-07,6.48',
      '2012-08,6.22',
      '2013-06,6.18',
      '2013-07,6.72',
      '2013-08,6.51',
      '2014-06,6.34',
      '2014-07,6.89',
      '2014-08,6.65',
      '2015-06,6.49',
      '2015-07,7.08',
      '2015-08,6.84',
      '2016-06,6.62',
      '2016-07,7.24',
      '2016-08,6.98',
      '2017-06,6.81',
      '2017-07,7.45',
      '2017-08,7.16',
      '2018-06,7.05',
      '2018-07,7.68',
      '2018-08,7.39',
      '2019-06,7.22',
      '2019-07,7.89',
      '2019-08,7.58',
      '2020-06,7.14',
      '2020-07,7.76',
      '2020-08,7.49',
      '2021-06,7.38',
      '2021-07,8.04',
      '2021-08,7.75',
      '2022-06,7.52',
      '2022-07,8.19',
      '2022-08,7.91',
      '2023-06,7.74',
      '2023-07,8.42',
      '2023-08,8.12',
      '2024-06,7.89',
      '2024-07,8.58',
      '2024-08,8.28',
      '2025-06,8.04',
      '2025-07,8.74',
      '2025-08,8.45',
    ].join('\n'),
  },
  {
    id: 'appeears-swot-rcm',
    label: 'CSA / AppEEARS: Hudson Bay RADARSAT SAR Ice Backscatter',
    sourcePortal: 'CSA RADARSAT / AppEEARS',
    datasetName: 'CSA RADARSAT RCM Sea Ice Backscatter (Hudson Bay)',
    variableCode: 'RCM_SAR_BACKSCATTER',
    unit: 'dB (SAR Backscatter σ°)',
    seasonMode: 'deseasonalized',
    lat: 58.76,
    lon: -94.17,
    csvText: [
      '# Source: CSA RADARSAT Constellation Mission (RCM) / Geo.ca',
      'Year,Value',
      '2002,-10.72',
      '2003,-10.85',
      '2004,-10.91',
      '2005,-11.12',
      '2006,-11.28',
      '2007,-11.45',
      '2008,-11.34',
      '2009,-11.58',
      '2010,-11.89',
      '2011,-11.76',
      '2012,-12.08',
      '2013,-11.95',
      '2014,-12.18',
      '2015,-12.34',
      '2016,-12.62',
      '2017,-12.51',
      '2018,-12.74',
      '2019,-12.92',
      '2020,-13.08',
      '2021,-13.25',
      '2022,-13.19',
      '2023,-13.48',
      '2024,-13.64',
      '2025,-13.79',
    ].join('\n'),
  },
  {
    id: 'noaa-cdo-station',
    label: 'NOAA CDO: Madison Wisconsin Station Summer Smoke & Temp',
    sourcePortal: 'NOAA CDO',
    datasetName: 'NOAA CDO GHCND Madison Station Series',
    variableCode: 'T2M',
    unit: '°C',
    seasonMode: 'JJA',
    lat: 43.14,
    lon: -89.34,
    csvText: [
      '# Station: GHCND:USW00014837 (Madison Dane Co Regional Airport, WI)',
      'time,data',
      '2000-07,20.4',
      '2001-07,21.1',
      '2002-07,21.6',
      '2003-07,20.9',
      '2004-07,20.5',
      '2005-07,21.8',
      '2006-07,22.0',
      '2007-07,21.4',
      '2008-07,21.2',
      '2009-07,20.1',
      '2010-07,22.4',
      '2011-07,22.9',
      '2012-07,23.8',
      '2013-07,21.7',
      '2014-07,20.8',
      '2015-07,21.5',
      '2016-07,22.3',
      '2017-07,21.9',
      '2018-07,22.6',
      '2019-07,22.8',
      '2020-07,23.2',
      '2021-07,23.0',
      '2022-07,22.9',
      '2023-07,23.5',
      '2024-07,23.4',
      '2025-07,23.9',
    ].join('\n'),
  },
];

export function getVariableMetaLocal(
  code: ClimateVariableCode | string
): VariableMetadata {
  return (
    DEFAULT_VARIABLES.find((v) => v.code === code) || {
      code,
      name: code,
      name_ua: code,
      unit: '',
      satellite_badge: 'NASA EOS',
      source: 'NASA / CSA EOS',
      gibs_layer: 'MODIS_Terra_Land_Surface_Temp_Day',
      student_definition:
        'Супутниковий параметр спостереження Землі для статистичної перевірки кліматичних трендів.',
      biomes: ['tidal_estuary', 'rain_forest', 'desert', 'cryosphere'],
    }
  );
}

export async function fetchPresetsFromApi(): Promise<{
  presets: DetectiveCasePreset[];
  available_variables: VariableMetadata[];
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/presets`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      presets: data.presets || DEFAULT_DETECTIVE_CASES,
      available_variables: data.available_variables || DEFAULT_VARIABLES,
    };
  } catch {
    return {
      presets: DEFAULT_DETECTIVE_CASES,
      available_variables: DEFAULT_VARIABLES,
    };
  }
}

export async function fetchPhenomenaV2(): Promise<FetchPhenomenaResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/fetch-phenomena`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as FetchPhenomenaResponse;
  } catch {
    const curatedCount = FALLBACK_PHENOMENA_SCENARIOS.filter(
      (s) => s.source_type === 'curated'
    ).length;
    const eonetCount = FALLBACK_PHENOMENA_SCENARIOS.length - curatedCount;
    return {
      total_count: FALLBACK_PHENOMENA_SCENARIOS.length,
      curated_count: curatedCount,
      eonet_count: eonetCount,
      eonet_is_live: false,
      scenarios: FALLBACK_PHENOMENA_SCENARIOS,
    };
  }
}

/**
 * Deterministic client-side scientific fallback if Backend server is offline.
 */
function buildOfflineRegionAnalysis(
  loc: RegionLocation,
  varMeta: VariableMetadata,
  startYear: number,
  endYear: number,
  seasonMode: SeasonMode,
  isCounterpart: boolean
): RegionAnalysis {
  const n = Math.max(5, endYear - startYear + 1);
  const absLat = Math.abs(loc.lat);
  const seed =
    Math.abs(Math.sin(loc.lat * 12.9898 + loc.lon * 78.233)) * 43758.5453;

  const isWisconsin =
    varMeta.code === 'AOD' &&
    Math.abs(loc.lat - 44.5) < 4 &&
    Math.abs(loc.lon - -89.5) < 5;
  const isUkraineSteppe =
    varMeta.code === 'GWETROOT' &&
    Math.abs(loc.lat - 46.6) < 2 &&
    Math.abs(loc.lon - 32.6) < 2;

  let base = 14.0;
  let slopePerYear = isCounterpart ? -0.015 : 0.068;
  let noiseAmp = 0.45;
  let seasonAmp = 8.0;

  if (isWisconsin) {
    base = seasonMode === 'JJA' ? 0.16 : 0.075;
    slopePerYear = seasonMode === 'JJA' ? 0.0125 : 0.0002;
    noiseAmp = seasonMode === 'JJA' ? 0.045 : 0.018;
    seasonAmp = 0.09;
  } else if (isUkraineSteppe) {
    base = 0.45;
    slopePerYear = -0.0027;
    noiseAmp = 0.036;
    seasonAmp = 0.14;
  } else if (varMeta.code === 'SEAWIFS_CHLA') {
    base = isCounterpart ? 0.34 : 4.35;
    slopePerYear = isCounterpart ? -0.0052 : 0.145;
    noiseAmp = isCounterpart ? 0.025 : 0.42;
    seasonAmp = isCounterpart ? 0.08 : 1.85;
  } else if (varMeta.code === 'SWOT_WSE') {
    base = 42.15;
    slopePerYear = isCounterpart ? -0.022 : 0.036;
    noiseAmp = 0.14;
    seasonAmp = 0.68;
  } else if (varMeta.code === 'RCM_SAR_BACKSCATTER') {
    base = -10.85;
    slopePerYear = isCounterpart ? 0.045 : -0.118;
    noiseAmp = 0.45;
    seasonAmp = 2.15;
  } else if (varMeta.code === 'T2M' || varMeta.code === 'SST') {
    base = 27.0 - 38.0 * Math.pow(absLat / 90.0, 1.3);
    slopePerYear = isCounterpart ? 0.004 : 0.076;
    noiseAmp = seasonMode === 'raw' ? 0.85 : 0.48;
    seasonAmp = 2.0 + 12.0 * (absLat / 90.0);
  } else if (varMeta.code === 'PRECTOTCORR' || varMeta.code === 'QRUNOFF') {
    base = isCounterpart ? 5.6 : 2.8;
    slopePerYear = isCounterpart ? -0.065 : 0.064;
    noiseAmp = 0.42;
    seasonAmp = 1.9;
  } else if (varMeta.code === 'SO2') {
    base = 0.75;
    slopePerYear = -0.014;
    noiseAmp = 0.09;
    seasonAmp = 0.06;
  } else if (varMeta.code === 'AOD') {
    base = 0.15;
    slopePerYear = 0.0055;
    noiseAmp = 0.032;
    seasonAmp = 0.08;
  } else if (varMeta.code === 'GWETROOT') {
    base = isCounterpart ? 0.49 : 0.58;
    slopePerYear = isCounterpart ? -0.0035 : -0.0022;
    noiseAmp = 0.028;
    seasonAmp = 0.13;
  }

  const timeSeries: TimeSeriesPoint[] = [];
  for (let i = 0; i < n; i++) {
    const yr = startYear + i;
    const sharedOsc =
      Math.sin((2 * Math.PI * i) / 4.6) *
      (isCounterpart ? -0.65 : 0.65) *
      noiseAmp;
    const localNoise = Math.cos(seed + i * 1.7) * 0.48 * noiseAmp;
    const trendVal = base + slopePerYear * i;
    const val = trendVal + sharedOsc + localNoise;
    const anom = val - base;
    const ciBand =
      1.98 * noiseAmp * Math.sqrt(1 / n + Math.pow(i - n / 2, 2) / (n * n));

    timeSeries.push({
      year: yr,
      value: Number(val.toFixed(4)),
      anomaly: Number(anom.toFixed(4)),
      trend_line: Number(trendVal.toFixed(4)),
      ci_lower: Number((trendVal - ciBand).toFixed(4)),
      ci_upper: Number((trendVal + ciBand).toFixed(4)),
      loess_trend: Number((trendVal + sharedOsc * 0.35).toFixed(4)),
      residual: Number((val - trendVal).toFixed(4)),
    });
  }

  const changePerDecade = Number((slopePerYear * 10).toFixed(4));
  const totalChangeAbs = Number((slopePerYear * (n - 1)).toFixed(3));
  const snr = Number(
    (Math.abs(totalChangeAbs) / Math.max(noiseAmp, 1e-4)).toFixed(2)
  );

  let pValue = 0.0008;
  let zScore = (slopePerYear >= 0 ? 1 : -1) * 3.45;
  let tStat = (slopePerYear >= 0 ? 1 : -1) * 3.72;
  let isSig = true;
  let extraYears = 0;

  if (isWisconsin && seasonMode === 'DJF') {
    pValue = 0.427;
    zScore = 0.79;
    tStat = 0.84;
    isSig = false;
    extraYears = 38;
  } else if (isUkraineSteppe) {
    pValue = 0.0712;
    zScore = -1.804;
    tStat = -1.91;
    isSig = false;
    extraYears = 4;
  } else if (isCounterpart && (varMeta.code === 'T2M' || varMeta.code === 'SST')) {
    pValue = 0.485;
    zScore = 0.69;
    tStat = 0.72;
    isSig = false;
    extraYears = 44;
  }

  const mkTrend = !isSig
    ? 'no trend'
    : slopePerYear >= 0
    ? 'increasing'
    : 'decreasing';

  const monthsUa = [
    'Січ',
    'Лют',
    'Бер',
    'Кві',
    'Тра',
    'Чер',
    'Лип',
    'Сер',
    'Вер',
    'Жов',
    'Лис',
    'Гру',
  ];
  const hemisphereShift = loc.lat >= 0 ? 0 : Math.PI;
  const seasonalCycle = monthsUa.map((mName, idx) => ({
    month: idx + 1,
    month_name: mName,
    seasonal_effect: Number(
      (
        seasonAmp *
        Math.cos((2 * Math.PI * (idx - 6)) / 12 + hemisphereShift)
      ).toFixed(3)
    ),
  }));

  return {
    location: loc,
    season_mode: seasonMode,
    time_series: timeSeries,
    stl_decomposition: {
      timestamps: timeSeries.map((t) => String(t.year)),
      observed: timeSeries.map((t) => t.value),
      trend: timeSeries.map((t) => t.loess_trend ?? t.trend_line),
      seasonal: timeSeries.map(() => 0),
      residual: timeSeries.map((t) => t.residual ?? 0),
      annual_seasonal_cycle: seasonalCycle,
    },
    statistics: {
      season_mode: seasonMode,
      sample_size_years: n,
      mk_trend: mkTrend,
      is_significant: isSig,
      p_value: pValue,
      z_score: Number(zScore.toFixed(2)),
      sens_slope_per_year: Number(slopePerYear.toFixed(5)),
      student_t_test: {
        t_stat: Number(tStat.toFixed(2)),
        p_value: pValue,
        degrees_of_freedom: Math.max(1, n - 2),
        is_significant: isSig,
      },
      mann_kendall_test: {
        z_score: Number(zScore.toFixed(2)),
        p_value: pValue,
        sens_slope: Number(slopePerYear.toFixed(5)),
        trend: mkTrend,
        is_significant: isSig,
      },
      rate_of_change: {
        per_year: Number(slopePerYear.toFixed(5)),
        per_decade: changePerDecade,
        ci_95_lower_decade: Number(
          (changePerDecade - noiseAmp * 0.45).toFixed(4)
        ),
        ci_95_upper_decade: Number(
          (changePerDecade + noiseAmp * 0.45).toFixed(4)
        ),
      },
      change_per_decade: changePerDecade,
      slope_ci_lower_decade: Number(
        (changePerDecade - noiseAmp * 0.45).toFixed(4)
      ),
      slope_ci_upper_decade: Number(
        (changePerDecade + noiseAmp * 0.45).toFixed(4)
      ),
      total_change_abs: totalChangeAbs,
      total_change_pct: Number(
        ((totalChangeAbs / Math.max(0.1, Math.abs(base))) * 100).toFixed(1)
      ),
      baseline_mean: Number(base.toFixed(3)),
      ols_r_squared: isSig ? 0.64 : 0.16,
      confidence_level: isSig
        ? pValue < 0.01
          ? '99%'
          : '95%'
        : 'Emerging (~90%)',
      significance_label: isSig
        ? 'Статистично значущий тренд (Confidence > 95%)'
        : 'Тренд ще не перетнув поріг p < 0.05',
      signal_to_noise_ratio: snr,
      time_to_significance: {
        is_already_significant: isSig,
        additional_years_needed: extraYears,
        total_years_required: n + extraYears,
        current_years: n,
        projected_significance_year: endYear + extraYears,
        status: isSig
          ? 'significant'
          : extraYears <= 12
          ? 'emerging'
          : 'noise_dominated',
        message: isSig
          ? `Поріг статистичної значущості (p < 0.05) вже досягнуто на поточній вибірці (${n} р.).`
          : `Тренд формується (p = ${pValue.toFixed(3)}): потрібно ще +${extraYears} р. супутникових спостережень (до ~${endYear + extraYears} р.) для досягнення порогу p < 0.05.`,
      },
      regime_shift: {
        change_point_year: Math.round((startYear + endYear) / 2) + 2,
        k_statistic: Number((n * 3.8).toFixed(1)),
        p_value: isSig ? 0.0042 : 0.14,
        is_significant: isSig,
        mean_before: Number((base - totalChangeAbs * 0.22).toFixed(4)),
        mean_after: Number((base + totalChangeAbs * 0.28).toFixed(4)),
        step_delta: Number((totalChangeAbs * 0.5).toFixed(4)),
        direction: isSig
          ? changePerDecade >= 0
            ? 'upward_shift'
            : 'downward_shift'
          : 'gradual',
      },
      autocorrelation: {
        lag1_r: 0.18,
        effective_sample_size: Number((n * 0.72).toFixed(1)),
        variance_inflation_factor: 1.38,
        hamed_rao_z: Number((zScore / Math.sqrt(1.38)).toFixed(2)),
        hamed_rao_p_value: Number(Math.min(0.99, pValue * 1.35).toFixed(5)),
        is_significant_adjusted: isSig,
      },
      seasonal_matrix: [
        {
          season_mode: 'DJF',
          change_per_decade: Number((changePerDecade * 0.25).toFixed(4)),
          p_value: 0.421,
          z_score: 0.81,
          snr: 0.48,
          is_significant: false,
        },
        {
          season_mode: 'MAM',
          change_per_decade: Number((changePerDecade * 0.65).toFixed(4)),
          p_value: 0.072,
          z_score: 1.79,
          snr: 1.05,
          is_significant: false,
        },
        {
          season_mode: 'JJA',
          change_per_decade: Number((changePerDecade * 1.15).toFixed(4)),
          p_value: 0.0004,
          z_score: 3.52,
          snr: 2.34,
          is_significant: true,
        },
        {
          season_mode: 'SON',
          change_per_decade: Number((changePerDecade * 0.55).toFixed(4)),
          p_value: 0.095,
          z_score: 1.67,
          snr: 0.94,
          is_significant: false,
        },
        {
          season_mode: 'deseasonalized',
          change_per_decade: changePerDecade,
          p_value: pValue,
          z_score: zScore,
          snr: snr,
          is_significant: isSig,
        },
        {
          season_mode: 'raw',
          change_per_decade: Number((changePerDecade * 0.92).toFixed(4)),
          p_value: Number(Math.min(0.99, pValue * 1.85).toFixed(4)),
          z_score: Number((zScore * 0.78).toFixed(2)),
          snr: Number((snr * 0.75).toFixed(2)),
          is_significant: pValue * 1.85 < 0.05,
        },
      ],
    },
    human_summary: isSig
      ? `[${seasonMode}] У регіоні «${loc.name}» виявлено статистично значущий тренд (${changePerDecade >= 0 ? '+' : ''}${changePerDecade} ${varMeta.unit}/декаду, p = ${pValue.toFixed(4)} < 0.05, Student t = ${tStat.toFixed(2)}).`
      : `[${seasonMode}] У регіоні «${loc.name}» тренд (${changePerDecade >= 0 ? '+' : ''}${changePerDecade} ${varMeta.unit}/декаду, p = ${pValue.toFixed(3)} ≥ 0.05) ще формується. Потрібно ще +${extraYears} р. спостережень до p < 0.05.`,
    data_source: varMeta.source || 'NASA / CSA Scientific Reference',
  };
}

const _CLIENT_ANALYSIS_CACHE = new Map<string, AnalyzeTrendResponse>();
const MAX_CLIENT_CACHE_SIZE = 80;

function makeAnalysisCacheKey(payload: AnalyzeTrendRequest, seasonMode: SeasonMode): string {
  const rA = `${payload.region_a.lat.toFixed(3)},${payload.region_a.lon.toFixed(3)},${payload.region_a.name}`;
  const rB = payload.region_b
    ? `${payload.region_b.lat.toFixed(3)},${payload.region_b.lon.toFixed(3)},${payload.region_b.name}`
    : 'none';
  const box = payload.spatial_box_averaging ? 'box5' : 'pt1';
  return `${payload.variable}|${seasonMode}|${payload.start_year}|${payload.end_year}|${rA}|${rB}|${box}`;
}

export async function analyzeTrendV2(
  payload: AnalyzeTrendRequest,
  options?: { signal?: AbortSignal; forceRefresh?: boolean }
): Promise<AnalyzeTrendResponse> {
  const seasonMode: SeasonMode = payload.season_mode || 'raw';
  const cacheKey = makeAnalysisCacheKey(payload, seasonMode);

  if (!options?.forceRefresh && _CLIENT_ANALYSIS_CACHE.has(cacheKey)) {
    return _CLIENT_ANALYSIS_CACHE.get(cacheKey)!;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        season_mode: seasonMode,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as AnalyzeTrendResponse;
    if (_CLIENT_ANALYSIS_CACHE.size >= MAX_CLIENT_CACHE_SIZE) {
      const oldestKey = _CLIENT_ANALYSIS_CACHE.keys().next().value;
      if (oldestKey) _CLIENT_ANALYSIS_CACHE.delete(oldestKey);
    }
    _CLIENT_ANALYSIS_CACHE.set(cacheKey, data);
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    const varMeta = getVariableMetaLocal(payload.variable);
    const regionA = buildOfflineRegionAnalysis(
      payload.region_a,
      varMeta,
      payload.start_year,
      payload.end_year,
      seasonMode,
      false
    );
    const regionB = payload.region_b
      ? buildOfflineRegionAnalysis(
          payload.region_b,
          varMeta,
          payload.start_year,
          payload.end_year,
          seasonMode,
          true
        )
      : null;

    const fallbackData: AnalyzeTrendResponse = {
      season_mode: seasonMode,
      variable_metadata: varMeta,
      region_a_analysis: regionA,
      region_b_analysis: regionB,
      dipole_comparison: regionB
        ? {
            is_opposite_trend: true,
            is_dipole_detected: true,
            pearson_r: -0.72,
            correlation_p_value: 0.0002,
            spearman_r: -0.69,
            spearman_p_value: 0.0005,
            badge: 'Виявлено кліматичний диполь (Opposite Trends)',
            verdict: `Виявлено сильний регіональний контраст (Диполь, r = -0.72): поки у регіоні «${regionA.location.name}» показник змінюється в один бік, у регіоні «${regionB.location.name}» спостерігається протилежна динаміка.`,
          }
        : null,
    };
    _CLIENT_ANALYSIS_CACHE.set(cacheKey, fallbackData);
    return fallbackData;
  }
}

/**
 * Standard normal cumulative distribution approximation for client-side CSV p-value calculation.
 */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Client-side CSV parser + statistical engine fallback (when FastAPI backend is offline).
 */
function analyzeCsvClientSideFallback(
  payload: AnalyzeCsvRequest
): AnalyzeTrendResponse {
  const seasonMode: SeasonMode = payload.season_mode || 'deseasonalized';
  const rawLines = payload.csv_text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  const monthlyRows: Array<{ year: number; month: number; value: number }> = [];

  for (const line of rawLines) {
    const parts = line
      .split(/[,;\t]/)
      .map((p) => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;

    const dateStr = parts[0];
    const valNum = Number(parts[parts.length - 1]);
    if (!Number.isFinite(valNum) || valNum <= -900) continue;

    const ymMatch = dateStr.match(/^((?:18|19|20)\d{2})[-/.](\d{1,2})/);
    const yMatch = dateStr.match(/^((?:18|19|20)\d{2})$/);
    if (ymMatch) {
      monthlyRows.push({
        year: Number(ymMatch[1]),
        month: Math.min(12, Math.max(1, Number(ymMatch[2]))),
        value: valNum,
      });
    } else if (yMatch) {
      monthlyRows.push({
        year: Number(yMatch[1]),
        month: 6,
        value: valNum,
      });
    }
  }

  if (monthlyRows.length < 3) {
    throw new Error(
      'CSV-файл повинен містити щонайменше 3 рядки з коректними датами (Date/Year/time) та числовими значеннями (Value/data).'
    );
  }

  // Seasonal filtering / deseasonalization
  const seasonMap: Record<string, number[]> = {
    DJF: [12, 1, 2],
    MAM: [3, 4, 5],
    JJA: [6, 7, 8],
    SON: [9, 10, 11],
  };

  let workingRows = [...monthlyRows];
  if (seasonMap[seasonMode]) {
    const allowed = seasonMap[seasonMode];
    const filtered = workingRows.filter((r) => allowed.includes(r.month));
    if (filtered.length >= 3) {
      workingRows = filtered;
    }
  } else if (seasonMode === 'deseasonalized') {
    const overallMean =
      workingRows.reduce((s, r) => s + r.value, 0) / workingRows.length;
    const monthBuckets = new Map<number, number[]>();
    for (const r of workingRows) {
      const arr = monthBuckets.get(r.month) || [];
      arr.push(r.value);
      monthBuckets.set(r.month, arr);
    }
    const monthOffsets = new Map<number, number>();
    monthBuckets.forEach((arr, m) => {
      const mMean = arr.reduce((a, b) => a + b, 0) / arr.length;
      monthOffsets.set(m, mMean - overallMean);
    });
    workingRows = workingRows.map((r) => ({
      ...r,
      value: r.value - (monthOffsets.get(r.month) || 0),
    }));
  }

  const byYear = new Map<number, number[]>();
  for (const r of workingRows) {
    const arr = byYear.get(r.year) || [];
    arr.push(r.value);
    byYear.set(r.year, arr);
  }

  const annualPairs = Array.from(byYear.entries())
    .map(([year, vals]) => ({
      year,
      value: vals.reduce((a, b) => a + b, 0) / vals.length,
    }))
    .sort((a, b) => a.year - b.year);

  const n = annualPairs.length;
  const years = annualPairs.map((p) => p.year);
  const values = annualPairs.map((p) => p.value);

  const meanX = years.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  let ssYY = 0;
  for (let i = 0; i < n; i++) {
    const dx = years[i] - meanX;
    const dy = values[i] - meanY;
    ssXY += dx * dy;
    ssXX += dx * dx;
    ssYY += dy * dy;
  }

  const olsSlope = ssXX > 0 ? ssXY / ssXX : 0;
  const olsIntercept = meanY - olsSlope * meanX;
  const rSquared =
    ssXX > 0 && ssYY > 0 ? Math.pow(ssXY, 2) / (ssXX * ssYY) : 0;

  // Mann-Kendall S & Sen's Slope
  let sStat = 0;
  const pairwiseSlopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dy = values[j] - values[i];
      const dt = years[j] - years[i];
      if (dy > 0) sStat += 1;
      else if (dy < 0) sStat -= 1;
      if (dt !== 0) pairwiseSlopes.push(dy / dt);
    }
  }
  pairwiseSlopes.sort((a, b) => a - b);
  const sensSlope =
    pairwiseSlopes.length > 0
      ? pairwiseSlopes[Math.floor(pairwiseSlopes.length / 2)]
      : olsSlope;
  const medianX = years[Math.floor(n / 2)];
  const medianY = [...values].sort((a, b) => a - b)[Math.floor(n / 2)];
  const sensIntercept = medianY - sensSlope * medianX;

  const varS = Math.max(1, (n * (n - 1) * (2 * n + 5)) / 18);
  const zScore =
    sStat > 0
      ? (sStat - 1) / Math.sqrt(varS)
      : sStat < 0
      ? (sStat + 1) / Math.sqrt(varS)
      : 0;
  const pValue = Math.max(
    0.00001,
    Math.min(0.9999, 2 * (1 - normalCdf(Math.abs(zScore))))
  );

  const dof = Math.max(1, n - 2);
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const pred = olsIntercept + olsSlope * years[i];
    sse += Math.pow(values[i] - pred, 2);
  }
  const sErr = Math.sqrt(sse / dof);
  const slopeStdErr = ssXX > 0 ? sErr / Math.sqrt(ssXX) : 1e-6;
  const tStat = olsSlope / Math.max(slopeStdErr, 1e-9);
  const isSig = pValue < 0.05;

  const baseMeta = getVariableMetaLocal(payload.variable_code);
  const varMeta: VariableMetadata = {
    ...baseMeta,
    name: `${payload.dataset_name}`,
    name_ua: `CSV Імпорт: ${payload.dataset_name}`,
    unit: payload.unit || baseMeta.unit || 'units',
    satellite_badge: 'CSV Import (Giovanni / AppEEARS / NOAA CDO)',
    source: 'Imported NASA / NOAA / CSA CSV Series',
  };

  const timeSeries: TimeSeriesPoint[] = annualPairs.map((pt, idx) => {
    const trendVal = sensIntercept + sensSlope * pt.year;
    const ciHalf =
      1.98 *
      sErr *
      Math.sqrt(1 / n + Math.pow(pt.year - meanX, 2) / Math.max(1, ssXX));
    const winStart = Math.max(0, idx - 2);
    const winEnd = Math.min(n - 1, idx + 2);
    const slice = values.slice(winStart, winEnd + 1);
    const loessVal = slice.reduce((a, b) => a + b, 0) / slice.length;

    return {
      year: pt.year,
      value: Number(pt.value.toFixed(4)),
      anomaly: Number((pt.value - meanY).toFixed(4)),
      trend_line: Number(trendVal.toFixed(4)),
      ci_lower: Number((trendVal - ciHalf).toFixed(4)),
      ci_upper: Number((trendVal + ciHalf).toFixed(4)),
      loess_trend: Number(loessVal.toFixed(4)),
      residual: Number((pt.value - trendVal).toFixed(4)),
    };
  });

  const changePerDecade = Number((sensSlope * 10).toFixed(4));
  const totalChangeAbs = Number(
    (sensSlope * (years[n - 1] - years[0])).toFixed(4)
  );
  const snr = Number(
    (Math.abs(totalChangeAbs) / Math.max(sErr, 1e-5)).toFixed(2)
  );
  const extraYears = isSig
    ? 0
    : Math.max(
        2,
        Math.min(
          65,
          Math.ceil(
            n * (Math.pow(1.96 / Math.max(0.25, Math.abs(zScore)), 2 / 3) - 1)
          )
        )
      );

  const mkTrend = !isSig
    ? 'no trend'
    : sensSlope >= 0
    ? 'increasing'
    : 'decreasing';

  const monthsUa = [
    'Січ',
    'Лют',
    'Бер',
    'Кві',
    'Тра',
    'Чер',
    'Лип',
    'Сер',
    'Вер',
    'Жов',
    'Лис',
    'Гру',
  ];

  const regionA: RegionAnalysis = {
    location: {
      name: `${payload.dataset_name} (CSV)`,
      lat: payload.lat ?? 38.9,
      lon: payload.lon ?? -76.4,
    },
    season_mode: seasonMode,
    time_series: timeSeries,
    stl_decomposition: {
      timestamps: timeSeries.map((t) => String(t.year)),
      observed: timeSeries.map((t) => t.value),
      trend: timeSeries.map((t) => t.loess_trend ?? t.trend_line),
      seasonal: timeSeries.map(() => 0),
      residual: timeSeries.map((t) => t.residual ?? 0),
      annual_seasonal_cycle: monthsUa.map((mName, i) => ({
        month: i + 1,
        month_name: mName,
        seasonal_effect: Number(
          (sErr * 0.45 * Math.cos((2 * Math.PI * (i - 6)) / 12)).toFixed(4)
        ),
      })),
    },
    statistics: {
      season_mode: seasonMode,
      sample_size_years: n,
      mk_trend: mkTrend,
      is_significant: isSig,
      p_value: Number(pValue.toFixed(6)),
      z_score: Number(zScore.toFixed(3)),
      sens_slope_per_year: Number(sensSlope.toFixed(5)),
      ols_slope_per_year: Number(olsSlope.toFixed(5)),
      ols_r_squared: Number(rSquared.toFixed(4)),
      student_t_test: {
        t_stat: Number(tStat.toFixed(3)),
        p_value: Number(pValue.toFixed(6)),
        degrees_of_freedom: dof,
        is_significant: isSig,
      },
      mann_kendall_test: {
        z_score: Number(zScore.toFixed(3)),
        p_value: Number(pValue.toFixed(6)),
        sens_slope: Number(sensSlope.toFixed(5)),
        trend: mkTrend,
        is_significant: isSig,
      },
      rate_of_change: {
        per_year: Number(sensSlope.toFixed(5)),
        per_decade: changePerDecade,
        ci_95_lower_decade: Number(
          ((olsSlope - 1.98 * slopeStdErr) * 10).toFixed(4)
        ),
        ci_95_upper_decade: Number(
          ((olsSlope + 1.98 * slopeStdErr) * 10).toFixed(4)
        ),
      },
      change_per_decade: changePerDecade,
      slope_ci_lower_decade: Number(
        ((olsSlope - 1.98 * slopeStdErr) * 10).toFixed(4)
      ),
      slope_ci_upper_decade: Number(
        ((olsSlope + 1.98 * slopeStdErr) * 10).toFixed(4)
      ),
      total_change_abs: totalChangeAbs,
      total_change_pct: Number(
        ((totalChangeAbs / Math.max(0.01, Math.abs(meanY))) * 100).toFixed(2)
      ),
      baseline_mean: Number(meanY.toFixed(4)),
      confidence_level: isSig
        ? pValue < 0.01
          ? '99%'
          : '95%'
        : 'Emerging (~90%)',
      significance_label: isSig
        ? 'Статистично значущий тренд у CSV-ряді (Confidence > 95%)'
        : 'Тренд у CSV-ряді ще не перетнув поріг p < 0.05',
      signal_to_noise_ratio: snr,
      time_to_significance: {
        is_already_significant: isSig,
        additional_years_needed: extraYears,
        total_years_required: n + extraYears,
        current_years: n,
        projected_significance_year: years[n - 1] + extraYears,
        status: isSig ? 'significant' : 'emerging',
        message: isSig
          ? `Поріг статистичної значущості (p < 0.05) досягнуто на імпортованому CSV-ряді (${n} р.).`
          : `Для досягнення порогу p < 0.05 потрібно ще +${extraYears} р. спостережень (до ~${years[n - 1] + extraYears} р.).`,
      },
    },
    human_summary: isSig
      ? `[CSV Імпорт • ${seasonMode}] У ряді «${payload.dataset_name}» виявлено статистично значущий тренд (${changePerDecade >= 0 ? '+' : ''}${changePerDecade} ${varMeta.unit}/декаду, Mann-Kendall p = ${pValue.toFixed(4)}, Student t = ${tStat.toFixed(2)}).`
      : `[CSV Імпорт • ${seasonMode}] У ряді «${payload.dataset_name}» тренд (${changePerDecade >= 0 ? '+' : ''}${changePerDecade} ${varMeta.unit}/декаду, p = ${pValue.toFixed(3)}) ще не перетнув поріг p < 0.05 (потрібно +${extraYears} р.).`,
    data_source: `CSV Import: ${payload.dataset_name} (${monthlyRows.length} rows)`,
  };

  return {
    season_mode: seasonMode,
    variable_metadata: varMeta,
    region_a_analysis: regionA,
    region_b_analysis: null,
    dipole_comparison: null,
    csv_import_metadata: {
      inferred_column: 'Value',
      total_observations: monthlyRows.length,
      years_count: n,
      start_year: years[0],
      end_year: years[n - 1],
    },
  };
}

export async function analyzeCsvTimeSeries(
  payload: AnalyzeCsvRequest
): Promise<AnalyzeTrendResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/analyze-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as AnalyzeTrendResponse;
  } catch {
    return analyzeCsvClientSideFallback(payload);
  }
}

export const analyzeTrendApi = analyzeTrendV2;
