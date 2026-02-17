import React, { useState } from "react";
import type {
  NewStudentData,
  MonitoringData,
  CertificateData,
  MedicineIssuanceData,
  LaboratoryRequestData,
  HistoryType,
} from "./studentTypes";
import StudentRecordViewModal from "./StudentRecordViewModal";

interface StudentHistoryViewProps {
  newStudentHistory: NewStudentData[];
  monitoringHistory: MonitoringData[];
  certificateHistory: CertificateData[];
  medicineIssuanceHistory: MedicineIssuanceData[];
  laboratoryRequestHistory: LaboratoryRequestData[];
}

const StudentHistoryView: React.FC<StudentHistoryViewProps> = ({
  newStudentHistory,
  monitoringHistory,
  certificateHistory,
  medicineIssuanceHistory,
  laboratoryRequestHistory,
}) => {
  const [activeHistoryType, setActiveHistoryType] =
    useState<HistoryType>("physicalExam");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [viewingRecord, setViewingRecord] = useState<
    | NewStudentData
    | MonitoringData
    | CertificateData
    | MedicineIssuanceData
    | LaboratoryRequestData
    | null
  >(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleHistoryTypeChange = (type: HistoryType) => {
    setActiveHistoryType(type);
    setCurrentPage(1);
  };

  const openViewModal = (
    entry:
      | NewStudentData
      | MonitoringData
      | CertificateData
      | MedicineIssuanceData
      | LaboratoryRequestData,
  ) => {
    setViewingRecord(entry);
    setShowViewModal(true);
  };

  // Determine active data and title
  let activeHistoryData: (
    | NewStudentData
    | MonitoringData
    | CertificateData
    | MedicineIssuanceData
    | LaboratoryRequestData
  )[] = [];
  let activeTitle = "";

  switch (activeHistoryType) {
    case "physicalExam":
      activeHistoryData = newStudentHistory;
      activeTitle = "Physical Examination";
      break;
    case "monitoring":
      activeHistoryData = monitoringHistory;
      activeTitle = "Medical Monitoring";
      break;
    case "certificate":
      activeHistoryData = certificateHistory;
      activeTitle = "Medical Certificate";
      break;
    case "medicineIssuance":
      activeHistoryData = medicineIssuanceHistory;
      activeTitle = "Medicine Issuance";
      break;
    case "laboratoryRequest":
      activeHistoryData = laboratoryRequestHistory;
      activeTitle = "Laboratory Request";
      break;
  }

  // Pagination Calculations
  const totalItems = activeHistoryData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedItems = activeHistoryData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const renderRow = (entry: any, index: number) => {
    const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;

    switch (activeHistoryType) {
      case "physicalExam": {
        const pe = entry as NewStudentData;
        return (
          <div key={pe._id || index} className="isu-row">
            <div className="isu-col index">{globalIndex}.</div>
            <div className="isu-col main">
              <div className="isu-title fw-semibold">{pe.name}</div>
              <div className="isu-meta">
                {pe.gender} &nbsp;|&nbsp; {pe.course} &nbsp;|&nbsp; {pe.year}
              </div>
              <div className="isu-date text-muted small">{pe.date}</div>
            </div>
            <div className="isu-col status d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-success"
                title="View full record"
                onClick={() => openViewModal(pe)}
              >
                <i className="bi bi-eye"></i>
              </button>
              <span
                className={`badge px-3 py-2 ${
                  pe.status === "approved"
                    ? "bg-success"
                    : pe.status === "rejected"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                }`}
              >
                {pe.status || "pending"}
              </span>
            </div>
          </div>
        );
      }
      case "monitoring": {
        const mon = entry as MonitoringData;
        return (
          <div key={mon._id || index} className="isu-row">
            <div className="isu-col index">{globalIndex}.</div>
            <div className="isu-col main">
              <div className="isu-title fw-semibold">{mon.patientName}</div>
              <div className="isu-meta">
                {mon.sex} &nbsp;|&nbsp; {mon.degree} &nbsp;|&nbsp; Student No:{" "}
                {mon.studentNo}
              </div>
              <div className="isu-date text-muted small">
                Arrival: {mon.arrival} — Symptoms: {mon.symptoms} — Action:{" "}
                {mon.action}
              </div>
            </div>
            <div className="isu-col status d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-success"
                title="View full record"
                onClick={() => openViewModal(mon)}
              >
                <i className="bi bi-eye"></i>
              </button>
              <span
                className={`badge px-3 py-2 ${
                  mon.status === "approved"
                    ? "bg-success"
                    : mon.status === "rejected"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                }`}
              >
                {mon.status || "pending"}
              </span>
            </div>
          </div>
        );
      }
      case "certificate": {
        const cert = entry as CertificateData;
        return (
          <div key={cert._id || index} className="isu-row">
            <div className="isu-col index">{globalIndex}.</div>
            <div className="isu-col main">
              <div className="isu-title fw-semibold">{cert.name}</div>
              <div className="isu-meta">
                {cert.sex} &nbsp;|&nbsp; {cert.civilStatus} &nbsp;|&nbsp;{" "}
                {cert.school}
              </div>
              <div className="isu-date text-muted small">
                ID: {cert.idNumber} — Date: {cert.date}
              </div>

              {cert.status === "approved" &&
                (cert.diagnosis || cert.remarks) && (
                  <div className="isu-admin-notes mt-2">
                    {cert.diagnosis && (
                      <div>
                        <strong>Diagnosis:</strong> {cert.diagnosis}
                      </div>
                    )}
                    {cert.remarks && (
                      <div>
                        <strong>Remarks:</strong> {cert.remarks}
                      </div>
                    )}
                  </div>
                )}
            </div>
            <div className="isu-col status d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-success"
                title="View full record"
                onClick={() => openViewModal(cert)}
              >
                <i className="bi bi-eye"></i>
              </button>
              <span
                className={`badge px-3 py-2 ${
                  cert.status === "approved"
                    ? "bg-success"
                    : cert.status === "rejected"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                }`}
              >
                {cert.status || "pending"}
              </span>
            </div>
          </div>
        );
      }
      case "medicineIssuance": {
        const mi = entry as MedicineIssuanceData;
        const medCount = mi.medicines?.length || 0;
        const totalQty = mi.medicines?.reduce((s, m) => s + m.quantity, 0) || 0;
        return (
          <div key={mi._id || index} className="isu-row">
            <div className="isu-col index">{globalIndex}.</div>
            <div className="isu-col main">
              <div className="isu-title fw-semibold">
                {medCount} medicine{medCount !== 1 ? "s" : ""} — {totalQty}{" "}
                total qty
              </div>
              <div className="isu-meta">
                {mi.course} &nbsp;|&nbsp; Date: {mi.date}
              </div>
              {mi.diagnosis && (
                <div className="isu-date text-muted small">
                  Diagnosis: {mi.diagnosis}
                </div>
              )}
            </div>
            <div className="isu-col status d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-success"
                title="View full record"
                onClick={() => openViewModal(mi)}
              >
                <i className="bi bi-eye"></i>
              </button>
              <span
                className={`badge px-3 py-2 ${
                  mi.status === "approved"
                    ? "bg-success"
                    : mi.status === "rejected"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                }`}
              >
                {mi.status || "pending"}
              </span>
            </div>
          </div>
        );
      }
      case "laboratoryRequest": {
        const lr = entry as LaboratoryRequestData;
        return (
          <div key={lr._id || index} className="isu-row">
            <div className="isu-col index">{globalIndex}.</div>
            <div className="isu-col main">
              <div className="isu-title fw-semibold">{lr.name}</div>
              <div className="isu-meta">Issue Date: {lr.issueDate}</div>
              {lr.nurseOnDuty && (
                <div className="isu-date text-muted small">
                  Nurse: {lr.nurseOnDuty}
                </div>
              )}
            </div>
            <div className="isu-col status d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-success"
                title="View full record"
                onClick={() => openViewModal(lr)}
              >
                <i className="bi bi-eye"></i>
              </button>
              <span
                className={`badge px-3 py-2 ${
                  lr.status === "approved"
                    ? "bg-success"
                    : lr.status === "rejected"
                      ? "bg-danger"
                      : "bg-warning text-dark"
                }`}
              >
                {lr.status || "pending"}
              </span>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <nav aria-label="Page navigation" className="mt-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <label
              htmlFor="rowsPerPageStudent"
              className="text-muted small mb-0"
            >
              Rows per page:
            </label>
            <select
              id="rowsPerPageStudent"
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>

          <ul className="pagination justify-content-end mb-0">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </div>
      </nav>
    );
  };

  return (
    <div className="section visitHistory" style={{ display: "block" }}>
      {/* Dropdown Filter */}
      <div className="d-flex justify-content-end align-items-center mb-3">
        <div className="history-filter-dropdown">
          <div className="dropdown">
            <button
              className="btn dropdown-toggle"
              type="button"
              id="historyDropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {activeTitle}
            </button>
            <ul
              className="dropdown-menu dropdown-menu-end"
              aria-labelledby="historyDropdownMenuButton"
            >
              <li>
                <a
                  className={`dropdown-item ${
                    activeHistoryType === "physicalExam" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHistoryTypeChange("physicalExam");
                  }}
                >
                  Physical Examination
                </a>
              </li>
              <li>
                <a
                  className={`dropdown-item ${
                    activeHistoryType === "monitoring" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHistoryTypeChange("monitoring");
                  }}
                >
                  Medical Monitoring
                </a>
              </li>
              <li>
                <a
                  className={`dropdown-item ${
                    activeHistoryType === "certificate" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHistoryTypeChange("certificate");
                  }}
                >
                  Medical Certificate
                </a>
              </li>
              <li>
                <a
                  className={`dropdown-item ${
                    activeHistoryType === "medicineIssuance" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHistoryTypeChange("medicineIssuance");
                  }}
                >
                  Medicine Issuance
                </a>
              </li>
              <li>
                <a
                  className={`dropdown-item ${
                    activeHistoryType === "laboratoryRequest" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleHistoryTypeChange("laboratoryRequest");
                  }}
                >
                  Laboratory Request
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* History Table Card */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-success text-white fw-bold">
          {activeTitle} History
        </div>
        <div className="card-body">
          {paginatedItems.length === 0 ? (
            <p className="text-muted text-center py-3">
              No records found for this type.
            </p>
          ) : (
            <div className="isu-style-table">
              {paginatedItems.map((entry, index) => renderRow(entry, index))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {renderPagination()}

      {/* View Record Modal */}
      <StudentRecordViewModal
        show={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingRecord(null);
        }}
        record={viewingRecord}
        recordType={activeHistoryType}
      />
    </div>
  );
};

export default StudentHistoryView;
