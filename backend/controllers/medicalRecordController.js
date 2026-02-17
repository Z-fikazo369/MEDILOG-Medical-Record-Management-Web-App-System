import PhysicalExam from "../models/PhysicalExam.js";
import MedicalMonitoring from "../models/MedicalMonitoring.js";
import MedicalCertificate from "../models/MedicalCertificate.js";
import MedicineIssuance from "../models/MedicineIssuance.js";
import LaboratoryRequest from "../models/LaboratoryRequest.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import { createNotification } from "./notificationController.js";

// ==================== HELPER FUNCTIONS ====================

const getModel = (recordType) => {
  switch (recordType) {
    case "physicalExam":
      return PhysicalExam;
    case "monitoring":
      return MedicalMonitoring;
    case "certificate":
      return MedicalCertificate;
    case "medicineIssuance":
      return MedicineIssuance;
    case "laboratoryRequest":
      return LaboratoryRequest;
    default:
      throw new Error("Invalid record type");
  }
};

// ✅ Helper to build filter query from request query params
const buildFilterQuery = (query) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.gender)
    filter.gender = { $regex: new RegExp(`^${query.gender}$`, "i") };
  if (query.sex) filter.sex = { $regex: new RegExp(`^${query.sex}$`, "i") };
  if (query.course) filter.course = { $regex: new RegExp(query.course, "i") };
  if (query.year) filter.year = { $regex: new RegExp(query.year, "i") };
  if (query.degree) filter.degree = { $regex: new RegExp(query.degree, "i") };

  // Date range filter (works with date, issueDate, or createdAt)
  if (query.dateFrom || query.dateTo) {
    const dateField = query.dateField || "createdAt";
    const dateFilter = {};
    if (query.dateFrom) dateFilter.$gte = query.dateFrom;
    if (query.dateTo) dateFilter.$lte = query.dateTo;

    if (dateField === "createdAt") {
      // createdAt is a real Date type
      if (query.dateFrom) dateFilter.$gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const toDate = new Date(query.dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }
    }
    filter[dateField] = dateFilter;
  }

  return filter;
};

// ✅ Helper to log admin activity
const logAdminActivity = async (req, action, actionDetails) => {
  if (!req.user || req.user.role !== "admin") return;

  try {
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "";

    await AdminActivityLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      adminUsername: req.user.username,
      action,
      actionDetails,
      ipAddress,
      userAgent,
      status: "success",
    });
  } catch (error) {
    console.error("❌ Failed to log activity:", error);
  }
};

// ==================== CRUD FUNCTIONS ====================

export async function createRecord(req, res) {
  try {
    const { recordType, ...recordData } = req.body;
    const Model = getModel(recordType);
    const record = new Model(recordData);
    await record.save();
    res.status(201).json({
      message: "Record created successfully",
      record,
    });
  } catch (error) {
    console.error("❌ Create record error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function getStudentRecords(req, res) {
  try {
    const { studentId } = req.params;
    const { type } = req.query;

    if (type) {
      const Model = getModel(type);
      const records = await Model.find({ studentId }).sort({ createdAt: -1 });
      return res.json({ records, recordType: type });
    }

    const physicalExams = await PhysicalExam.find({ studentId }).sort({
      createdAt: -1,
    });
    const monitoring = await MedicalMonitoring.find({ studentId }).sort({
      createdAt: -1,
    });
    const certificates = await MedicalCertificate.find({ studentId }).sort({
      createdAt: -1,
    });
    const medicineIssuances = await MedicineIssuance.find({ studentId }).sort({
      createdAt: -1,
    });
    const laboratoryRequests = await LaboratoryRequest.find({ studentId }).sort(
      {
        createdAt: -1,
      },
    );

    res.json({
      physicalExams,
      monitoring,
      certificates,
      medicineIssuances,
      laboratoryRequests,
    });
  } catch (error) {
    console.error("❌ Get student records error:", error);
    res.status(500).json({ message: error.message });
  }
}

// ✅✅✅ IN-UPDATE ANG 'getAllRecords' PARA SA MULTI-COLUMN SORTING ✅✅✅
export async function getAllRecords(req, res) {
  try {
    const { type } = req.query;

    // Pagination (Walang binago)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // --- BAGO: Multi-Sort Logic ---
    const sortByKeys = (req.query.sortBy || "createdAt").split(",");
    const sortOrderValues = (req.query.sortOrder || "desc").split(",");

    const sortOptions = {};
    sortByKeys.forEach((key, index) => {
      const order = sortOrderValues[index] || "desc";
      sortOptions[key] = order === "asc" ? 1 : -1;
    });
    // --- End ng Multi-Sort Logic ---

    // --- BAGO: Filter Logic ---
    const filterQuery = buildFilterQuery(req.query);
    // --- End ng Filter Logic ---

    if (type) {
      const Model = getModel(type);

      const records = await Model.find(filterQuery)
        .populate("studentId", "username email profilePictureUrl")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const totalCount = await Model.countDocuments(filterQuery);
      const totalPages = Math.ceil(totalCount / limit);

      return res.json({
        records,
        recordType: type,
        currentPage: page,
        totalPages,
        totalCount,
      });
    }

    res.status(400).json({ message: "Record type ('type') is required." });
  } catch (error) {
    console.error("❌ Get all records error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function updateRecord(req, res) {
  try {
    const { id } = req.params;
    const { recordType, ...updates } = req.body;
    const Model = getModel(recordType);

    const originalRecord = await Model.findById(id).lean();
    if (!originalRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    const updatedRecord = await Model.findByIdAndUpdate(id, updates, {
      new: true,
    });

    try {
      let message = "";
      let formName = "submission";
      if (recordType === "physicalExam") formName = "Physical Exam";
      if (recordType === "monitoring") formName = "Medical Monitoring";
      if (recordType === "certificate") formName = "Medical Certificate";
      if (recordType === "medicineIssuance") formName = "Medicine Issuance";
      if (recordType === "laboratoryRequest") formName = "Laboratory Request";

      if (updates.status && updates.status !== originalRecord.status) {
        message = `Your ${formName} has been ${updates.status}.`;
        if (updates.status === "approved") {
          message +=
            " Please proceed to the infirmary within the day to complete the process. This schedule is valid for today only.";
        }
      } else if (
        recordType === "certificate" &&
        updates.diagnosis &&
        updates.diagnosis !== originalRecord.diagnosis
      ) {
        message = `An admin has added a diagnosis to your ${formName}.`;
      } else if (
        recordType === "monitoring" &&
        updates.meds &&
        updates.meds !== originalRecord.meds
      ) {
        message = `An admin has added treatment notes to your ${formName}.`;
      } else if (
        recordType === "medicineIssuance" &&
        updates.diagnosis &&
        updates.diagnosis !== originalRecord.diagnosis
      ) {
        message = `An admin has added a diagnosis to your ${formName}.`;
      }

      if (message) {
        await createNotification(
          updatedRecord.studentId,
          message,
          updatedRecord._id,
          recordType,
        );
      }
    } catch (notifError) {
      console.error("Notification trigger failed:", notifError);
    }

    res.json({
      message: "Record updated successfully",
      record: updatedRecord,
    });

    // ✅ Log the activity
    await logAdminActivity(req, "UPDATE_RECORD", {
      recordType,
      recordId: id,
      userId: updatedRecord.studentId.toString(),
      details: `Updated record with status: ${updates.status}`,
    });
  } catch (error) {
    console.error("❌ Update record error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function deleteRecord(req, res) {
  try {
    const { id } = req.params;
    const { recordType } = req.query;
    const Model = getModel(recordType);

    const record = await Model.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record deleted successfully" });

    // ✅ Log the activity
    await logAdminActivity(req, "DELETE_RECORD", {
      recordType,
      recordId: id,
      userId: record.studentId?.toString(),
    });
  } catch (error) {
    console.error("❌ Delete record error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function bulkDeleteRecords(req, res) {
  try {
    const { ids, recordType } = req.body;
    const Model = getModel(recordType);
    const result = await Model.deleteMany({ _id: { $in: ids } });
    res.json({
      message: `${result.deletedCount} records deleted successfully`,
      deletedCount: result.deletedCount,
    });

    // ✅ Log the activity
    await logAdminActivity(req, "BULK_DELETE_RECORDS", {
      recordType,
      count: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Bulk delete error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function bulkUpdateStatus(req, res) {
  try {
    const { ids, recordType, status, adminId } = req.body;
    const Model = getModel(recordType);

    const updateData = {
      status,
      approvedBy: adminId,
      approvedDate: new Date(),
    };

    const result = await Model.updateMany(
      { _id: { $in: ids } },
      { $set: updateData },
    );

    if (result.modifiedCount > 0) {
      const updatedRecords = await Model.find({ _id: { $in: ids } }).lean();

      let formName = "submission";
      if (recordType === "physicalExam") formName = "Physical Exam";
      if (recordType === "monitoring") formName = "Medical Monitoring";
      if (recordType === "certificate") formName = "Medical Certificate";
      if (recordType === "medicineIssuance") formName = "Medicine Issuance";
      if (recordType === "laboratoryRequest") formName = "Laboratory Request";

      for (const record of updatedRecords) {
        let message = `Your ${formName} has been ${status}.`;
        if (status === "approved") {
          message +=
            " Please proceed to the infirmary within the day to complete the process. This schedule is valid for today only.";
        }
        await createNotification(
          record.studentId,
          message,
          record._id,
          recordType,
        );
      }
    }

    res.json({
      message: `${result.modifiedCount} records ${status} successfully`,
      modifiedCount: result.modifiedCount,
    });

    // ✅ Log the activity
    await logAdminActivity(req, "BULK_UPDATE_STATUS", {
      recordType,
      count: result.modifiedCount,
      details: `Changed status to: ${status}`,
    });
  } catch (error) {
    console.error("❌ Bulk update error:", error);
    res.status(500).json({ message: error.message });
  }
}

// ==================== ANALYTICS & CLUSTERING ====================

// FIXED: Corrected date range calculation for accurate weekly monitoring
export async function getHierarchicalAggregation(req, res) {
  try {
    const { recordType } = req.query; // 👈 TINANGGAL ANG 'days'
    const Model = getModel(recordType);

    // --- BAGONG DATE LOGIC (Current Month) ---
    const today = new Date();
    // Unang araw ng kasalukuyang buwan (e.g., Nov 1, 2025 at 00:00:00)
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    // Huling araw ng kasalukuyang buwan (e.g., Nov 30, 2025 at 23:59:59)
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Bilang ng araw sa buwan na 'to
    const daysInMonth = endDate.getDate();
    // --- END NG BAGONG DATE LOGIC ---

    console.log(`\n📅 AGGREGATION for ${recordType}:`, {
      month: today.toLocaleString("en-US", { month: "long" }),
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      daysInMonth: daysInMonth,
      description: `Data for the Current Month`, // ✅ In-update ang description
    });

    // Determine which field to use for date filtering
    let basePipeline;
    let dateFieldForGrouping;

    if (recordType === "physicalExam") {
      basePipeline = [
        {
          $addFields: {
            parsedDate: {
              $dateFromString: {
                dateString: { $substr: ["$date", 0, 10] },
                format: "%Y-%m-%d",
                onError: "$createdAt",
                onNull: "$createdAt",
              },
            },
          },
        },
        {
          $match: {
            parsedDate: { $gte: startDate, $lte: endDate },
          },
        },
      ];
      dateFieldForGrouping = "$parsedDate";
    } else if (recordType === "monitoring") {
      basePipeline = [
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
      ];
      dateFieldForGrouping = "$createdAt";
    } else if (recordType === "certificate") {
      basePipeline = [
        {
          $addFields: {
            parsedDate: {
              $dateFromString: {
                dateString: { $substr: ["$date", 0, 10] },
                format: "%Y-%m-%d",
                onError: "$createdAt",
                onNull: "$createdAt",
              },
            },
          },
        },
        {
          $match: {
            parsedDate: { $gte: startDate, $lte: endDate },
          },
        },
      ];
      dateFieldForGrouping = "$parsedDate";
    } else if (recordType === "laboratoryRequest") {
      basePipeline = [
        {
          $addFields: {
            parsedDate: {
              $dateFromString: {
                dateString: { $substr: ["$issueDate", 0, 10] },
                format: "%Y-%m-%d",
                onError: "$createdAt",
                onNull: "$createdAt",
              },
            },
          },
        },
        {
          $match: {
            parsedDate: { $gte: startDate, $lte: endDate },
          },
        },
      ];
      dateFieldForGrouping = "$parsedDate";
    }

    // ✅ DEBUG: Show matched records with their actual dates
    const matchedRecords = await Model.aggregate([
      ...basePipeline,
      {
        $project: {
          _id: 1,
          date: 1,
          arrival: 1,
          createdAt: 1,
          status: 1,
          parsedDate: 1,
        },
      },
    ]);

    console.log(`🔍 ${recordType} - Matched ${matchedRecords.length} records:`);
    matchedRecords.forEach((r, idx) => {
      console.log(
        `  ${idx + 1}. ID: ${r._id}, Date: ${r.date || "N/A"}, Created: ${
          r.createdAt?.toISOString().split("T")[0]
        }, Status: ${r.status}`,
      );
    });

    // ✅ DAILY STATS with proper date grouping
    const dailyStatsRaw = await Model.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: dateFieldForGrouping,
              timezone: "Asia/Manila",
            },
          },
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log(`📊 ${recordType} - Daily breakdown:`, dailyStatsRaw);

    // ✅ FILL MISSING DATES (Para sa buong buwan)
    const dailyStats = [];
    const currentDate = new Date(startDate); // Magsimula sa Araw 1 (Nov 1)

    for (let i = 0; i < daysInMonth; i++) {
      // 👈 Ginamit ang 'daysInMonth'
      const dateString = currentDate.toISOString().split("T")[0];
      const existingStat = dailyStatsRaw.find(
        (stat) => stat._id === dateString,
      );

      dailyStats.push(
        existingStat || {
          _id: dateString,
          count: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      );

      currentDate.setDate(currentDate.getDate() + 1); // Umabante papuntang next day
    }

    // ✅ STATUS STATS
    const statusStats = await Model.aggregate([
      ...basePipeline,
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // ✅ GENDER STATS
    const genderField = recordType === "physicalExam" ? "$gender" : "$sex";
    const genderStats = await Model.aggregate([
      ...basePipeline,
      { $group: { _id: genderField, count: { $sum: 1 } } },
    ]);

    // ✅ ADDITIONAL STATS based on record type
    let additionalStats = {};

    if (recordType === "physicalExam") {
      const [courseStats, yearStats] = await Promise.all([
        Model.aggregate([
          ...basePipeline,
          { $match: { course: { $exists: true, $ne: "" } } },
          { $group: { _id: "$course", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Model.aggregate([
          ...basePipeline,
          { $match: { year: { $exists: true, $ne: "" } } },
          { $group: { _id: "$year", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

      additionalStats = { courseStats, yearStats };
    } else if (recordType === "monitoring") {
      const [symptomsStats, actionStats, degreeStats] = await Promise.all([
        Model.aggregate([
          ...basePipeline,
          { $match: { symptoms: { $exists: true, $ne: "" } } },
          { $group: { _id: "$symptoms", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Model.aggregate([
          ...basePipeline,
          { $match: { action: { $exists: true, $ne: "" } } },
          { $group: { _id: "$action", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Model.aggregate([
          ...basePipeline,
          { $match: { degree: { $exists: true, $ne: "" } } },
          { $group: { _id: "$degree", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      additionalStats = { symptomsStats, actionStats, degreeStats };
    } else if (recordType === "certificate") {
      const [ageStats, civilStatusStats] = await Promise.all([
        Model.aggregate([
          ...basePipeline,
          { $match: { age: { $exists: true, $ne: "" } } },
          { $addFields: { ageNum: { $toInt: "$age" } } },
          {
            $bucket: {
              groupBy: "$ageNum",
              boundaries: [0, 18, 25, 30, 40, 50, 100],
              default: "Other",
              output: { count: { $sum: 1 } },
            },
          },
        ]),
        Model.aggregate([
          ...basePipeline,
          { $match: { civilStatus: { $exists: true, $ne: "" } } },
          { $group: { _id: "$civilStatus", count: { $sum: 1 } } },
        ]),
      ]);

      additionalStats = { ageStats, civilStatusStats };
    }

    // ✅ TOTAL COUNT
    const totalCountResult = await Model.aggregate([
      ...basePipeline,
      { $count: "total" },
    ]);
    const totalCount = totalCountResult[0]?.total || 0;

    console.log(`✅ ${recordType} FINAL:`, {
      totalCount,
      dailyStatsCount: dailyStats.length,
      statusBreakdown: statusStats,
    });

    res.json({
      recordType,
      period: `Current Month (${today.toLocaleString("en-US", {
        month: "long",
      })})`, // ✅ In-update ang text
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      totalCount,
      dailyStats,
      statusStats,
      genderStats,
      ...additionalStats,
    });
  } catch (error) {
    console.error(`❌ Aggregation error for ${req.query.recordType}:`, error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// ==================== EXPORT FUNCTIONS ====================

const extractLastName = (fullName) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
};

const extractDepartment = (course) => {
  if (!course) return "Unknown";
  const deptMap = {
    CS: "Computer Science",
    IT: "Information Technology",
    IS: "Information Systems",
    BSCS: "Computer Science",
    BSIT: "Information Technology",
    BSIS: "Information Systems",
    ENG: "Engineering",
    CE: "Civil Engineering",
    ME: "Mechanical Engineering",
    EE: "Electrical Engineering",
    ECE: "Electronics Engineering",
    BUS: "Business",
    BA: "Business Administration",
    ACC: "Accountancy",
    MKT: "Marketing",
    EDU: "Education",
    BEED: "Elementary Education",
    BSED: "Secondary Education",
    MED: "Medicine",
    NURS: "Nursing",
    PHAR: "Pharmacy",
  };
  for (const [key, value] of Object.entries(deptMap)) {
    if (course.toUpperCase().startsWith(key)) {
      return value;
    }
  }
  return course.split(" ")[0] || "Unknown";
};

// ✅✅✅ IN-UPDATE ANG 'exportRecords' PARA SA MULTI-COLUMN SORTING ✅✅✅
export async function exportRecords(req, res) {
  try {
    const {
      recordType,
      format = "csv",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const Model = getModel(recordType);

    // --- BAGO: Multi-Sort Logic ---
    const sortByKeys = (sortBy || "createdAt").split(",");
    const sortOrderValues = (sortOrder || "desc").split(",");

    const sortOptions = {};
    sortByKeys.forEach((key, index) => {
      const order = sortOrderValues[index] || "desc";
      sortOptions[key] = order === "asc" ? 1 : -1;
    });
    // --- End ng Multi-Sort Logic ---

    // --- BAGO: Filter Logic ---
    const filterQuery = buildFilterQuery(req.query);
    // --- End ng Filter Logic ---

    const records = await Model.find(filterQuery)
      .sort(sortOptions)
      .populate("studentId", "username email profilePictureUrl")
      .lean();

    if (records.length === 0) {
      return res.status(404).json({ message: "No records to export" });
    }

    // --- Mula dito pababa, ito 'yung original logic mo ---

    const flatRecords = records.map((r) => {
      const populatedStudent = r.studentId;
      const studentIdString = populatedStudent?._id
        ? populatedStudent._id.toString()
        : r.studentEmail || "N/A";
      const studentUsername = populatedStudent?.username || "N/A";
      const studentEmailFromUser =
        populatedStudent?.email || r.studentEmail || "N/A";

      const { _id, __v, studentId, approvedBy, updatedAt, ...rest } = r;

      const cleanRecord = {
        studentUsername: studentUsername,
        studentEmail: studentEmailFromUser,
        studentName: rest.studentName,
        ...rest,
      };

      if (cleanRecord.createdAt) {
        cleanRecord.createdAt = new Date(cleanRecord.createdAt).toLocaleString(
          "en-US",
          {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          },
        );
      }

      return cleanRecord;
    });

    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(flatRecords);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${recordType}_${sortBy.replace(
          /,/g,
          "-",
        )}_${Date.now()}.csv`,
      );
      res.send(csv);
    } else if (format === "excel") {
      const workbook = new ExcelJS.Workbook();

      if (recordType === "physicalExam") {
        const grouped = {};
        flatRecords.forEach((record) => {
          const dept = extractDepartment(record.course);
          const program = record.course || "Unknown";
          const year = record.year || "Unknown";

          if (!grouped[dept]) grouped[dept] = {};
          if (!grouped[dept][program]) grouped[dept][program] = {};
          if (!grouped[dept][program][year]) grouped[dept][program][year] = [];

          grouped[dept][program][year].push(record);
        });

        const worksheet = workbook.addWorksheet("Physical Exam Records");

        worksheet.columns = [
          { header: "Student ID", key: "studentId", width: 25 },
          { header: "Student Username", key: "studentUsername", width: 20 },
          { header: "Email", key: "studentEmail", width: 30 },
          { header: "Student Name", key: "studentName", width: 25 },
          { header: "Name", key: "name", width: 25 },
          { header: "Gender", key: "gender", width: 12 },
          { header: "Course", key: "course", width: 20 },
          { header: "Year", key: "year", width: 10 },
          { header: "Date", key: "date", width: 15 },
          { header: "Status", key: "status", width: 12 },
          { header: "Created At", key: "createdAt", width: 20 },
        ];

        let currentRow = 1;

        Object.keys(grouped)
          .sort()
          .forEach((dept) => {
            worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
            const deptCell = worksheet.getCell(`A${currentRow}`);
            deptCell.value = `DEPARTMENT: ${dept}`;
            deptCell.font = {
              bold: true,
              size: 14,
              color: { argb: "FFFFFFFF" },
            };
            deptCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF2C5F2D" },
            };
            deptCell.alignment = { horizontal: "center", vertical: "middle" };
            worksheet.getRow(currentRow).height = 25;
            currentRow++;

            Object.keys(grouped[dept])
              .sort()
              .forEach((program) => {
                worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
                const programCell = worksheet.getCell(`A${currentRow}`);
                programCell.value = `Program: ${program}`;
                programCell.font = {
                  bold: true,
                  size: 12,
                  color: { argb: "FFFFFFFF" },
                };
                programCell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF4A9D4F" },
                };
                programCell.alignment = {
                  horizontal: "left",
                  vertical: "middle",
                };
                worksheet.getRow(currentRow).height = 20;
                currentRow++;

                Object.keys(grouped[dept][program])
                  .sort()
                  .forEach((year) => {
                    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
                    const yearCell = worksheet.getCell(`A${currentRow}`);
                    yearCell.value = `Year Level: ${year}`;
                    yearCell.font = { bold: true, size: 11, italic: true };
                    yearCell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFA8E6A3" },
                    };
                    yearCell.alignment = {
                      horizontal: "left",
                      vertical: "middle",
                    };
                    worksheet.getRow(currentRow).height = 18;
                    currentRow++;

                    const headerRow = worksheet.getRow(currentRow);
                    headerRow.values = [
                      "Student ID",
                      "Student Username",
                      "Email",
                      "Student Name",
                      "Name",
                      "Gender",
                      "Course",
                      "Year",
                      "Date",
                      "Status",
                      "Created At",
                    ];
                    headerRow.font = { bold: true };
                    headerRow.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFE8F5E9" },
                    };
                    currentRow++;

                    grouped[dept][program][year].forEach((record) => {
                      worksheet.addRow({
                        studentId: record.studentId,
                        studentUsername: record.studentUsername,
                        studentEmail: record.studentEmail,
                        studentName: record.studentName,
                        name: record.name,
                        gender: record.gender,
                        course: record.course,
                        year: record.year,
                        date: record.date,
                        status: record.status,
                        createdAt: record.createdAt,
                      });
                      currentRow++;
                    });

                    const countRow = worksheet.getRow(currentRow);
                    countRow.getCell(1).value =
                      `Total: ${grouped[dept][program][year].length} students`;
                    countRow.getCell(1).font = { bold: true, italic: true };
                    countRow.getCell(1).fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFF5F5F5" },
                    };
                    currentRow++;
                    currentRow++;
                  });
              });
            currentRow++;
          });

        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      } else {
        const worksheet = workbook.addWorksheet(recordType);
        const sampleRecord = flatRecords[0];
        const headers = Object.keys(sampleRecord);
        worksheet.addRow(headers);
        worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        worksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2C5F2D" },
        };

        flatRecords.forEach((record) => {
          const row = headers.map((header) => record[header] || "");
          worksheet.addRow(row);
        });

        worksheet.columns.forEach((column) => {
          column.width = 20;
        });

        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${recordType}_${sortBy.replace(
          /,/g,
          "-",
        )}_${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({ message: error.message });
  }
}

// ==================== PENDING RECORD COUNTS ====================
export async function getPendingRecordCounts(req, res) {
  try {
    const [pe, mon, cert, mi, lr] = await Promise.all([
      PhysicalExam.countDocuments({ status: "pending" }),
      MedicalMonitoring.countDocuments({ status: "pending" }),
      MedicalCertificate.countDocuments({ status: "pending" }),
      MedicineIssuance.countDocuments({ status: "pending" }),
      LaboratoryRequest.countDocuments({ status: "pending" }),
    ]);

    res.json({
      physicalExam: pe,
      monitoring: mon,
      certificate: cert,
      medicineIssuance: mi,
      laboratoryRequest: lr,
      total: pe + mon + cert + mi + lr,
    });
  } catch (error) {
    console.error("❌ Pending counts error:", error);
    res.status(500).json({ message: error.message });
  }
}
