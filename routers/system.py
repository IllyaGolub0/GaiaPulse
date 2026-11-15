"""System health, API directory, and cache management routes."""

from __future__ import annotations

import os
import secrets
import time
from typing import Any, Dict, Optional

from fastapi import APIRouter, Header, HTTPException

from nasa_client import clear_cache, get_cache_stats
from presets import (
    NASA_OFFICIAL_DISCLAIMER,
    OFFICIAL_RESOURCES_CATALOG,
    VARIABLE_CATALOG,
)

router = APIRouter(tags=["System"])

_CACHE_FLUSH_COOLDOWN_SECONDS = 5.0
_last_cache_flush_ts: float = 0.0


def api_status_payload() -> Dict[str, Any]:
    """Return service metadata and available REST endpoints."""
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


@router.get("/api/info")
async def api_info() -> Dict[str, Any]:
    """API status and endpoint directory."""
    return api_status_payload()


@router.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """Health check and cache telemetry."""
    return {
        "status": "ok",
        "version": "2.1.0",
        "cache": get_cache_stats(),
    }


@router.get("/api/v2/health")
async def health_check_v2() -> Dict[str, Any]:
    """v2 Health check alias."""
    return {
        "status": "ok",
        "version": "2.1.0",
        "variables_count": len(VARIABLE_CATALOG),
        "official_resources_count": len(OFFICIAL_RESOURCES_CATALOG),
        "cache": get_cache_stats(),
    }


@router.delete("/api/cache")
async def flush_cache(
    x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token"),
) -> Dict[str, str]:
    """Clear in-memory NASA data cache with optional token auth and cooldown guard."""
    global _last_cache_flush_ts
    expected_token = os.getenv("ADMIN_CACHE_TOKEN", "").strip()
    if expected_token:
        if not x_admin_token or not secrets.compare_digest(x_admin_token, expected_token):
            raise HTTPException(status_code=403, detail="Invalid or missing admin cache token.")

    now = time.monotonic()
    if _last_cache_flush_ts > 0.0 and (now - _last_cache_flush_ts) < _CACHE_FLUSH_COOLDOWN_SECONDS:
        raise HTTPException(
            status_code=429,
            detail="Cache flush rate-limited; please wait a few seconds before retrying.",
        )

    _last_cache_flush_ts = now
    clear_cache()
    return {"status": "cleared"}
