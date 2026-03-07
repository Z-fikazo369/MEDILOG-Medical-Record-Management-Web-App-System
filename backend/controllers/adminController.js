// File: server/controllers/adminController.js
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

// ✅ FINAL CORRECT IMPORTS (Matching your provided filenames)
import User from "../models/User.js";
import PhysicalExam from "../models/PhysicalExam.js";
import MedicalMonitoring from "../models/MedicalMonitoring.js";
import MedicalCertificate from "../models/MedicalCertificate.js";
import MedicineIssuance from "../models/MedicineIssuance.js";
import LaboratoryRequest from "../models/LaboratoryRequest.js";
import PharmacyInventory from "../models/PharmacyInventory.js";
import Notification from "../models/Notification.js";
import AdminActivityLog from "../models/AdminActivityLog.js";

// Utility to get the current directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The directory where backups will be saved (e.g., server/backups)
const BACKUP_DIR = path.join(__dirname, "..", "backups");
const DUMP_EXTENSION = ".json";

// Function to ensure backup directory exists
const ensureBackupDir = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create backup directory:", error);
    throw new Error(
      "Server storage access denied. Check file permissions for 'backups' folder.",
    );
  }
};

// 1. CREATE SYSTEM BACKUP (POST /api/users/backup/create)
export const createSystemBackup = async (req, res) => {
  try {
    console.log("[Backup] Step 1: Ensuring backup directory...");
    await ensureBackupDir();

    console.log("[Backup] Step 2: Creating timestamp...");
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("Z")[0]; // ✅ FIXED: Removed the dash before Z

    const backupFileName = `MEDILOG_Backup_${timestamp}${DUMP_EXTENSION}`;
    const outputFilePath = path.join(BACKUP_DIR, backupFileName);

    console.log(`[Backup] Step 3: Will save to: ${outputFilePath}`);
    console.log(`[Backup] Step 4: Fetching database records...`);

    // 1. Fetch data from all critical collections
    const [
      users,
      physicalExams,
      monitoringRecords,
      certificateRecords,
      medicineIssuances,
      laboratoryRequests,
      pharmacyInventory,
      notifications,
    ] = await Promise.all([
      User.find().lean(),
      PhysicalExam.find().lean(),
      MedicalMonitoring.find().lean(),
      MedicalCertificate.find().lean(),
      MedicineIssuance.find().lean(),
      LaboratoryRequest.find().lean(),
      PharmacyInventory.find().lean(),
      Notification.find().lean(),
    ]);

    console.log(`[Backup] Step 5: Records fetched successfully`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Physical Exams: ${physicalExams.length}`);
    console.log(`  - Monitoring Records: ${monitoringRecords.length}`);
    console.log(`  - Certificate Records: ${certificateRecords.length}`);
    console.log(`  - Medicine Issuances: ${medicineIssuances.length}`);
    console.log(`  - Laboratory Requests: ${laboratoryRequests.length}`);
    console.log(`  - Pharmacy Inventory: ${pharmacyInventory.length}`);
    console.log(`  - Notifications: ${notifications.length}`);

    // 2. Compile all data into a single JSON object
    const backupData = {
      metadata: {
        date: new Date().toISOString(),
        admin: req.user.username || "System Admin",
        totalCollections: 8,
      },
      collections: {
        users: users,
        physicalExams: physicalExams,
        monitoringRecords: monitoringRecords,
        certificateRecords: certificateRecords,
        medicineIssuances: medicineIssuances,
        laboratoryRequests: laboratoryRequests,
        pharmacyInventory: pharmacyInventory,
        notifications: notifications,
      },
    };

    // 3. Write the JSON data to the file system
    console.log("[Backup] Step 6: Writing file...");
    await fs.writeFile(
      outputFilePath,
      JSON.stringify(backupData, null, 2),
      "utf-8",
    );

    console.log(`[Backup SUCCESS]: JSON file created at ${outputFilePath}`);
    return res.status(200).json({
      message: `Database backup created successfully. File: ${backupFileName}`,
      backupName: backupFileName,
    });
  } catch (error) {
    console.error("[Backup CRITICAL ERROR]:", error.message);
    console.error("[Backup ERROR STACK]:", error.stack);
    return res.status(500).json({
      message:
        error.message ||
        "Failed to create backup. Check server logs and file paths.",
    });
  }
};

// 2. GET BACKUP LIST (GET /api/users/backup/list)
export const getBackupList = async (req, res) => {
  try {
    await ensureBackupDir();
    const dirents = await fs.readdir(BACKUP_DIR, { withFileTypes: true });

    // Filter only MEDILOG JSON files
    const backupList = await Promise.all(
      dirents
        .filter(
          (dirent) =>
            dirent.isFile() &&
            dirent.name.startsWith("MEDILOG_Backup_") &&
            dirent.name.endsWith(DUMP_EXTENSION),
        )
        .map(async (dirent) => {
          const fullPath = path.join(BACKUP_DIR, dirent.name);
          const stats = await fs.stat(fullPath); // Get file size and creation time

          return {
            name: dirent.name,
            date: stats.birthtime.toISOString(),
            size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`, // Convert bytes to MB
          };
        }),
    );

    // Sort by newest first
    backupList.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return res.status(200).json({ backups: backupList });
  } catch (error) {
    console.error("[Backup LIST ERROR]:", error);
    return res.status(500).json({ message: "Failed to retrieve backup list." });
  }
};

// 3. DOWNLOAD BACKUP (GET /api/users/backup/download/:filename)
export const downloadBackup = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    // Basic security check on filename
    if (
      !filename.startsWith("MEDILOG_Backup_") ||
      !filename.endsWith(DUMP_EXTENSION)
    ) {
      return res.status(403).json({ message: "Invalid backup file request." });
    }

    await fs.access(filePath); // Ensure file exists

    // Set headers for JSON file download
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/json");

    // Stream the file back to the user
    res.download(filePath, (err) => {
      if (err) {
        console.error("File download error:", err);
        res.status(500).json({ message: "File download failed." });
      }
    });
  } catch (error) {
    console.error("Download failed:", error);
    res.status(404).json({ message: "Backup file not found." });
  }
};

// 4. RESTORE SYSTEM (POST /api/users/backup/restore)
export const restoreSystem = (req, res) => {
  res.status(501).json({
    message:
      "System restore is a critical operation and must be handled by manual developer intervention. Automated restore is disabled.",
  });
};

// 5. GET ACTIVITY LOGS (GET /api/users/activity-logs)
export const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      search,
      startDate,
      endDate,
      staffId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Build filter
    const filter = {};

    // Filter by action type
    if (action && action !== "all") {
      filter.action = action;
    }

    // Filter by specific staff member
    if (staffId) {
      filter.adminId = staffId;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Search by username or email
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { adminUsername: searchRegex },
        { adminEmail: searchRegex },
        { "actionDetails.details": searchRegex },
        { "actionDetails.userName": searchRegex },
      ];
    }

    const [logs, total] = await Promise.all([
      AdminActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      AdminActivityLog.countDocuments(filter),
    ]);

    // Get distinct action types for filter dropdown
    const actionTypes = await AdminActivityLog.distinct("action");

    // Get distinct staff members for filter dropdown
    const staffMembers = await AdminActivityLog.aggregate([
      {
        $group: {
          _id: "$adminId",
          username: { $first: "$adminUsername" },
          email: { $first: "$adminEmail" },
        },
      },
      { $sort: { username: 1 } },
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      filters: {
        actionTypes,
        staffMembers,
      },
    });
  } catch (error) {
    console.error("❌ Failed to fetch activity logs:", error);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};

// 6. GET STAFF ACTIVITY SUMMARY (GET /api/users/activity-logs/staff-summary)
export const getStaffActivitySummary = async (req, res) => {
  try {
    // Aggregate logs per staff member with action breakdown
    const staffSummaries = await AdminActivityLog.aggregate([
      {
        $group: {
          _id: "$adminId",
          username: { $first: "$adminUsername" },
          email: { $first: "$adminEmail" },
          totalActions: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
          actions: { $push: { action: "$action", createdAt: "$createdAt" } },
        },
      },
      { $sort: { totalActions: -1 } },
    ]);

    // Build action breakdown for each staff
    // Fetch profile pictures for all staff members
    const staffIds = staffSummaries.map((s) => s._id);
    const users = await User.find(
      { _id: { $in: staffIds } },
      { _id: 1, profilePictureUrl: 1 },
    ).lean();
    const profileMap = {};
    users.forEach((u) => {
      profileMap[u._id.toString()] = u.profilePictureUrl || "";
    });

    const result = staffSummaries.map((staff) => {
      const actionBreakdown = {};
      staff.actions.forEach((a) => {
        actionBreakdown[a.action] = (actionBreakdown[a.action] || 0) + 1;
      });
      return {
        _id: staff._id,
        username: staff.username,
        email: staff.email,
        totalActions: staff.totalActions,
        lastActivity: staff.lastActivity,
        actionBreakdown,
        profilePictureUrl: profileMap[staff._id.toString()] || "",
      };
    });

    res.json({ staffSummaries: result });
  } catch (error) {
    console.error("❌ Failed to fetch staff summaries:", error);
    res.status(500).json({ message: "Failed to fetch staff summaries" });
  }
};
