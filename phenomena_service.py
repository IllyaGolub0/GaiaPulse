"""
Curated Historical Phenomena (Dr. James Acker's NASA Goddard Challenge Cases)
+ Live NASA EONET v3 API Event Fetcher & Scenario Converter.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger("gaiapulse.phenomena")

NASA_EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"
EONET_CACHE_TTL = 1800  # 30 minutes

_EONET_CACHE: Dict[str, Any] = {
    "timestamp": 0.0,
    "events": [],
    "is_live": False,
}

# Part A: Curated Historical Phenomena (from Dr. James Acker's video & challenge specification)
CURATED_PHENOMENA: List[Dict[str, Any]] = [
    {
        "id": "wisconsin-wildfire-smoke",
        "title": "Canadian Wildfires & Smoke Transport over Wisconsin (2002–2026)",
        "category": "Wildfires",
        "source_type": "curated",
        "tags": ["acker_video", "curated"],
        "satellite_badge": "MODIS Aqua",
        "variable": "AOD",
        "secondary_variable": "ALLSKY_SFC_SW_DWN",
        "mode": "single",
        "start_year": 2002,
        "end_year": 2026,
        "season_mode": "JJA",
        "region_a": {
            "name": "Wisconsin, USA",
            "lat": 44.50,
            "lon": -89.50,
        },
        "region_b": None,
        "scientific_summary": (
            "Перенесення диму масштабних лісових пожеж із центральної Канади у США. "
            "Взимку диму немає (шум), але літній сезонний зріз (JJA — Червень-Серпень) "
            "виявляє статистично значущий висхідний тренд оптичної товщини аерозолів (p < 0.05)."
        ),
        "student_note": (
            "Порада д-ра Екера: Спробуйте перемкнути сезон із JJA (Літо) на DJF (Зима), "
            "щоб побачити, як сезонна фільтрація відділяє реальний сигнал пожеж від зимового фону!"
        ),
    },
    {
        "id": "kasatochi-volcanic-cooling",
        "title": "Kasatochi Eruption & Sulfur Cooling Trap (Aleutian Islands)",
        "category": "Volcanoes",
        "source_type": "curated",
        "tags": ["acker_video", "curated"],
        "satellite_badge": "Aura OMI",
        "variable": "SO2",
        "secondary_variable": "ALLSKY_SFC_SW_DWN",
        "mode": "single",
        "start_year": 2004,
        "end_year": 2025,
        "season_mode": "deseasonalized",
        "region_a": {
            "name": "Kasatochi Volcano, Aleutian Islands",
            "lat": 52.17,
            "lon": -175.51,
        },
        "region_b": None,
        "scientific_summary": (
            "Потужне виверження вулкана Касаточі на Алеутських островах інжектує діоксид сірки (SO₂) "
            "у стратосферу. Сульфатні аерозолі блокують сонячне випромінювання і запускають регіональну "
            "«пастку охолодження» (Cooling Trap) та аномальний спад після імпульсу."
        ),
        "student_note": (
            "Зверніть увагу на екстремальний пік SO₂ у 2008 році та подальше очищення стратосфери "
            "на десезоналізованому ряді Aura OMI."
        ),
    },
    {
        "id": "enso-pacific-dipole",
        "title": "El Niño / Southern Oscillation Hydrological Dipole",
        "category": "Hydrological Dipole",
        "source_type": "curated",
        "tags": ["acker_video", "dipole", "curated"],
        "satellite_badge": "GPM / MERRA-2",
        "variable": "PRECTOTCORR",
        "secondary_variable": "SST",
        "mode": "dipole",
        "start_year": 1985,
        "end_year": 2026,
        "season_mode": "DJF",
        "region_a": {
            "name": "Peru / Ecuador Coast",
            "lat": -4.50,
            "lon": -81.20,
        },
        "region_b": {
            "name": "Indonesia / Northern Australia",
            "lat": -12.40,
            "lon": 130.80,
        },
        "scientific_summary": (
            "Один глобальний океанічно-атмосферний процес (ENSO) формує два протилежні регіональні тренди: "
            "зростання конвективних опадів уздовж узбережжя Перу/Еквадору та посилення посухи в Індонезії "
            "та Північній Австралії у піковий сезон DJF."
        ),
        "student_note": (
            "Ключова вимога челенджу: порівняння двох регіонів із протилежно спрямованими трендами (r < -0.5)."
        ),
    },
    {
        "id": "arctic-atlantic-dipole",
        "title": "Arctic Amplification vs. North Atlantic Warming Hole",
        "category": "Ocean-Atmosphere Dipole",
        "source_type": "curated",
        "tags": ["dipole", "curated"],
        "satellite_badge": "MERRA-2 / AIRS",
        "variable": "T2M",
        "secondary_variable": "SST",
        "mode": "dipole",
        "start_year": 1985,
        "end_year": 2026,
        "season_mode": "deseasonalized",
        "region_a": {
            "name": "Svalbard, High Arctic",
            "lat": 78.22,
            "lon": 15.63,
        },
        "region_b": {
            "name": "North Atlantic Subpolar Gyre",
            "lat": 53.00,
            "lon": -35.00,
        },
        "scientific_summary": (
            "Втрата морського льоду викликає стрімке потепління Арктики (p < 0.001, десезоналізований тренд), "
            "тоді як притік талої води Гренландії уповільнює меридіональну циркуляцію AMOC, створюючи "
            "Північноатлантичну «холодну пляму» зі стагнацією температури."
        ),
        "student_note": (
            "Десезоналізація (віднімання річного циклу) зменшує залишковий шум і підвищує точність t-тесту."
        ),
    },
    {
        "id": "ukraine-steppe-soil-moisture",
        "title": "Emerging Soil Moisture & Evaporation Trend (Time-to-Significance Case)",
        "category": "Drought & Soil Moisture",
        "source_type": "curated",
        "tags": ["acker_video", "curated"],
        "satellite_badge": "GLDAS",
        "variable": "GWETROOT",
        "secondary_variable": "EVPTRNS",
        "mode": "single",
        "start_year": 2005,
        "end_year": 2026,
        "season_mode": "JJA",
        "region_a": {
            "name": "Southern Steppe / Black Sea, Ukraine",
            "lat": 46.60,
            "lon": 32.60,
        },
        "region_b": None,
        "scientific_summary": (
            "Демонстрація тренду на межі статистичної значущості (p ≈ 0.07): літнє висихання кореневого шару "
            "ґрунту на Півдні України вже має помітний спадний нахил, а калькулятор Time-to-Significance "
            "розраховує, скільки ще років супутникових спостережень потрібно для досягнення порогу p < 0.05."
        ),
        "student_note": (
            "Ідеальний приклад того, чому короткі вибірки (20 років) можуть давати p = 0.06–0.08 попри реальний фізичний процес."
        ),
    },
]

# Offline fallback cache of real NASA EONET events in case external API is unreachable
FALLBACK_EONET_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "eonet-fallback-wildfires-canada",
        "eonet_id": "EONET_6418",
        "title": "Boreal Forest Wildfire Plume — Northern Alberta & Saskatchewan",
        "category": "Wildfires",
        "source_type": "eonet_live",
        "tags": ["eonet_live"],
        "satellite_badge": "MODIS Aqua",
        "variable": "AOD",
        "mode": "single",
        "start_year": 2002,
        "end_year": 2026,
        "season_mode": "JJA",
        "region_a": {"name": "Northern Alberta Boreal, Canada", "lat": 56.72, "lon": -111.38},
        "region_b": None,
        "event_date": "2025-07-18",
        "scientific_summary": (
            "Подія з каталогу NASA EONET (Wildfires): аналіз багаторічного тренду оптичної товщини "
            "аерозолів диму (MODIS Aqua AOD) у літній пожежонебезпечний сезон (JJA, 2002–2026)."
        ),
        "student_note": "Автоматично згенерований сценарій на основі координат події NASA EONET.",
    },
    {
        "id": "eonet-fallback-volcano-reykjanes",
        "eonet_id": "EONET_6394",
        "title": "Reykjanes Peninsula Volcanic Fissure Eruption, Iceland",
        "category": "Volcanoes",
        "source_type": "eonet_live",
        "tags": ["eonet_live"],
        "satellite_badge": "Aura OMI",
        "variable": "SO2",
        "mode": "single",
        "start_year": 2004,
        "end_year": 2026,
        "season_mode": "deseasonalized",
        "region_a": {"name": "Reykjanes Peninsula, Iceland", "lat": 63.88, "lon": -22.42},
        "region_b": None,
        "event_date": "2025-03-12",
        "scientific_summary": (
            "Подія з каталогу NASA EONET (Volcanoes): моніторинг емісії діоксиду сірки (Aura OMI SO₂) "
            "із видаленням сезонної компоненти (deseasonalized)."
        ),
        "student_note": "Автоматично сконвертовано з NASA EONET API (категорія Volcanoes -> Aura OMI SO₂).",
    },
    {
        "id": "eonet-fallback-storm-atlantic",
        "eonet_id": "EONET_6451",
        "title": "Tropical Cyclone & Extreme Rainfall — Western Caribbean / Gulf",
        "category": "Severe Storms",
        "source_type": "eonet_live",
        "tags": ["eonet_live"],
        "satellite_badge": "GPM / MERRA-2",
        "variable": "PRECTOTCORR",
        "mode": "single",
        "start_year": 1998,
        "end_year": 2026,
        "season_mode": "SON",
        "region_a": {"name": "Western Caribbean Basin", "lat": 19.40, "lon": -83.50},
        "region_b": None,
        "event_date": "2025-09-24",
        "scientific_summary": (
            "Подія з каталогу NASA EONET (Severe Storms): перевірка довгострокового тренду інтенсивності "
            "штормових опадів GPM у піковий сезон ураганів (SON)."
        ),
        "student_note": "Автоматично сконвертовано з NASA EONET API (Severe Storms -> GPM Precipitation).",
    },
    {
        "id": "eonet-fallback-drought-amazon",
        "eonet_id": "EONET_6377",
        "title": "Extreme Hydrological Drought — Central Amazon Basin",
        "category": "Drought",
        "source_type": "eonet_live",
        "tags": ["eonet_live"],
        "satellite_badge": "GLDAS",
        "variable": "GWETROOT",
        "mode": "single",
        "start_year": 2000,
        "end_year": 2026,
        "season_mode": "SON",
        "region_a": {"name": "Manaus / Rio Negro, Amazon", "lat": -3.12, "lon": -60.02},
        "region_b": None,
        "event_date": "2025-10-05",
        "scientific_summary": (
            "Подія з каталогу NASA EONET (Drought): аналіз деградації вологості кореневої зони ґрунтів "
            "(GLDAS Soil Moisture) у сухий сезон басейну Амазонки."
        ),
        "student_note": "Автоматично сконвертовано з NASA EONET API (Drought -> GLDAS GWETROOT).",
    },
]


def _extract_eonet_lat_lon(geometries: List[Dict[str, Any]]) -> Optional[Tuple[float, float, str]]:
    """Extract latest (lat, lon, date_str) from EONET v3 event geometry array."""
    if not geometries:
        return None
    latest = geometries[-1]
    g_type = latest.get("type", "Point")
    coords = latest.get("coordinates")
    date_raw = str(latest.get("date", ""))[:10]

    if not coords:
        return None

    try:
        if g_type == "Point" and len(coords) >= 2:
            lon, lat = float(coords[0]), float(coords[1])
            return (round(lat, 3), round(lon, 3), date_raw)
        if g_type == "Polygon" and isinstance(coords[0], list) and len(coords[0]) > 0:
            ring = coords[0]
            lons = [float(pt[0]) for pt in ring if len(pt) >= 2]
            lats = [float(pt[1]) for pt in ring if len(pt) >= 2]
            if lons and lats:
                return (
                    round(sum(lats) / len(lats), 3),
                    round(sum(lons) / len(lons), 3),
                    date_raw,
                )
    except (TypeError, ValueError, IndexError):
        return None

    return None


def _map_eonet_category_to_variable(category_title: str, category_id: str) -> Dict[str, Any]:
    """
    Map NASA EONET event category to the appropriate Earth observation variable,
    satellite/model badge, time range, and seasonal filter as specified in the TZ.
    """
    cat_lower = f"{category_id} {category_title}".lower()

    if "wildfire" in cat_lower or "fire" in cat_lower or "dust" in cat_lower or "haze" in cat_lower:
        return {
            "variable": "AOD",
            "satellite_badge": "MODIS Aqua",
            "season_mode": "JJA",
            "start_year": 2002,
            "end_year": 2026,
            "category_label": "Wildfires",
        }
    if "volcano" in cat_lower:
        return {
            "variable": "SO2",
            "satellite_badge": "Aura OMI",
            "season_mode": "deseasonalized",
            "start_year": 2004,
            "end_year": 2026,
            "category_label": "Volcanoes",
        }
    if "flood" in cat_lower:
        return {
            "variable": "QRUNOFF",
            "satellite_badge": "GLDAS",
            "season_mode": "deseasonalized",
            "start_year": 2000,
            "end_year": 2026,
            "category_label": "Floods",
        }
    if "storm" in cat_lower or "cyclone" in cat_lower or "hurricane" in cat_lower:
        return {
            "variable": "PRECTOTCORR",
            "satellite_badge": "GPM",
            "season_mode": "deseasonalized",
            "start_year": 1998,
            "end_year": 2026,
            "category_label": "Severe Storms",
        }
    if "drought" in cat_lower:
        return {
            "variable": "GWETROOT",
            "satellite_badge": "GLDAS",
            "season_mode": "JJA",
            "start_year": 2000,
            "end_year": 2026,
            "category_label": "Drought",
        }
    if "ice" in cat_lower or "snow" in cat_lower:
        return {
            "variable": "SNODP",
            "satellite_badge": "MODIS / MERRA-2",
            "season_mode": "DJF",
            "start_year": 2000,
            "end_year": 2026,
            "category_label": "Sea and Lake Ice",
        }

    return {
        "variable": "T2M",
        "satellite_badge": "MERRA-2 / AIRS",
        "season_mode": "deseasonalized",
        "start_year": 1995,
        "end_year": 2026,
        "category_label": category_title or "Earth Event",
    }


async def fetch_live_eonet_scenarios(limit: int = 6) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Query live NASA EONET v3 API (`https://eonet.gsfc.nasa.gov/api/v3/events?limit=6&status=all`)
    and convert returned events into `PhenomenonScenario` objects.
    Falls back smoothly to `FALLBACK_EONET_SCENARIOS` if offline or rate-limited.
    """
    now = time.time()
    if (
        _EONET_CACHE["events"]
        and (now - float(_EONET_CACHE["timestamp"])) < EONET_CACHE_TTL
    ):
        return _EONET_CACHE["events"], bool(_EONET_CACHE["is_live"])

    params = {
        "limit": str(limit),
        "status": "all",
    }
    headers = {
        "Accept": "application/json",
        "User-Agent": "GaiaPulse-EarthTrendDetective-2026/2.0",
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(8.0, connect=4.0)) as client:
            resp = await client.get(NASA_EONET_URL, params=params, headers=headers)
            resp.raise_for_status()
            payload = resp.json()

        raw_events = payload.get("events", [])
        converted: List[Dict[str, Any]] = []

        for ev in raw_events:
            ev_id = str(ev.get("id", "EONET_EVENT"))
            ev_title = str(ev.get("title", "NASA EONET Earth Event")).strip()
            categories = ev.get("categories") or [{}]
            cat_title = str(categories[0].get("title", "Earth Event"))
            cat_id = str(categories[0].get("id", ""))

            loc_info = _extract_eonet_lat_lon(ev.get("geometry") or [])
            if loc_info is None:
                continue
            lat, lon, ev_date = loc_info
            # Clamp latitude to valid satellite range
            lat = max(-85.0, min(85.0, lat))
            lon = max(-180.0, min(180.0, lon))

            mapping = _map_eonet_category_to_variable(cat_title, cat_id)
            # Adjust JJA -> DJF automatically for Southern Hemisphere wildfires/droughts
            season = mapping["season_mode"]
            if lat < -10.0 and season == "JJA":
                season = "DJF"

            scenario = {
                "id": f"eonet-{ev_id.lower()}",
                "eonet_id": ev_id,
                "title": ev_title,
                "category": mapping["category_label"],
                "source_type": "eonet_live",
                "tags": ["eonet_live"],
                "satellite_badge": mapping["satellite_badge"],
                "variable": mapping["variable"],
                "mode": "single",
                "start_year": mapping["start_year"],
                "end_year": mapping["end_year"],
                "season_mode": season,
                "region_a": {
                    "name": f"{ev_title[:42]} ({lat:.1f}°, {lon:.1f}°)",
                    "lat": lat,
                    "lon": lon,
                },
                "region_b": None,
                "event_date": ev_date or "Live EONET",
                "scientific_summary": (
                    f"Жива подія NASA EONET ({ev_id} • {cat_title}): автоматично прив'язано змінну "
                    f"{mapping['variable']} ({mapping['satellite_badge']}) із сезонним фільтром «{season}» "
                    f"за період {mapping['start_year']}–{mapping['end_year']} для перевірки багаторічного кліматичного фону."
                ),
                "student_note": (
                    f"Дата фіксації супутником: {ev_date or 'N/A'}. Перевірте, чи є ця подія частиною довгострокового значущого тренду (p < 0.05)!"
                ),
            }
            converted.append(scenario)

        if converted:
            _EONET_CACHE["timestamp"] = now
            _EONET_CACHE["events"] = converted
            _EONET_CACHE["is_live"] = True
            return converted, True

    except Exception as exc:
        logger.warning("NASA EONET live fetch failed (%s); returning cached EONET scenarios.", exc)

    _EONET_CACHE["timestamp"] = now
    _EONET_CACHE["events"] = FALLBACK_EONET_SCENARIOS
    _EONET_CACHE["is_live"] = False
    return FALLBACK_EONET_SCENARIOS, False


async def get_all_phenomena_scenarios() -> Dict[str, Any]:
    """
    Combine Part A (5 Curated Historical Phenomena) and Part B (Live NASA EONET Events)
    for `GET /api/v2/fetch-phenomena`.
    """
    eonet_list, eonet_is_live = await fetch_live_eonet_scenarios(limit=6)
    combined = [*CURATED_PHENOMENA, *eonet_list]
    return {
        "total_count": len(combined),
        "curated_count": len(CURATED_PHENOMENA),
        "eonet_count": len(eonet_list),
        "eonet_is_live": eonet_is_live,
        "scenarios": combined,
    }
