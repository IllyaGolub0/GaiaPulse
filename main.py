"""
GaiaPulse / Earth System Trend Detective v2 — FastAPI Backend Server
NASA Space Apps Challenge 2026 ("Be an Earth System Trend Detective", Dr. James Acker — NASA Goddard)

Endpoints:
- GET  /api/v2/fetch-phenomena : Curated Historical Phenomena (Part A) + Live NASA EONET API Events (Part B)
- POST /api/v2/analyze         : Seasonal/Deseasonalized Trend Engine (t-test, Mann-Kendall, 95% CI, Time-to-Significance)
- POST /api/v2/analyze-csv     : Import & Analyze CSV Time-Series from NASA Giovanni, AppEEARS, GES DISC, or NOAA CDO
- GET  /api/v2/resources       : Official 13 NASA, NOAA, KNMI & CSA Space Agency Resources Hub + Disclaimer
- POST /api/analyze-trend      : Legacy v1 alias pointing to the v2 mathematical engine
- GET  /api/presets            : Quick preset cases & variable catalog
- GET  /api/variables          : Full catalog of 13 NASA & CSA satellite/reanalysis variables
"""

from __future__ import annotations

import asyncio
import csv
import io
import logging
import math
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator

from nasa_client import clear_cache, fetch_climate_series, get_cache_stats
from phenomena_service import get_all_phenomena_scenarios
from presets import (
    NASA_OFFICIAL_DISCLAIMER,
    OFFICIAL_RESOURCES_CATALOG,
    VARIABLE_CATALOG,
    get_variable_metadata,
    router as presets_router,
)
from statistics_engine import (
    analyze_single_region,
    compare_dipole_regions,
    normalize_season_mode,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("gaiapulse.main")

app = FastAPI(
    title="GaiaPulse — NASA Earth System Trend Detective API v2",
    description=(
        "Інтерактивна геопросторова аналітична платформа для NASA Space Apps Challenge 2026: "
        "каталог історичних феноменів д-ра Джеймса Екера та CSA (SWOT / RADARSAT), живі події NASA EONET v3, "
        "імпорт CSV із NASA Giovanni / AppEEARS / NOAA CDO, сезонна фільтрація (raw, deseasonalized, DJF, MAM, JJA, SON), "
        "Student's t-test, Mann-Kendall, Sen's Slope, 95% CI, STL-декомпозиція та Time-to-Significance Calculator."
    ),
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(presets_router)

SeasonModeLiteral = Literal["raw", "deseasonalized", "DJF", "MAM", "JJA", "SON"]


class RegionLocationInput(BaseModel):
    """Coordinates and human-readable label for a target geographical point."""

    name: Optional[str] = Field(
        default=None,
        description="Назва регіону або досліджуваної локації",
        examples=["Wisconsin, USA"],
    )
    lat: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Географічна широта (-90..90)",
        examples=[44.5],
    )
    lon: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Географічна довгота (-180..180)",
        examples=[-89.5],
    )

    def resolved_name(self, fallback_prefix: str = "Region") -> str:
        if self.name and self.name.strip():
            return self.name.strip()
        return f"{fallback_prefix} ({self.lat:.2f}°, {self.lon:.2f}°)"


class AnalyzeTrendRequestV2(BaseModel):
    """Request contract for POST /api/v2/analyze (and POST /api/analyze-trend)."""

    variable: str = Field(
        default="T2M",
        description=(
            "Код змінної NASA/CSA: T2M, PRECTOTCORR, GWETROOT, ALLSKY_SFC_SW_DWN, "
            "AOD, SO2, EVPTRNS, QRUNOFF, SNODP, SST, SEAWIFS_CHLA, SWOT_WSE, RCM_SAR_BACKSCATTER"
        ),
        examples=["AOD"],
    )
    start_year: int = Field(
        default=1985,
        ge=1981,
        le=2025,
        description="Початковий рік аналізу (>= 1981)",
        examples=[2002],
    )
    end_year: int = Field(
        default=2026,
        ge=1985,
        le=2026,
        description="Кінцевий рік аналізу (<= 2026)",
        examples=[2026],
    )
    season_mode: str = Field(
        default="raw",
        description="Режим сезонної фільтрації: raw, deseasonalized, DJF, MAM, JJA, SON",
        examples=["JJA"],
    )
    region_a: RegionLocationInput = Field(
        ...,
        description="Основний досліджуваний регіон (Точка А)",
    )
    region_b: Optional[RegionLocationInput] = Field(
        default=None,
        description="Опціональний другий регіон для режиму Dipole Comparison (Точка Б)",
    )
    prefer_live_api: bool = Field(
        default=True,
        description="Використовувати живий запит до NASA POWER API з автоматичним fallback",
    )

    @model_validator(mode="after")
    def validate_year_window(self) -> "AnalyzeTrendRequestV2":
        if self.end_year - self.start_year < 4:
            raise ValueError(
                "Часовий діапазон (end_year - start_year) має становити щонайменше 5 років "
                "для коректного розрахунку статистичної значущості."
            )
        self.season_mode = normalize_season_mode(self.season_mode)
        return self


class AnalyzeCsvRequestV2(BaseModel):
    """Request contract for POST /api/v2/analyze-csv (Giovanni / AppEEARS / NOAA CDO CSV import)."""

    csv_text: str = Field(
        ...,
        min_length=10,
        description="Сирі текстові дані CSV-файлу з колонками Date/Year/time та Value/data",
    )
    dataset_name: str = Field(
        default="Imported NASA/NOAA CSV Series",
        description="Назва файлу або датасету (наприклад, Giovanni MODIS AOD / NOAA CDO)",
    )
    variable_code: str = Field(
        default="AOD",
        description="Код змінної або власна назва показника",
    )
    unit: Optional[str] = Field(
        default=None,
        description="Одиниця вимірювання (опціонально)",
    )
    season_mode: str = Field(
        default="deseasonalized",
        description="Сезонний фільтр: raw, deseasonalized, DJF, MAM, JJA, SON",
    )
    lat: float = Field(default=38.90, ge=-90.0, le=90.0)
    lon: float = Field(default=-76.40, ge=-180.0, le=180.0)


def _parse_scientific_csv_text(csv_text: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Parse CSV files exported from NASA Giovanni, AppEEARS, GES DISC Hydrology Time Series, or NOAA CDO.
    Supports:
    - Preamble comment lines starting with `#` or metadata key-value lines before the tabular header
    - Date formats: `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, `YYYY/MM/DD`, `YYYYMM`, ISO timestamps, or separate `Year` & `Month` columns
    - Value columns named `Value`, `data`, `mean`, variable codes, or the first numeric column after Date
    - Automatic filtering of NASA/NOAA fill values (`-9999`, `-999.9`, `NaN`, `null`)
    """
    raw_lines = [line.strip() for line in csv_text.splitlines() if line.strip()]
    detected_meta: Dict[str, Any] = {}

    data_lines: List[str] = []
    header_found = False

    for line in raw_lines:
        if line.startswith("#"):
            clean_comment = line.lstrip("#").strip()
            if ":" in clean_comment:
                k, v = clean_comment.split(":", 1)
                detected_meta[k.strip().lower()] = v.strip()
            continue

        # Skip Giovanni metadata preamble lines before the actual CSV header
        if not header_found:
            lower_line = line.lower()
            has_date_token = any(
                tok in lower_line
                for tok in ("date", "year", "time", "timestamp", "datetime", "month")
            )
            first_token = line.split(",")[0].strip().strip('"')
            looks_like_date_row = bool(re.match(r"^(19|20)\d{2}", first_token))
            if has_date_token or looks_like_date_row:
                header_found = True
                data_lines.append(line)
            elif ":" in line and "," not in line:
                k, v = line.split(":", 1)
                detected_meta[k.strip().lower()] = v.strip()
        else:
            data_lines.append(line)

    if not data_lines:
        data_lines = [ln for ln in raw_lines if not ln.startswith("#")]

    if len(data_lines) < 3:
        raise ValueError("CSV-файл містить замало рядків для статистичного аналізу (потрібно щонайменше 3 роки даних).")

    sample_text = "\n".join(data_lines[:15])
    delimiter = ";" if sample_text.count(";") > sample_text.count(",") else ","
    reader = csv.reader(io.StringIO("\n".join(data_lines)), delimiter=delimiter)
    rows = [r for r in reader if any(cell.strip() for cell in r)]

    if len(rows) < 3:
        raise ValueError("Не вдалося розпізнати табличні рядки у CSV-файлі.")

    first_row = [c.strip().strip('"') for c in rows[0]]
    first_cell_is_year = bool(re.match(r"^(19|20)\d{2}", first_row[0]))

    date_col_idx = 0
    month_col_idx: Optional[int] = None
    val_col_idx = 1 if len(first_row) > 1 else 0
    inferred_col_name = "Value"

    if not first_cell_is_year:
        headers_lower = [h.lower() for h in first_row]
        for idx, h in enumerate(headers_lower):
            if any(k in h for k in ("date", "time", "timestamp", "datetime", "year", "рік")):
                date_col_idx = idx
                break
        for idx, h in enumerate(headers_lower):
            if idx != date_col_idx and h in ("month", "mo", "місяць", "mon"):
                month_col_idx = idx
                break
        # Find value column
        preferred_val_idx: Optional[int] = None
        for idx, h in enumerate(headers_lower):
            if idx in (date_col_idx, month_col_idx):
                continue
            if any(
                k in h
                for k in (
                    "val",
                    "data",
                    "mean",
                    "anom",
                    "aod",
                    "chla",
                    "chlor",
                    "wse",
                    "sar",
                    "backscatter",
                    "t2m",
                    "temp",
                    "prec",
                    "prcp",
                    "gwet",
                    "so2",
                    "sst",
                    "qrunoff",
                    "snodp",
                )
            ):
                preferred_val_idx = idx
                inferred_col_name = first_row[idx]
                break
        if preferred_val_idx is None:
            for idx in range(len(first_row)):
                if idx not in (date_col_idx, month_col_idx):
                    preferred_val_idx = idx
                    inferred_col_name = first_row[idx]
                    break
        if preferred_val_idx is not None:
            val_col_idx = preferred_val_idx
        data_rows = rows[1:]
    else:
        data_rows = rows

    monthly_records: List[Dict[str, Any]] = []
    for raw_r in data_rows:
        if len(raw_r) <= max(date_col_idx, val_col_idx):
            continue
        raw_date = raw_r[date_col_idx].strip().strip('"')
        raw_val = raw_r[val_col_idx].strip().strip('"')
        if not raw_date or not raw_val:
            continue

        try:
            val = float(raw_val)
        except ValueError:
            continue

        if math.isnan(val) or math.isinf(val) or val <= -900.0 or val in (-9999.0, -999.9, -999.0, 9999.0):
            continue

        yr: Optional[int] = None
        mo: int = 6

        # Parse year & month
        m_iso = re.match(r"^((?:18|19|20)\d{2})[-/.](\d{1,2})", raw_date)
        m_ym6 = re.match(r"^((?:18|19|20)\d{2})(\d{2})$", raw_date)
        m_year_only = re.match(r"^((?:18|19|20)\d{2})(?:\.0)?$", raw_date)

        if m_iso:
            yr = int(m_iso.group(1))
            mo = int(m_iso.group(2))
        elif m_ym6:
            yr = int(m_ym6.group(1))
            mo = int(m_ym6.group(2))
        elif m_year_only:
            yr = int(m_year_only.group(1))
            if month_col_idx is not None and len(raw_r) > month_col_idx:
                try:
                    mo = int(float(raw_r[month_col_idx].strip()))
                except ValueError:
                    mo = 6
            else:
                mo = 6
        else:
            parsed_dt = pd.to_datetime(raw_date, errors="coerce")
            if pd.notna(parsed_dt):
                yr = int(parsed_dt.year)
                mo = int(parsed_dt.month)

        if yr is None or yr < 1850 or yr > 2100:
            continue
        if mo < 1 or mo > 12:
            mo = 6

        monthly_records.append(
            {
                "year": yr,
                "month": mo,
                "timestamp": f"{yr:04d}-{mo:02d}",
                "value": round(float(val), 5),
            }
        )

    if len(monthly_records) < 4:
        raise ValueError(
            "Не вдалося вилучити достатню кількість коректних пар (Дата, Значення) із завантаженого CSV."
        )

    monthly_df = (
        pd.DataFrame(monthly_records)
        .groupby(["year", "month", "timestamp"], as_index=False)["value"]
        .mean()
        .sort_values(["year", "month"])
        .reset_index(drop=True)
    )
    annual_df = (
        monthly_df.groupby("year", as_index=False)["value"]
        .mean()
        .sort_values("year")
        .reset_index(drop=True)
    )

    if len(annual_df) < 4:
        raise ValueError(
            f"Для статистичного тесту тренду потрібно щонайменше 4 річні точки, знайдено: {len(annual_df)}."
        )

    baseline_df = annual_df[(annual_df["year"] >= 1981) & (annual_df["year"] <= 2010)].copy()
    if len(baseline_df) < 5:
        baseline_df = annual_df.head(min(15, len(annual_df))).copy()

    detected_meta["inferred_column"] = inferred_col_name
    detected_meta["total_observations"] = len(monthly_df)
    detected_meta["years_count"] = len(annual_df)
    detected_meta["start_year"] = int(annual_df["year"].min())
    detected_meta["end_year"] = int(annual_df["year"].max())

    return annual_df, monthly_df, baseline_df, detected_meta


def _serialize_variable_meta(var_meta: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "code": var_meta["code"],
        "name": var_meta["name"],
        "name_ua": var_meta.get("name_ua", var_meta["name"]),
        "unit": var_meta["unit"],
        "satellite_badge": var_meta.get("satellite_badge", "NASA EOS"),
        "source": var_meta.get("source", var_meta.get("satellite_badge", "NASA EOS")),
        "gibs_layer": var_meta.get("gibs_layer", "MODIS_Terra_Land_Surface_Temp_Day"),
        "description": var_meta.get("description", ""),
        "student_definition": var_meta.get("student_definition", var_meta.get("description", "")),
        "biomes": var_meta.get("biomes", []),
    }


FRONTEND_DIST_DIR = Path(__file__).resolve().parent / "frontend" / "dist"
FRONTEND_INDEX_FILE = FRONTEND_DIST_DIR / "index.html"


def _api_status_payload() -> Dict[str, Any]:
    return {
        "service": "GaiaPulse / NASA Earth System Trend Detective API v2",
        "version": "2.1.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "fetch_phenomena_v2": "GET /api/v2/fetch-phenomena",
            "analyze_v2": "POST /api/v2/analyze",
            "analyze_csv_v2": "POST /api/v2/analyze-csv",
            "official_resources_v2": "GET /api/v2/resources",
            "analyze_legacy": "POST /api/analyze-trend",
            "presets": "GET /api/presets",
            "variables": "GET /api/variables",
            "health": "GET /api/health",
        },
        "disclaimer": NASA_OFFICIAL_DISCLAIMER,
    }


@app.get("/", tags=["System"], response_model=None)
async def root() -> Any:
    """Serve built React frontend when available, otherwise return API status."""
    if FRONTEND_INDEX_FILE.is_file():
        return FileResponse(FRONTEND_INDEX_FILE)
    return _api_status_payload()


@app.get("/api/info", tags=["System"])
async def api_info() -> Dict[str, Any]:
    """API status and endpoint directory."""
    return _api_status_payload()


@app.get("/api/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """Health check and cache telemetry."""
    return {
        "status": "ok",
        "version": "2.1.0",
        "cache": get_cache_stats(),
    }


@app.get("/api/v2/health", tags=["System"])
async def health_check_v2() -> Dict[str, Any]:
    """v2 Health check alias."""
    return {
        "status": "ok",
        "version": "2.1.0",
        "variables_count": len(VARIABLE_CATALOG),
        "official_resources_count": len(OFFICIAL_RESOURCES_CATALOG),
        "cache": get_cache_stats(),
    }


@app.delete("/api/cache", tags=["System"])
async def flush_cache() -> Dict[str, str]:
    """Clear in-memory NASA data cache."""
    clear_cache()
    return {"status": "cleared"}


@app.get("/api/v2/fetch-phenomena", tags=["Phenomena & Live NASA EONET"])
async def fetch_phenomena_v2() -> Dict[str, Any]:
    """
    GET /api/v2/fetch-phenomena
    Returns combined list of `PhenomenonScenario` objects:
      - Part A: 7 Curated Historical Phenomena (including Dr. Acker's SeaWiFS Coastal Study & CSA SWOT/RADARSAT)
      - Part B: Live Earth events fetched asynchronously from NASA EONET v3 API
    """
    return await get_all_phenomena_scenarios()


async def _run_trend_analysis_pipeline(payload: AnalyzeTrendRequestV2) -> Dict[str, Any]:
    """Shared mathematical execution pipeline for `/api/v2/analyze` and `/api/analyze-trend`."""
    try:
        var_meta = get_variable_metadata(payload.variable)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    var_code = var_meta["code"]
    norm_season = normalize_season_mode(payload.season_mode)

    try:
        if payload.region_b is not None:
            bundle_a, bundle_b = await asyncio.gather(
                fetch_climate_series(
                    lat=payload.region_a.lat,
                    lon=payload.region_a.lon,
                    variable=var_code,
                    start_year=payload.start_year,
                    end_year=payload.end_year,
                    prefer_live_api=payload.prefer_live_api,
                ),
                fetch_climate_series(
                    lat=payload.region_b.lat,
                    lon=payload.region_b.lon,
                    variable=var_code,
                    start_year=payload.start_year,
                    end_year=payload.end_year,
                    prefer_live_api=payload.prefer_live_api,
                ),
            )
        else:
            bundle_a = await fetch_climate_series(
                lat=payload.region_a.lat,
                lon=payload.region_a.lon,
                variable=var_code,
                start_year=payload.start_year,
                end_year=payload.end_year,
                prefer_live_api=payload.prefer_live_api,
            )
            bundle_b = None

        region_a_analysis = analyze_single_region(
            location_info={
                "name": payload.region_a.resolved_name("Region A"),
                "lat": payload.region_a.lat,
                "lon": payload.region_a.lon,
            },
            variable_meta=var_meta,
            annual_df=bundle_a.annual_df,
            monthly_df=bundle_a.monthly_df,
            baseline_df=bundle_a.baseline_df,
            data_source=bundle_a.source,
            season_mode=norm_season,
        )

        region_b_analysis: Optional[Dict[str, Any]] = None
        dipole_comparison: Optional[Dict[str, Any]] = None

        if payload.region_b is not None and bundle_b is not None:
            region_b_analysis = analyze_single_region(
                location_info={
                    "name": payload.region_b.resolved_name("Region B"),
                    "lat": payload.region_b.lat,
                    "lon": payload.region_b.lon,
                },
                variable_meta=var_meta,
                annual_df=bundle_b.annual_df,
                monthly_df=bundle_b.monthly_df,
                baseline_df=bundle_b.baseline_df,
                data_source=bundle_b.source,
                season_mode=norm_season,
            )
            dipole_comparison = compare_dipole_regions(
                region_a_result=region_a_analysis,
                region_b_result=region_b_analysis,
            )

        return {
            "season_mode": norm_season,
            "variable_metadata": _serialize_variable_meta(var_meta),
            "region_a_analysis": region_a_analysis,
            "region_b_analysis": region_b_analysis,
            "dipole_comparison": dipole_comparison,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error during v2 trend analysis pipeline")
        raise HTTPException(
            status_code=500,
            detail=f"Помилка математичного пайплайну обробки даних: {exc}",
        ) from exc


@app.post("/api/v2/analyze", tags=["Trend Detective Engine v2"])
async def analyze_trend_v2(payload: AnalyzeTrendRequestV2) -> Dict[str, Any]:
    """
    POST /api/v2/analyze
    Mathematical engine with seasonal filtering (`raw`, `deseasonalized`, `DJF`, `MAM`, `JJA`, `SON`),
    Student's t-test, Mann-Kendall test, Sen's slope, 95% Confidence Intervals, and Time-to-Significance.
    """
    return await _run_trend_analysis_pipeline(payload)


@app.post("/api/v2/analyze-csv", tags=["Trend Detective Engine v2"])
async def analyze_csv_v2(payload: AnalyzeCsvRequestV2) -> Dict[str, Any]:
    """
    POST /api/v2/analyze-csv
    Import a user-provided CSV time series from NASA Giovanni, AppEEARS, GES DISC Hydrology Time Series,
    or NOAA Climate Data Online (CDO) and run full deseasonalization, linear trend, Student's t-test,
    Mann-Kendall test, 95% CI, STL decomposition, and Time-to-Significance calculation.
    """
    try:
        annual_df, monthly_df, baseline_df, parsed_meta = _parse_scientific_csv_text(
            payload.csv_text
        )
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    code_upper = payload.variable_code.strip().upper()
    if code_upper in VARIABLE_CATALOG:
        base_meta = dict(VARIABLE_CATALOG[code_upper])
        if payload.unit:
            base_meta["unit"] = payload.unit
    else:
        col_label = parsed_meta.get("inferred_column", code_upper)
        base_meta = {
            "code": code_upper or "CUSTOM_CSV",
            "name": f"{payload.dataset_name} ({col_label})",
            "name_ua": f"Імпортований ряд CSV: {payload.dataset_name}",
            "unit": payload.unit or "units",
            "satellite_badge": "CSV Import (Giovanni / AppEEARS / NOAA CDO)",
            "source": "Imported NASA / NOAA / CSA CSV Dataset",
            "gibs_layer": "MODIS_Terra_Land_Surface_Temp_Day",
            "description": f"Часовий ряд, імпортований із файлу {payload.dataset_name}.",
            "student_definition": (
                "Користувацький часовий ряд із зовнішнього порталу NASA Giovanni, AppEEARS або NOAA CDO, "
                "проаналізований математичним рушієм Earth System Trend Detective."
            ),
            "biomes": ["tidal_estuary", "rain_forest", "desert", "cryosphere"],
        }

    norm_season = normalize_season_mode(payload.season_mode)
    region_analysis = analyze_single_region(
        location_info={
            "name": f"{payload.dataset_name} (CSV)",
            "lat": payload.lat,
            "lon": payload.lon,
        },
        variable_meta=base_meta,
        annual_df=annual_df,
        monthly_df=monthly_df,
        baseline_df=baseline_df,
        data_source=f"CSV Import: {payload.dataset_name} ({parsed_meta.get('total_observations', 0)} obs)",
        season_mode=norm_season,
    )

    return {
        "season_mode": norm_season,
        "variable_metadata": _serialize_variable_meta(base_meta),
        "region_a_analysis": region_analysis,
        "region_b_analysis": None,
        "dipole_comparison": None,
        "csv_import_metadata": parsed_meta,
    }


@app.post("/api/analyze-trend", tags=["Trend Detective Engine v2"])
async def analyze_trend_legacy(payload: AnalyzeTrendRequestV2) -> Dict[str, Any]:
    """Backwards-compatible alias for POST /api/v2/analyze."""
    return await _run_trend_analysis_pipeline(payload)


if (FRONTEND_DIST_DIR / "assets").is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST_DIR / "assets"),
        name="frontend-assets",
    )

if FRONTEND_INDEX_FILE.is_file():
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        """Serve built frontend assets or SPA index.html for non-API routes."""
        if full_path == "api" or full_path.startswith("api/") or full_path in (
            "docs",
            "redoc",
            "openapi.json",
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        dist_root = FRONTEND_DIST_DIR.resolve()
        candidate = (FRONTEND_DIST_DIR / full_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(dist_root):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_INDEX_FILE)


if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "8000")))
    uvicorn.run("main:app", host=host, port=port, reload=True)
