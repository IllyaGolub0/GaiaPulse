"""Phenomena catalog, satellite trend analysis, and CSV import routes."""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException

from csv_parser import parse_scientific_csv_text
from nasa_client import ClimateDataBundle, fetch_climate_series, fetch_spatial_box_series
from phenomena_service import get_all_phenomena_scenarios
from presets import VARIABLE_CATALOG, clamp_year_range_for_variable, get_variable_metadata
from schemas import AnalyzeCsvRequestV2, AnalyzeTrendRequestV2
from statistics_engine import (
    analyze_single_region,
    compare_dipole_regions,
    normalize_season_mode,
)

logger = logging.getLogger("gaiapulse.analysis")

router = APIRouter()


def serialize_variable_meta(var_meta: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize variable catalog entry for API responses."""
    return {
        "code": var_meta["code"],
        "name": var_meta["name"],
        "name_ua": var_meta.get("name_ua", var_meta["name"]),
        "unit": var_meta["unit"],
        "satellite_badge": var_meta.get("satellite_badge", "NASA EOS"),
        "source": var_meta.get("source", var_meta.get("satellite_badge", "NASA EOS")),
        "gibs_layer": var_meta.get("gibs_layer", "MODIS_Terra_Land_Surface_Temp_Day"),
        "min_year": int(var_meta.get("min_year", 1981)),
        "max_year": int(var_meta.get("max_year", 2025)),
        "mission_status": var_meta.get("mission_status", "active"),
        "description": var_meta.get("description", ""),
        "student_definition": var_meta.get("student_definition", var_meta.get("description", "")),
        "biomes": var_meta.get("biomes", []),
    }


async def _fetch_region_bundle(
    lat: float,
    lon: float,
    variable: str,
    start_year: int,
    end_year: int,
    prefer_live_api: bool,
    spatial_box_averaging: bool,
) -> ClimateDataBundle:
    """Fetch single-point or 5-point ROI spatially averaged climate series."""
    if spatial_box_averaging:
        return await fetch_spatial_box_series(
            lat=lat,
            lon=lon,
            variable=variable,
            start_year=start_year,
            end_year=end_year,
            prefer_live_api=prefer_live_api,
        )
    return await fetch_climate_series(
        lat=lat,
        lon=lon,
        variable=variable,
        start_year=start_year,
        end_year=end_year,
        prefer_live_api=prefer_live_api,
    )


async def run_trend_analysis_pipeline(payload: AnalyzeTrendRequestV2) -> Dict[str, Any]:
    """Shared mathematical execution pipeline for `/api/v2/analyze` and `/api/analyze-trend`."""
    try:
        var_meta = get_variable_metadata(payload.variable)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    var_code = var_meta["code"]
    norm_season = normalize_season_mode(payload.season_mode)
    eff_start_year, eff_end_year = clamp_year_range_for_variable(
        payload.start_year,
        payload.end_year,
        var_meta,
    )

    try:
        if payload.region_b is not None:
            bundle_a, bundle_b = await asyncio.gather(
                _fetch_region_bundle(
                    lat=payload.region_a.lat,
                    lon=payload.region_a.lon,
                    variable=var_code,
                    start_year=eff_start_year,
                    end_year=eff_end_year,
                    prefer_live_api=payload.prefer_live_api,
                    spatial_box_averaging=payload.spatial_box_averaging,
                ),
                _fetch_region_bundle(
                    lat=payload.region_b.lat,
                    lon=payload.region_b.lon,
                    variable=var_code,
                    start_year=eff_start_year,
                    end_year=eff_end_year,
                    prefer_live_api=payload.prefer_live_api,
                    spatial_box_averaging=payload.spatial_box_averaging,
                ),
            )
        else:
            bundle_a = await _fetch_region_bundle(
                lat=payload.region_a.lat,
                lon=payload.region_a.lon,
                variable=var_code,
                start_year=eff_start_year,
                end_year=eff_end_year,
                prefer_live_api=payload.prefer_live_api,
                spatial_box_averaging=payload.spatial_box_averaging,
            )
            bundle_b = None

        region_a_analysis = await asyncio.to_thread(
            analyze_single_region,
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
            spatial_box_averaging=payload.spatial_box_averaging,
            data_origin=bundle_a.data_origin,
            lang=payload.lang,
        )

        region_b_analysis: Optional[Dict[str, Any]] = None
        dipole_comparison: Optional[Dict[str, Any]] = None

        if payload.region_b is not None and bundle_b is not None:
            region_b_analysis = await asyncio.to_thread(
                analyze_single_region,
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
                spatial_box_averaging=payload.spatial_box_averaging,
                data_origin=bundle_b.data_origin,
                lang=payload.lang,
            )
            dipole_comparison = await asyncio.to_thread(
                compare_dipole_regions,
                region_a_result=region_a_analysis,
                region_b_result=region_b_analysis,
                lang=payload.lang,
            )

        return {
            "season_mode": norm_season,
            "variable_metadata": serialize_variable_meta(var_meta),
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


@router.get("/api/v2/fetch-phenomena", tags=["Phenomena & Live NASA EONET"])
async def fetch_phenomena_v2() -> Dict[str, Any]:
    """
    GET /api/v2/fetch-phenomena
    Returns combined list of `PhenomenonScenario` objects:
      - Part A: 7 Curated Historical Phenomena (including Dr. Acker's SeaWiFS Coastal Study & CSA SWOT/RADARSAT)
      - Part B: Live Earth events fetched asynchronously from NASA EONET v3 API
    """
    return await get_all_phenomena_scenarios()


@router.post("/api/v2/analyze", tags=["Trend Detective Engine v2"])
async def analyze_trend_v2(payload: AnalyzeTrendRequestV2) -> Dict[str, Any]:
    """
    POST /api/v2/analyze
    Mathematical engine with seasonal filtering (`raw`, `deseasonalized`, `DJF`, `MAM`, `JJA`, `SON`),
    Student's t-test, Mann-Kendall test, Sen's slope, 95% Confidence Intervals, and Time-to-Significance.
    """
    return await run_trend_analysis_pipeline(payload)


@router.post("/api/v2/analyze-csv", tags=["Trend Detective Engine v2"])
async def analyze_csv_v2(payload: AnalyzeCsvRequestV2) -> Dict[str, Any]:
    """
    POST /api/v2/analyze-csv
    Import a user-provided CSV time series from NASA Giovanni, AppEEARS, GES DISC Hydrology Time Series,
    or NOAA Climate Data Online (CDO) and run full deseasonalization, linear trend, Student's t-test,
    Mann-Kendall test, 95% CI, STL decomposition, and Time-to-Significance calculation.
    """
    try:
        annual_df, monthly_df, baseline_df, parsed_meta = await asyncio.to_thread(
            parse_scientific_csv_text,
            payload.csv_text,
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
    region_analysis = await asyncio.to_thread(
        analyze_single_region,
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
        data_origin="user_csv",
        lang=payload.lang,
    )

    return {
        "season_mode": norm_season,
        "variable_metadata": serialize_variable_meta(base_meta),
        "region_a_analysis": region_analysis,
        "region_b_analysis": None,
        "dipole_comparison": None,
        "csv_import_metadata": parsed_meta,
    }


@router.post("/api/analyze-trend", tags=["Trend Detective Engine v2"])
async def analyze_trend_legacy(payload: AnalyzeTrendRequestV2) -> Dict[str, Any]:
    """Backwards-compatible alias for POST /api/v2/analyze."""
    return await run_trend_analysis_pipeline(payload)
