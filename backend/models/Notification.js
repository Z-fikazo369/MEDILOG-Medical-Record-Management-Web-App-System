import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      // Para kanino 'yung notification (student ID or null for admin-wide)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    targetRole: {
      // "student" = specific student, "admin" = all admins/staff
      type: String,
      enum: ["student", "admin"],
      default: "student",
      index: true,
    },
    message: {
      // e.g., "Your Medical Certificate has been approved."
      type: String,
      required: true,
    },
    recordId: {
      // 'Yung ID ng form na na-update
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recordType: {
      // e.g., 'physicalExam', 'monitoring', 'certificate'
      type: String,
      required: true,
    },
    studentName: {
      // Name of the student who submitted (for admin notifications)
      type: String,
    },
    isRead: {
      // Para sa badge count
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", notificationSchema);
