"""Integration tests for FastAPI routes, cache headers, and request validation."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import app
from nasa_client import _parse_nasa_monthly_dict

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


def test_analyze_enforces_satellite_mission_year_bounds() -> None:
    vars_resp = client.get("/api/variables")
    assert vars_resp.status_code == 200
    vars_payload = vars_resp.json()
    vars_list = vars_payload.get("variables", vars_payload) if isinstance(vars_payload, dict) else vars_payload
    by_code = {item["code"]: item for item in vars_list if isinstance(item, dict) and "code" in item}

    assert "SEAWIFS_CHLA" in by_code
    assert by_code["SEAWIFS_CHLA"]["min_year"] == 1998
    assert by_code["SEAWIFS_CHLA"]["max_year"] == 2010
    assert by_code["SEAWIFS_CHLA"]["mission_status"] == "completed"
    assert by_code["SEAWIFS_CHLA"]["gibs_layer"] == "SEAWIFS_ORBVIEW-2_GAC_Chlorophyll_a"
    assert by_code["SO2"]["gibs_layer"] == "OMI_SO2_Middle_Troposphere"
    assert by_code["SST"]["gibs_layer"] == "GHRSST_L4_MUR_Sea_Surface_Temperature"

    assert "RCM_SAR_BACKSCATTER" in by_code
    assert by_code["RCM_SAR_BACKSCATTER"]["min_year"] == 2019
    assert by_code["RCM_SAR_BACKSCATTER"]["max_year"] == 2026
    assert by_code["RCM_SAR_BACKSCATTER"]["mission_status"] == "active"

    seawifs_resp = client.post(
        "/api/v2/analyze",
        json={
            "variable": "SEAWIFS_CHLA",
            "season": "JJA",
            "start_year": 1998,
            "end_year": 2026,
            "region_a": {"name": "SeaWiFS Test", "lat": 37.0, "lon": -76.0},
        },
    )
    assert seawifs_resp.status_code == 200
    seawifs_body = seawifs_resp.json()
    seawifs_years = [int(pt["year"]) for pt in seawifs_body["region_a_analysis"]["time_series"]]
    assert seawifs_years
    assert min(seawifs_years) >= 1998
    assert max(seawifs_years) <= 2010

    rcm_resp = client.post(
        "/api/v2/analyze",
        json={
            "variable": "RCM_SAR_BACKSCATTER",
            "season": "JJA",
            "start_year": 2000,
            "end_year": 2026,
            "region_a": {"name": "RCM Test", "lat": 62.5, "lon": -114.4},
        },
    )
    assert rcm_resp.status_code == 200
    rcm_body = rcm_resp.json()
    rcm_years = [int(pt["year"]) for pt in rcm_body["region_a_analysis"]["time_series"]]
    assert rcm_years
    assert min(rcm_years) >= 2019
    assert max(rcm_years) <= 2026

    # Verify NASA POWER unit normalizations in _parse_nasa_monthly_dict
    raw_sw = {f"{yr}{mo:02d}": 10.0 for yr in range(2015, 2025) for mo in range(1, 13)}
    bundle_sw = _parse_nasa_monthly_dict(raw_sw, 50.4, 30.5, "ALLSKY_SFC_SW_DWN", 2015, 2024)
    assert bundle_sw is not None
    # 10 MJ/m^2/day * (1_000_000 / 86_400) ~= 115.7407 W/m^2
    assert abs(float(bundle_sw.monthly_df["value"].iloc[0]) - 115.7407) < 0.01

    raw_snow = {f"{yr}{mo:02d}": 25.0 for yr in range(2015, 2025) for mo in range(1, 13)}
    bundle_snow = _parse_nasa_monthly_dict(raw_snow, 50.4, 30.5, "SNODP", 2015, 2024)
    assert bundle_snow is not None
    # 25 cm -> 0.25 m
    assert abs(float(bundle_snow.monthly_df["value"].iloc[0]) - 0.25) < 0.001
