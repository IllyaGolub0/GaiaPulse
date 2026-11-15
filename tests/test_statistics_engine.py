"""Unit tests for the GaiaPulse mathematical and statistical engine."""

from __future__ import annotations

import numpy as np
import pandas as pd

from statistics_engine import (
    analyze_single_region,
    apply_seasonal_filter,
    compare_dipole_regions,
    compute_autocorrelation_and_hamed_rao,
    compute_mann_kendall_and_sen,
    compute_pettitt_change_point,
    compute_stl_decomposition,
    compute_time_to_significance,
)


def _make_monthly_df(
    start_year: int = 2000,
    end_year: int = 2020,
    slope_per_year: float = 0.05,
    seasonal_amp: float = 4.0,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    rows = []
    for yr in range(start_year, end_year + 1):
        for mo in range(1, 13):
            val = 10.0 + slope_per_year * (yr - start_year) + seasonal_amp * np.cos(
                2.0 * np.pi * (mo - 7) / 12.0
            )
            rows.append(
                {
                    "year": yr,
                    "month": mo,
                    "timestamp": f"{yr:04d}-{mo:02d}",
                    "value": float(val),
                }
            )
    monthly_df = pd.DataFrame(rows)
    annual_df = monthly_df.groupby("year", as_index=False)["value"].mean()
    baseline_df = annual_df[annual_df["year"] <= start_year + 10].copy()
    return annual_df, monthly_df, baseline_df


def test_djf_seasonal_filter_groups_december_with_next_year() -> None:
    """Dec(Y-1) must be averaged with Jan(Y) and Feb(Y) into winter year Y."""
    rows = [
        {"year": 2019, "month": 12, "timestamp": "2019-12", "value": 10.0},
        {"year": 2020, "month": 1, "timestamp": "2020-01", "value": 20.0},
        {"year": 2020, "month": 2, "timestamp": "2020-02", "value": 30.0},
        {"year": 2020, "month": 12, "timestamp": "2020-12", "value": 100.0},
        {"year": 2021, "month": 1, "timestamp": "2021-01", "value": 200.0},
        {"year": 2021, "month": 2, "timestamp": "2021-02", "value": 300.0},
        {"year": 2021, "month": 12, "timestamp": "2021-12", "value": 1000.0},
        {"year": 2022, "month": 1, "timestamp": "2022-01", "value": 2000.0},
        {"year": 2022, "month": 2, "timestamp": "2022-02", "value": 3000.0},
        # Trailing lone Dec 2022 should be excluded rather than creating an artificial 1-month 2023 winter
        {"year": 2022, "month": 12, "timestamp": "2022-12", "value": 9999.0},
    ]
    monthly_df = pd.DataFrame(rows)
    annual_df = monthly_df.groupby("year", as_index=False)["value"].mean()

    filtered, _, boost = apply_seasonal_filter(
        monthly_df=monthly_df,
        annual_df=annual_df,
        baseline_df=annual_df,
        season_mode="DJF",
    )

    assert boost == 1.0
    assert filtered["year"].tolist() == [2020, 2021, 2022]
    assert np.allclose(filtered["value"].tolist(), [20.0, 200.0, 2000.0])


def test_mann_kendall_and_sen_slope_detects_monotonic_trend() -> None:
    years = np.arange(2000, 2020, dtype=float)
    values = 5.0 + 0.25 * (years - 2000.0)
    res = compute_mann_kendall_and_sen(years, values)

    assert res["h"] is True
    assert res["trend"] == "increasing"
    assert res["p"] < 0.001
    assert np.isclose(res["slope"], 0.25, atol=1e-6)


def test_pettitt_change_point_identifies_step_shift_year() -> None:
    years = np.arange(2000, 2022, dtype=float)
    rng = np.random.default_rng(42)
    values = np.concatenate(
        [
            1.0 + rng.normal(0.0, 0.05, size=10),  # 2000..2009
            5.0 + rng.normal(0.0, 0.05, size=12),  # 2010..2021
        ]
    )
    cp = compute_pettitt_change_point(years, values)

    assert cp["is_significant"] is True
    assert cp["change_point_year"] == 2009
    assert cp["direction"] == "upward_shift"
    assert cp["step_delta"] > 3.5


def test_hamed_rao_autocorrelation_reduces_effective_sample_size() -> None:
    rng = np.random.default_rng(7)
    n = 30
    ar1 = np.zeros(n)
    for i in range(1, n):
        ar1[i] = 0.75 * ar1[i - 1] + rng.normal(0.0, 0.2)
    values = 0.03 * np.arange(n) + ar1
    res = compute_autocorrelation_and_hamed_rao(
        values=values,
        residuals=ar1,
        raw_p_value=0.02,
        z_score=2.33,
    )

    assert res["lag1_r"] > 0.3
    assert res["variance_inflation_factor"] > 1.2
    assert res["effective_sample_size"] < n
    assert res["hamed_rao_p_value"] > 0.02


def test_time_to_significance_accounts_for_autocorrelation_vif() -> None:
    tts_iid = compute_time_to_significance(
        n_years=20,
        end_year=2025,
        p_value=0.08,
        t_stat=1.85,
        z_score=1.75,
        lag1_r=0.0,
        variance_inflation_factor=1.0,
    )
    tts_ar1 = compute_time_to_significance(
        n_years=20,
        end_year=2025,
        p_value=0.08,
        t_stat=1.85,
        z_score=1.75,
        lag1_r=0.45,
        variance_inflation_factor=2.6,
    )

    assert tts_iid["is_already_significant"] is False
    assert tts_ar1["autocorrelation_adjusted"] is True
    assert tts_ar1["additional_years_needed"] > tts_iid["additional_years_needed"]


def test_sens_slope_lies_inside_theil_sen_95_ci_even_with_outlier_spike() -> None:
    years = np.arange(2004, 2026)
    rows = []
    for yr in years:
        base = 0.4 + (-0.015 * (yr - 2004))
        # Inject extreme Kasatochi-like spike in 2008 that pulls OLS slope steeply negative
        val = base + (6.5 if yr == 2008 else 0.0)
        for mo in range(1, 13):
            rows.append(
                {
                    "year": int(yr),
                    "month": mo,
                    "timestamp": f"{yr:04d}-{mo:02d}",
                    "value": float(val + 0.02 * np.cos(2 * np.pi * mo / 12)),
                }
            )
    monthly_df = pd.DataFrame(rows)
    annual_df = monthly_df.groupby("year", as_index=False)["value"].mean()

    res = analyze_single_region(
        location_info={"name": "Kasatochi Spike Test", "lat": 52.17, "lon": -175.51},
        variable_meta={"code": "SO2", "unit": "DU"},
        annual_df=annual_df,
        monthly_df=monthly_df,
        baseline_df=annual_df.head(10),
        season_mode="deseasonalized",
    )
    stats_block = res["statistics"]
    roc = stats_block["rate_of_change"]

    assert roc["ci_95_lower_decade"] <= roc["per_decade"] <= roc["ci_95_upper_decade"]
    assert stats_block["slope_ci_lower_decade"] == roc["ci_95_lower_decade"]
    assert stats_block["slope_ci_upper_decade"] == roc["ci_95_upper_decade"]


def test_analyze_single_region_does_not_temporally_smooth_values_on_roi_flag() -> None:
    annual_df, monthly_df, baseline_df = _make_monthly_df(2000, 2020, slope_per_year=0.1)
    res_plain = analyze_single_region(
        location_info={"name": "Test", "lat": 45.0, "lon": 30.0},
        variable_meta={"code": "T2M", "unit": "°C"},
        annual_df=annual_df,
        monthly_df=monthly_df,
        baseline_df=baseline_df,
        season_mode="deseasonalized",
        spatial_box_averaging=False,
    )
    res_roi = analyze_single_region(
        location_info={"name": "Test", "lat": 45.0, "lon": 30.0},
        variable_meta={"code": "T2M", "unit": "°C"},
        annual_df=annual_df,
        monthly_df=monthly_df,
        baseline_df=baseline_df,
        season_mode="deseasonalized",
        spatial_box_averaging=True,
    )

    vals_plain = [p["value"] for p in res_plain["time_series"]]
    vals_roi = [p["value"] for p in res_roi["time_series"]]
    assert vals_plain == vals_roi
    assert "ROI" in res_roi["data_source"]


def test_stl_decomposition_and_dipole_comparison() -> None:
    ann_a, mon_a, base_a = _make_monthly_df(2000, 2020, slope_per_year=0.12)
    ann_b, mon_b, base_b = _make_monthly_df(2000, 2020, slope_per_year=-0.10)

    stl_payload, _ = compute_stl_decomposition(mon_a, ann_a)
    assert len(stl_payload["annual_seasonal_cycle"]) == 12
    assert len(stl_payload["observed"]) == len(mon_a)

    res_a = analyze_single_region(
        {"name": "Pole A", "lat": 10.0, "lon": 10.0},
        {"code": "T2M", "unit": "°C"},
        ann_a,
        mon_a,
        base_a,
        season_mode="deseasonalized",
    )
    res_b = analyze_single_region(
        {"name": "Pole B", "lat": -10.0, "lon": 100.0},
        {"code": "T2M", "unit": "°C"},
        ann_b,
        mon_b,
        base_b,
        season_mode="deseasonalized",
    )
    dipole = compare_dipole_regions(res_a, res_b)

    assert dipole["is_opposite_trend"] is True
    assert dipole["is_dipole_detected"] is True
    assert dipole["pearson_r"] < -0.9


def test_analyze_single_region_english_localization_and_data_origin() -> None:
    annual_df, monthly_df, baseline_df = _make_monthly_df(2000, 2020, slope_per_year=0.12)
    res = analyze_single_region(
        location_info={"name": "Kyiv Basin", "lat": 50.45, "lon": 30.52},
        variable_meta={"code": "T2M", "unit": "°C"},
        annual_df=annual_df,
        monthly_df=monthly_df,
        baseline_df=baseline_df,
        season_mode="deseasonalized",
        data_origin="user_csv",
        lang="en",
    )
    assert res["data_origin"] == "user_csv"
    assert "statistically significant" in res["human_summary"].lower()
    assert "Statistical significance threshold" in res["statistics"]["time_to_significance"]["message"]
    assert res["stl_decomposition"]["annual_seasonal_cycle"][0]["month_name"] == "Jan"


def test_compare_dipole_regions_rejects_flat_noisy_non_significant_opposite_signs() -> None:
    rng = np.random.default_rng(12345)
    years = list(range(2005, 2021))
    # Construct two nearly flat oscillating series with p > 0.4 and negligible correlation
    rows_a = []
    rows_b = []
    for idx, yr in enumerate(years):
        val_a = 10.0 + (0.08 if idx % 2 == 0 else -0.08) + float(rng.normal(0, 0.02))
        val_b = 10.0 + (0.08 if (idx // 2) % 2 == 0 else -0.08) + float(rng.normal(0, 0.02))
        for mo in range(1, 13):
            rows_a.append({"year": yr, "month": mo, "timestamp": f"{yr:04d}-{mo:02d}", "value": val_a})
            rows_b.append({"year": yr, "month": mo, "timestamp": f"{yr:04d}-{mo:02d}", "value": val_b})
    mon_a = pd.DataFrame(rows_a)
    mon_b = pd.DataFrame(rows_b)
    ann_a = mon_a.groupby("year", as_index=False)["value"].mean()
    ann_b = mon_b.groupby("year", as_index=False)["value"].mean()

    res_a = analyze_single_region(
        {"name": "Flat A", "lat": 10.0, "lon": 10.0},
        {"code": "T2M", "unit": "°C"},
        ann_a,
        mon_a,
        ann_a.head(8),
        season_mode="deseasonalized",
        lang="en",
    )
    res_b = analyze_single_region(
        {"name": "Flat B", "lat": 20.0, "lon": 20.0},
        {"code": "T2M", "unit": "°C"},
        ann_b,
        mon_b,
        ann_b.head(8),
        season_mode="deseasonalized",
        lang="en",
    )
    assert res_a["statistics"]["p_value"] > 0.10
    assert res_b["statistics"]["p_value"] > 0.10
    dipole = compare_dipole_regions(res_a, res_b, lang="en")
    assert dipole["is_dipole_detected"] is False
    assert "Dipole" not in dipole["badge"] or "Detected" not in dipole["badge"]
