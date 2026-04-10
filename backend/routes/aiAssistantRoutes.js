import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  saveTranscription,
  summarizeConsultation,
  uploadAndSaveOCR,
  uploadAndSavePDF,
  getTranscriptions,
  getStats,
  deleteTranscription,
  regenerateSummary,
  uploadImage,
  uploadPDF,
  uploadAudio,
} from "../controllers/aiAssistantController.js";

const router = express.Router();

const restrictSuperAdminAndHead = (req, res, next) => {
  const email = String(req.user?.email || "")
    .trim()
    .toLowerCase();
  const position = String(req.user?.position || "")
    .trim()
    .toLowerCase();
  const isSuperAdmin = email === "admin@medilog.com";
  const isHeadAccount = position.includes("head");

  if (isSuperAdmin || isHeadAccount) {
    return res.status(403).json({
      message:
        "AI Assistant access is disabled for super admin and head accounts.",
    });
  }

  next();
};

// All routes require admin auth
router.use(protect, isAdmin, restrictSuperAdminAndHead);

// Stats
router.get("/stats", getStats);

// CRUD
router.get("/transcriptions", getTranscriptions);
router.post("/transcriptions", saveTranscription);
router.post(
  "/transcriptions/audio",
  uploadAudio.single("audio"),
  summarizeConsultation,
);
router.post(
  "/transcriptions/ocr",
  uploadImage.single("image"),
  uploadAndSaveOCR,
);
router.post("/transcriptions/pdf", uploadPDF.single("pdf"), uploadAndSavePDF);
router.post("/transcriptions/:id/regenerate-summary", regenerateSummary);
router.delete("/transcriptions/:id", deleteTranscription);

export default router;
