"""
Catalog of NASA & CSA Earth Observation Variables (MODIS, SeaWiFS, SWOT, CSA RADARSAT RCM,
Aura OMI, MERRA-2, GLDAS, GPM, CERES), Official Space Agency Resources Hub (13 resources),
and presets router for GaiaPulse / Earth System Trend Detective v2.
"""

from typing import Any, Dict, List
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Presets & Metadata"])

NASA_OFFICIAL_DISCLAIMER = (
    "Disclaimer: NASA does not endorse any non-U.S. Government entity and is not responsible "
    "for information contained on non-U.S. Government websites. For non-U.S. Government websites, "
    "participants must comply with any data use parameters of that specific website."
)

VARIABLE_CATALOG: Dict[str, Dict[str, Any]] = {
    "T2M": {
        "code": "T2M",
        "name": "Surface Air Temperature (2m)",
        "name_ua": "Температура повітря (2 м)",
        "unit": "°C",
        "satellite_badge": "MERRA-2 / AIRS",
        "source": "NASA MERRA-2 / Aqua AIRS / Giovanni",
        "nasa_power_param": "T2M",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "biomes": ["cryosphere", "desert", "rain_forest", "tidal_estuary"],
        "description": (
            "Приземна температура повітря на висоті 2 метри (NASA MERRA-2 Reanalysis & Aqua AIRS)."
        ),
        "student_definition": (
            "Приземна температура повітря на висоті 2 метри. Базовий показник для виявлення "
            "глобального потепління, арктичної ампліфікації та температурних диполів."
        ),
    },
    "PRECTOTCORR": {
        "code": "PRECTOTCORR",
        "name": "Precipitation Rate (Corrected)",
        "name_ua": "Інтенсивність опадів (GPM / MERRA-2)",
        "unit": "mm/day",
        "satellite_badge": "GPM / MERRA-2",
        "source": "NASA GPM IMERG / MERRA-2 / Giovanni",
        "nasa_power_param": "PRECTOTCORR",
        "aggregation": "mean",
        "gibs_layer": "IMERG_Precipitation_Rate",
        "biomes": ["rain_forest", "desert", "tidal_estuary"],
        "description": (
            "Середньодобова скоригована кількість опадів за супутниковими даними GPM IMERG та MERRA-2."
        ),
        "student_definition": (
            "Середньодобова кількість дощу та снігу з супутників GPM IMERG. Дозволяє відстежувати "
            "мусони, тропічні циклони та гідрологічні диполі Ель-Ніньйо (ENSO)."
        ),
    },
    "GWETROOT": {
        "code": "GWETROOT",
        "name": "Root Zone Soil Moisture",
        "name_ua": "Вологість ґрунту в кореневій зоні",
        "unit": "fraction (0-1)",
        "satellite_badge": "GLDAS / SMAP",
        "source": "NASA GES DISC Hydrology / GLDAS / SMAP",
        "nasa_power_param": "GWETROOT",
        "aggregation": "mean",
        "gibs_layer": "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
        "biomes": ["desert", "rain_forest"],
        "description": (
            "Відносна насиченість вологою кореневого шару ґрунту (0..1) за моделлю GLDAS та радаром SMAP."
        ),
        "student_definition": (
            "Частка води у кореневому шарі ґрунту (від 0 до 1). Прямий індикатор сільськогосподарських "
            "посух та деградації степових і лісових екосистем."
        ),
    },
    "ALLSKY_SFC_SW_DWN": {
        "code": "ALLSKY_SFC_SW_DWN",
        "name": "Surface Shortwave Solar Radiation",
        "name_ua": "Сонячна радіація на поверхні",
        "unit": "W/m²",
        "satellite_badge": "CERES / FLASHFlux",
        "source": "NASA CERES / FLASHFlux",
        "nasa_power_param": "ALLSKY_SFC_SW_DWN",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_CorrectedReflectance_TrueColor",
        "biomes": ["desert", "cryosphere", "rain_forest"],
        "description": (
            "Потік короткохвильового сонячного випромінювання на поверхні Землі з урахуванням хмар та аерозолів."
        ),
        "student_definition": (
            "Енергія сонячного світла, що досягає поверхні Землі крізь хмари, дим пожеж та вулканічні сульфатні аерозолі."
        ),
    },
    "AOD": {
        "code": "AOD",
        "name": "Aerosol Optical Depth (550 nm)",
        "name_ua": "Оптична товщина аерозолів / Дим (AOD)",
        "unit": "AOD",
        "satellite_badge": "MODIS Aqua",
        "source": "NASA MODIS Aqua / Giovanni",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Aerosol",
        "biomes": ["rain_forest", "desert"],
        "description": (
            "Безрозмірний показник екстинкції сонячного світла димом лісових пожеж, пилом і сульфатами (MODIS Aqua 550nm)."
        ),
        "student_definition": (
            "Міра замутнення атмосфери димом лісових пожеж, пустельним пилом та промисловим смогом за даними MODIS Aqua."
        ),
    },
    "SO2": {
        "code": "SO2",
        "name": "Sulfur Dioxide Column Amount",
        "name_ua": "Діоксид сірки в атмосфері (SO₂)",
        "unit": "DU",
        "satellite_badge": "Aura OMI",
        "source": "NASA Aura OMI / Giovanni",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Aerosol",
        "biomes": ["cryosphere", "desert"],
        "description": (
            "Загальний вміст діоксиду сірки у стовпі атмосфери в одиницях Добсона (Aura OMI Planetary/Stratospheric)."
        ),
        "student_definition": (
            "Концентрація вулканічного газу SO₂ у стовпі атмосфери. У стратосфері перетворюється на краплі сірчаної кислоти, що відбивають сонячне світло."
        ),
    },
    "EVPTRNS": {
        "code": "EVPTRNS",
        "name": "Evapotranspiration Flux",
        "name_ua": "Евапотранспірація / Випаровування",
        "unit": "mm/day",
        "satellite_badge": "GLDAS",
        "source": "NASA GES DISC Hydrology / GLDAS",
        "nasa_power_param": "EVLAND",
        "aggregation": "mean",
        "gibs_layer": "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
        "biomes": ["rain_forest", "desert"],
        "description": (
            "Сумарне випаровування вологи з поверхні ґрунту та транспірація рослинності (GLDAS Noah)."
        ),
        "student_definition": (
            "Сумарний потік водяної пари, який піднімається в атмосферу з поверхні ґрунту та листя рослин."
        ),
    },
    "QRUNOFF": {
        "code": "QRUNOFF",
        "name": "Surface & Subsurface Streamflow Runoff",
        "name_ua": "Річковий та поверхневий стік (Runoff)",
        "unit": "mm/day",
        "satellite_badge": "GLDAS",
        "source": "NASA GES DISC Hydrology Time Series / GLDAS",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "IMERG_Precipitation_Rate",
        "biomes": ["tidal_estuary", "rain_forest"],
        "description": (
            "Інтенсивність поверхневого та підземного гідрологічного стоку (індикатор паводків та виносу біогенів у прибережні води)."
        ),
        "student_definition": (
            "Обсяг талої та дощової води, що стікає по поверхні суходолу у річки та естуарії, переносячи поживні речовини до океану."
        ),
    },
    "SNODP": {
        "code": "SNODP",
        "name": "Snow Depth & Cryosphere Cover",
        "name_ua": "Товщина снігового покриву",
        "unit": "m",
        "satellite_badge": "MODIS / MERRA-2",
        "source": "NASA MODIS / MERRA-2 Cryosphere",
        "nasa_power_param": "SNODP",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_NDSI_Snow_Cover",
        "biomes": ["cryosphere"],
        "description": (
            "Середня глибина снігового покриву на суходолі та льодовиках (MERRA-2 / MODIS Cryosphere)."
        ),
        "student_definition": (
            "Висота снігового покриву, що визначає альбедо (відбивну здатність) полярних і гірських регіонів."
        ),
    },
    "SST": {
        "code": "SST",
        "name": "Sea / Skin Surface Temperature",
        "name_ua": "Температура поверхні океану / суші (SST/TS)",
        "unit": "°C",
        "satellite_badge": "GHRSST / MODIS",
        "source": "NASA GHRSST / MODIS Aqua",
        "nasa_power_param": "TS",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "biomes": ["tidal_estuary", "cryosphere"],
        "description": (
            "Радіаційна температура поверхні океану або верхнього шару суші (GHRSST / MERRA-2 Skin Temp)."
        ),
        "student_definition": (
            "Температура верхнього міліметрового шару океану з інфрачервоних супутників, що керує штормами й кораловими рифами."
        ),
    },
    "SEAWIFS_CHLA": {
        "code": "SEAWIFS_CHLA",
        "name": "Coastal & Estuarine Chlorophyll-a (SeaWiFS / MODIS Aqua)",
        "name_ua": "Прибережний хлорофіл-а (SeaWiFS / MODIS Aqua)",
        "unit": "mg/m³",
        "satellite_badge": "NASA SeaWiFS / MODIS / Giovanni",
        "source": "NASA SeaWiFS / MODIS / Giovanni",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_CorrectedReflectance_TrueColor",
        "biomes": ["tidal_estuary"],
        "description": (
            "Концентрація хлорофілу-a у прибережних водах та естуаріях (NASA SeaWiFS / MODIS Aqua Ocean Color в системі Giovanni)."
        ),
        "student_definition": (
            "Концентрація хлорофілу у прибережних водах і гирлах річок (естуаріях). "
            "Показує, як річковий стік і добрива з полів викликають цвітіння водоростей."
        ),
    },
    "SWOT_WSE": {
        "code": "SWOT_WSE",
        "name": "Water Surface Elevation — Lakes, Rivers & Reservoirs (SWOT Mission)",
        "name_ua": "Висота водної поверхні озер та річок (SWOT WSE)",
        "unit": "m (meters above reference ellipsoid)",
        "satellite_badge": "NASA / CNES / CSA SWOT Satellite",
        "source": "NASA / CNES / CSA SWOT Satellite",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_CorrectedReflectance_Bands721",
        "biomes": ["tidal_estuary", "rain_forest", "desert"],
        "description": (
            "Висота водної поверхні (Water Surface Elevation) озер, річок, водосховищ та естуаріїв за даними радарної інтерферометрії KaRIn місії SWOT (NASA/CNES/CSA)."
        ),
        "student_definition": (
            "Висота водної поверхні річок, озер та водосховищ із космосу. Місія SWOT покриває 90% "
            "поверхневих вод Землі і дозволяє бачити обміління або наповнення водойм."
        ),
    },
    "RCM_SAR_BACKSCATTER": {
        "code": "RCM_SAR_BACKSCATTER",
        "name": "SAR Surface Moisture, Flood & Sea Ice Index (RADARSAT Constellation Mission)",
        "name_ua": "Радарний індекс льоду, повеней та вологості (CSA RADARSAT SAR)",
        "unit": "dB (SAR Backscatter σ°)",
        "satellite_badge": "CSA RADARSAT (RCM) / Geo.ca",
        "source": "CSA RADARSAT (RCM) / Geo.ca",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_NDSI_Snow_Cover",
        "biomes": ["cryosphere", "tidal_estuary"],
        "description": (
            "Нормалізований радарний зворотний розсіювальний сигнал (SAR Backscatter σ°, C-band) сузір'я CSA RADARSAT Constellation Mission (RCM)."
        ),
        "student_definition": (
            "Радар із синтезованою апертурою (SAR) бачить крізь хмари та вночі, відстежуючи танення морського льоду, "
            "межі боліт, вологість полів та розливи річок у Канаді й світі."
        ),
    },
}

OFFICIAL_RESOURCES_CATALOG: List[Dict[str, Any]] = [
    # Category 1: NASA Data & Resources
    {
        "id": "nasa-giovanni",
        "number": 1,
        "category": "nasa_data",
        "category_label": "NASA Data & Resources",
        "title": "NASA Giovanni",
        "agency_badge": "NASA GSFC / GES DISC",
        "is_us_gov": True,
        "url": "https://giovanni.gsfc.nasa.gov/giovanni/",
        "role_in_app": (
            "Базове джерело часових рядів супутникових змінних (MODIS AOD, SeaWiFS, AIRS, OMI, GPM)."
        ),
        "supported_variables": ["AOD", "SEAWIFS_CHLA", "SO2", "T2M", "PRECTOTCORR"],
    },
    {
        "id": "ges-disc-hydrology",
        "number": 2,
        "category": "nasa_data",
        "category_label": "NASA Data & Resources",
        "title": "GES DISC Hydrology Time Series",
        "agency_badge": "NASA GES DISC",
        "is_us_gov": True,
        "url": "https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series",
        "role_in_app": (
            "Джерело гідрологічних рядів GLDAS/NLDAS (вологість ґрунту, випаровування, річковий стік)."
        ),
        "supported_variables": ["GWETROOT", "EVPTRNS", "QRUNOFF"],
    },
    {
        "id": "nasa-appeears",
        "number": 3,
        "category": "nasa_data",
        "category_label": "NASA Data & Resources",
        "title": "NASA AppEEARS",
        "agency_badge": "NASA LP DAAC / Earthdata",
        "is_us_gov": True,
        "url": "https://appeears.earthdatacloud.nasa.gov/",
        "role_in_app": (
            "Трансформація та вивантаження геопросторових часових рядів для конкретних точок і полігонів."
        ),
        "supported_variables": ["T2M", "SST", "SNODP", "AOD", "SEAWIFS_CHLA"],
    },
    {
        "id": "noaa-cdo",
        "number": 4,
        "category": "nasa_data",
        "category_label": "NASA Data & Resources",
        "title": "NOAA Climate Data Online (CDO)",
        "agency_badge": "NOAA NCEI",
        "is_us_gov": True,
        "url": "https://www.ncei.noaa.gov/cdo-web/",
        "role_in_app": (
            "Історичні дані метеостанцій для валідації супутникових трендів."
        ),
        "supported_variables": ["T2M", "PRECTOTCORR", "SNODP"],
    },
    {
        "id": "nasa-ntrs-seawifs-paper",
        "number": 5,
        "category": "nasa_data",
        "category_label": "NASA Data & Resources",
        "title": "NASA NTRS Research Paper (SeaWiFS Chlorophyll Time-Series)",
        "agency_badge": "NASA NTRS • Dr. James Acker",
        "is_us_gov": True,
        "url": "https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf",
        "role_in_app": (
            "Еталонна методологія побудови часових рядів та перевірки значущості трендів у прибережних естуаріях."
        ),
        "supported_variables": ["SEAWIFS_CHLA", "QRUNOFF"],
    },
    # Category 2: Space Agency Partner & Methodology Resources
    {
        "id": "knmi-climate-explorer",
        "number": 6,
        "category": "partner_methodology",
        "category_label": "Space Agency Partner & Methodology Resources",
        "title": "KNMI Climate Explorer (Royal Netherlands Meteorological Institute)",
        "agency_badge": "KNMI Netherlands",
        "is_us_gov": False,
        "url": "https://climexp.knmi.nl/",
        "role_in_app": (
            "Референсна платформа для кліматичної кореляції та аналізу диполів."
        ),
        "supported_variables": ["T2M", "PRECTOTCORR", "SST"],
    },
    {
        "id": "statistical-test-methods-medium",
        "number": 7,
        "category": "partner_methodology",
        "category_label": "Space Agency Partner & Methodology Resources",
        "title": "Statistical Test Methods to Detect Trends in Time Series Data",
        "agency_badge": "Statistical Methodology",
        "is_us_gov": False,
        "url": "https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b",
        "role_in_app": (
            "Теоретична база нашого статистичного рушія (тест Манна-Кендалла, нахил Сена, t-тест)."
        ),
        "supported_variables": [],
    },
    {
        "id": "statsig-statistical-significance",
        "number": 8,
        "category": "partner_methodology",
        "category_label": "Space Agency Partner & Methodology Resources",
        "title": "A Comprehensive Guide to Statistical Significance",
        "agency_badge": "Statsig Education",
        "is_us_gov": False,
        "url": "https://www.statsig.com/perspectives/a-comprehensive-guide-to-statistical-significance",
        "role_in_app": (
            "Освітній гайд для студентів щодо інтерпретації p-value < 0.05 та довірчих інтервалів."
        ),
        "supported_variables": [],
    },
    # Category 3: CSA (Canadian Space Agency) Resources
    {
        "id": "csa-rcm-data",
        "number": 9,
        "category": "csa_resources",
        "category_label": "CSA (Canadian Space Agency) Resources",
        "title": "RADARSAT Constellation Mission (RCM) Data",
        "agency_badge": "CSA / ASC Canada",
        "is_us_gov": False,
        "url": "https://donnees-data.asc-csa.gc.ca/en/dataset/rcm",
        "role_in_app": (
            "Цілодобовий всепогодний SAR-моніторинг морського льоду, повеней, боліт та узбережжя."
        ),
        "supported_variables": ["RCM_SAR_BACKSCATTER", "SNODP"],
    },
    {
        "id": "canada-geoca",
        "number": 10,
        "category": "csa_resources",
        "category_label": "CSA (Canadian Space Agency) Resources",
        "title": "Geo.ca (Canada's Open Geospatial Information)",
        "agency_badge": "Geo.ca • NRCan / CSA",
        "is_us_gov": False,
        "url": "http://geo.ca/",
        "role_in_app": (
            "Регіональні екологічні та просторові дані Канади (лісові пожежі, водні ресурси)."
        ),
        "supported_variables": ["RCM_SAR_BACKSCATTER", "AOD", "SWOT_WSE"],
    },
    {
        "id": "csa-swot-mission",
        "number": 11,
        "category": "csa_resources",
        "category_label": "CSA (Canadian Space Agency) Resources",
        "title": "SWOT Mission (Surface Water and Ocean Topography)",
        "agency_badge": "NASA / CNES / CSA",
        "is_us_gov": False,
        "url": "https://www.asc-csa.gc.ca/eng/satellites/swot/",
        "role_in_app": (
            "Вимірювання змін висоти водної поверхні 90% озер, річок, водосховищ та океанів."
        ),
        "supported_variables": ["SWOT_WSE", "QRUNOFF"],
    },
    {
        "id": "csa-monitoring-ecosystems",
        "number": 12,
        "category": "csa_resources",
        "category_label": "CSA (Canadian Space Agency) Resources",
        "title": "Monitoring and Protecting Our Ecosystem from Space (CSA)",
        "agency_badge": "CSA / ASC Education",
        "is_us_gov": False,
        "url": "https://www.asc-csa.gc.ca/eng/satellites/everyday-lives/monitoring-and-protecting-our-ecosystems-from-space.asp",
        "role_in_app": (
            "Освітній контекст для школярів та студентів про захист екосистем за допомогою супутників."
        ),
        "supported_variables": ["SEAWIFS_CHLA", "SWOT_WSE", "RCM_SAR_BACKSCATTER"],
    },
    {
        "id": "csa-sar-python-tutorial",
        "number": 13,
        "category": "csa_resources",
        "category_label": "CSA (Canadian Space Agency) Resources",
        "title": "Synthetic Aperture Radar (SAR) Python Tutorial (CSA GitHub)",
        "agency_badge": "CSA GitHub • Python SAR",
        "is_us_gov": False,
        "url": "https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial",
        "role_in_app": (
            "Інтеграція методів обробки SAR-знімків на Python для аналізу поверхневих змін."
        ),
        "supported_variables": ["RCM_SAR_BACKSCATTER"],
    },
]

DETECTIVE_CASES: List[Dict[str, Any]] = [
    {
        "id": "ackers-seawifs-coastal-study",
        "title": "River-Influenced Coastal Chlorophyll Trend (SeaWiFS / MODIS)",
        "subtitle": "Гирло Міссісіпі / Чесапікська затока vs Відкритий шельф (NTRS 20090042747)",
        "mode": "dipole",
        "variable": "SEAWIFS_CHLA",
        "start_year": 1998,
        "end_year": 2026,
        "season_mode": "JJA",
        "physical_process": (
            "Річковий стік (QRUNOFF із GES DISC Hydrology) виносить нітрати та фосфати з аграрних басейнів "
            "у прибережні естуарії, стимулюючи інтенсивне цвітіння фітопланктону (SEAWIFS_CHLA у системі Giovanni), "
            "тоді як відкритий шельф Мексиканської затоки демонструє протилежну оліготрофну динаміку."
        ),
        "expected_finding": (
            "Статистично значуще зростання хлорофілу-а у гирлі річки (p < 0.01) на противагу стабільному/східному тренду відкритого шельфу."
        ),
        "region_a": {"name": "Mississippi River Plume / Chesapeake Estuary", "lat": 29.15, "lon": -89.25},
        "region_b": {"name": "Open Gulf of Mexico Shelf", "lat": 26.0, "lon": -90.0},
    },
    {
        "id": "csa-swot-radarsat-water-ice",
        "title": "Canadian Boreal Lakes & Arctic Sea Ice Shift (CSA SWOT + RCM + Geo.ca)",
        "subtitle": "Північна Канада / Гудзонова затока (SWOT WSE & RADARSAT SAR)",
        "mode": "single",
        "variable": "SWOT_WSE",
        "start_year": 2002,
        "end_year": 2026,
        "season_mode": "deseasonalized",
        "physical_process": (
            "Поєднання радарної альтиметрії SWOT (Water Surface Elevation) та всепогодного C-band радару "
            "CSA RADARSAT Constellation Mission (RCM) фіксує зміни рівня бореальних озер та скорочення льодового покриву Гудзонової затоки."
        ),
        "expected_finding": (
            "Статистично значущий тренд зміни висоти водної поверхні (SWOT_WSE) та радарного зворотного розсіювання (RCM_SAR_BACKSCATTER, p < 0.01)."
        ),
        "region_a": {"name": "Northern Canada / Hudson Bay (CSA Monitor)", "lat": 58.76, "lon": -94.17},
        "region_b": {"name": "Mackenzie Delta, Arctic Canada", "lat": 68.85, "lon": -134.50},
    },
    {
        "id": "enso-pacific-dipole",
        "title": "El Niño / Southern Oscillation Hydrological Dipole",
        "subtitle": "Перу / Еквадор vs Індонезія / Північна Австралія",
        "mode": "dipole",
        "variable": "PRECTOTCORR",
        "start_year": 1985,
        "end_year": 2026,
        "season_mode": "DJF",
        "physical_process": (
            "Перебудова тихоокеанської циркуляції Вокера зміщує конвективні зливи до узбережжя Перу/Еквадору, "
            "одночасно викликаючи посуху в Індонезії та Північній Австралії."
        ),
        "expected_finding": (
            "Протилежні статистично значущі тренди опадів у зимовий сезон DJF (r < -0.5)."
        ),
        "region_a": {"name": "Peru / Ecuador Coast", "lat": -4.5, "lon": -81.2},
        "region_b": {"name": "Indonesia / Northern Australia", "lat": -12.4, "lon": 130.8},
    },
    {
        "id": "arctic-atlantic-dipole",
        "title": "Arctic Amplification vs. North Atlantic Warming Hole",
        "subtitle": "Шпіцберген (Арктика) vs Субполярна Північна Атлантика (AMOC)",
        "mode": "dipole",
        "variable": "T2M",
        "start_year": 1985,
        "end_year": 2026,
        "season_mode": "deseasonalized",
        "physical_process": (
            "Зменшення площі морського льоду прискорює потепління Арктики, тоді як прісна тала вода Гренландії "
            "послаблює меридіональну циркуляцію океану AMOC, утворюючи зону стагнації/охолодження."
        ),
        "expected_finding": (
            "Стрімке потепління на Шпіцбергені (p < 0.001) проти стагнації в Північній Атлантиці."
        ),
        "region_a": {"name": "Svalbard, Arctic", "lat": 78.22, "lon": 15.63},
        "region_b": {"name": "North Atlantic Warming Hole", "lat": 53.0, "lon": -35.0},
    },
    {
        "id": "wisconsin-wildfire-smoke",
        "title": "Canadian Wildfires & Smoke Transport over Wisconsin",
        "subtitle": "Сезонне перенесення диму з Канади у Вісконсин (MODIS Aqua AOD)",
        "mode": "single",
        "variable": "AOD",
        "start_year": 2002,
        "end_year": 2026,
        "season_mode": "JJA",
        "physical_process": (
            "Масштабні бореальні пожежі в Канаді викидають аерозолі диму, які північно-західними вітрами "
            "переносяться над Вісконсином виключно в літній сезон (JJA)."
        ),
        "expected_finding": (
            "Статистично значущий висхідний тренд оптичної товщини аерозолів влітку (JJA, p < 0.05) при відсутності тренду взимку."
        ),
        "region_a": {"name": "Wisconsin, USA", "lat": 44.5, "lon": -89.5},
        "region_b": {"name": "Central Canada Boreal Source", "lat": 54.0, "lon": -105.0},
    },
]


def get_variable_metadata(variable_code: str) -> Dict[str, Any]:
    """Return metadata for a requested climate variable code."""
    code = variable_code.strip().upper()
    if code not in VARIABLE_CATALOG:
        raise ValueError(
            f"Unsupported variable '{variable_code}'. "
            f"Supported variables: {', '.join(VARIABLE_CATALOG.keys())}"
        )
    return VARIABLE_CATALOG[code]


@router.get("/presets")
async def list_presets() -> Dict[str, Any]:
    """GET /api/presets endpoint returning quick presets, variables, and official resources."""
    return {
        "count": len(DETECTIVE_CASES),
        "presets": DETECTIVE_CASES,
        "available_variables": list(VARIABLE_CATALOG.values()),
        "official_resources": OFFICIAL_RESOURCES_CATALOG,
        "disclaimer": NASA_OFFICIAL_DISCLAIMER,
    }


@router.get("/variables")
async def list_variables() -> Dict[str, Any]:
    """Return all 13 supported NASA & CSA variables."""
    return {"variables": list(VARIABLE_CATALOG.values())}


@router.get("/v2/resources")
async def list_official_resources() -> Dict[str, Any]:
    """Return all 13 Official NASA, NOAA, KNMI, and CSA Space Agency Resources."""
    return {
        "total_count": len(OFFICIAL_RESOURCES_CATALOG),
        "resources": OFFICIAL_RESOURCES_CATALOG,
        "disclaimer": NASA_OFFICIAL_DISCLAIMER,
    }
