import express from "express";
import {
  getDashboardInsights,
  getDashboardOverview,
} from "../controllers/analyticsController.js";
import {
  getVisitForecast,
  retrainVisitForecast,
} from "../controllers/visitForecastController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ito 'yung bagong endpoint na tatawagin ng React
// GET /api/analytics/insights
router.route("/insights").get(protect, isAdmin, getDashboardInsights);

// GET /api/analytics/dashboard-overview
router.route("/dashboard-overview").get(protect, isAdmin, getDashboardOverview);

// GET /api/analytics/visit-forecast
router.route("/visit-forecast").get(protect, isAdmin, getVisitForecast);

// POST /api/analytics/visit-forecast/train
router
  .route("/visit-forecast/train")
  .post(protect, isAdmin, retrainVisitForecast);

export default router;
