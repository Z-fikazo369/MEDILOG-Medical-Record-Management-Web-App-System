import express from "express";
import {
  createRecord,
  getStudentRecords,
  getAllRecords,
  updateRecord,
  deleteRecord,
  bulkDeleteRecords,
  bulkUpdateStatus,
  getHierarchicalAggregation,
  exportRecords,
  exportTallyRecords,
  getPendingRecordCounts,
} from "../controllers/medicalRecordController.js";

// I-import ang security middleware
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Student routes ---
// (Gagamit ng 'protect' para siguradong naka-login)
router.post("/records", protect, createRecord);
router.get("/records/student/:studentId", protect, getStudentRecords);

// --- Admin routes ---
// (Gagamit ng 'protect' AT 'isAdmin')
router.get("/records/all", protect, isAdmin, getAllRecords);
router.put("/records/:id", protect, isAdmin, updateRecord);
router.delete("/records/:id", protect, isAdmin, deleteRecord);
router.post("/records/bulk-delete", protect, isAdmin, bulkDeleteRecords);
router.post("/records/bulk-update-status", protect, isAdmin, bulkUpdateStatus);
router.get(
  "/records/aggregation",
  protect,
  isAdmin,
  getHierarchicalAggregation,
);
router.get("/records/export", protect, isAdmin, exportRecords);
router.get("/records/tally-export", protect, isAdmin, exportTallyRecords);
router.get("/records/pending-counts", protect, isAdmin, getPendingRecordCounts);

// ❌ TINANGGAL NA RIN DITO 'YUNG ROUTE PARA SA TALLY EXPORT
// router.get("/records/tally-export", exportTallyWithCSV);

export default router;
