import mongoose from "mongoose";

const aiTranscriptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["audio", "image"],
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    // For audio transcriptions
    transcriptionText: {
      type: String,
      default: "",
    },
    aiSummary: {
      type: String,
      default: "",
    },
    audioDuration: {
      type: Number, // seconds
      default: 0,
    },
    patientName: {
      type: String,
      default: "",
    },
    // For image OCR
    extractedText: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    originalFileName: {
      type: String,
      default: "",
    },
    // Common fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["completed", "processing", "failed"],
      default: "completed",
    },
  },
  { timestamps: true },
);

const AiTranscription = mongoose.model(
  "AiTranscription",
  aiTranscriptionSchema,
);

export default AiTranscription;
