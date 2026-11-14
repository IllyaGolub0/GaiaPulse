"""Integration tests for FastAPI routes, cache headers, and request validation."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_and_reference_endpoints_with_cache_headers() -> None:
    health = client.get("/api/v2/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    presets = client.get("/api/presets")
    assert presets.status_code == 200
    assert presets.json()["count"] >= 1
    assert "max-age=3600" in presets.headers.get("cache-control", "")

    variables = client.get("/api/variables")
    assert variables.status_code == 200
    assert len(variables.json()["variables"]) == 13
    assert "max-age=3600" in variables.headers.get("cache-control", "")

    resources = client.get("/api/v2/resources")
    assert resources.status_code == 200
    assert resources.json()["total_count"] == 13
    assert "max-age=3600" in resources.headers.get("cache-control", "")


def test_analyze_v2_single_and_dipole_and_roi_box() -> None:
    resp = client.post(
        "/api/v2/analyze",
        json={
            "variable": "AOD",
            "start_year": 2002,
            "end_year": 2025,
            "season_mode": "JJA",
            "region_a": {"name": "Wisconsin", "lat": 44.5, "lon": -89.5},
            "region_b": {"name": "Svalbard", "lat": 78.22, "lon": 15.63},
            "prefer_live_api": False,
            "spatial_box_averaging": True,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["season_mode"] == "JJA"
    assert "ROI" in body["region_a_analysis"]["data_source"]
    assert body["region_b_analysis"] is not None
    assert body["dipole_comparison"] is not None

    roc = body["region_a_analysis"]["statistics"]["rate_of_change"]
    assert roc["ci_95_lower_decade"] <= roc["per_decade"] <= roc["ci_95_upper_decade"]


def test_analyze_legacy_alias_and_validation_errors() -> None:
    bad_window = client.post(
        "/api/v2/analyze",
        json={
            "variable": "T2M",
            "start_year": 2020,
            "end_year": 2022,
            "region_a": {"lat": 45.0, "lon": 30.0},
            "prefer_live_api": False,
        },
    )
    assert bad_window.status_code == 422

    legacy = client.post(
        "/api/analyze-trend",
        json={
            "variable": "T2M",
            "start_year": 2000,
            "end_year": 2020,
            "season_mode": "DJF",
            "region_a": {"lat": 45.0, "lon": 30.0},
            "prefer_live_api": False,
        },
    )
    assert legacy.status_code == 200
    assert legacy.json()["season_mode"] == "DJF"


def test_analyze_csv_v2_endpoint() -> None:
    csv_lines = ["Date,Value"] + [f"{yr}-07,{10.0 + (yr - 2000) * 0.2:.2f}" for yr in range(2000, 2020)]
    resp = client.post(
        "/api/v2/analyze-csv",
        json={
            "csv_text": "\n".join(csv_lines),
            "dataset_name": "Unit Test CSV",
            "variable_code": "T2M",
            "season_mode": "jja",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["season_mode"] == "JJA"
    assert body["region_a_analysis"]["statistics"]["is_significant"] is True
    assert body["csv_import_metadata"]["years_count"] == 20
