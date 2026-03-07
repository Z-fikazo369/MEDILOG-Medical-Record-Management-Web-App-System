import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../../services/api";

interface ActivityLog {
  _id: string;
  adminId: string;
  adminEmail: string;
  adminUsername: string;
  action: string;
  actionDetails: {
    details?: string;
    userName?: string;
    userId?: string;
    changes?: Record<string, unknown>;
    [key: string]: unknown;
  };
  ipAddress: string;
  status: string;
  createdAt: string;
}

interface StaffSummary {
  _id: string;
  username: string;
  email: string;
  totalActions: number;
  lastActivity: string;
  actionBreakdown: Record<string, number>;
  profilePictureUrl?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  LOGIN: {
    label: "Login",
    icon: "bi-box-arrow-in-right",
    color: "#0d6efd",
    bg: "rgba(13,110,253,0.1)",
  },
  APPROVE_ACCOUNT: {
    label: "Approved Account",
    icon: "bi-check-circle",
    color: "#198754",
    bg: "rgba(25,135,84,0.1)",
  },
  REJECT_ACCOUNT: {
    label: "Rejected Account",
    icon: "bi-x-circle",
    color: "#dc3545",
    bg: "rgba(220,53,69,0.1)",
  },
  DELETE_ACCOUNT: {
    label: "Deleted Account",
    icon: "bi-trash",
    color: "#dc3545",
    bg: "rgba(220,53,69,0.1)",
  },
  UPDATE_ACCOUNT: {
    label: "Updated Account",
    icon: "bi-pencil-square",
    color: "#fd7e14",
    bg: "rgba(253,126,20,0.1)",
  },
  DELETE_STAFF_ACCOUNT: {
    label: "Deleted Staff",
    icon: "bi-person-x",
    color: "#dc3545",
    bg: "rgba(220,53,69,0.1)",
  },
  UPDATE_STAFF_ACCOUNT: {
    label: "Updated Staff",
    icon: "bi-person-gear",
    color: "#fd7e14",
    bg: "rgba(253,126,20,0.1)",
  },
  UPDATE_RECORD: {
    label: "Updated Record",
    icon: "bi-journal-arrow-up",
    color: "#6f42c1",
    bg: "rgba(111,66,193,0.1)",
  },
  DELETE_RECORD: {
    label: "Deleted Record",
    icon: "bi-journal-x",
    color: "#dc3545",
    bg: "rgba(220,53,69,0.1)",
  },
  BULK_DELETE_RECORDS: {
    label: "Bulk Deleted",
    icon: "bi-trash3",
    color: "#dc3545",
    bg: "rgba(220,53,69,0.1)",
  },
  BULK_UPDATE_STATUS: {
    label: "Bulk Status Update",
    icon: "bi-list-check",
    color: "#0dcaf0",
    bg: "rgba(13,202,240,0.1)",
  },
};

const DEFAULT_ACTION_CONFIG = {
  label: "Activity",
  icon: "bi-activity",
  color: "#6c757d",
  bg: "rgba(108,117,125,0.1)",
};

function getRelativeTime(dateStr: string): string {
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
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getActionDetails(log: ActivityLog): string {
  const d = log.actionDetails;
  if (d?.details) return d.details;
  if (d?.userName) return `Target: ${d.userName}`;
  return "";
}

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "#4f46e5",
  "#0d9488",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#059669",
  "#2563eb",
  "#c026d3",
  "#ea580c",
  "#0891b2",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const StaffActivityView: React.FC = () => {
  // --- Staff summary state ---
  const [staffList, setStaffList] = useState<StaffSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // --- Selected staff drill-down ---
  const [selectedStaff, setSelectedStaff] = useState<StaffSummary | null>(null);
  const [staffLogs, setStaffLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [actionFilter, setActionFilter] = useState("all");

  // Fetch staff summaries
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await adminAPI.getStaffSummary();
      setStaffList(data.staffSummaries);
    } catch (err) {
      console.error("Failed to fetch staff summaries:", err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Fetch individual staff logs when selected
  const fetchStaffLogs = useCallback(async () => {
    if (!selectedStaff) return;
    setLoadingLogs(true);
    try {
      const data = await adminAPI.getActivityLogs({
        staffId: selectedStaff._id,
        page: pagination.page,
        limit: pagination.limit,
        action: actionFilter !== "all" ? actionFilter : undefined,
      });
      setStaffLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch staff logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [selectedStaff, pagination.page, pagination.limit, actionFilter]);

  useEffect(() => {
    if (selectedStaff) fetchStaffLogs();
  }, [fetchStaffLogs, selectedStaff]);

  const handleSelectStaff = (staff: StaffSummary) => {
    if (selectedStaff?._id === staff._id) {
      // Deselect
      setSelectedStaff(null);
      setStaffLogs([]);
      setActionFilter("all");
    } else {
      setSelectedStaff(staff);
      setPagination((p) => ({ ...p, page: 1 }));
      setActionFilter("all");
    }
  };

  const handleBack = () => {
    setSelectedStaff(null);
    setStaffLogs([]);
    setActionFilter("all");
  };

  // Compute totals
  const totalTransactions = staffList.reduce(
    (sum, s) => sum + s.totalActions,
    0,
  );

  return (
    <div className="activity-log-container">
      {/* === STAFF LIST VIEW === */}
      {!selectedStaff ? (
        <>
          {/* Summary stats */}
          <div className="activity-stats-row">
            <div className="activity-stat-card">
              <div
                className="activity-stat-icon"
                style={{ background: "rgba(13,110,253,0.1)" }}
              >
                <i
                  className="bi bi-people-fill"
                  style={{ color: "#0d6efd" }}
                ></i>
              </div>
              <div>
                <div className="activity-stat-value">{staffList.length}</div>
                <div className="activity-stat-label">Staff Members</div>
              </div>
            </div>
            <div className="activity-stat-card">
              <div
                className="activity-stat-icon"
                style={{ background: "rgba(25,135,84,0.1)" }}
              >
                <i
                  className="bi bi-journal-check"
                  style={{ color: "#198754" }}
                ></i>
              </div>
              <div>
                <div className="activity-stat-value">{totalTransactions}</div>
                <div className="activity-stat-label">Total Transactions</div>
              </div>
            </div>
            <div className="activity-stat-card">
              <div
                className="activity-stat-icon"
                style={{ background: "rgba(111,66,193,0.1)" }}
              >
                <i
                  className="bi bi-graph-up-arrow"
                  style={{ color: "#6f42c1" }}
                ></i>
              </div>
              <div>
                <div className="activity-stat-value">
                  {staffList.length > 0
                    ? Math.round(totalTransactions / staffList.length)
                    : 0}
                </div>
                <div className="activity-stat-label">Avg per Staff</div>
              </div>
            </div>
          </div>

          {/* Staff cards */}
          <div className="activity-staff-grid-card">
            <div className="activity-staff-grid-header">
              <span>
                <i className="bi bi-person-lines-fill me-2"></i>
                Staff Transaction Overview
              </span>
              <span className="activity-count-badge">
                {staffList.length}{" "}
                {staffList.length === 1 ? "member" : "members"}
              </span>
            </div>

            {loadingSummary ? (
              <div className="activity-loading">
                <div className="spinner-border spinner-border-sm text-secondary me-2" />
                Loading staff data...
              </div>
            ) : staffList.length === 0 ? (
              <div className="activity-empty">
                <i
                  className="bi bi-inbox"
                  style={{ fontSize: "2rem", color: "#adb5bd" }}
                ></i>
                <p>No activity logs recorded yet</p>
              </div>
            ) : (
              <div className="activity-staff-list">
                {staffList.map((staff) => {
                  const color = getAvatarColor(staff._id || "");
                  const initials = getInitials(staff.username || staff.email);

                  // Get top 3 action types sorted by count
                  const topActions = Object.entries(staff.actionBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4);

                  return (
                    <div
                      key={staff._id}
                      className="activity-staff-row"
                      onClick={() => handleSelectStaff(staff)}
                    >
                      {staff.profilePictureUrl ? (
                        <img
                          src={staff.profilePictureUrl}
                          alt={staff.username}
                          className="activity-staff-avatar"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="activity-staff-avatar"
                          style={{ background: color }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="activity-staff-info">
                        <div className="activity-staff-name">
                          {staff.username || "Unknown"}
                        </div>
                        <div className="activity-staff-email">
                          {staff.email}
                        </div>
                      </div>
                      <div className="activity-staff-breakdown">
                        {topActions.map(([action, count]) => {
                          const cfg =
                            ACTION_CONFIG[action] || DEFAULT_ACTION_CONFIG;
                          return (
                            <span
                              key={action}
                              className="activity-mini-badge"
                              style={{ color: cfg.color, background: cfg.bg }}
                              title={cfg.label}
                            >
                              <i className={`bi ${cfg.icon}`}></i>
                              {count}
                            </span>
                          );
                        })}
                      </div>
                      <div className="activity-staff-total">
                        <span className="activity-staff-total-num">
                          {staff.totalActions}
                        </span>
                        <span className="activity-staff-total-label">
                          transactions
                        </span>
                      </div>
                      <div className="activity-staff-last">
                        {getRelativeTime(staff.lastActivity)}
                      </div>
                      <i className="bi bi-chevron-right activity-staff-chevron"></i>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* === STAFF DETAIL VIEW === */
        <>
          {/* Back button + staff header */}
          <div className="activity-detail-header-card">
            <button className="activity-back-btn" onClick={handleBack}>
              <i className="bi bi-arrow-left"></i>
            </button>
            {selectedStaff.profilePictureUrl ? (
              <img
                src={selectedStaff.profilePictureUrl}
                alt={selectedStaff.username}
                className="activity-staff-avatar"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div
                className="activity-staff-avatar"
                style={{ background: getAvatarColor(selectedStaff._id || "") }}
              >
                {getInitials(selectedStaff.username || selectedStaff.email)}
              </div>
            )}
            <div className="activity-detail-hdr-info">
              <div className="activity-detail-hdr-name">
                {selectedStaff.username || "Unknown"}
              </div>
              <div className="activity-detail-hdr-email">
                {selectedStaff.email}
              </div>
            </div>
            <div className="activity-detail-hdr-stats">
              <div className="activity-detail-hdr-stat">
                <span className="activity-detail-hdr-num">
                  {selectedStaff.totalActions}
                </span>
                <span className="activity-detail-hdr-lbl">Total</span>
              </div>
              <div className="activity-detail-hdr-stat">
                <span className="activity-detail-hdr-num">
                  {Object.keys(selectedStaff.actionBreakdown).length}
                </span>
                <span className="activity-detail-hdr-lbl">Types</span>
              </div>
            </div>
          </div>

          {/* Action breakdown chips */}
          <div className="activity-breakdown-card">
            <div className="activity-breakdown-header">
              <i className="bi bi-bar-chart-line me-2"></i>
              Action Breakdown
            </div>
            <div className="activity-breakdown-chips">
              {Object.entries(selectedStaff.actionBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([action, count]) => {
                  const cfg = ACTION_CONFIG[action] || DEFAULT_ACTION_CONFIG;
                  return (
                    <button
                      key={action}
                      className={`activity-chip ${actionFilter === action ? "active" : ""}`}
                      style={
                        actionFilter === action
                          ? {
                              background: cfg.color,
                              borderColor: cfg.color,
                              color: "#fff",
                            }
                          : { borderColor: cfg.color, color: cfg.color }
                      }
                      onClick={() => {
                        setActionFilter(action);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                    >
                      <i className={`bi ${cfg.icon}`}></i>
                      {cfg.label} ({count})
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Transaction table */}
          <div className="activity-table-card">
            <div className="activity-table-header">
              <span>
                <i className="bi bi-list-ul me-2"></i>
                Transaction History
              </span>
              <span className="activity-count-badge">
                {pagination.total}{" "}
                {pagination.total === 1 ? "entry" : "entries"}
              </span>
            </div>

            {loadingLogs ? (
              <div className="activity-loading">
                <div className="spinner-border spinner-border-sm text-secondary me-2" />
                Loading transactions...
              </div>
            ) : staffLogs.length === 0 ? (
              <div className="activity-empty">
                <i
                  className="bi bi-inbox"
                  style={{ fontSize: "1.5rem", color: "#adb5bd" }}
                ></i>
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="activity-table-wrap">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Details</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffLogs.map((log) => {
                      const config =
                        ACTION_CONFIG[log.action] || DEFAULT_ACTION_CONFIG;
                      const details = getActionDetails(log);

                      return (
                        <tr key={log._id}>
                          <td>
                            <span
                              className="activity-action-badge"
                              style={{
                                color: config.color,
                                background: config.bg,
                              }}
                            >
                              <i className={`bi ${config.icon} me-1`}></i>
                              {config.label}
                            </span>
                          </td>
                          <td>
                            <span className="activity-table-detail">
                              {details || (
                                <span style={{ color: "#cbd5e1" }}>—</span>
                              )}
                            </span>
                          </td>
                          <td>
                            <span
                              className="activity-table-date"
                              title={formatFullDate(log.createdAt)}
                            >
                              {formatFullDate(log.createdAt)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`activity-status-badge ${log.status === "success" ? "success" : "error"}`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="activity-pagination">
                <button
                  className="activity-page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`activity-page-btn ${pagination.page === pageNum ? "active" : ""}`}
                        onClick={() =>
                          setPagination((p) => ({ ...p, page: pageNum }))
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
                <button
                  className="activity-page-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
                <span className="activity-page-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StaffActivityView;
