import mongoose from "mongoose";

// Stub model — activity logging feature removed, but kept as minimal schema
// so existing code references don't crash the server
const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    actionDetails: mongoose.Schema.Types.Mixed,
    status: String,
  },
  { timestamps: true },
);

export default mongoose.model("AdminActivityLog", adminActivityLogSchema);
