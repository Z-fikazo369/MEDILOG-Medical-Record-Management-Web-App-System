import json
import os
import sys
from datetime import date, datetime
from typing import Any, Dict, List, Tuple

import numpy as np
from catboost import CatBoostRegressor
from regression_metrics import summarize_regression_metrics

MIN_LAGS = 3
DEFAULT_MIN_HISTORY_WEEKS = 20
MIN_ALLOWED_HISTORY_WEEKS = 8
FORECAST_HORIZON_WEEKS = 4
TRAIN_RATIO = 0.7
FEATURE_NAMES = [
    "lag1",
    "lag2",
    "lag3",
    "rolling3",
    "momentum",
    "seasonal_last_year",
    "week_of_year",
    "year",
]


def _error(message: str) -> Dict[str, Any]:
    return {"ok": False, "error": message}


def _safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _resolve_min_history_weeks(payload: Dict[str, Any]) -> int:
    raw = payload.get("minHistoryWeeks")
    try:
        parsed = int(raw)
    except (TypeError, ValueError):
        return DEFAULT_MIN_HISTORY_WEEKS

    return max(MIN_ALLOWED_HISTORY_WEEKS, parsed)


def _weeks_in_year(year: int) -> int:
    return date(year, 12, 28).isocalendar()[1]


def _next_week(year: int, week: int) -> Tuple[int, int]:
    max_week = _weeks_in_year(year)
    if week >= max_week:
        return year + 1, 1
    return year, week + 1


def _week_label(year: int, week: int) -> str:
    return f"{year}-W{week:02d}"


def _validate_series(series: List[Dict[str, Any]]) -> List[Dict[str, int]]:
    cleaned: List[Dict[str, int]] = []
    for item in series:
        year = int(item.get("year"))
        week = int(item.get("week"))
        count = int(round(_safe_float(item.get("count", 0))))
        max_week = _weeks_in_year(year)
        if week < 1 or week > max_week:
            raise ValueError(f"Invalid ISO week value: {week} for year {year}")
        cleaned.append({"year": year, "week": week, "count": max(0, count)})

    cleaned.sort(key=lambda x: (x["year"], x["week"]))
    return cleaned


def _build_training_data(
    series: List[Dict[str, int]],
) -> Tuple[np.ndarray, np.ndarray]:
    counts = [float(item["count"]) for item in series]
    weeks = [int(item["week"]) for item in series]
    years = [int(item["year"]) for item in series]

    x_rows: List[List[float]] = []
    y_rows: List[float] = []

    for idx in range(MIN_LAGS, len(series)):
        lag1 = counts[idx - 1]
        lag2 = counts[idx - 2]
        lag3 = counts[idx - 3]
        rolling3 = (lag1 + lag2 + lag3) / 3.0
        momentum = lag1 - lag2
        seasonal_last_year = counts[idx - 52] if idx - 52 >= 0 else lag3

        x_rows.append(
            [
                lag1,
                lag2,
                lag3,
                rolling3,
                momentum,
                seasonal_last_year,
                float(weeks[idx]),
                float(years[idx]),
            ]
        )
        y_rows.append(counts[idx])

    x = np.array(x_rows, dtype=float)
    y = np.array(y_rows, dtype=float)
    return x, y


def _build_feature_row(
    counts: List[float], target_year: int, target_week: int
) -> np.ndarray:
    lag1 = counts[-1]
    lag2 = counts[-2]
    lag3 = counts[-3]
    rolling3 = (lag1 + lag2 + lag3) / 3.0
    momentum = lag1 - lag2
    seasonal_last_year = counts[-52] if len(counts) >= 52 else lag3

    return np.array(
        [
            lag1,
            lag2,
            lag3,
            rolling3,
            momentum,
            seasonal_last_year,
            float(target_week),
            float(target_year),
        ],
        dtype=float,
    )


def _predict_horizon(
    model: CatBoostRegressor, series: List[Dict[str, int]], horizon: int
) -> List[Dict[str, Any]]:
    counts = [float(item["count"]) for item in series]
    cursor_year = int(series[-1]["year"])
    cursor_week = int(series[-1]["week"])

    forecasts: List[Dict[str, Any]] = []
    for _ in range(horizon):
        cursor_year, cursor_week = _next_week(cursor_year, cursor_week)
        feature_row = _build_feature_row(counts, cursor_year, cursor_week)
        raw_prediction = max(0.0, float(model.predict(np.array([feature_row]))[0]))
        prediction = int(round(raw_prediction))

        forecasts.append(
            {
                "year": cursor_year,
                "week": cursor_week,
                "label": _week_label(cursor_year, cursor_week),
                "predictedVisits": prediction,
            }
        )
        counts.append(float(prediction))

    return forecasts


def train_model(
    series: List[Dict[str, int]], model_dir: str, min_history_weeks: int
) -> Dict[str, Any]:
    if len(series) < min_history_weeks:
        return _error(
            f"Need at least {min_history_weeks} completed weeks to train. Found {len(series)}."
        )

    x, y = _build_training_data(series)
    if x.shape[0] < 4:
        return _error("Not enough training rows after feature generation.")

    split_idx = int(round(x.shape[0] * TRAIN_RATIO))
    split_idx = min(max(split_idx, 1), x.shape[0] - 1)

    x_train, y_train = x[:split_idx], y[:split_idx]
    x_val, y_val = x[split_idx:], y[split_idx:]

    model = CatBoostRegressor(
        loss_function="MAE",
        depth=6,
        learning_rate=0.05,
        iterations=600,
        random_seed=42,
        verbose=False,
    )

    model.fit(
        x_train,
        y_train,
        eval_set=(x_val, y_val) if x_val.shape[0] > 0 else None,
        use_best_model=x_val.shape[0] > 0,
    )

    train_pred = model.predict(x_train)
    val_pred = model.predict(x_val) if x_val.shape[0] > 0 else np.array([])

    next_week_forecasts = _predict_horizon(model, series, FORECAST_HORIZON_WEEKS)
    monthly_estimate = int(sum(item["predictedVisits"] for item in next_week_forecasts))

    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "visit_forecast.cbm")
    metadata_path = os.path.join(model_dir, "metadata.json")

    model.save_model(model_path)

    metadata = {
        "trainedAt": datetime.utcnow().isoformat() + "Z",
        "featureNames": FEATURE_NAMES,
        "trainingRows": int(x.shape[0]),
        "trainingWeeks": int(len(series)),
        "minHistoryWeeks": int(min_history_weeks),
        "lastCompletedWeek": {
            "year": series[-1]["year"],
            "week": series[-1]["week"],
            "label": _week_label(series[-1]["year"], series[-1]["week"]),
        },
        "forecastHorizonWeeks": FORECAST_HORIZON_WEEKS,
        "nextWeeklyForecast": next_week_forecasts,
        "monthlyEstimate": monthly_estimate,
        "metrics": {
            "train": summarize_regression_metrics(y_train, train_pred),
            "validation": summarize_regression_metrics(y_val, val_pred),
        },
        "split": {
            "trainRatio": TRAIN_RATIO,
            "validationRatio": round(1.0 - TRAIN_RATIO, 2),
            "trainRows": int(x_train.shape[0]),
            "validationRows": int(x_val.shape[0]),
        },
    }

    with open(metadata_path, "w", encoding="utf-8") as meta_file:
        json.dump(metadata, meta_file, indent=2)

    return {
        "ok": True,
        "action": "train",
        "modelPath": model_path,
        "metadataPath": metadata_path,
        "metrics": metadata["metrics"],
        "lastCompletedWeek": metadata["lastCompletedWeek"],
        "nextWeeklyForecast": next_week_forecasts,
        "monthlyEstimate": monthly_estimate,
        "nextForecast": {
            "targetMonth": {"label": "Next 4 Weeks"},
            "predictedVisits": monthly_estimate,
        },
    }


def evaluate_model(
    series: List[Dict[str, int]], model_dir: str, min_history_weeks: int
) -> Dict[str, Any]:
    if len(series) < min_history_weeks:
        return _error(
            f"Need at least {min_history_weeks} completed weeks to evaluate. Found {len(series)}."
        )

    model_path = os.path.join(model_dir, "visit_forecast.cbm")
    if not os.path.exists(model_path):
        return _error("Model not found. Train the model first.")

    x, y = _build_training_data(series)
    if x.shape[0] < 2:
        return _error("Not enough evaluation rows after feature generation.")

    split_idx = int(round(x.shape[0] * TRAIN_RATIO))
    split_idx = min(max(split_idx, 1), x.shape[0] - 1)

    model = CatBoostRegressor()
    model.load_model(model_path)

    y_pred = model.predict(x)

    points: List[Dict[str, Any]] = []
    for idx in range(x.shape[0]):
        target_week = series[idx + MIN_LAGS]
        split_name = "train" if idx < split_idx else "validation"
        points.append(
            {
                "week": _week_label(target_week["year"], target_week["week"]),
                "actual": round(float(y[idx]), 4),
                "predicted": round(float(y_pred[idx]), 4),
                "split": split_name,
                "error": round(float(y[idx] - y_pred[idx]), 4),
            }
        )

    train_metrics = summarize_regression_metrics(y[:split_idx], y_pred[:split_idx])
    val_metrics = summarize_regression_metrics(y[split_idx:], y_pred[split_idx:])
    overall_metrics = summarize_regression_metrics(y, y_pred)

    return {
        "ok": True,
        "action": "evaluate",
        "evaluationPoints": points,
        "metrics": {
            "train": train_metrics,
            "validation": val_metrics,
            "overall": overall_metrics,
        },
        "splitIndex": int(split_idx),
        "split": {
            "trainRatio": TRAIN_RATIO,
            "validationRatio": round(1.0 - TRAIN_RATIO, 2),
            "trainRows": int(split_idx),
            "validationRows": int(x.shape[0] - split_idx),
        },
    }


def predict_next_weeks(series: List[Dict[str, int]], model_dir: str) -> Dict[str, Any]:
    if len(series) < MIN_LAGS:
        return _error("Need at least 3 completed weeks for prediction.")

    model_path = os.path.join(model_dir, "visit_forecast.cbm")
    metadata_path = os.path.join(model_dir, "metadata.json")

    if not os.path.exists(model_path):
        return _error("Model not found. Train the model first.")

    model = CatBoostRegressor()
    model.load_model(model_path)

    metadata: Dict[str, Any] = {}
    if os.path.exists(metadata_path):
        with open(metadata_path, "r", encoding="utf-8") as meta_file:
            metadata = json.load(meta_file)

    next_week_forecasts = _predict_horizon(model, series, FORECAST_HORIZON_WEEKS)
    monthly_estimate = int(sum(item["predictedVisits"] for item in next_week_forecasts))

    return {
        "ok": True,
        "action": "predict",
        "lastCompletedWeek": {
            "year": series[-1]["year"],
            "week": series[-1]["week"],
            "label": _week_label(series[-1]["year"], series[-1]["week"]),
        },
        "nextWeeklyForecast": next_week_forecasts,
        "monthlyEstimate": monthly_estimate,
        "nextForecast": {
            "targetMonth": {"label": "Next 4 Weeks"},
            "predictedVisits": monthly_estimate,
        },
        "modelMetadata": metadata,
    }


def main() -> None:
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps(_error("No input payload provided.")))
            return

        payload = json.loads(raw)
        action = (payload.get("action") or "predict").strip().lower()
        model_dir = payload.get("modelDir")
        weekly_series = payload.get("weeklySeries") or payload.get("monthlySeries") or []
        min_history_weeks = _resolve_min_history_weeks(payload)

        if not model_dir:
            print(json.dumps(_error("modelDir is required.")))
            return

        series = _validate_series(weekly_series)

        if action == "train":
            result = train_model(series, model_dir, min_history_weeks)
        elif action == "evaluate":
            result = evaluate_model(series, model_dir, min_history_weeks)
        elif action == "predict":
            result = predict_next_weeks(series, model_dir)
        else:
            result = _error(f"Unsupported action: {action}")

        print(json.dumps(result))
    except Exception as exc:
        print(json.dumps(_error(f"Service failure: {str(exc)}")))


if __name__ == "__main__":
    main()
