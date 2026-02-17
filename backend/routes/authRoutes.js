import express from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  verifyOTP,
  login,
  resendOTP,
  forgotPassword,
  resetPassword,
  getPendingAccounts,
  approveAccount,
  rejectAccount,
  getAllStudentAccounts,
  changePassword,
  getTotalStudentCount,
  deleteStudentAccount,
  updateStudentAccount,
  getAllStaffAccounts,
  getPendingStaffAccounts,
  getTotalStaffCount,
  deleteStaffAccount,
  updateStaffAccount,
} from "../controllers/authController.js";

// ✅ (1) I-IMPORT 'YUNG UPLOAD CONFIG (gaya ng sa userRoutes.js)
import upload from "../config/cloudinary.js";
import { uploadIdPicture } from "../config/cloudinary.js";

// Import security middleware (Assuming ito 'yung ginawa natin sa Turn 40)
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rule para sa mga endpoint na nagpapadala ng OTP
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: {
    message:
      "Too many OTP requests from this IP. Please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rule para sa login attempts — SEPARATE per role para hindi magdamayan
const studentLoginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes lang din para sa student
  max: 5,
  keyGenerator: (req) => {
    return `student-${req.ip}`;
  },
  message: {
    message:
      "Too many login attempts. Your account has been locked for 2 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

const staffAdminLoginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes lang para sa staff/admin
  max: 5,
  keyGenerator: (req) => {
    return `staffadmin-${req.ip}`;
  },
  message: {
    message:
      "Too many login attempts. Your account has been locked for 2 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

// Middleware na pumipili ng limiter base sa role
const loginLimiter = (req, res, next) => {
  const role = req.body?.role;
  if (role === "admin" || role === "staff") {
    return staffAdminLoginLimiter(req, res, next);
  }
  return studentLoginLimiter(req, res, next);
};

// ✅ (2) I-UPDATE 'YUNG SIGNUP ROUTE PARA TUMANGGAP NG FILE (full resolution ID)
router.post("/users", uploadIdPicture.single("idPicture"), signup);

router.post("/verify-otp", verifyOTP);

// I-apply ang mga limiter sa routes
router.post("/login", loginLimiter, login);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
// I-apply ang protect middleware dito (assuming ito ay para sa logged-in users)
router.post("/users/change-password", protect, changePassword);

// --- Admin account management routes (May security na dapat ito) ---
// Note: Assuming na na-apply mo na ang protect at isAdmin sa file na 'to based sa Turn 40
router.get("/accounts/pending", protect, isAdmin, getPendingAccounts);
router.get("/accounts/all", protect, isAdmin, getAllStudentAccounts);
router.post("/accounts/:userId/approve", protect, isAdmin, approveAccount);
router.post("/accounts/:userId/reject", protect, isAdmin, rejectAccount);

// ✅ BAGO: Route para sa Total Student Count
router.get("/accounts/total", protect, isAdmin, getTotalStudentCount);

// ✅ Delete & Update Student Account
router.delete("/accounts/:userId", protect, isAdmin, deleteStudentAccount);
router.put("/accounts/:userId", protect, isAdmin, updateStudentAccount);

// ✅ Staff Account Management Routes
router.get("/staff/all", protect, isAdmin, getAllStaffAccounts);
router.get("/staff/pending", protect, isAdmin, getPendingStaffAccounts);
router.get("/staff/total", protect, isAdmin, getTotalStaffCount);
router.delete("/staff/:userId", protect, isAdmin, deleteStaffAccount);
router.put("/staff/:userId", protect, isAdmin, updateStaffAccount);

export default router;
