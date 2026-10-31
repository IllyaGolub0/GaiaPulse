"""
Catalog of NASA Earth Observation Variables (MODIS, Aura OMI, MERRA-2, GLDAS, GPM, CERES)
and legacy presets router for GaiaPulse / Earth System Trend Detective v2.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["Presets & Metadata"])

VARIABLE_CATALOG: Dict[str, Dict[str, Any]] = {
    "T2M": {
        "code": "T2M",
        "name": "Surface Air Temperature (2m)",
        "name_ua": "Температура повітря (2 м)",
        "unit": "°C",
        "satellite_badge": "MERRA-2 / AIRS",
        "nasa_power_param": "T2M",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "description": (
            "Приземна температура повітря на висоті 2 метри (NASA MERRA-2 Reanalysis & Aqua AIRS)."
        ),
    },
    "PRECTOTCORR": {
        "code": "PRECTOTCORR",
        "name": "Precipitation Rate (Corrected)",
        "name_ua": "Інтенсивність опадів (GPM / MERRA-2)",
        "unit": "mm/day",
        "satellite_badge": "GPM / MERRA-2",
        "nasa_power_param": "PRECTOTCORR",
        "aggregation": "mean",
        "gibs_layer": "IMERG_Precipitation_Rate",
        "description": (
            "Середньодобова скоригована кількість опадів за супутниковими даними GPM IMERG та MERRA-2."
        ),
    },
    "GWETROOT": {
        "code": "GWETROOT",
        "name": "Root Zone Soil Moisture",
        "name_ua": "Вологість ґрунту в кореневій зоні",
        "unit": "fraction (0-1)",
        "satellite_badge": "GLDAS / SMAP",
        "nasa_power_param": "GWETROOT",
        "aggregation": "mean",
        "gibs_layer": "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
        "description": (
            "Відносна насиченість вологою кореневого шару ґрунту (0..1) за моделлю GLDAS та радаром SMAP."
        ),
    },
    "ALLSKY_SFC_SW_DWN": {
        "code": "ALLSKY_SFC_SW_DWN",
        "name": "Surface Shortwave Solar Radiation",
        "name_ua": "Сонячна радіація на поверхні",
        "unit": "W/m²",
        "satellite_badge": "CERES / FLASHFlux",
        "nasa_power_param": "ALLSKY_SFC_SW_DWN",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_CorrectedReflectance_TrueColor",
        "description": (
            "Потік короткохвильового сонячного випромінювання на поверхні Землі з урахуванням хмар та аерозолів."
        ),
    },
    "AOD": {
        "code": "AOD",
        "name": "Aerosol Optical Depth (550 nm)",
        "name_ua": "Оптична товщина аерозолів / Дим (AOD)",
        "unit": "AOD",
        "satellite_badge": "MODIS Aqua",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Aerosol",
        "description": (
            "Безрозмірний показник екстинкції сонячного світла димом лісових пожеж, пилом і сульфатами (MODIS Aqua 550nm)."
        ),
    },
    "SO2": {
        "code": "SO2",
        "name": "Sulfur Dioxide Column Amount",
        "name_ua": "Діоксид сірки в атмосфері (SO₂)",
        "unit": "DU",
        "satellite_badge": "Aura OMI",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Aerosol",
        "description": (
            "Загальний вміст діоксиду сірки у стовпі атмосфери в одиницях Добсона (Aura OMI Planetary/Stratospheric)."
        ),
    },
    "EVPTRNS": {
        "code": "EVPTRNS",
        "name": "Evapotranspiration Flux",
        "name_ua": "Евапотранспірація / Випаровування",
        "unit": "mm/day",
        "satellite_badge": "GLDAS",
        "nasa_power_param": "EVLAND",
        "aggregation": "mean",
        "gibs_layer": "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
        "description": (
            "Сумарне випаровування вологи з поверхні ґрунту та транспірація рослинності (GLDAS Noah)."
        ),
    },
    "QRUNOFF": {
        "code": "QRUNOFF",
        "name": "Surface & Subsurface Streamflow Runoff",
        "name_ua": "Річковий та поверхневий стік (Runoff)",
        "unit": "mm/day",
        "satellite_badge": "GLDAS",
        "nasa_power_param": None,
        "aggregation": "mean",
        "gibs_layer": "IMERG_Precipitation_Rate",
        "description": (
            "Інтенсивність поверхневого та підземного гідрологічного стоку (індикатор паводків GLDAS)."
        ),
    },
    "SNODP": {
        "code": "SNODP",
        "name": "Snow Depth & Cryosphere Cover",
        "name_ua": "Товщина снігового покриву",
        "unit": "m",
        "satellite_badge": "MODIS / MERRA-2",
        "nasa_power_param": "SNODP",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_NDSI_Snow_Cover",
        "description": (
            "Середня глибина снігового покриву на суходолі та льодовиках (MERRA-2 / MODIS Cryosphere)."
        ),
    },
    "SST": {
        "code": "SST",
        "name": "Sea / Skin Surface Temperature",
        "name_ua": "Температура поверхні океану / суші (SST/TS)",
        "unit": "°C",
        "satellite_badge": "GHRSST / MODIS",
        "nasa_power_param": "TS",
        "aggregation": "mean",
        "gibs_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "description": (
            "Радіаційна температура поверхні океану або верхнього шару суші (GHRSST / MERRA-2 Skin Temp)."
        ),
    },
}

DETECTIVE_CASES: List[Dict[str, Any]] = [
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
    """Legacy GET /api/presets endpoint."""
    return {
        "count": len(DETECTIVE_CASES),
        "presets": DETECTIVE_CASES,
        "available_variables": list(VARIABLE_CATALOG.values()),
    }


@router.get("/variables")
async def list_variables() -> Dict[str, Any]:
    """Return all supported NASA variables."""
    return {"variables": list(VARIABLE_CATALOG.values())}
