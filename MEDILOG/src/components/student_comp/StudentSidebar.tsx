import React, { useState, useEffect } from "react";
import type { StudentView } from "./studentTypes";

interface StudentSidebarProps {
  activeView: StudentView;
  setActiveView: (view: StudentView) => void;
  unreadCount: number;
  onNotificationsClick: () => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeView,
  setActiveView,
  unreadCount,
  onNotificationsClick,
  onLogout,
  collapsed,
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
      className={`sidebar p-3 d-flex flex-column ${collapsed ? "sidebar-collapsed" : ""}`}
      style={{ minHeight: "100vh" }}
    >
      {/* Logo */}
      <div className="d-flex align-items-center justify-content-center mb-4 gap-2">
        <div style={{ width: "40px", height: "40px", flexShrink: 0 }}>
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
        {!collapsed && <h4 className="mb-0 fw-bold">MEDILOG</h4>}
      </div>

      <hr className="border-white opacity-25 mb-4" />

      <ul className="nav flex-column gap-2">
        {/* Home */}
        <li className="nav-item">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveView("landing");
            }}
            className={`nav-link ${activeView === "landing" ? "active-link" : ""}`}
          >
            <i className="bi bi-house me-2"></i> {!collapsed && "Home"}
          </a>
        </li>

        {/* Online Form Dropdown */}
        <li className="nav-item">
          <div
            onClick={() =>
              !collapsed && setIsFormDropdownOpen(!isFormDropdownOpen)
            }
            className={`nav-link d-flex justify-content-between align-items-center ${
              isFormActive ? "active-link" : ""
            }`}
            style={{ cursor: "pointer", transition: "all 0.2s" }}
          >
            <span>
              <i className="bi bi-file-text me-2"></i>{" "}
              {!collapsed && "Online Form"}
            </span>
            {!collapsed && (
              <i
                className={`bi bi-chevron-${isFormDropdownOpen ? "down" : "right"}`}
              ></i>
            )}
          </div>

          {/* Sub-menu items */}
          {isFormDropdownOpen && !collapsed && (
            <ul className="nav flex-column form-submenu">
              <li className="nav-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveView("newStudent");
                  }}
                  className={`nav-link form-submenu-item py-1 ${activeView === "newStudent" ? "form-submenu-active" : ""}`}
                >
                  <i className="bi bi-person-vcard me-2"></i>
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
                  className={`nav-link form-submenu-item py-1 ${activeView === "monitoring" ? "form-submenu-active" : ""}`}
                >
                  <i className="bi bi-heart-pulse me-2"></i>
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
                  className={`nav-link form-submenu-item py-1 ${activeView === "certificate" ? "form-submenu-active" : ""}`}
                >
                  <i className="bi bi-file-earmark-medical me-2"></i>
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
                  className={`nav-link form-submenu-item py-1 ${activeView === "medicineIssuance" ? "form-submenu-active" : ""}`}
                >
                  <i className="bi bi-capsule me-2"></i>
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
                  className={`nav-link form-submenu-item py-1 ${activeView === "laboratoryRequest" ? "form-submenu-active" : ""}`}
                >
                  <i className="bi bi-clipboard2-pulse me-2"></i>
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
            <i className="bi bi-clock-history me-2"></i>{" "}
            {!collapsed && "History"}
          </a>
        </li>

        <hr className="sidebar-separator" />

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
            <i className="bi bi-bell me-2"></i> {!collapsed && "Notifications"}
            {unreadCount > 0 && (
              <span className="badge bg-danger ms-2">{unreadCount}</span>
            )}
          </a>
        </li>
      </ul>

      {/* Logout */}
      <div className="mt-auto">
        <hr className="sidebar-separator" />
        <a href="#" onClick={onLogout} className="nav-link text-danger">
          <i className="bi bi-box-arrow-right me-2"></i>{" "}
          {!collapsed && "Logout"}
        </a>
      </div>
    </div>
  );
};

export default StudentSidebar;
