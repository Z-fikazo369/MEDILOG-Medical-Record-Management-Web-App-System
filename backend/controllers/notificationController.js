import Notification from "../models/Notification.js";

/**
 * Helper function na tatawagin mula sa medicalRecordController
 * Para sa student notifications (admin → student)
 */
export const createNotification = async (
  userId,
  message,
  recordId,
  recordType,
) => {
  try {
    const notification = new Notification({
      userId,
      targetRole: "student",
      message,
      recordId,
      recordType,
      isRead: false,
    });
    await notification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

/**
 * Helper: Create admin notification (student → admin)
 * Called when a student submits a new record
 */
export const createAdminNotification = async (
  studentName,
  recordId,
  recordType,
) => {
  try {
    const formNames = {
      physicalExam: "Physical Examination",
      monitoring: "Medical Monitoring",
      certificate: "Medical Certificate",
      medicineIssuance: "Medicine Issuance",
      laboratoryRequest: "Laboratory Request",
    };
    const formName = formNames[recordType] || recordType;
    const message = `${studentName} submitted a new ${formName} form.`;

    const notification = new Notification({
      userId: null,
      targetRole: "admin",
      message,
      recordId,
      recordType,
      studentName,
      isRead: false,
    });
    await notification.save();
  } catch (error) {
    console.error("Error creating admin notification:", error);
  }
};

/**
 * API: Kunin lahat ng notifications ng student
 */
export async function getStudentNotifications(req, res) {
  try {
    const { studentId } = req.params;
    const notifications = await Notification.find({
      userId: studentId,
      targetRole: "student",
    })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * API: Kunin 'yung bilang ng HINDI PA NABABASA (para sa badge)
 */
export async function getUnreadCount(req, res) {
  try {
    const { studentId } = req.params;
    const count = await Notification.countDocuments({
      userId: studentId,
      targetRole: "student",
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * API: Markahin lahat bilang "read"
 */
export async function markNotificationsAsRead(req, res) {
  try {
    const { studentId } = req.params;
    await Notification.updateMany(
      { userId: studentId, targetRole: "student", isRead: false },
      { $set: { isRead: true } },
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * API: Get admin notifications (for the admin dashboard)
 */
export async function getAdminNotifications(req, res) {
  try {
    const notifications = await Notification.find({ targetRole: "admin" })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * API: Get admin unread count
 */
export async function getAdminUnreadCount(req, res) {
  try {
    const count = await Notification.countDocuments({
      targetRole: "admin",
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * API: Mark admin notifications as read
 */
export async function markAdminNotificationsAsRead(req, res) {
  try {
    await Notification.updateMany(
      { targetRole: "admin", isRead: false },
      { $set: { isRead: true } },
    );
    res.json({ message: "All admin notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
