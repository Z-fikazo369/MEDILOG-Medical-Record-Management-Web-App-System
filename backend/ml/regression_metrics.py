"""
Reusable scoring metrics for regression models.

This module centralizes metric computations used by the visit forecast model.

Formulas (for reference):
- MAE:  MAE = (1/n) * sum(|y_i - y_hat_i|)
- RMSE: RMSE = sqrt((1/n) * sum((y_i - y_hat_i)^2))
- MAPE: MAPE = (100/n) * sum(|(y_i - y_hat_i) / y_i|), for y_i != 0
- R^2:  R^2 = 1 - (sum((y_i - y_hat_i)^2) / sum((y_i - y_bar)^2))
"""

from __future__ import annotations

from typing import Dict

import numpy as np


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    if y_true.size == 0:
        return 0.0
    return float(np.mean(np.abs(y_true - y_pred)))


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    if y_true.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(np.square(y_true - y_pred))))


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    if y_true.size == 0:
        return 0.0
    non_zero_mask = y_true != 0
    if not np.any(non_zero_mask):
        return 0.0
    ratio = np.abs((y_true[non_zero_mask] - y_pred[non_zero_mask]) / y_true[non_zero_mask])
    return float(np.mean(ratio) * 100.0)


def r2_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    if y_true.size == 0:
        return 0.0

    ss_res = float(np.sum(np.square(y_true - y_pred)))
    y_mean = float(np.mean(y_true))
    ss_tot = float(np.sum(np.square(y_true - y_mean)))

    if ss_tot == 0.0:
        # If all true values are identical, R^2 is undefined in strict terms.
        # We return 0.0 as a conservative, stable fallback.
        return 0.0

    return float(1.0 - (ss_res / ss_tot))


def summarize_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    return {
        "mae": round(mae(y_true, y_pred), 4),
        "rmse": round(rmse(y_true, y_pred), 4),
        "mape": round(mape(y_true, y_pred), 4),
        "r2": round(r2_score(y_true, y_pred), 4),
    }
