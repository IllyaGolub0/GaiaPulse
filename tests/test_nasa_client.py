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
