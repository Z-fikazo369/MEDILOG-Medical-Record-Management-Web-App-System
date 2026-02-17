import React, { useState, useEffect } from "react";

type ViewType =
  | "dashboard"
  | "patientRecords"
  | "accounts"
  | "staffAccounts"
  | "pharmacy"
  | "backup"
  | "aiAssistant";

type RecordType =
  | "physicalExam"
  | "monitoring"
  | "certificate"
  | "medicineIssuance"
  | "laboratoryRequest";

interface AdminSidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  setRecordType: (type: RecordType) => void;
  pendingCount: number;
  staffPendingCount: number;
  recordPendingCounts: Record<string, number>;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: "student" | "admin" | "staff";
  userPosition?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  view,
  setView,
  setRecordType,
  pendingCount,
  staffPendingCount,
  recordPendingCounts,
  onLogout,
  collapsed,
  onToggleCollapse,
  userRole,
  userPosition,
}) => {
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const isRecordsActive = view === "patientRecords";

  // Determine if this user has limited access (Nurse, Nurse Attendant, Administrative Aide)
  const isLimitedStaff =
    userRole === "staff" && userPosition !== "Head Director";

  useEffect(() => {
    if (isRecordsActive) {
      setIsRecordsOpen(true);
    }
  }, [view, isRecordsActive]);

  return (
    <div className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div
        className="d-flex align-items-center justify-content-center mb-5 gap-2"
        style={{ marginRight: collapsed ? "0" : "10px" }}
      >
        <div style={{ width: "50px", height: "50px", flexShrink: 0 }}>
          <svg
            width="50"
            height="50"
            viewBox="0 0 70 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="70" height="70" fill="white" rx="8" />
            <path d="M70 0L70 22L48 0L70 0Z" fill="#2c5f2d" />
            <rect x="31" y="20" width="8" height="30" rx="2" fill="#2c5f2d" />
            <rect x="20" y="31" width="30" height="8" rx="2" fill="#2c5f2d" />
          </svg>
        </div>
        {!collapsed && (
          <h5
            className="mb-0 fw-bold"
            style={{ letterSpacing: "0.5px", fontSize: "15px" }}
          >
            MEDILOG
          </h5>
        )}
      </div>

      <ul className="nav flex-column sidebar-nav-list">
        <li className="nav-item">
          <label
            onClick={() => setView("dashboard")}
            className={`nav-link ${view === "dashboard" ? "active" : ""}`}
            title="Dashboard"
          >
            <i className="bi bi-grid-1x2"></i> {!collapsed && "Dashboard"}
          </label>
        </li>

        {!isLimitedStaff && (
          <li className="nav-item">
            <label
              onClick={() => setView("accounts")}
              className={`nav-link ${view === "accounts" ? "active" : ""}`}
              title="Student Accounts"
            >
              <i className="bi bi-people"></i>{" "}
              {!collapsed && "Student Accounts"}
              {!collapsed && pendingCount > 0 && (
                <span className="badge bg-white text-success ms-auto rounded-pill">
                  {pendingCount}
                </span>
              )}
              {collapsed && pendingCount > 0 && (
                <span className="sidebar-badge-dot"></span>
              )}
            </label>
          </li>
        )}

        {!isLimitedStaff && (
          <li className="nav-item">
            <label
              onClick={() => setView("staffAccounts")}
              className={`nav-link ${view === "staffAccounts" ? "active" : ""}`}
              style={{ cursor: "pointer" }}
              title="Staff Accounts"
            >
              <i className="bi bi-person-badge"></i>{" "}
              {!collapsed && "Staff Accounts"}
              {!collapsed && staffPendingCount > 0 && (
                <span className="badge bg-white text-success ms-auto rounded-pill">
                  {staffPendingCount}
                </span>
              )}
              {collapsed && staffPendingCount > 0 && (
                <span className="sidebar-badge-dot"></span>
              )}
            </label>
          </li>
        )}

        <li className="nav-item">
          <label
            onClick={() => setView("pharmacy")}
            className={`nav-link ${view === "pharmacy" ? "active" : ""}`}
            style={{ cursor: "pointer" }}
            title="Pharmacy Inventory"
          >
            <i className="bi bi-capsule"></i>{" "}
            {!collapsed && "Pharmacy Inventory"}
          </label>
        </li>

        {collapsed ? (
          <li className="nav-item">
            <label
              onClick={() => {
                setView("patientRecords");
                setRecordType("physicalExam");
              }}
              className={`nav-link ${view === "patientRecords" ? "active" : ""}`}
              style={{ cursor: "pointer" }}
              title="Records"
            >
              <i className="bi bi-file-earmark-medical"></i>
              {(recordPendingCounts.total || 0) > 0 && (
                <span className="sidebar-badge-dot"></span>
              )}
            </label>
          </li>
        ) : (
          <li className="nav-item">
            <label
              onClick={() => setIsRecordsOpen(!isRecordsOpen)}
              className={`nav-link d-flex justify-content-between align-items-center ${isRecordsActive ? "active" : ""}`}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="bi bi-file-earmark-medical"></i> Records
              </span>
              <span className="d-flex align-items-center gap-2">
                {(recordPendingCounts.total || 0) > 0 && (
                  <span
                    className="badge bg-white text-success rounded-pill"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {recordPendingCounts.total}
                  </span>
                )}
                <i
                  className={`bi bi-chevron-${isRecordsOpen ? "down" : "right"}`}
                  style={{ fontSize: "0.75rem" }}
                ></i>
              </span>
            </label>

            {isRecordsOpen && (
              <ul
                className="nav flex-column ms-3 mt-1 border-start border-2 ps-2"
                style={{ borderColor: "rgba(255,255,255,0.2) !important" }}
              >
                <li className="nav-item">
                  <a
                    className="nav-link py-1 text-white-50"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView("patientRecords");
                      setRecordType("physicalExam");
                    }}
                    style={{ fontSize: "0.9rem" }}
                  >
                    Physical Exam
                    {(recordPendingCounts.physicalExam || 0) > 0 && (
                      <span
                        className="badge bg-warning text-dark ms-auto rounded-pill"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {recordPendingCounts.physicalExam}
                      </span>
                    )}
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link py-1 text-white-50"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView("patientRecords");
                      setRecordType("monitoring");
                    }}
                    style={{ fontSize: "0.9rem" }}
                  >
                    Monitoring
                    {(recordPendingCounts.monitoring || 0) > 0 && (
                      <span
                        className="badge bg-warning text-dark ms-auto rounded-pill"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {recordPendingCounts.monitoring}
                      </span>
                    )}
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link py-1 text-white-50"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView("patientRecords");
                      setRecordType("certificate");
                    }}
                    style={{ fontSize: "0.9rem" }}
                  >
                    Certificate
                    {(recordPendingCounts.certificate || 0) > 0 && (
                      <span
                        className="badge bg-warning text-dark ms-auto rounded-pill"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {recordPendingCounts.certificate}
                      </span>
                    )}
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link py-1 text-white-50"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView("patientRecords");
                      setRecordType("medicineIssuance");
                    }}
                    style={{ fontSize: "0.9rem" }}
                  >
                    Medicine Issuance
                    {(recordPendingCounts.medicineIssuance || 0) > 0 && (
                      <span
                        className="badge bg-warning text-dark ms-auto rounded-pill"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {recordPendingCounts.medicineIssuance}
                      </span>
                    )}
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link py-1 text-white-50"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView("patientRecords");
                      setRecordType("laboratoryRequest");
                    }}
                    style={{ fontSize: "0.9rem" }}
                  >
                    Laboratory Request
                    {(recordPendingCounts.laboratoryRequest || 0) > 0 && (
                      <span
                        className="badge bg-warning text-dark ms-auto rounded-pill"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {recordPendingCounts.laboratoryRequest}
                      </span>
                    )}
                  </a>
                </li>
              </ul>
            )}
          </li>
        )}

        {!isLimitedStaff && (
          <li className="nav-item">
            <label
              onClick={() => setView("backup")}
              className={`nav-link ${view === "backup" ? "active" : ""}`}
              style={{ cursor: "pointer" }}
              title="Backup"
            >
              <i className="bi bi-cloud-arrow-up"></i> {!collapsed && "Backup"}
            </label>
          </li>
        )}

        <li className="nav-item">
          <label
            onClick={() => setView("aiAssistant")}
            className={`nav-link ${view === "aiAssistant" ? "active" : ""}`}
            style={{ cursor: "pointer" }}
            title="AI Assistant"
          >
            <i className="bi bi-robot"></i> {!collapsed && "AI Assistant"}
          </label>
        </li>

        <li className="nav-item mt-auto">
          <a href="#" onClick={onLogout} className="nav-link" title="Logout">
            <i className="bi bi-box-arrow-right"></i> {!collapsed && "Logout"}
          </a>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
