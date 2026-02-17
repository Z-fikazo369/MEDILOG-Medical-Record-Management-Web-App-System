import express from "express";
import {
  getDashboardInsights,
  getDashboardOverview,
  getPredictiveAnalytics,
} from "../controllers/analyticsController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ito 'yung bagong endpoint na tatawagin ng React
// GET /api/analytics/insights
router.route("/insights").get(protect, isAdmin, getDashboardInsights);

// GET /api/analytics/dashboard-overview
router.route("/dashboard-overview").get(protect, isAdmin, getDashboardOverview);

// GET /api/analytics/predictive
router.route("/predictive").get(protect, isAdmin, getPredictiveAnalytics);

export default router;
