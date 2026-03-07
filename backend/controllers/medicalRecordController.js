import PhysicalExam from "../models/PhysicalExam.js";
import MedicalMonitoring from "../models/MedicalMonitoring.js";
import MedicalCertificate from "../models/MedicalCertificate.js";
import MedicineIssuance from "../models/MedicineIssuance.js";
import LaboratoryRequest from "../models/LaboratoryRequest.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import {
  createNotification,
  createAdminNotification,
} from "./notificationController.js";

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

// ✅ Helper to log admin/staff activity
const logAdminActivity = async (req, action, actionDetails) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff"))
    return;

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

    // Notify admins about the new submission
    try {
      const studentName =
        recordData.name ||
        recordData.studentName ||
        recordData.patientName ||
        "A student";
      await createAdminNotification(studentName, record._id, recordType);
    } catch (notifErr) {
      console.error("Admin notification failed:", notifErr);
    }

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
    let formName = "Record";
    if (recordType === "physicalExam") formName = "Physical Exam";
    if (recordType === "monitoring") formName = "Medical Monitoring";
    if (recordType === "certificate") formName = "Medical Certificate";
    if (recordType === "medicineIssuance") formName = "Medicine Issuance";
    if (recordType === "laboratoryRequest") formName = "Laboratory Request";
    const studentName =
      updatedRecord.studentName ||
      updatedRecord.name ||
      updatedRecord.patientName ||
      "Unknown";
    const detailParts = [`${formName} — ${studentName}`];
    if (updates.status) detailParts.push(`Status: ${updates.status}`);
    if (updates.diagnosis && updates.diagnosis !== originalRecord.diagnosis)
      detailParts.push("Added diagnosis");
    if (updates.meds && updates.meds !== originalRecord.meds)
      detailParts.push("Added treatment notes");
    await logAdminActivity(req, "UPDATE_RECORD", {
      recordType,
      recordId: id,
      userId: updatedRecord.studentId.toString(),
      details: detailParts.join(" | "),
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
    let delFormName = "Record";
    if (recordType === "physicalExam") delFormName = "Physical Exam";
    if (recordType === "monitoring") delFormName = "Medical Monitoring";
    if (recordType === "certificate") delFormName = "Medical Certificate";
    if (recordType === "medicineIssuance") delFormName = "Medicine Issuance";
    if (recordType === "laboratoryRequest") delFormName = "Laboratory Request";
    const delStudentName =
      record.studentName || record.name || record.patientName || "Unknown";
    await logAdminActivity(req, "DELETE_RECORD", {
      recordType,
      recordId: id,
      userId: record.studentId?.toString(),
      details: `${delFormName} — ${delStudentName}`,
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
    let bulkDelForm = "Records";
    if (recordType === "physicalExam") bulkDelForm = "Physical Exams";
    if (recordType === "monitoring") bulkDelForm = "Medical Monitoring";
    if (recordType === "certificate") bulkDelForm = "Medical Certificates";
    if (recordType === "medicineIssuance") bulkDelForm = "Medicine Issuances";
    if (recordType === "laboratoryRequest") bulkDelForm = "Laboratory Requests";
    await logAdminActivity(req, "BULK_DELETE_RECORDS", {
      recordType,
      count: result.deletedCount,
      details: `Deleted ${result.deletedCount} ${bulkDelForm}`,
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
    let bulkForm = "Records";
    if (recordType === "physicalExam") bulkForm = "Physical Exams";
    if (recordType === "monitoring") bulkForm = "Medical Monitoring";
    if (recordType === "certificate") bulkForm = "Medical Certificates";
    if (recordType === "medicineIssuance") bulkForm = "Medicine Issuances";
    if (recordType === "laboratoryRequest") bulkForm = "Laboratory Requests";
    await logAdminActivity(req, "BULK_UPDATE_STATUS", {
      recordType,
      count: result.modifiedCount,
      details: `${result.modifiedCount} ${bulkForm} — Status: ${status}`,
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
    const { recordType, dateFrom, dateTo, ...extraFilters } = req.query;

    // --- DATE RANGE LOGIC ---
    // If dateFrom/dateTo provided, use them; otherwise default to current month
    const today = new Date();
    let startDate, endDate;

    if (dateFrom) {
      startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    if (dateTo) {
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // --- BUILD EXTRA FILTER $match STAGE ---
    // Accepts optional pre-filters like course, gender, sex, degree, action, diagnosis, civilStatus
    const buildExtraMatch = () => {
      const match = {};
      const allowed = [
        "course",
        "year",
        "gender",
        "sex",
        "degree",
        "action",
        "diagnosis",
        "remarks",
        "symptoms",
      ];
      allowed.forEach((key) => {
        if (extraFilters[key]) {
          match[key] = { $regex: new RegExp(extraFilters[key], "i") };
        }
      });
      return Object.keys(match).length > 0 ? [{ $match: match }] : [];
    };

    // Build the date-filtered base pipeline per record type
    const buildBasePipeline = (type) => {
      if (type === "monitoring") {
        // Monitoring uses createdAt (Date type)
        return [{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }];
      }
      // All others store dates as strings: physicalExam/certificate use "date",
      // medicineIssuance uses "date", laboratoryRequest uses "issueDate"
      const stringField = type === "laboratoryRequest" ? "$issueDate" : "$date";
      return [
        {
          $addFields: {
            parsedDate: {
              $dateFromString: {
                dateString: { $substr: [stringField, 0, 10] },
                format: "%Y-%m-%d",
                onError: "$createdAt",
                onNull: "$createdAt",
              },
            },
          },
        },
        { $match: { parsedDate: { $gte: startDate, $lte: endDate } } },
      ];
    };

    const extraMatch = buildExtraMatch();
    let tallyData = [];
    let totalCount = 0;

    // ==================================================================
    // TALLYING LOGIC PER COLLECTION
    // ==================================================================

    if (recordType === "medicineIssuance") {
      // 1. Medicine Issuance — $unwind medicines, group by name + course, $sum quantity
      const basePipeline = buildBasePipeline("medicineIssuance");
      tallyData = await MedicineIssuance.aggregate([
        ...basePipeline,
        ...extraMatch,
        { $unwind: "$medicines" },
        {
          $group: {
            _id: { medicineName: "$medicines.name", course: "$course" },
            totalQuantity: { $sum: "$medicines.quantity" },
          },
        },
        {
          $project: {
            _id: 0,
            medicineName: "$_id.medicineName",
            course: "$_id.course",
            totalQuantity: 1,
          },
        },
        { $sort: { totalQuantity: -1 } },
      ]);
      totalCount = tallyData.reduce((sum, r) => sum + r.totalQuantity, 0);
    } else if (recordType === "monitoring") {
      // 2. Medical Monitoring — group by symptoms; count visits
      const basePipeline = buildBasePipeline("monitoring");
      tallyData = await MedicalMonitoring.aggregate([
        ...basePipeline,
        ...extraMatch,
        {
          $group: {
            _id: { symptoms: "$symptoms" },
            visitCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            symptoms: "$_id.symptoms",
            visitCount: 1,
          },
        },
        { $sort: { visitCount: -1 } },
      ]);
      totalCount = tallyData.reduce((sum, r) => sum + r.visitCount, 0);
    } else if (recordType === "physicalExam") {
      // 3. New Student Assessment — group by course, year, gender; count students
      const basePipeline = buildBasePipeline("physicalExam");
      tallyData = await PhysicalExam.aggregate([
        ...basePipeline,
        ...extraMatch,
        {
          $group: {
            _id: { course: "$course", year: "$year", gender: "$gender" },
            studentCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            course: "$_id.course",
            year: "$_id.year",
            gender: "$_id.gender",
            studentCount: 1,
          },
        },
        { $sort: { course: 1, year: 1 } },
      ]);
      totalCount = tallyData.reduce((sum, r) => sum + r.studentCount, 0);
    } else if (recordType === "certificate") {
      // 4. Medical Certificates — group by diagnosis, remarks; count certificates
      const basePipeline = buildBasePipeline("certificate");
      tallyData = await MedicalCertificate.aggregate([
        ...basePipeline,
        ...extraMatch,
        {
          $group: {
            _id: {
              diagnosis: "$diagnosis",
              remarks: "$remarks",
            },
            certificateCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            diagnosis: "$_id.diagnosis",
            remarks: "$_id.remarks",
            certificateCount: 1,
          },
        },
        { $sort: { certificateCount: -1 } },
      ]);
      totalCount = tallyData.reduce((sum, r) => sum + r.certificateCount, 0);
    } else if (recordType === "laboratoryRequest") {
      // 5. Laboratory Requests — count true values for each boolean test field
      const basePipeline = buildBasePipeline("laboratoryRequest");
      const testFields = [
        { field: "routineUrinalysisTests.pregnancy", label: "Pregnancy Test" },
        { field: "routineUrinalysisTests.fecalysis", label: "Fecalysis" },
        { field: "cbcTests.hemoglobin", label: "Hemoglobin" },
        { field: "cbcTests.hematocrit", label: "Hematocrit" },
        { field: "cbcTests.bloodSugar", label: "Blood Sugar" },
        { field: "cbcTests.plateletCT", label: "Platelet CT" },
        { field: "gramStain.hpsBhTest", label: "HPS/BH Test" },
        { field: "gramStain.vaginalSmear", label: "Vaginal Smear" },
        { field: "bloodChemistry.fbs", label: "FBS" },
        { field: "bloodChemistry.uricAcid", label: "Uric Acid" },
        { field: "bloodChemistry.cholesterol", label: "Cholesterol" },
        { field: "bloodChemistry.hdl", label: "HDL" },
        { field: "bloodChemistry.tsh", label: "TSH" },
        { field: "bloodChemistry.totalProtein", label: "Total Protein" },
        { field: "papSmear.cxrInterpretation", label: "CXR Interpretation" },
        { field: "papSmear.ecgInterpretation", label: "ECG Interpretation" },
        { field: "widhalTest.salmonella", label: "Salmonella (Widal)" },
      ];

      // Build a single $group stage that sums all boolean test fields
      const groupAccumulators = {};
      testFields.forEach((t) => {
        const key = t.field.replace(".", "_");
        groupAccumulators[key] = {
          $sum: { $cond: [{ $eq: [`$${t.field}`, true] }, 1, 0] },
        };
      });

      const result = await LaboratoryRequest.aggregate([
        ...basePipeline,
        ...extraMatch,
        { $group: { _id: null, ...groupAccumulators } },
      ]);

      const counts = result[0] || {};
      tallyData = testFields
        .map((t) => ({
          testName: t.label,
          count: counts[t.field.replace(".", "_")] || 0,
        }))
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count);

      totalCount = tallyData.reduce((sum, r) => sum + r.count, 0);
    } else {
      return res.status(400).json({ message: "Invalid record type" });
    }

    // Build a clean object of applied filters for the response
    const appliedFilters = {};
    [
      "course",
      "year",
      "gender",
      "sex",
      "degree",
      "action",
      "diagnosis",
      "remarks",
      "symptoms",
    ].forEach((k) => {
      if (extraFilters[k]) appliedFilters[k] = extraFilters[k];
    });

    res.json({
      recordType,
      dateFrom: startDate.toISOString().split("T")[0],
      dateTo: endDate.toISOString().split("T")[0],
      totalCount,
      tallyData,
      appliedFilters,
    });
  } catch (error) {
    console.error(`❌ Tally error for ${req.query.recordType}:`, error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

// ==================== TALLY EXPORT (CSV of individual matching records) ====================
export async function exportTallyRecords(req, res) {
  try {
    const { recordType, dateFrom, dateTo, ...extraFilters } = req.query;

    const Model = getModel(recordType);

    // Build date filter
    const today = new Date();
    let startDate, endDate;
    if (dateFrom) {
      startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }
    if (dateTo) {
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Build query filter
    const filter = {};
    // Date filter
    if (recordType === "monitoring") {
      filter.createdAt = { $gte: startDate, $lte: endDate };
    } else {
      const dateField =
        recordType === "laboratoryRequest" ? "issueDate" : "date";
      filter[dateField] = {
        $gte: startDate.toISOString().split("T")[0],
        $lte: endDate.toISOString().split("T")[0],
      };
    }

    // Extra filters (regex)
    const allowed = [
      "course",
      "year",
      "gender",
      "sex",
      "degree",
      "action",
      "diagnosis",
      "remarks",
      "symptoms",
    ];
    allowed.forEach((key) => {
      if (extraFilters[key]) {
        filter[key] = { $regex: new RegExp(extraFilters[key], "i") };
      }
    });

    const records = await Model.find(filter).sort({ createdAt: -1 }).lean();

    if (records.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for this filter" });
    }

    // Build CSV with only the online form details per record type
    let csvRows;
    if (recordType === "physicalExam") {
      csvRows = records.map((r) => ({
        Date: r.date,
        Name: r.name,
        Gender: r.gender,
        Course: r.course,
        Year: r.year,
        Status: r.status,
      }));
    } else if (recordType === "monitoring") {
      csvRows = records.map((r) => ({
        Date: r.createdAt
          ? new Date(r.createdAt).toISOString().split("T")[0]
          : "",
        Arrival: r.arrival,
        "Patient Name": r.patientName,
        Sex: r.sex,
        Degree: r.degree,
        "Student No": r.studentNo,
        Symptoms: r.symptoms,
        Action: r.action,
        Meds: r.meds || "",
        Exit: r.exit || "",
        Duration: r.duration || "",
        Personnel: r.personnel || "",
        Status: r.status,
      }));
    } else if (recordType === "certificate") {
      csvRows = records.map((r) => ({
        Date: r.date,
        Name: r.name,
        Age: r.age,
        Sex: r.sex,
        "Civil Status": r.civilStatus,
        School: r.school,
        "ID Number": r.idNumber,
        Diagnosis: r.diagnosis || "",
        Remarks: r.remarks || "",
        Status: r.status,
      }));
    } else if (recordType === "medicineIssuance") {
      csvRows = records.map((r) => ({
        Date: r.date,
        Course: r.course,
        Diagnosis: r.diagnosis || "",
        Medicines: (r.medicines || [])
          .map((m) => `${m.name} (x${m.quantity})`)
          .join("; "),
        Status: r.status,
      }));
    } else if (recordType === "laboratoryRequest") {
      csvRows = records.map((r) => {
        const tests = [];
        if (r.routineUrinalysisTests?.pregnancy) tests.push("Pregnancy Test");
        if (r.routineUrinalysisTests?.fecalysis) tests.push("Fecalysis");
        if (r.cbcTests?.hemoglobin) tests.push("Hemoglobin");
        if (r.cbcTests?.hematocrit) tests.push("Hematocrit");
        if (r.cbcTests?.bloodSugar) tests.push("Blood Sugar");
        if (r.cbcTests?.plateletCT) tests.push("Platelet CT");
        if (r.gramStain?.hpsBhTest) tests.push("HPS/BH Test");
        if (r.gramStain?.vaginalSmear) tests.push("Vaginal Smear");
        if (r.bloodChemistry?.fbs) tests.push("FBS");
        if (r.bloodChemistry?.uricAcid) tests.push("Uric Acid");
        if (r.bloodChemistry?.cholesterol) tests.push("Cholesterol");
        if (r.bloodChemistry?.hdl) tests.push("HDL");
        if (r.bloodChemistry?.tsh) tests.push("TSH");
        if (r.bloodChemistry?.totalProtein) tests.push("Total Protein");
        if (r.papSmear?.cxrInterpretation) tests.push("CXR Interpretation");
        if (r.papSmear?.ecgInterpretation) tests.push("ECG Interpretation");
        if (r.widhalTest?.salmonella) tests.push("Salmonella (Widal)");
        return {
          "Issue Date": r.issueDate,
          Name: r.name,
          "Nurse On Duty": r.nurseOnDuty || "",
          "Tests Requested": tests.join("; "),
          Others: r.others || "",
          Status: r.status,
        };
      });
    }

    const parser = new Parser();
    const csv = parser.parse(csvRows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Tally_${recordType}_${Date.now()}.csv`,
    );
    res.send(csv);
  } catch (error) {
    console.error("❌ Tally export error:", error);
    res.status(500).json({ message: error.message });
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

    // --- Explicit column mappings per record type for clean CSV ---

    const flatRecords = records.map((r) => {
      const pop = r.studentId;
      const username = pop?.username || "N/A";
      const email = pop?.email || r.studentEmail || "N/A";

      if (recordType === "physicalExam") {
        return {
          "Student Username": username,
          "Student Email": email,
          Name: r.name || r.studentName || "",
          Gender: r.gender || "",
          Course: r.course || "",
          Year: r.year || "",
          Date: r.date || "",
          Status: r.status || "",
        };
      } else if (recordType === "medicalMonitoring") {
        return {
          "Student Username": username,
          "Student Email": email,
          "Patient Name": r.patientName || r.studentName || "",
          Sex: r.sex || "",
          Degree: r.degree || "",
          "Student No": r.studentNo || "",
          Arrival: r.arrival || "",
          Symptoms: r.symptoms || "",
          Action: r.action || "",
          Meds: r.meds || "",
          Exit: r.exit || "",
          Duration: r.duration || "",
          Personnel: r.personnel || "",
          Status: r.status || "",
        };
      } else if (recordType === "medicalCertificate") {
        return {
          "Student Username": username,
          "Student Email": email,
          Name: r.name || r.studentName || "",
          Age: r.age || "",
          Sex: r.sex || "",
          "Civil Status": r.civilStatus || "",
          School: r.school || "",
          "ID Number": r.idNumber || "",
          Date: r.date || "",
          Diagnosis: r.diagnosis || "",
          Remarks: r.remarks || "",
          Status: r.status || "",
        };
      } else if (recordType === "medicineIssuance") {
        return {
          "Student Username": username,
          "Student Email": email,
          "Student Name": r.studentName || "",
          Date: r.date || "",
          Course: r.course || "",
          Diagnosis: r.diagnosis || "",
          Medicines: (r.medicines || [])
            .map((m) => `${m.name} (x${m.quantity})`)
            .join("; "),
          Status: r.status || "",
        };
      } else if (recordType === "laboratoryRequest") {
        const tests = [];
        if (r.routineUrinalysisTests?.pregnancy) tests.push("Pregnancy Test");
        if (r.routineUrinalysisTests?.fecalysis) tests.push("Fecalysis");
        if (r.cbcTests?.hemoglobin) tests.push("Hemoglobin");
        if (r.cbcTests?.hematocrit) tests.push("Hematocrit");
        if (r.cbcTests?.bloodSugar) tests.push("Blood Sugar");
        if (r.cbcTests?.plateletCT) tests.push("Platelet CT");
        if (r.gramStain?.hpsBhTest) tests.push("HPS/BH Test");
        if (r.gramStain?.vaginalSmear) tests.push("Vaginal Smear");
        if (r.bloodChemistry?.fbs) tests.push("FBS");
        if (r.bloodChemistry?.uricAcid) tests.push("Uric Acid");
        if (r.bloodChemistry?.cholesterol) tests.push("Cholesterol");
        if (r.bloodChemistry?.hdl) tests.push("HDL");
        if (r.bloodChemistry?.tsh) tests.push("TSH");
        if (r.bloodChemistry?.totalProtein) tests.push("Total Protein");
        if (r.papSmear?.cxrInterpretation) tests.push("CXR Interpretation");
        if (r.papSmear?.ecgInterpretation) tests.push("ECG Interpretation");
        if (r.widhalTest?.salmonella) tests.push("Salmonella (Widal)");
        return {
          "Student Username": username,
          "Student Email": email,
          "Issue Date": r.issueDate || "",
          Name: r.name || r.studentName || "",
          "Nurse On Duty": r.nurseOnDuty || "",
          "Tests Requested": tests.join("; "),
          Others: r.others || "",
          Status: r.status || "",
        };
      }

      // fallback generic (shouldn't reach here)
      return { "Student Username": username, "Student Email": email };
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
