import json
import os
import sys
from typing import Any, Dict, List

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def _error(message: str) -> Dict[str, Any]:
    return {"ok": False, "error": message}


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _plot_residuals_scatter(points: List[Dict[str, Any]], output_dir: str) -> str:
    if not points:
        raise ValueError("No evaluation points for residual plot.")

    predicted = np.array([_to_float(p.get("predicted")) for p in points], dtype=float)
    residuals = np.array([_to_float(p.get("actual")) - _to_float(p.get("predicted")) for p in points], dtype=float)
    idx_colors = np.arange(len(points))

    fig, ax = plt.subplots(figsize=(8.8, 5.8))
    ax.set_facecolor("#f8fafc")

    scatter = ax.scatter(
        predicted,
        residuals,
        c=idx_colors,
        cmap="viridis",
        s=52,
        alpha=0.78,
        edgecolors="#ffffff",
        linewidths=0.45,
        label="Residual Points",
    )
    cbar = fig.colorbar(scatter, ax=ax)
    cbar.ax.set_ylabel("Point Order", rotation=270, labelpad=12)

    ax.axhline(0.0, color="#475569", linestyle="--", linewidth=1.5, label="Zero Error")
    ax.set_title("Residuals Plot (Actual - Predicted)")
    ax.set_xlabel("Predicted Visits")
    ax.set_ylabel("Residual")
    ax.grid(linestyle="--", alpha=0.28)
    ax.legend(loc="upper right")
    fig.tight_layout()

    residuals_path = os.path.join(output_dir, "visit_forecast_residuals.png")
    fig.savefig(residuals_path, dpi=160)
    plt.close(fig)
    return residuals_path


def _plot_regression_scatter(points: List[Dict[str, Any]], output_dir: str) -> str:
    if not points:
        raise ValueError("No evaluation points for scatter plot.")

    fig, ax = plt.subplots(figsize=(8.8, 6.0))
    ax.set_facecolor("#f8fafc")

    # Color points by temporal index to mimic a richer scatter style.
    all_points = points
    actual_all = np.array([_to_float(p.get("actual")) for p in all_points], dtype=float)
    pred_all = np.array([_to_float(p.get("predicted")) for p in all_points], dtype=float)
    idx_colors = np.arange(len(all_points))
    if actual_all.size > 0:
        scatter = ax.scatter(
            actual_all,
            pred_all,
            c=idx_colors,
            cmap="rainbow",
            s=44,
            alpha=0.72,
            edgecolors="#ffffff",
            linewidths=0.45,
            label="Evaluation Points",
        )
        cbar = fig.colorbar(scatter, ax=ax)
        cbar.ax.set_ylabel("Point Order", rotation=270, labelpad=12)

    x_all = actual_all
    y_all = pred_all

    min_v = float(np.min(np.concatenate([x_all, y_all]))) if x_all.size > 0 else 0.0
    max_v = float(np.max(np.concatenate([x_all, y_all]))) if x_all.size > 0 else 1.0

    # Ideal fit line (y = x)
    ax.plot([min_v, max_v], [min_v, max_v], color="#475569", linestyle="--", linewidth=1.6, label="Ideal (y=x)")

    # Linear trend line of predictions vs actual
    if x_all.size >= 2:
        slope, intercept = np.polyfit(x_all, y_all, 1)
        trend_x = np.linspace(min_v, max_v, 100)
        trend_y = slope * trend_x + intercept
        ax.plot(trend_x, trend_y, color="#0f766e", linewidth=2.0, label="Linear fit")

        # Simple confidence band around linear fit using residual spread.
        residuals = y_all - (slope * x_all + intercept)
        sigma = float(np.std(residuals)) if residuals.size > 1 else 0.0
        band = 1.96 * sigma
        ax.fill_between(trend_x, trend_y - band, trend_y + band, color="#60a5fa", alpha=0.18, label="~95% band")

    ax.set_title("Actual vs Predicted (Regression Scatter + Linear Fit)")
    ax.set_xlabel("Actual Visits")
    ax.set_ylabel("Predicted Visits")
    ax.grid(linestyle="--", alpha=0.28)
    ax.legend(loc="upper left")
    fig.tight_layout()

    scatter_path = os.path.join(output_dir, "visit_forecast_scatter.png")
    fig.savefig(scatter_path, dpi=160)
    plt.close(fig)
    return scatter_path


def main() -> None:
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            print(json.dumps(_error("No input payload provided.")))
            return

        payload = json.loads(raw)
        points = payload.get("evaluationPoints") or []
        output_dir = payload.get("outputDir")

        if not output_dir:
            print(json.dumps(_error("outputDir is required.")))
            return

        if not isinstance(points, list) or len(points) == 0:
            print(json.dumps(_error("evaluationPoints must be a non-empty list.")))
            return

        os.makedirs(output_dir, exist_ok=True)

        scatter_path = _plot_regression_scatter(points, output_dir)
        residuals_path = _plot_residuals_scatter(points, output_dir)

        print(
            json.dumps(
                {
                    "ok": True,
                    "scatterChart": scatter_path,
                    "residualsPlot": residuals_path,
                }
            )
        )
    except Exception as exc:
        print(json.dumps(_error(f"Plot generation failed: {str(exc)}")))


if __name__ == "__main__":
    main()
