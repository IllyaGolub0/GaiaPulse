"""Scientific CSV time-series parser for NASA Giovanni, AppEEARS, GES DISC, and NOAA CDO."""

from __future__ import annotations

import csv
import io
import math
import re
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

_VALUE_COLUMN_TOKENS = (
    "val",
    "data",
    "mean",
    "anom",
    "aod",
    "chla",
    "chlor",
    "wse",
    "sar",
    "backscatter",
    "t2m",
    "temp",
    "prec",
    "prcp",
    "gwet",
    "so2",
    "sst",
    "qrunoff",
    "snodp",
)


def _detect_columns(
    first_row: List[str],
) -> Tuple[int, Optional[int], int, str]:
    """Identify date, optional month, and value column indices from a CSV header row."""
    date_col_idx = 0
    month_col_idx: Optional[int] = None
    val_col_idx = 1 if len(first_row) > 1 else 0
    inferred_col_name = "Value"

    headers_lower = [h.lower() for h in first_row]
    for idx, header in enumerate(headers_lower):
        if any(k in header for k in ("date", "time", "timestamp", "datetime", "year", "рік")):
            date_col_idx = idx
            break
    for idx, header in enumerate(headers_lower):
        if idx != date_col_idx and header in ("month", "mo", "місяць", "mon"):
            month_col_idx = idx
            break

    preferred_val_idx: Optional[int] = None
    for idx, header in enumerate(headers_lower):
        if idx in (date_col_idx, month_col_idx):
            continue
        if any(k in header for k in _VALUE_COLUMN_TOKENS):
            preferred_val_idx = idx
            inferred_col_name = first_row[idx]
            break

    if preferred_val_idx is None:
        for idx in range(len(first_row)):
            if idx not in (date_col_idx, month_col_idx):
                preferred_val_idx = idx
                inferred_col_name = first_row[idx]
                break

    if preferred_val_idx is not None:
        val_col_idx = preferred_val_idx

    return date_col_idx, month_col_idx, val_col_idx, inferred_col_name


def parse_scientific_csv_text(
    csv_text: str,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Parse CSV files exported from NASA Giovanni, AppEEARS, GES DISC Hydrology Time Series, or NOAA CDO.

    Supports:
    - Preamble comment lines starting with `#` or metadata key-value lines before the tabular header
    - Date formats: `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, `YYYY/MM/DD`, `YYYYMM`, ISO timestamps, or separate `Year` & `Month` columns
    - Value columns named `Value`, `data`, `mean`, variable codes, or the first numeric column after Date
    - Automatic filtering of NASA/NOAA fill values (`-9999`, `-999.9`, `NaN`, `null`)
    """
    raw_lines = [line.strip() for line in csv_text.splitlines() if line.strip()]
    detected_meta: Dict[str, Any] = {}

    data_lines: List[str] = []
    header_found = False

    for line in raw_lines:
        if line.startswith("#"):
            clean_comment = line.lstrip("#").strip()
            if ":" in clean_comment:
                k, v = clean_comment.split(":", 1)
                detected_meta[k.strip().lower()] = v.strip()
            continue

        # Skip Giovanni metadata preamble lines before the actual CSV header
        if not header_found:
            lower_line = line.lower()
            has_date_token = any(
                tok in lower_line
                for tok in ("date", "year", "time", "timestamp", "datetime", "month")
            )
            first_token = line.split(",")[0].strip().strip('"')
            looks_like_date_row = bool(re.match(r"^(19|20)\d{2}", first_token))
            if has_date_token or looks_like_date_row:
                header_found = True
                data_lines.append(line)
            elif ":" in line and "," not in line:
                k, v = line.split(":", 1)
                detected_meta[k.strip().lower()] = v.strip()
        else:
            data_lines.append(line)

    if not data_lines:
        data_lines = [ln for ln in raw_lines if not ln.startswith("#")]

    if len(data_lines) < 3:
        raise ValueError(
            "CSV-файл містить замало рядків для статистичного аналізу (потрібно щонайменше 3 роки даних)."
        )

    sample_text = "\n".join(data_lines[:15])
    delimiter = ";" if sample_text.count(";") > sample_text.count(",") else ","
    reader = csv.reader(io.StringIO("\n".join(data_lines)), delimiter=delimiter)
    rows = [r for r in reader if any(cell.strip() for cell in r)]

    if len(rows) < 3:
        raise ValueError("Не вдалося розпізнати табличні рядки у CSV-файлі.")

    first_row = [c.strip().strip('"') for c in rows[0]]
    first_cell_is_year = bool(re.match(r"^(19|20)\d{2}", first_row[0]))

    if not first_cell_is_year:
        date_col_idx, month_col_idx, val_col_idx, inferred_col_name = _detect_columns(first_row)
        data_rows = rows[1:]
    else:
        date_col_idx = 0
        month_col_idx = None
        val_col_idx = 1 if len(first_row) > 1 else 0
        inferred_col_name = "Value"
        data_rows = rows

    monthly_records: List[Dict[str, Any]] = []
    for raw_r in data_rows:
        if len(raw_r) <= max(date_col_idx, val_col_idx):
            continue
        raw_date = raw_r[date_col_idx].strip().strip('"')
        raw_val = raw_r[val_col_idx].strip().strip('"')
        if not raw_date or not raw_val:
            continue

        try:
            val = float(raw_val)
        except ValueError:
            continue

        if math.isnan(val) or math.isinf(val) or val <= -900.0 or val in (-9999.0, -999.9, -999.0, 9999.0):
            continue

        yr: Optional[int] = None
        mo: int = 6

        m_iso = re.match(r"^((?:18|19|20)\d{2})[-/.](\d{1,2})", raw_date)
        m_ym6 = re.match(r"^((?:18|19|20)\d{2})(\d{2})$", raw_date)
        m_year_only = re.match(r"^((?:18|19|20)\d{2})(?:\.0)?$", raw_date)

        if m_iso:
            yr = int(m_iso.group(1))
            mo = int(m_iso.group(2))
        elif m_ym6:
            yr = int(m_ym6.group(1))
            mo = int(m_ym6.group(2))
        elif m_year_only:
            yr = int(m_year_only.group(1))
            if month_col_idx is not None and len(raw_r) > month_col_idx:
                try:
                    mo = int(float(raw_r[month_col_idx].strip()))
                except ValueError:
                    mo = 6
            else:
                mo = 6
        else:
            parsed_dt = pd.to_datetime(raw_date, errors="coerce")
            if pd.notna(parsed_dt):
                yr = int(parsed_dt.year)
                mo = int(parsed_dt.month)

        if yr is None or yr < 1850 or yr > 2100:
            continue
        if mo < 1 or mo > 12:
            mo = 6

        monthly_records.append(
            {
                "year": yr,
                "month": mo,
                "timestamp": f"{yr:04d}-{mo:02d}",
                "value": round(float(val), 5),
            }
        )

    if len(monthly_records) < 4:
        raise ValueError(
            "Не вдалося вилучити достатню кількість коректних пар (Дата, Значення) із завантаженого CSV."
        )

    monthly_df = (
        pd.DataFrame(monthly_records)
        .groupby(["year", "month", "timestamp"], as_index=False)["value"]
        .mean()
        .sort_values(["year", "month"])
        .reset_index(drop=True)
    )
    annual_df = (
        monthly_df.groupby("year", as_index=False)["value"]
        .mean()
        .sort_values("year")
        .reset_index(drop=True)
    )

    if len(annual_df) < 4:
        raise ValueError(
            f"Для статистичного тесту тренду потрібно щонайменше 4 річні точки, знайдено: {len(annual_df)}."
        )

    baseline_df = annual_df[(annual_df["year"] >= 1981) & (annual_df["year"] <= 2010)].copy()
    if len(baseline_df) < 5:
        baseline_df = annual_df.head(min(15, len(annual_df))).copy()

    detected_meta["inferred_column"] = inferred_col_name
    detected_meta["total_observations"] = len(monthly_df)
    detected_meta["years_count"] = len(annual_df)
    detected_meta["start_year"] = int(annual_df["year"].min())
    detected_meta["end_year"] = int(annual_df["year"].max())

    return annual_df, monthly_df, baseline_df, detected_meta
