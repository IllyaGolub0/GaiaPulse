"""
GaiaPulse / Earth System Trend Detective v2 — FastAPI Backend Server
NASA Space Apps Challenge 2026 ("Be an Earth System Trend Detective", Dr. James Acker — NASA Goddard)

Endpoints:
- GET  /api/v2/fetch-phenomena : Curated Historical Phenomena (Part A) + Live NASA EONET API Events (Part B)
- POST /api/v2/analyze         : Seasonal/Deseasonalized Trend Engine (t-test, Mann-Kendall, 95% CI, Time-to-Significance)
- POST /api/analyze-trend      : Legacy v1 alias pointing to the v2 mathematical engine
- GET  /api/presets            : Quick preset cases & variable catalog
- GET  /api/variables          : Full catalog of 10 NASA satellite/reanalysis variables
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict, Literal, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from nasa_client import clear_cache, fetch_climate_series, get_cache_stats
from phenomena_service import get_all_phenomena_scenarios
from presets import get_variable_metadata, router as presets_router
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
        "каталог історичних феноменів д-ра Джеймса Екера, живі події NASA EONET v3, "
        "сезонна фільтрація (raw, deseasonalized, DJF, MAM, JJA, SON), Student's t-test, "
        "Mann-Kendall, Sen's Slope, 95% CI, STL-декомпозиція та Time-to-Significance Calculator."
    ),
    version="2.0.0",
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
            "Код змінної NASA: T2M, PRECTOTCORR, GWETROOT, ALLSKY_SFC_SW_DWN, "
            "AOD, SO2, EVPTRNS, QRUNOFF, SNODP, SST"
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


@app.get("/", tags=["System"])
async def root() -> Dict[str, Any]:
    """Root status endpoint."""
    return {
        "service": "GaiaPulse / NASA Earth System Trend Detective API v2",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "fetch_phenomena_v2": "GET /api/v2/fetch-phenomena",
            "analyze_v2": "POST /api/v2/analyze",
            "analyze_legacy": "POST /api/analyze-trend",
            "presets": "GET /api/presets",
            "variables": "GET /api/variables",
            "health": "GET /api/health",
        },
    }


@app.get("/api/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """Health check and cache telemetry."""
    return {
        "status": "ok",
        "version": "2.0.0",
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
      - Part A: 5 Curated Historical Phenomena from Dr. James Acker's challenge guide & video
      - Part B: Live Earth events fetched asynchronously from NASA EONET v3 API
        (`https://eonet.gsfc.nasa.gov/api/v3/events?limit=6&status=all`) automatically mapped
        to satellite variables (`AOD`, `SO2`, `PRECTOTCORR`, `QRUNOFF`, `GWETROOT`, `SNODP`/`SST`),
        with zero-error fallback to cached EONET events when offline.
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
            "variable_metadata": {
                "code": var_meta["code"],
                "name": var_meta["name"],
                "name_ua": var_meta["name_ua"],
                "unit": var_meta["unit"],
                "satellite_badge": var_meta.get("satellite_badge", "NASA EOS"),
                "gibs_layer": var_meta["gibs_layer"],
                "description": var_meta["description"],
            },
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


@app.post("/api/analyze-trend", tags=["Trend Detective Engine v2"])
async def analyze_trend_legacy(payload: AnalyzeTrendRequestV2) -> Dict[str, Any]:
    """Backwards-compatible alias for POST /api/v2/analyze."""
    return await _run_trend_analysis_pipeline(payload)


if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "8000")))
    uvicorn.run("main:app", host=host, port=port, reload=True)
