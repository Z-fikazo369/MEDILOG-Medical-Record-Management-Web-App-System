import express from "express";
import {
  getStudentNotifications,
  getUnreadCount,
  markNotificationsAsRead,
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// Student notifications
router.get("/notifications/student/:studentId", getStudentNotifications);
router.get("/notifications/student/:studentId/unread-count", getUnreadCount);
router.post(
  "/notifications/student/:studentId/mark-read",
  markNotificationsAsRead,
);

// Admin notifications
router.get("/notifications/admin", getAdminNotifications);
router.get("/notifications/admin/unread-count", getAdminUnreadCount);
router.post("/notifications/admin/mark-read", markAdminNotificationsAsRead);

export default router;
