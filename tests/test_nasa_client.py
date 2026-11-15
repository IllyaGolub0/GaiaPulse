"""Unit tests for NASA client spatial 5-point ROI box averaging."""

from __future__ import annotations

import asyncio

import pandas as pd

import nasa_client


def _stub_bundle(lat: float, lon: float, offset: float) -> nasa_client.ClimateDataBundle:
    rows = []
    for yr in range(2000, 2006):
        for mo in range(1, 13):
            rows.append(
                {
                    "year": yr,
                    "month": mo,
                    "timestamp": f"{yr:04d}-{mo:02d}",
                    "value": float(yr - 2000) + offset,
                }
            )
    monthly_df = pd.DataFrame(rows)
    annual_df = monthly_df.groupby("year", as_index=False)["value"].mean()
    return nasa_client.ClimateDataBundle(
        variable="T2M",
        lat=lat,
        lon=lon,
        start_year=2000,
        end_year=2005,
        annual_df=annual_df,
        monthly_df=monthly_df,
        baseline_df=annual_df.copy(),
        source="Stub Source",
    )


def test_fetch_spatial_box_series_averages_5_coordinates(monkeypatch) -> None:
    called_coords: list[tuple[float, float]] = []

    async def fake_fetch(
        lat: float,
        lon: float,
        variable: str,
        start_year: int = 1985,
        end_year: int = 2026,
        prefer_live_api: bool = True,
    ) -> nasa_client.ClimateDataBundle:
        called_coords.append((lat, lon))
        # Center gets offset 0, 4 corners get +10 each -> spatial mean offset = 8.0
        offset = 0.0 if (lat == 89.0 and lon == 179.5) else 10.0
        return _stub_bundle(lat, lon, offset)

    monkeypatch.setattr(nasa_client, "fetch_climate_series", fake_fetch)

    bundle = asyncio.run(
        nasa_client.fetch_spatial_box_series(
            lat=89.0,
            lon=179.5,
            variable="T2M",
            start_year=2000,
            end_year=2005,
            prefer_live_api=False,
            box_offset_deg=1.5,
        )
    )

    assert len(called_coords) == 5
    # Latitudes must stay clamped within [-89.5, 89.5] and longitudes wrapped within [-180, 180]
    assert all(-89.5 <= pt[0] <= 89.5 for pt in called_coords)
    assert all(-180.0 <= pt[1] <= 180.0 for pt in called_coords)
    assert bundle.annual_df.loc[bundle.annual_df["year"] == 2000, "value"].iloc[0] == 8.0
    assert "ROI 5-pt Box" in bundle.source


def test_parse_nasa_monthly_dict_does_not_extrapolate_trailing_years() -> None:
    raw_dict = {
        f"{yr}{mo:02d}": 12.0 + 0.05 * (yr - 2010)
        for yr in range(2010, 2024)
        for mo in range(1, 13)
    }
    bundle = nasa_client._parse_nasa_monthly_dict(
        raw_dict=raw_dict,
        lat=50.45,
        lon=30.52,
        variable="T2M",
        start_year=2010,
        end_year=2025,
    )
    assert bundle is not None
    assert bundle.data_origin == "live_api"
    assert int(bundle.annual_df["year"].max()) == 2023
    assert bundle.end_year == 2023


def test_fetch_raw_nasa_power_monthly_single_flight_deduplication(monkeypatch) -> None:
    nasa_client.clear_cache()
    call_count = 0
    sample_block = {
        f"{yr}{mo:02d}": 15.0 + 0.02 * (yr - 2010)
        for yr in range(2010, 2025)
        for mo in range(1, 13)
    }

    class _StubResponse:
        status_code = 200

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {"properties": {"parameter": {"T2M": sample_block}}}

    class _StubHttpClient:
        async def get(self, url: str, params=None, headers=None) -> _StubResponse:
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.03)
            return _StubResponse()

    monkeypatch.setattr(nasa_client, "_get_shared_http_client", lambda: _StubHttpClient())

    async def _run_concurrent() -> list[dict[str, float]]:
        return await asyncio.gather(
            *(
                nasa_client._fetch_raw_nasa_power_monthly(50.45, 30.52, "T2M", 2010, 2024)
                for _ in range(5)
            )
        )

    results = asyncio.run(_run_concurrent())
    assert call_count == 1
    assert len(results) == 5
    assert all(res == sample_block for res in results)
    nasa_client.clear_cache()
