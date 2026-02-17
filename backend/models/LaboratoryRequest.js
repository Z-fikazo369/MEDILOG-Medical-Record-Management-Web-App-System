import mongoose from "mongoose";

const laboratoryRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },

    // Student-filled fields
    issueDate: { type: String, required: true },
    name: { type: String, required: true },

    // Admin-only fields
    nurseOnDuty: { type: String, default: "" },

    // Routine/Urinalysis Tests
    routineUrinalysisTests: {
      pregnancy: { type: Boolean, default: false },
      fecalysis: { type: Boolean, default: false },
    },

    // CBC with Diff Count
    cbcTests: {
      hemoglobin: { type: Boolean, default: false },
      hematocrit: { type: Boolean, default: false },
      bloodSugar: { type: Boolean, default: false },
      plateletCT: { type: Boolean, default: false },
    },

    // Gram Stain
    gramStain: {
      hpsBhTest: { type: Boolean, default: false },
      vaginalSmear: { type: Boolean, default: false },
    },

    // Blood Chemistry
    bloodChemistry: {
      fbs: { type: Boolean, default: false },
      uricAcid: { type: Boolean, default: false },
      cholesterol: { type: Boolean, default: false },
      hdl: { type: Boolean, default: false },
      tsh: { type: Boolean, default: false },
      totalProtein: { type: Boolean, default: false },
    },

    // Pap Smear
    papSmear: {
      cxrInterpretation: { type: Boolean, default: false },
      ecgInterpretation: { type: Boolean, default: false },
    },

    // Widhal Test
    widhalTest: {
      salmonella: { type: Boolean, default: false },
    },

    others: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: { type: Date },
    adminNotes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("LaboratoryRequest", laboratoryRequestSchema);
