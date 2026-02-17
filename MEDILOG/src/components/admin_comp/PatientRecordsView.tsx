import { useState, useEffect } from "react";
import type { MouseEvent } from "react";
import { medicalAPI, type SortConfig } from "../../services/api";
import PaginationControls from "./PaginationControls";

// --- Interfaces ---

interface MedicalRecord {
  _id: string;
  studentId: {
    _id: string;
    username: string;
    email: string;
  };
  studentName: string;
  studentEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  [key: string]: any;
}

type RecordType =
  | "physicalExam"
  | "monitoring"
  | "certificate"
  | "medicineIssuance"
  | "laboratoryRequest";

interface PatientRecordsViewProps {
  recordType: RecordType;
}

const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({
  recordType,
}) => {
  // --- State ---
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [patientCurrentPage, setPatientCurrentPage] = useState(1);
  const [patientTotalPages, setPatientTotalPages] = useState(0);
  const [patientTotalCount, setPatientTotalCount] = useState(0);
  const [patientRowsPerPage, setPatientRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([
    { key: "createdAt", order: "desc" },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(
    null,
  );

  // --- Data Loading ---

  const loadRecords = async (
    page: number,
    sort: SortConfig[],
    limit: number = patientRowsPerPage,
    activeFilters: Record<string, string> = filters,
  ) => {
    try {
      setLoading(true);
      const response = await medicalAPI.getAllRecords(
        recordType,
        page,
        sort,
        limit,
        activeFilters,
      );
      setPatientRecords(response.records || []);
      setPatientCurrentPage(response.currentPage);
      setPatientTotalPages(response.totalPages);
      setPatientTotalCount(response.totalCount);
    } catch (error) {
      console.error("Failed to load records:", error);
      alert("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  // Reset and load when recordType changes
  useEffect(() => {
    setPatientCurrentPage(1);
    setSortConfig([{ key: "createdAt", order: "desc" }]);
    setFilters({});
    setShowFilters(false);
    loadRecords(
      1,
      [{ key: "createdAt", order: "desc" }],
      patientRowsPerPage,
      {},
    );
  }, [recordType, patientRowsPerPage]);

  // Load when page or sort changes
  useEffect(() => {
    loadRecords(patientCurrentPage, sortConfig, patientRowsPerPage, filters);
  }, [patientCurrentPage, sortConfig, recordType, patientRowsPerPage]);

  // --- CRUD Handlers ---

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this single record?",
      )
    )
      return;
    try {
      await medicalAPI.deleteRecord(id, recordType);
      alert("Record deleted successfully");
      loadRecords(patientCurrentPage, sortConfig);
    } catch (error) {
      alert("Failed to delete record");
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      await medicalAPI.updateRecord(
        editingRecord._id,
        recordType,
        editingRecord,
      );
      alert("Record updated successfully");
      setShowEditModal(false);
      setEditingRecord(null);
      loadRecords(patientCurrentPage, sortConfig);
    } catch (error) {
      alert("Failed to update record");
    }
  };

  // --- Print & Export ---

  const handlePrint = () => {
    if (!editingRecord) return;

    const printableContent = document.getElementById("printable-record");

    if (printableContent) {
      const printContents = printableContent.innerHTML;

      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write("<html><head><title>Print Record</title>");
        printWindow.document.write(
          '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css">',
        );
        printWindow.document.write("<style>");
        printWindow.document.write("body { font-size: 14px; color: #222; }");
        printWindow.document.write(".modal-footer { display: none; }");
        printWindow.document.write(
          ".form-control, .form-select, input, select, textarea { border: none !important; padding: 2px 0 !important; background: transparent !important; box-shadow: none !important; resize: none !important; font-size: 14px; }",
        );
        printWindow.document.write(".row { margin-bottom: 8px; }");
        printWindow.document.write(".col-md-6 { padding-bottom: 6px; }");
        printWindow.document.write(
          "label { font-weight: 600; margin-top: 8px; margin-bottom: 2px; display: block; font-size: 13px; color: #555; }",
        );
        printWindow.document.write(
          "input, select, textarea { margin-top: 0; font-size: 14px; }",
        );
        printWindow.document.write(
          ".badge { font-size: 13px; padding: 4px 10px; }",
        );
        printWindow.document.write(
          ".table { font-size: 13px; } .table th { font-weight: 600; background: #f8f9fa !important; }",
        );
        printWindow.document.write("hr { margin: 12px 0; }");
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");
        printWindow.document.write('<div class="container mt-4">');

        printWindow.document.write(
          `<h3 style="color:#2c5f2d; margin-bottom:4px;">MEDILOG</h3>`,
        );
        printWindow.document.write(
          `<h5 style="margin-bottom:2px;">${getRecordTitle()}</h5>`,
        );
        printWindow.document.write(
          `<p style="margin-bottom:0;">Student: <strong>${editingRecord.studentName}</strong> (${editingRecord.studentEmail})</p><hr>`,
        );

        printWindow.document.write(printContents);
        printWindow.document.write("</div></body></html>");
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } else {
      alert("Printable content not found.");
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const extension = format === "csv" ? "csv" : "xlsx";
      const recordName =
        recordType.charAt(0).toUpperCase() + recordType.slice(1);

      const primarySortKey = sortConfig[0]?.key || "default";
      const defaultName = `${recordName}_Sort-${primarySortKey}_${date}.${extension}`;

      let fileName = window.prompt(
        "Please enter a filename for your export:",
        defaultName,
      );

      if (!fileName) {
        return;
      }
      if (!fileName.endsWith(`.${extension}`)) {
        fileName += `.${extension}`;
      }

      const response = await medicalAPI.exportRecords(
        recordType,
        format,
        sortConfig,
        filters,
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Failed to export records");
    }
  };

  const handlePrintTable = () => {
    const recordTitle = getRecordTitle();
    const tableContainer = document.querySelector(".table-responsive");

    if (tableContainer) {
      const printContents = tableContainer.innerHTML;

      const printWindow = window.open("", "", "height=700,width=1000");
      if (printWindow) {
        printWindow.document.write(
          "<html><head><title>Print Table - " + recordTitle + "</title>",
        );
        printWindow.document.write(
          '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css">',
        );
        printWindow.document.write("<style>");
        printWindow.document.write("body { font-size: 13px; color: #222; }");
        // Hide avatars, action buttons, and pagination
        printWindow.document.write(
          ".table-avatar, img.table-avatar { display: none !important; }",
        );
        printWindow.document.write(
          ".btn-icon-circle { display: none !important; }",
        );
        printWindow.document.write(
          ".pagination-controls { display: none !important; }",
        );
        printWindow.document.write(
          ".pagination-wrapper { display: none !important; }",
        );
        // Table styling
        printWindow.document.write(
          "table { width: 100%; border-collapse: collapse; font-size: 13px; }",
        );
        printWindow.document.write(
          "th { background: #f0f0f0 !important; font-weight: 600; padding: 8px 10px; border-bottom: 2px solid #ccc; text-align: left; white-space: nowrap; position: static; }",
        );
        printWindow.document.write(
          "td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; vertical-align: middle; }",
        );
        printWindow.document.write(
          ".badge { font-size: 12px; padding: 3px 8px; border: 1px solid #ccc; background: #f5f5f5 !important; color: #333 !important; }",
        );
        printWindow.document.write(
          ".table-responsive { overflow: visible !important; }",
        );
        // Hide the last column header (Actions)
        printWindow.document.write(
          "th:last-child, td:last-child { display: none; }",
        );
        printWindow.document.write(".text-end { display: none; }");
        // Sort icons
        printWindow.document.write(".bi, .sort-priority { display: none; }");
        printWindow.document.write("hr { margin: 10px 0; }");
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");

        printWindow.document.write('<div class="container-fluid mt-3">');
        printWindow.document.write(
          `<h4 style="color:#2c5f2d; margin-bottom:2px;">MEDILOG</h4>`,
        );
        printWindow.document.write(
          `<h5 style="margin-bottom:0;">${recordTitle}</h5>`,
        );
        printWindow.document.write(
          `<p style="font-size:12px; color:#666; margin-bottom:4px;">Printed: ${new Date().toLocaleDateString()}</p><hr>`,
        );

        printWindow.document.write(printContents);

        printWindow.document.write("</div></body></html>");
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } else {
      alert("Table content not found.");
    }
  };

  // --- Helper Functions ---

  const filteredRecords = patientRecords.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.studentName?.toLowerCase().includes(searchLower) ||
      record.studentEmail?.toLowerCase().includes(searchLower) ||
      record.name?.toLowerCase().includes(searchLower) ||
      record.patientName?.toLowerCase().includes(searchLower)
    );
  });

  const getRecordTitle = () => {
    switch (recordType) {
      case "physicalExam":
        return "Physical Examination Records";
      case "monitoring":
        return "Medical Monitoring Records";
      case "certificate":
        return "Medical Certificate Records";
      case "medicineIssuance":
        return "Medicine Issuance Records";
      case "laboratoryRequest":
        return "Laboratory Request Records";
      default:
        return "Records";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "badge bg-success";
      case "rejected":
        return "badge bg-danger";
      case "pending":
      default:
        return "badge bg-warning text-dark";
    }
  };

  const handleSort = (event: MouseEvent, key: string) => {
    const shiftKey = event.shiftKey;

    setSortConfig((prevConfig) => {
      let newConfig = [...prevConfig];
      const existingIndex = newConfig.findIndex((s) => s.key === key);

      if (!shiftKey) {
        const isSameKey = newConfig.length === 1 && newConfig[0].key === key;
        const currentOrder = newConfig[0]?.order;

        return [
          {
            key,
            order: isSameKey && currentOrder === "asc" ? "desc" : "asc",
          },
        ];
      } else {
        if (existingIndex > -1) {
          newConfig[existingIndex].order =
            newConfig[existingIndex].order === "asc" ? "desc" : "asc";
        } else {
          newConfig.push({ key, order: "asc" });
        }
        return newConfig;
      }
    });
    setPatientCurrentPage(1);
  };

  const getSortInfo = (key: string) => {
    const sortRule = sortConfig.find((s) => s.key === key);

    if (!sortRule) {
      return <i className="bi bi-three-dots-vertical"></i>;
    }

    const icon = sortRule.order === "asc" ? "bi-sort-up" : "bi-sort-down";
    const priority = sortConfig.findIndex((s) => s.key === key) + 1;

    return (
      <>
        <i className={`bi ${icon}`}></i>
        {sortConfig.length > 1 && (
          <span className="sort-priority">{priority}</span>
        )}
      </>
    );
  };

  const getRecordAvatar = (record: any) => {
    if (record.studentId?.profilePictureUrl) {
      return record.studentId.profilePictureUrl;
    }
    const name = record.studentName || record.name || "Student";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  };

  // --- Filter Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPatientCurrentPage(1);
    loadRecords(1, sortConfig, patientRowsPerPage, filters);
  };

  const clearFilters = () => {
    setFilters({});
    setPatientCurrentPage(1);
    loadRecords(1, sortConfig, patientRowsPerPage, {});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const renderFilterBar = () => {
    return (
      <div
        className="card mb-3 border-0 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        }}
      >
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            {/* Status — available for all record types */}
            <div className="col-md-2">
              <label className="form-label small fw-semibold mb-1">
                Status
              </label>
              <select
                className="form-select form-select-sm"
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Course — Physical Exam, Medicine Issuance */}
            {(recordType === "physicalExam" ||
              recordType === "medicineIssuance") && (
              <div className="col-md-2">
                <label className="form-label small fw-semibold mb-1">
                  Course
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. BSIT"
                  value={filters.course || ""}
                  onChange={(e) => handleFilterChange("course", e.target.value)}
                />
              </div>
            )}

            {/* Year — Physical Exam */}
            {recordType === "physicalExam" && (
              <div className="col-md-2">
                <label className="form-label small fw-semibold mb-1">
                  Year Level
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filters.year || ""}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            )}

            {/* Gender — Physical Exam */}
            {recordType === "physicalExam" && (
              <div className="col-md-2">
                <label className="form-label small fw-semibold mb-1">
                  Gender
                </label>
                <select
                  className="form-select form-select-sm"
                  value={filters.gender || ""}
                  onChange={(e) => handleFilterChange("gender", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            )}

            {/* Sex — Monitoring, Certificate */}
            {(recordType === "monitoring" || recordType === "certificate") && (
              <div className="col-md-2">
                <label className="form-label small fw-semibold mb-1">Sex</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.sex || ""}
                  onChange={(e) => handleFilterChange("sex", e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            )}

            {/* Degree — Monitoring */}
            {recordType === "monitoring" && (
              <div className="col-md-2">
                <label className="form-label small fw-semibold mb-1">
                  Degree
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. BSIT"
                  value={filters.degree || ""}
                  onChange={(e) => handleFilterChange("degree", e.target.value)}
                />
              </div>
            )}

            {/* Date Range — all types */}
            <div className="col-md-2">
              <label className="form-label small fw-semibold mb-1">
                Date From
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold mb-1">
                Date To
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            {/* Apply / Clear buttons */}
            <div className="col-md-auto d-flex gap-2 align-items-end">
              <button
                className="btn btn-success btn-sm px-3"
                onClick={applyFilters}
              >
                <i className="bi bi-funnel-fill me-1"></i>Apply
              </button>
              <button
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                <i className="bi bi-x-circle me-1"></i>Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- JSX ---

  return (
    <div>
      {/* Search & Export Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search..."
            style={{ maxWidth: "300px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-success" disabled={!searchTerm}>
            <i className="bi bi-search"></i> Search
          </button>
          <button
            className={`btn btn-sm px-3 ${showFilters ? "btn-warning" : "btn-outline-secondary"}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <i className="bi bi-funnel me-1"></i>
            Filters
            {activeFilterCount > 0 && (
              <span className="badge bg-danger ms-1 rounded-pill">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary px-3 btn-sm"
            onClick={handlePrintTable}
          >
            <i className="bi bi-printer"></i> Print Table
          </button>
          <button
            className="btn btn-info px-3 text-white btn-sm"
            onClick={() => handleExport("csv")}
          >
            <i className="bi bi-download"></i> CSV
          </button>
        </div>
      </div>

      {showFilters && renderFilterBar()}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
        </div>
      ) : (
        <div className="table-responsive">
          {/* === Physical Exam Table === */}
          {recordType === "physicalExam" && (
            <>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th
                      className="ps-4 th-sortable"
                      onClick={(e) => handleSort(e, "name")}
                    >
                      Student {getSortInfo("name")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "studentEmail")}
                    >
                      Email {getSortInfo("studentEmail")}
                    </th>
                    <th>Gender</th>
                    <th>Course & Year</th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "date")}
                    >
                      Date {getSortInfo("date")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "status")}
                    >
                      Status {getSortInfo("status")}
                    </th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <img
                              src={getRecordAvatar(record)}
                              alt="avatar"
                              className="table-avatar me-3 shadow-sm"
                            />
                            <div>
                              <div className="fw-bold text-dark">
                                {record.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="text-muted">{record.studentEmail}</td>

                        <td>
                          <span className="badge bg-light text-dark border">
                            {record.gender}
                          </span>
                        </td>

                        <td>
                          <div
                            className="fw-semibold"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {record.course}
                          </div>
                          <div className="small text-muted">{record.year}</div>
                        </td>

                        <td>{record.date}</td>

                        <td>
                          <span
                            className={`${getStatusBadge(record.status)} rounded-pill px-3`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td className="text-end pe-4">
                          <button
                            className="btn-icon-circle edit"
                            title="Edit"
                            onClick={() => handleEdit(record)}
                          >
                            <i
                              className="bi bi-pencil-fill"
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                          </button>
                          <button
                            className="btn-icon-circle delete"
                            title="Delete"
                            onClick={() => handleDelete(record._id)}
                          >
                            <i
                              className="bi bi-trash-fill"
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <PaginationControls
                currentPage={patientCurrentPage}
                totalPages={patientTotalPages}
                onPageChange={(page) => setPatientCurrentPage(page)}
                totalCount={patientTotalCount}
                pageSize={patientRowsPerPage}
                onPageSizeChange={(newSize) => {
                  setPatientRowsPerPage(newSize);
                  setPatientCurrentPage(1);
                }}
              />
            </>
          )}

          {/* === Monitoring Table === */}
          {recordType === "monitoring" && (
            <>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th
                      className="ps-4 th-sortable"
                      onClick={(e) => handleSort(e, "patientName")}
                    >
                      Student {getSortInfo("patientName")}
                    </th>
                    <th>Sex</th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "symptoms")}
                    >
                      Symptoms {getSortInfo("symptoms")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "arrival")}
                    >
                      Arrival {getSortInfo("arrival")}
                    </th>
                    <th>Exit</th>
                    <th>Duration</th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "status")}
                    >
                      Status {getSortInfo("status")}
                    </th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <img
                              src={getRecordAvatar(record)}
                              alt="avatar"
                              className="table-avatar me-3 shadow-sm"
                            />
                            <div>
                              <div className="fw-bold text-dark">
                                {record.patientName}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border">
                            {record.sex}
                          </span>
                        </td>

                        <td className="text-truncate" title={record.symptoms}>
                          {record.symptoms}
                        </td>

                        <td>{record.arrival}</td>

                        <td>{record.exit || "-"}</td>

                        <td>{record.duration || "-"}</td>

                        <td>
                          <span
                            className={`${getStatusBadge(record.status)} rounded-pill px-3`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td className="text-end pe-4">
                          <button
                            className="btn-icon-circle edit"
                            title="Edit"
                            onClick={() => handleEdit(record)}
                          >
                            <i
                              className="bi bi-pencil-fill"
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                          </button>
                          <button
                            className="btn-icon-circle delete"
                            title="Delete"
                            onClick={() => handleDelete(record._id)}
                          >
                            <i
                              className="bi bi-trash-fill"
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <PaginationControls
                currentPage={patientCurrentPage}
                totalPages={patientTotalPages}
                onPageChange={(page) => setPatientCurrentPage(page)}
                totalCount={patientTotalCount}
                pageSize={patientRowsPerPage}
                onPageSizeChange={(newSize) => {
                  setPatientRowsPerPage(newSize);
                  setPatientCurrentPage(1);
                }}
              />
            </>
          )}

          {/* === Certificate Table === */}
          {recordType === "certificate" && (
            <>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th
                      className="ps-4 th-sortable"
                      onClick={(e) => handleSort(e, "name")}
                    >
                      Name {getSortInfo("name")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "age")}
                    >
                      Age {getSortInfo("age")}
                    </th>
                    <th>Sex</th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "civilStatus")}
                    >
                      Civil Status {getSortInfo("civilStatus")}
                    </th>
                    <th>Diagnosis</th>
                    <th>Remarks</th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "date")}
                    >
                      Date {getSortInfo("date")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "status")}
                    >
                      Status {getSortInfo("status")}
                    </th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4 text-muted">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <img
                              src={getRecordAvatar(record)}
                              alt="avatar"
                              className="table-avatar me-3 shadow-sm"
                            />
                            <div>
                              <div className="fw-bold text-dark">
                                {record.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>{record.age}</td>

                        <td>
                          <span className="badge bg-light text-dark border">
                            {record.sex}
                          </span>
                        </td>

                        <td>{record.civilStatus}</td>

                        <td className="text-truncate" title={record.diagnosis}>
                          {record.diagnosis || "-"}
                        </td>

                        <td className="text-truncate" title={record.remarks}>
                          {record.remarks || "-"}
                        </td>

                        <td>{record.date}</td>

                        <td>
                          <span
                            className={`${getStatusBadge(record.status)} rounded-pill px-3`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td className="text-end pe-4">
                          <button
                            className="btn-icon-circle edit"
                            title="Edit"
                            onClick={() => handleEdit(record)}
                          >
                            <i
                              className="bi bi-pencil-fill"
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                          </button>
                          <button
                            className="btn-icon-circle delete"
                            title="Delete"
                            onClick={() => handleDelete(record._id)}
                          >
                            <i
                              className="bi bi-trash-fill"
                              style={{ fontSize: "0.8rem" }}
                            ></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <PaginationControls
                currentPage={patientCurrentPage}
                totalPages={patientTotalPages}
                onPageChange={(page) => setPatientCurrentPage(page)}
                totalCount={patientTotalCount}
                pageSize={patientRowsPerPage}
                onPageSizeChange={(newSize) => {
                  setPatientRowsPerPage(newSize);
                  setPatientCurrentPage(1);
                }}
              />
            </>
          )}

          {/* === Medicine Issuance Table === */}
          {recordType === "medicineIssuance" && (
            <>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th
                      className="ps-4 th-sortable"
                      onClick={(e) => handleSort(e, "studentName")}
                    >
                      Student {getSortInfo("studentName")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "studentEmail")}
                    >
                      Email {getSortInfo("studentEmail")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "course")}
                    >
                      Course {getSortInfo("course")}
                    </th>
                    <th>Medicines</th>
                    <th>Diagnosis</th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "date")}
                    >
                      Date {getSortInfo("date")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "status")}
                    >
                      Status {getSortInfo("status")}
                    </th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const medList = record.medicines || [];
                      const totalQty = medList.reduce(
                        (s: number, m: any) => s + (m.quantity || 0),
                        0,
                      );
                      return (
                        <tr key={record._id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <img
                                src={getRecordAvatar(record)}
                                alt="avatar"
                                className="table-avatar me-3 shadow-sm"
                              />
                              <div>
                                <div className="fw-bold text-dark">
                                  {record.studentName}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="text-muted">{record.studentEmail}</td>

                          <td>
                            <div
                              className="fw-semibold"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {record.course}
                            </div>
                          </td>

                          <td>
                            <span className="badge bg-light text-dark border">
                              {medList.length} item
                              {medList.length !== 1 ? "s" : ""} ({totalQty} qty)
                            </span>
                          </td>

                          <td
                            className="text-truncate"
                            title={record.diagnosis}
                          >
                            {record.diagnosis || "-"}
                          </td>

                          <td>{record.date}</td>

                          <td>
                            <span
                              className={`${getStatusBadge(record.status)} rounded-pill px-3`}
                            >
                              {record.status}
                            </span>
                          </td>

                          <td className="text-end pe-4">
                            <button
                              className="btn-icon-circle edit"
                              title="Edit"
                              onClick={() => handleEdit(record)}
                            >
                              <i
                                className="bi bi-pencil-fill"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </button>
                            <button
                              className="btn-icon-circle delete"
                              title="Delete"
                              onClick={() => handleDelete(record._id)}
                            >
                              <i
                                className="bi bi-trash-fill"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <PaginationControls
                currentPage={patientCurrentPage}
                totalPages={patientTotalPages}
                onPageChange={(page) => setPatientCurrentPage(page)}
                totalCount={patientTotalCount}
                pageSize={patientRowsPerPage}
                onPageSizeChange={(newSize) => {
                  setPatientRowsPerPage(newSize);
                  setPatientCurrentPage(1);
                }}
              />
            </>
          )}

          {recordType === "laboratoryRequest" && (
            <>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th
                      className="ps-4 th-sortable"
                      onClick={(e) => handleSort(e, "studentName")}
                    >
                      Student {getSortInfo("studentName")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "name")}
                    >
                      Name {getSortInfo("name")}
                    </th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "issueDate")}
                    >
                      Issue Date {getSortInfo("issueDate")}
                    </th>
                    <th>Nurse on Duty</th>
                    <th>Tests</th>
                    <th
                      className="th-sortable"
                      onClick={(e) => handleSort(e, "status")}
                    >
                      Status {getSortInfo("status")}
                    </th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      // Count selected tests
                      let testCount = 0;
                      const categories = [
                        "routineUrinalysisTests",
                        "cbcTests",
                        "gramStain",
                        "bloodChemistry",
                        "papSmear",
                        "widhalTest",
                      ];
                      categories.forEach((cat) => {
                        const catData = record[cat];
                        if (catData && typeof catData === "object") {
                          Object.values(catData).forEach((v: any) => {
                            if (v === true) testCount++;
                          });
                        }
                      });
                      return (
                        <tr key={record._id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <img
                                src={getRecordAvatar(record)}
                                alt="avatar"
                                className="table-avatar me-3 shadow-sm"
                              />
                              <div>
                                <div className="fw-bold text-dark">
                                  {record.studentName}
                                </div>
                                <div className="text-muted small">
                                  {record.studentEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{record.name}</td>
                          <td>{record.issueDate}</td>
                          <td>{record.nurseOnDuty || "-"}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {testCount} test{testCount !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${getStatusBadge(record.status)} rounded-pill px-3`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <button
                              className="btn-icon-circle edit"
                              title="Edit"
                              onClick={() => handleEdit(record)}
                            >
                              <i
                                className="bi bi-pencil-fill"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </button>
                            <button
                              className="btn-icon-circle delete"
                              title="Delete"
                              onClick={() => handleDelete(record._id)}
                            >
                              <i
                                className="bi bi-trash-fill"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <PaginationControls
                currentPage={patientCurrentPage}
                totalPages={patientTotalPages}
                onPageChange={(page) => setPatientCurrentPage(page)}
                totalCount={patientTotalCount}
                pageSize={patientRowsPerPage}
                onPageSizeChange={(newSize) => {
                  setPatientRowsPerPage(newSize);
                  setPatientCurrentPage(1);
                }}
              />
            </>
          )}
        </div>
      )}

      {/* --- Edit Record Modal --- */}
      {showEditModal && editingRecord && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Edit/View Record</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>

              <div className="modal-body" id="printable-record">
                <div className="row g-3">
                  <div className="col-12 mb-3">
                    <span className="badge bg-secondary me-2">
                      Record ID: {editingRecord._id}
                    </span>
                    <span
                      className={`badge ${getStatusBadge(
                        editingRecord.status,
                      )} rounded-pill`}
                    >
                      {editingRecord.status}
                    </span>
                  </div>

                  {/* Physical Exam Fields */}
                  {recordType === "physicalExam" && (
                    <>
                      <div className="col-md-6">
                        <label>Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.name || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              name: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Gender</label>
                        <select
                          className="form-control"
                          value={editingRecord.gender || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              gender: e.target.value,
                            })
                          }
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>Course</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.course || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              course: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Year</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.year || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              year: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingRecord.date || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              date: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                    </>
                  )}

                  {/* Monitoring Fields */}
                  {recordType === "monitoring" && (
                    <>
                      <div className="col-md-6">
                        <label>Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.patientName || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              patientName: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Sex</label>
                        <select
                          className="form-control"
                          value={editingRecord.sex || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              sex: e.target.value,
                            })
                          }
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>Degree</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.degree || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              degree: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Student No</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.studentNo || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              studentNo: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Arrival</label>
                        <input
                          type="time"
                          className="form-control"
                          value={editingRecord.arrival || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              arrival: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Exit</label>
                        <input
                          type="time"
                          className="form-control"
                          value={editingRecord.exit || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              exit: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Symptoms</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.symptoms || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              symptoms: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Action</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.action || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              action: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Meds</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.meds || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              meds: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.duration || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              duration: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Personnel</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.personnel || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              personnel: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {/* Certificate Fields */}
                  {recordType === "certificate" && (
                    <>
                      <div className="col-md-6">
                        <label>Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.name || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              name: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Age</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editingRecord.age || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              age: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Sex</label>
                        <select
                          className="form-control"
                          value={editingRecord.sex || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              sex: e.target.value,
                            })
                          }
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>Civil Status</label>
                        <select
                          className="form-control"
                          value={editingRecord.civilStatus || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              civilStatus: e.target.value,
                            })
                          }
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>School</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.school || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              school: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>ID Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.idNumber || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              idNumber: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingRecord.date || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              date: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Diagnosis</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={editingRecord.diagnosis || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              diagnosis: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Remarks</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.remarks || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              remarks: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {/* Medicine Issuance Fields */}
                  {recordType === "medicineIssuance" && (
                    <>
                      <div className="col-md-6">
                        <label>Student Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.studentName || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Course</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.course || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingRecord.date || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Email</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.studentEmail || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-12">
                        <label>Medicines Requested</label>
                        <div className="table-responsive border rounded mt-1">
                          <table className="table table-sm mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>#</th>
                                <th>Medicine Name</th>
                                <th className="text-center">Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(editingRecord.medicines || []).map(
                                (med: any, idx: number) => (
                                  <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{med.name}</td>
                                    <td className="text-center">
                                      {med.quantity}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <label>Diagnosis</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Enter diagnosis..."
                          value={editingRecord.diagnosis || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              diagnosis: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {/* Laboratory Request Fields */}
                  {recordType === "laboratoryRequest" && (
                    <>
                      <div className="col-md-6">
                        <label>Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.name || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Issue Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingRecord.issueDate || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Student Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.studentName || ""}
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Nurse on Duty</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.nurseOnDuty || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              nurseOnDuty: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Test Categories */}
                      <div className="col-12 mt-3">
                        <label className="fw-bold mb-2">Test Categories</label>
                        <div className="row g-3">
                          {/* Routine/Urinalysis Tests */}
                          <div className="col-md-4">
                            <div className="p-3 bg-light rounded border">
                              <h6
                                className="fw-bold mb-2"
                                style={{ fontSize: "0.85rem" }}
                              >
                                Routine/Urinalysis Tests
                              </h6>
                              {[
                                { key: "pregnancy", label: "Pregnancy Test" },
                                { key: "fecalysis", label: "Fecalysis" },
                              ].map(({ key, label }) => (
                                <div className="form-check" key={key}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`edit-rut-${key}`}
                                    checked={
                                      editingRecord.routineUrinalysisTests?.[
                                        key
                                      ] || false
                                    }
                                    onChange={(e) =>
                                      setEditingRecord({
                                        ...editingRecord,
                                        routineUrinalysisTests: {
                                          ...editingRecord.routineUrinalysisTests,
                                          [key]: e.target.checked,
                                        },
                                      })
                                    }
                                  />
                                  <label
                                    className="form-check-label small"
                                    htmlFor={`edit-rut-${key}`}
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* CBC with Diff Count */}
                          <div className="col-md-4">
                            <div className="p-3 bg-light rounded border">
                              <h6
                                className="fw-bold mb-2"
                                style={{ fontSize: "0.85rem" }}
                              >
                                CBC with Diff Count
                              </h6>
                              {[
                                { key: "hemoglobin", label: "Hemoglobin" },
                                { key: "hematocrit", label: "Hematocrit" },
                                { key: "bloodSugar", label: "Blood Sugar" },
                                {
                                  key: "plateletCT",
                                  label: "Platelet CT/Wear",
                                },
                              ].map(({ key, label }) => (
                                <div className="form-check" key={key}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`edit-cbc-${key}`}
                                    checked={
                                      editingRecord.cbcTests?.[key] || false
                                    }
                                    onChange={(e) =>
                                      setEditingRecord({
                                        ...editingRecord,
                                        cbcTests: {
                                          ...editingRecord.cbcTests,
                                          [key]: e.target.checked,
                                        },
                                      })
                                    }
                                  />
                                  <label
                                    className="form-check-label small"
                                    htmlFor={`edit-cbc-${key}`}
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Gram Stain */}
                          <div className="col-md-4">
                            <div className="p-3 bg-light rounded border">
                              <h6
                                className="fw-bold mb-2"
                                style={{ fontSize: "0.85rem" }}
                              >
                                Gram Stain
                              </h6>
                              {[
                                { key: "hpsBhTest", label: "HPS/BH Test" },
                                { key: "vaginalSmear", label: "Vaginal Smear" },
                              ].map(({ key, label }) => (
                                <div className="form-check" key={key}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`edit-gs-${key}`}
                                    checked={
                                      editingRecord.gramStain?.[key] || false
                                    }
                                    onChange={(e) =>
                                      setEditingRecord({
                                        ...editingRecord,
                                        gramStain: {
                                          ...editingRecord.gramStain,
                                          [key]: e.target.checked,
                                        },
                                      })
                                    }
                                  />
                                  <label
                                    className="form-check-label small"
                                    htmlFor={`edit-gs-${key}`}
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Blood Chemistry */}
                          <div className="col-md-4">
                            <div className="p-3 bg-light rounded border">
                              <h6
                                className="fw-bold mb-2"
                                style={{ fontSize: "0.85rem" }}
                              >
                                Blood Chemistry
                              </h6>
                              {[
                                { key: "fbs", label: "FBS" },
                                { key: "uricAcid", label: "Uric Acid" },
                                {
                                  key: "cholesterol",
                                  label: "Total Cholesterol",
                                },
                                { key: "hdl", label: "HDL/LDL Profile" },
                                { key: "tsh", label: "TSH" },
                                { key: "totalProtein", label: "Total Protein" },
                              ].map(({ key, label }) => (
                                <div className="form-check" key={key}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`edit-bc-${key}`}
                                    checked={
                                      editingRecord.bloodChemistry?.[key] ||
                                      false
                                    }
                                    onChange={(e) =>
                                      setEditingRecord({
                                        ...editingRecord,
                                        bloodChemistry: {
                                          ...editingRecord.bloodChemistry,
                                          [key]: e.target.checked,
                                        },
                                      })
                                    }
                                  />
                                  <label
                                    className="form-check-label small"
                                    htmlFor={`edit-bc-${key}`}
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Pap Smear */}
                          <div className="col-md-4">
                            <div className="p-3 bg-light rounded border">
                              <h6
                                className="fw-bold mb-2"
                                style={{ fontSize: "0.85rem" }}
                              >
                                Pap Smear
                              </h6>
                              {[
                                {
                                  key: "cxrInterpretation",
                                  label: "CXR Interpretation",
                                },
                                {
                                  key: "ecgInterpretation",
                                  label: "ECG Interpretation",
                                },
                              ].map(({ key, label }) => (
                                <div className="form-check" key={key}>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`edit-ps-${key}`}
                                    checked={
                                      editingRecord.papSmear?.[key] || false
                                    }
                                    onChange={(e) =>
                                      setEditingRecord({
                                        ...editingRecord,
                                        papSmear: {
                                          ...editingRecord.papSmear,
                                          [key]: e.target.checked,
                                        },
                                      })
                                    }
                                  />
                                  <label
                                    className="form-check-label small"
                                    htmlFor={`edit-ps-${key}`}
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Widhal Test */}
                          <div className="col-md-4">
                            <div className="p-3 bg-light rounded border">
                              <h6
                                className="fw-bold mb-2"
                                style={{ fontSize: "0.85rem" }}
                              >
                                Widhal Test
                              </h6>
                              {[{ key: "salmonella", label: "Salmonella" }].map(
                                ({ key, label }) => (
                                  <div className="form-check" key={key}>
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`edit-wt-${key}`}
                                      checked={
                                        editingRecord.widhalTest?.[key] || false
                                      }
                                      onChange={(e) =>
                                        setEditingRecord({
                                          ...editingRecord,
                                          widhalTest: {
                                            ...editingRecord.widhalTest,
                                            [key]: e.target.checked,
                                          },
                                        })
                                      }
                                    />
                                    <label
                                      className="form-check-label small"
                                      htmlFor={`edit-wt-${key}`}
                                    >
                                      {label}
                                    </label>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-12 mt-3">
                        <label>Others</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="Enter other tests or notes..."
                          value={editingRecord.others || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              others: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="col-md-12">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={editingRecord.status || "pending"}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          status: e.target.value as any,
                        })
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer with Print Button */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-info me-auto"
                  onClick={handlePrint}
                  title="Print this record as a formal document"
                >
                  <i className="bi bi-printer me-2"></i>Print Record
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSaveEdit}
                >
                  <i className="bi bi-save me-2"></i>Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordsView;
