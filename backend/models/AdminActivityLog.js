import mongoose from "mongoose";

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminEmail: { type: String, default: "" },
    adminUsername: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    actionDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "unknown" },
    userAgent: { type: String, default: "" },
    status: { type: String, default: "success" },
  },
  { timestamps: true },
);

// Index for efficient querying by date and action type
adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });

export default mongoose.model("AdminActivityLog", adminActivityLogSchema);
