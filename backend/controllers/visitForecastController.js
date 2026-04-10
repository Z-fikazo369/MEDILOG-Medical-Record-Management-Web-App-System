import {
  predictVisitForecast,
  trainVisitForecastModel,
} from "../utils/visitForecastModel.js";

export const getVisitForecast = async (req, res) => {
  try {
    const result = await predictVisitForecast();
    if (!result.ok) {
      return res.status(result.statusCode || 500).json({
        message: result.error || "Failed to generate visit forecast.",
      });
    }

    return res.json({
      message: "Visit forecast generated.",
      forecast: result.nextForecast,
      weeklyForecast: result.weeklyForecast,
      lastCompletedWeek: result.lastCompletedWeek,
      currentWeekProgress: result.currentWeekProgress,
      weeklyHistory: result.weeklyHistory,
      lastCompletedMonth: result.lastCompletedMonth,
      history: result.history,
      modelMetadata: result.modelMetadata || {},
    });
  } catch (error) {
    console.error("[VisitForecast] Prediction error:", error);
    return res.status(500).json({
      message: "Failed to generate visit forecast.",
    });
  }
};

export const retrainVisitForecast = async (req, res) => {
  try {
    const result = await trainVisitForecastModel();
    if (!result.ok) {
      return res.status(result.statusCode || 500).json({
        message: result.error || "Failed to train visit forecast model.",
        foundWeeks: result.foundWeeks,
        requiredWeeks: result.requiredWeeks,
        hint: result.hint,
      });
    }

    return res.json({
      message: "Visit forecast model trained successfully.",
      nextForecast: result.nextForecast,
      weeklyForecast: result.weeklyForecast,
      metrics: result.metrics,
      lastCompletedWeek: result.lastCompletedWeek,
      lastCompletedMonth: result.lastCompletedMonth,
      dataSummary: result.dataSummary,
    });
  } catch (error) {
    console.error("[VisitForecast] Training error:", error);
    return res.status(500).json({
      message: "Failed to train visit forecast model.",
    });
  }
};
