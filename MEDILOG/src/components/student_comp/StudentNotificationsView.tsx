import React, { useState } from "react";
import type { Notification } from "./studentTypes";

interface StudentNotificationsViewProps {
  notifications: Notification[];
}

const getRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getNotifIcon = (recordType: string) => {
  switch (recordType) {
    case "physicalExam":
      return {
        icon: "bi-person-vcard",
        color: "#10b981",
        bg: "rgba(16,185,129,0.1)",
      };
    case "monitoring":
      return {
        icon: "bi-heart-pulse",
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.1)",
      };
    case "certificate":
      return {
        icon: "bi-file-earmark-medical",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.1)",
      };
    case "medicineIssuance":
      return {
        icon: "bi-capsule",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
      };
    case "laboratoryRequest":
      return {
        icon: "bi-clipboard2-pulse",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.1)",
      };
    default:
      return { icon: "bi-bell", color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  }
};

const StudentNotificationsView: React.FC<StudentNotificationsViewProps> = ({
  notifications,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const totalItems = notifications.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedNotifs = notifications.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="section notificationsPage" style={{ display: "block" }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(44, 95, 45, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className="bi bi-bell"
              style={{ fontSize: "1.15rem", color: "#2c5f2d" }}
            ></i>
          </div>
          <div>
            <h6
              className="mb-0 fw-bold"
              style={{ fontSize: "1rem", color: "#1e293b" }}
            >
              Notifications
            </h6>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up"}
            </span>
          </div>
        </div>
        <span
          className="badge"
          style={{
            background: unreadCount > 0 ? "#2c5f2d" : "#e2e8f0",
            color: unreadCount > 0 ? "#fff" : "#64748b",
            fontSize: "0.7rem",
            padding: "5px 10px",
            borderRadius: 20,
          }}
        >
          {totalItems} total
        </span>
      </div>

      {/* Card body */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e8eaed",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {notifications.length === 0 ? (
          <div className="text-center py-5">
            <i
              className="bi bi-bell-slash"
              style={{ fontSize: "2.5rem", color: "#cbd5e1" }}
            ></i>
            <p
              className="mt-2 mb-0"
              style={{ color: "#94a3b8", fontSize: "0.85rem" }}
            >
              No notifications yet
            </p>
          </div>
        ) : (
          <>
            <div className="notif-modern-list">
              {paginatedNotifs.map((notif, idx) => {
                const iconInfo = getNotifIcon(notif.recordType);
                return (
                  <div
                    key={notif._id}
                    className={`notif-modern-item${!notif.isRead ? " notif-unread" : ""}`}
                    style={{
                      borderBottom:
                        idx < paginatedNotifs.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="notif-unread-dot"></span>
                    )}
                    {/* Icon */}
                    <div
                      className="notif-modern-icon"
                      style={{ background: iconInfo.bg }}
                    >
                      <i
                        className={`bi ${iconInfo.icon}`}
                        style={{ color: iconInfo.color, fontSize: "1.1rem" }}
                      ></i>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="mb-0"
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: !notif.isRead ? 600 : 400,
                          color: "#1e293b",
                          lineHeight: 1.45,
                        }}
                      >
                        {notif.message}
                      </p>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#94a3b8",
                          marginTop: 2,
                          display: "block",
                        }}
                      >
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    {/* Record type badge */}
                    <span
                      className="notif-type-badge"
                      style={{ background: iconInfo.bg, color: iconInfo.color }}
                    >
                      {notif.recordType === "physicalExam"
                        ? "Physical Exam"
                        : notif.recordType === "monitoring"
                          ? "Monitoring"
                          : notif.recordType === "certificate"
                            ? "Certificate"
                            : notif.recordType === "medicineIssuance"
                              ? "Medicine"
                              : notif.recordType === "laboratoryRequest"
                                ? "Lab Request"
                                : "General"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2"
                style={{
                  borderTop: "1px solid #f1f5f9",
                  background: "#fafbfc",
                  fontSize: "0.75rem",
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span style={{ color: "#94a3b8" }}>Show</span>
                  <select
                    className="form-select form-select-sm"
                    style={{
                      width: 58,
                      fontSize: "0.73rem",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      padding: "3px 8px",
                    }}
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
                  <span style={{ color: "#94a3b8" }}>of {totalItems}</span>
                </div>

                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm"
                    style={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: currentPage === 1 ? "#f8fafc" : "#fff",
                      color: currentPage === 1 ? "#cbd5e1" : "#475569",
                      padding: "3px 10px",
                      fontSize: "0.73rem",
                    }}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <span
                    style={{
                      padding: "3px 10px",
                      color: "#64748b",
                      fontSize: "0.73rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background:
                        currentPage === totalPages ? "#f8fafc" : "#fff",
                      color: currentPage === totalPages ? "#cbd5e1" : "#475569",
                      padding: "3px 10px",
                      fontSize: "0.73rem",
                    }}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentNotificationsView;
