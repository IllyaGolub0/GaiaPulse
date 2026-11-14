"""Unit tests for the scientific CSV parser."""

from __future__ import annotations

import pytest

from csv_parser import parse_scientific_csv_text


def test_parse_giovanni_preamble_and_filter_fill_values() -> None:
    csv_text = "\n".join(
        [
            "# Title: MODIS Aqua AOD",
            "User Region: Wisconsin",
            "Date,AOD_Mean",
            "2018-06,0.14",
            "2018-07,-9999",
            "2019-06,0.18",
            "2020-06,0.21",
            "2021-06,0.27",
            "2022-06,0.29",
        ]
    )

    annual_df, monthly_df, baseline_df, meta = parse_scientific_csv_text(csv_text)

    assert meta["inferred_column"] == "AOD_Mean"
    assert meta["years_count"] == 5
    assert meta["total_observations"] == 5
    assert len(annual_df) == 5
    assert len(monthly_df) == 5
    assert not baseline_df.empty
    assert -9999 not in monthly_df["value"].values


def test_parse_separate_year_month_and_semicolon_delimiter() -> None:
    csv_text = "\n".join(
        [
            "Year;Month;T2M",
            "2000;1;1.5",
            "2001;1;2.0",
            "2002;1;2.5",
            "2003;1;3.0",
        ]
    )

    annual_df, monthly_df, _, meta = parse_scientific_csv_text(csv_text)
    assert meta["start_year"] == 2000
    assert meta["end_year"] == 2003
    assert monthly_df["month"].tolist() == [1, 1, 1, 1]
    assert len(annual_df) == 4


def test_parse_rejects_insufficient_years() -> None:
    with pytest.raises(ValueError):
        parse_scientific_csv_text("Date,Value\n2020-01,1.0\n2021-01,2.0\n2022-01,3.0")
