import AiTranscription from "../models/AiTranscription.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
import { summarizeText } from "../utils/aiSummarizer.js";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";

// Multer config for image uploads (memory storage)
const storage = multer.memoryStorage();
export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/tiff",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Multer config for PDF uploads (memory storage)
export const uploadPDF = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for PDFs
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Multer config for audio uploads (memory storage)
export const uploadAudio = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB (Groq Whisper limit)
  fileFilter: (req, file, cb) => {
    const allowed = [
      "audio/webm",
      "audio/ogg",
      "audio/wav",
      "audio/mp3",
      "audio/mpeg",
      "audio/mp4",
      "audio/m4a",
      "audio/flac",
      "video/webm", // MediaRecorder sometimes uses video/webm for audio
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Audio format not supported: ${file.mimetype}`), false);
    }
  },
});

// ─── Groq: Transcribe + Summarize Consultation (Pure Groq Flow) ────
export const summarizeConsultation = async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "GROQ_API_KEY not configured on the server" });
    }

    const { title, patientName, audioDuration } = req.body;
    const groq = new Groq({ apiKey });

    // ── STEP A: Transcription via Groq Whisper ──────────────────
    console.log("[Groq] Starting Whisper transcription...");

    // Groq SDK needs a file path or ReadStream, so write buffer to temp file
    const ext = path.extname(req.file.originalname || ".webm") || ".webm";
    tempFilePath = path.join(os.tmpdir(), `medilog_audio_${Date.now()}${ext}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3",
      language: "tl", // Tagalog/Filipino — Whisper handles Taglish well
      prompt:
        "Medical consultation transcript. Include filler words and natural speech.",
      response_format: "text",
    });

    // transcription is the raw text string when response_format is "text"
    const transcriptText = (
      typeof transcription === "string"
        ? transcription
        : transcription?.text || ""
    ).trim();

    console.log(
      `[Groq] Whisper done — ${transcriptText.length} chars transcribed`,
    );

    if (!transcriptText || transcriptText.length < 10) {
      return res.status(400).json({
        message:
          "Could not transcribe audio. The recording may be too short or silent.",
      });
    }

    // ── STEP B: Summarization via Groq Llama 3.3 ────────────────
    console.log("[Groq] Starting Llama 3.3 summarization...");
    let aiSummary = "";
    try {
      aiSummary = await summarizeText(transcriptText);
    } catch (err) {
      console.warn("[Groq] Summarization failed (non-critical):", err.message);
    }
    console.log(`[Groq] Summary done — ${aiSummary.length} chars`);

    // ── STEP C: Save to database ────────────────────────────────
    const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;

    const record = new AiTranscription({
      type: "audio",
      title: title || "Audio Consultation",
      transcriptionText: transcriptText,
      aiSummary,
      audioDuration: parseInt(audioDuration) || 0,
      originalFileName: req.file.originalname || "recording.webm",
      patientName: patientName || "",
      wordCount,
      createdBy: req.user._id,
      status: "completed",
    });

    await record.save();

    res.status(201).json(record);
  } catch (error) {
    console.error("[Groq] Consultation processing error:", error);
    const message =
      error?.error?.message ||
      error?.message ||
      "Failed to process audio consultation";
    res.status(500).json({ message });
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (_) {
        /* ignore */
      }
    }
  }
};

// ─── Save audio transcription (with AI summary) ────────────────────
export const saveTranscription = async (req, res) => {
  try {
    const {
      type,
      title,
      transcriptionText,
      extractedText,
      audioDuration,
      originalFileName,
      wordCount,
      patientName,
    } = req.body;

    let aiSummary = "";

    // Generate AI summary for audio transcriptions
    if (
      type === "audio" &&
      transcriptionText &&
      transcriptionText.length > 50
    ) {
      try {
        aiSummary = await summarizeText(transcriptionText);
      } catch (err) {
        console.warn("AI summary generation failed:", err.message);
      }
    }

    const record = new AiTranscription({
      type,
      title: title || (type === "audio" ? "Audio Transcription" : "Image OCR"),
      transcriptionText: transcriptionText || "",
      aiSummary,
      extractedText: extractedText || "",
      audioDuration: audioDuration || 0,
      originalFileName: originalFileName || "",
      patientName: patientName || "",
      wordCount: wordCount || 0,
      createdBy: req.user._id,
      status: "completed",
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    console.error("Error saving transcription:", error);
    res.status(500).json({ message: "Failed to save transcription" });
  }
};

// ─── Re-summarize an existing transcription ─────────────────────────
export const regenerateSummary = async (req, res) => {
  try {
    const record = await AiTranscription.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!record) {
      return res.status(404).json({ message: "Transcription not found" });
    }

    const textToSummarize =
      record.type === "audio" ? record.transcriptionText : record.extractedText;
    const summaryType = record.type === "audio" ? "audio" : "document";

    if (!textToSummarize || textToSummarize.length < 50) {
      return res.status(400).json({ message: "Text too short to summarize" });
    }

    const aiSummary = await summarizeText(textToSummarize, summaryType);
    record.aiSummary = aiSummary;
    await record.save();

    res.json(record);
  } catch (error) {
    console.error("Error regenerating summary:", error);
    res.status(500).json({ message: "Failed to regenerate summary" });
  }
};

// ─── Upload image to Cloudinary and save OCR result ─────────────────
export const uploadAndSaveOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "medilog_ocr",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(req.file.buffer);
    });

    const { extractedText, title, wordCount } = req.body;

    // Summarize OCR text with document-specific prompt
    let aiSummary = "";
    if (extractedText && extractedText.length > 50) {
      try {
        aiSummary = await summarizeText(extractedText, "document");
      } catch (err) {
        console.warn("AI summary for OCR failed:", err.message);
      }
    }

    const record = new AiTranscription({
      type: "image",
      title: title || req.file.originalname || "Image OCR",
      extractedText: extractedText || "",
      aiSummary,
      imageUrl: uploadResult.secure_url,
      originalFileName: req.file.originalname,
      wordCount: wordCount || 0,
      createdBy: req.user._id,
      status: "completed",
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

// ─── Upload PDF and extract text ────────────────────────────────────
export const uploadAndSavePDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file provided" });
    }

    // Extract text from PDF buffer using pdf-parse v2 API
    let extractedText = "";
    try {
      const parser = new PDFParse({ data: new Uint8Array(req.file.buffer) });
      const result = await parser.getText();
      extractedText = result.text || "";
      await parser.destroy();
    } catch (pdfErr) {
      console.error("PDF parsing failed:", pdfErr.message);
      return res.status(400).json({
        message:
          "Failed to parse PDF. The file may be corrupted or image-based (scanned).",
      });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({
        message:
          "No text found in PDF. This might be a scanned document — try uploading as an image instead.",
      });
    }

    // Upload PDF to Cloudinary as raw file
    let fileUrl = "";
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "medilog_pdf",
            resource_type: "raw",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      fileUrl = uploadResult.secure_url;
    } catch (uploadErr) {
      console.warn(
        "Cloudinary PDF upload failed (non-critical):",
        uploadErr.message,
      );
    }

    // Generate AI summary with document-specific prompt
    let aiSummary = "";
    if (extractedText.length > 50) {
      try {
        aiSummary = await summarizeText(extractedText, "document");
      } catch (err) {
        console.warn("AI summary for PDF failed:", err.message);
      }
    }

    const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;

    const record = new AiTranscription({
      type: "image", // grouped under "image" for consistency in history
      title: req.body.title || req.file.originalname || "PDF Document",
      extractedText,
      aiSummary,
      imageUrl: fileUrl,
      originalFileName: req.file.originalname,
      wordCount,
      createdBy: req.user._id,
      status: "completed",
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ message: "Failed to process PDF" });
  }
};

// ─── Get all transcriptions (with pagination) ───────────────────────
export const getTranscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const skip = (page - 1) * limit;

    const filter = { createdBy: req.user._id };
    if (type) filter.type = type;

    const [records, total] = await Promise.all([
      AiTranscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AiTranscription.countDocuments(filter),
    ]);

    res.json({
      records,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
    });
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    res.status(500).json({ message: "Failed to fetch transcriptions" });
  }
};

// ─── Get stats ──────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // This week calculation
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [audioCount, imageCount, thisWeekCount, totalWordCount] =
      await Promise.all([
        AiTranscription.countDocuments({ createdBy: userId, type: "audio" }),
        AiTranscription.countDocuments({ createdBy: userId, type: "image" }),
        AiTranscription.countDocuments({
          createdBy: userId,
          createdAt: { $gte: startOfWeek },
        }),
        AiTranscription.aggregate([
          { $match: { createdBy: userId } },
          { $group: { _id: null, total: { $sum: "$wordCount" } } },
        ]),
      ]);

    res.json({
      audioTranscriptions: audioCount,
      imageScans: imageCount,
      thisWeekCount,
      totalWordsProcessed: totalWordCount[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching AI stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// ─── Delete a transcription ─────────────────────────────────────────
export const deleteTranscription = async (req, res) => {
  try {
    const record = await AiTranscription.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!record) {
      return res.status(404).json({ message: "Transcription not found" });
    }

    // If it has a Cloudinary image, delete it
    if (record.imageUrl) {
      try {
        const publicId = record.imageUrl
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn("Failed to delete Cloudinary image:", e.message);
      }
    }

    res.json({ message: "Transcription deleted" });
  } catch (error) {
    console.error("Error deleting transcription:", error);
    res.status(500).json({ message: "Failed to delete transcription" });
  }
};
