import React, { useState, useEffect } from "react";
import type { StudentView } from "./studentTypes";

interface StudentSidebarProps {
  activeView: StudentView;
  setActiveView: (view: StudentView) => void;
  unreadCount: number;
  onNotificationsClick: () => void;
  onLogout: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeView,
  setActiveView,
  unreadCount,
  onNotificationsClick,
  onLogout,
}) => {
  // State para sa dropdown toggle
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);

  // Check kung nasa loob tayo ng form sub-menus
  const isFormActive = [
    "formOptions",
    "newStudent",
    "monitoring",
    "certificate",
    "medicineIssuance",
    "laboratoryRequest",
  ].includes(activeView);

  // Auto-open ang dropdown kapag nasa form view
  useEffect(() => {
    if (isFormActive) {
      setIsFormDropdownOpen(true);
    }
  }, [activeView, isFormActive]);

  return (
    <div
      className="sidebar p-3 d-flex flex-column"
      style={{ minHeight: "100vh" }}
    >
      {/* Logo */}
      <div className="d-flex align-items-center justify-content-center mb-4 gap-2">
        <div style={{ width: "40px", height: "40px" }}>
          <svg
            width="40"
            height="40"
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
        <h4 className="mb-0 fw-bold">MEDILOG</h4>
      </div>

      <hr className="border-white opacity-25 mb-4" />

      <ul className="nav flex-column gap-2">
        {/* Dashboard */}
        <li className="nav-item">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveView("landing");
            }}
            className={`nav-link ${activeView === "landing" ? "active-link" : ""}`}
          >
            <i className="bi bi-grid me-2"></i> Dashboard
          </a>
        </li>

        {/* Online Form Dropdown */}
        <li className="nav-item">
          <div
            onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)}
            className={`nav-link d-flex justify-content-between align-items-center ${
              isFormActive ? "active-link" : ""
            }`}
            style={{ cursor: "pointer", transition: "all 0.2s" }}
          >
            <span>
              <i className="bi bi-file-text me-2"></i> Online Form
            </span>
            <i
              className={`bi bi-chevron-${isFormDropdownOpen ? "down" : "right"}`}
            ></i>
          </div>

          {/* Sub-menu items */}
          {isFormDropdownOpen && (
            <ul className="nav flex-column ms-3 mt-2 border-start border-2 ps-2">
              <li className="nav-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView("newStudent");
                  }}
                  className={`nav-link py-1 ${activeView === "newStudent" ? "fw-bold text-success" : "text-muted"}`}
                >
                  Physical Examination
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView("monitoring");
                  }}
                  className={`nav-link py-1 ${activeView === "monitoring" ? "fw-bold text-success" : "text-muted"}`}
                >
                  Medical Monitoring
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView("certificate");
                  }}
                  className={`nav-link py-1 ${activeView === "certificate" ? "fw-bold text-success" : "text-muted"}`}
                >
                  Medical Certificate
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView("medicineIssuance");
                  }}
                  className={`nav-link py-1 ${activeView === "medicineIssuance" ? "fw-bold text-success" : "text-muted"}`}
                >
                  Medicine Issuance
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView("laboratoryRequest");
                  }}
                  className={`nav-link py-1 ${activeView === "laboratoryRequest" ? "fw-bold text-success" : "text-muted"}`}
                >
                  Laboratory Request
                </a>
              </li>
            </ul>
          )}
        </li>

        {/* History */}
        <li className="nav-item">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveView("history");
            }}
            className={`nav-link ${activeView === "history" ? "active-link" : ""}`}
          >
            <i className="bi bi-clock-history me-2"></i> History
          </a>
        </li>

        {/* Notifications */}
        <li className="nav-item">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNotificationsClick();
            }}
            className={`nav-link ${activeView === "notifications" ? "active-link" : ""}`}
          >
            <i className="bi bi-bell me-2"></i> Notifications
            {unreadCount > 0 && (
              <span className="badge bg-danger ms-2">{unreadCount}</span>
            )}
          </a>
        </li>
      </ul>

      {/* Logout */}
      <div className="mt-auto">
        <a href="#" onClick={onLogout} className="nav-link text-danger">
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </a>
      </div>
    </div>
  );
};

export default StudentSidebar;
