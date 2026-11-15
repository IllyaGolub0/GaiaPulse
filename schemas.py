"""Pydantic request schemas for GaiaPulse FastAPI endpoints."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

from statistics_engine import normalize_season_mode

SeasonModeLiteral = Literal["raw", "deseasonalized", "DJF", "MAM", "JJA", "SON"]


class RegionLocationInput(BaseModel):
    """Coordinates and human-readable label for a target geographical point."""

    name: Optional[str] = Field(
        default=None,
        description="Name of the region or target study location",
        examples=["Wisconsin, USA"],
    )
    lat: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Geographic latitude (-90..90)",
        examples=[44.5],
    )
    lon: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Geographic longitude (-180..180)",
        examples=[-89.5],
    )

    def resolved_name(self, fallback_prefix: str = "Region") -> str:
        """Return trimmed region name or formatted coordinate fallback."""
        if self.name and self.name.strip():
            return self.name.strip()
        return f"{fallback_prefix} ({self.lat:.2f}°, {self.lon:.2f}°)"


class AnalyzeTrendRequestV2(BaseModel):
    """Request contract for POST /api/v2/analyze (and POST /api/analyze-trend)."""

    variable: str = Field(
        default="T2M",
        description=(
            "NASA/CSA variable code: T2M, PRECTOTCORR, GWETROOT, ALLSKY_SFC_SW_DWN, "
            "AOD, SO2, EVPTRNS, QRUNOFF, SNODP, SST, SEAWIFS_CHLA, SWOT_WSE, RCM_SAR_BACKSCATTER"
        ),
        examples=["AOD"],
    )
    start_year: int = Field(
        default=1985,
        ge=1981,
        le=2030,
        description="Analysis start year (>= 1981)",
        examples=[2002],
    )
    end_year: int = Field(
        default=2025,
        ge=1985,
        le=2030,
        description="Analysis end year (clamped to satellite mission upper bound <= 2025)",
        examples=[2025],
    )
    season_mode: str = Field(
        default="raw",
        description="Seasonal filtering mode: raw, deseasonalized, DJF, MAM, JJA, SON",
        examples=["JJA"],
    )
    region_a: RegionLocationInput = Field(
        ...,
        description="Primary study region (Region A)",
    )
    region_b: Optional[RegionLocationInput] = Field(
        default=None,
        description="Optional secondary region for Dipole Comparison mode (Region B)",
    )
    prefer_live_api: bool = Field(
        default=True,
        description="Query live NASA POWER API with calibrated offline fallback",
    )
    spatial_box_averaging: bool = Field(
        default=False,
        description="Enable 5-point ROI spatial box averaging (±0.5° lat/lon around center) to reduce single-pixel noise",
    )
    lang: Literal["en", "ua"] = Field(
        default="en",
        description="Narrative output language ('en' or 'ua')",
    )

    @model_validator(mode="after")
    def validate_year_window(self) -> "AnalyzeTrendRequestV2":
        """Ensure at least a 5-year span and normalize season_mode."""
        if self.end_year - self.start_year < 4:
            raise ValueError(
                "Time window (end_year - start_year) must span at least 5 inclusive years "
                "for valid statistical significance testing."
            )
        self.season_mode = normalize_season_mode(self.season_mode)
        return self


class AnalyzeCsvRequestV2(BaseModel):
    """Request contract for POST /api/v2/analyze-csv (Giovanni / AppEEARS / NOAA CDO CSV import)."""

    csv_text: str = Field(
        ...,
        min_length=10,
        max_length=2_000_000,
        description="Raw CSV text with Date/Year/time and Value/data columns",
    )
    dataset_name: str = Field(
        default="Imported NASA/NOAA CSV Series",
        description="Dataset or file label (e.g., Giovanni MODIS AOD / NOAA CDO)",
    )
    variable_code: str = Field(
        default="AOD",
        description="Variable code or custom indicator name",
    )
    unit: Optional[str] = Field(
        default=None,
        description="Optional measurement unit",
    )
    season_mode: str = Field(
        default="deseasonalized",
        description="Seasonal filter: raw, deseasonalized, DJF, MAM, JJA, SON",
    )
    lat: float = Field(default=38.90, ge=-90.0, le=90.0)
    lon: float = Field(default=-76.40, ge=-180.0, le=180.0)
    lang: Literal["en", "ua"] = Field(
        default="en",
        description="Narrative output language ('en' or 'ua')",
    )

    @model_validator(mode="after")
    def normalize_fields(self) -> "AnalyzeCsvRequestV2":
        """Normalize season_mode on CSV import requests."""
        self.season_mode = normalize_season_mode(self.season_mode)
        return self
