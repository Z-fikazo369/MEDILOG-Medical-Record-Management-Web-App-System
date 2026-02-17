import { useState, useEffect } from "react";
import { authAPI } from "../../services/api";
import PaginationControls from "./PaginationControls";

// --- Staff Interface (matches User model with staff fields) ---
export interface StaffAccount {
  _id: string;
  username: string;
  email: string;
  employeeId: string;
  position: string; // "Nurse" | "Nurse Attendant" | "Administrative Aide" | "Head Director"
  status: "pending" | "approved" | "rejected";
  idPictureUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface StaffStats {
  total: number;
  active: number;
  pending: number;
  newThisWeek: number;
}

// --- Helpers ---

const getPositionBadgeClass = (position: string): string => {
  const p = position?.toLowerCase() || "";
  if (p.includes("nurse attendant")) return "badge-role role-nurse";
  if (p.includes("nurse")) return "badge-role role-nurse";
  if (p.includes("head director")) return "badge-role role-doctor";
  if (p.includes("administrative")) return "badge-role role-admin";
  return "badge bg-secondary";
};

const getStatusBadge = (status: string): string => {
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

// --- Component ---

interface StaffAccountsViewProps {
  adminId: string;
  onPendingCountChange?: (count: number) => void;
}

const StaffAccountsView: React.FC<StaffAccountsViewProps> = ({
  adminId,
  onPendingCountChange,
}) => {
  // State
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState<StaffStats>({
    total: 0,
    active: 0,
    pending: 0,
    newThisWeek: 0,
  });

  // ID Modal
  const [showIdModal, setShowIdModal] = useState<string | null>(null);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);

  // --- Data Loading ---

  const loadStaffAccounts = async (
    page: number = 1,
    limit: number = rowsPerPage,
  ) => {
    setLoading(true);
    try {
      const response = await authAPI.getAllStaffAccounts(page, limit);
      setStaffAccounts(response.accounts || []);
      setTotalPages(response.totalPages || 0);
      setTotalCount(response.totalCount || 0);
      setCurrentPage(response.currentPage || 1);

      // Calculate "New this week"
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recent = (response.accounts || []).filter(
        (acc: StaffAccount) => new Date(acc.createdAt) > oneWeekAgo,
      ).length;

      setStats((prev) => ({ ...prev, newThisWeek: recent }));
    } catch (error) {
      console.error("Failed to load staff accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffStats = async () => {
    try {
      const [pendingRes, totalRes] = await Promise.all([
        authAPI.getPendingStaffAccounts(),
        authAPI.getTotalStaffCount(),
      ]);
      const pCount = pendingRes.count || 0;
      const tCount = totalRes.totalCount || 0;

      setStats((prev) => ({
        ...prev,
        total: tCount,
        pending: pCount,
        active: Math.max(0, tCount - pCount),
      }));
      onPendingCountChange?.(pCount);
    } catch (error) {
      console.error("Failed to load staff stats:", error);
    }
  };

  useEffect(() => {
    loadStaffAccounts(1);
    loadStaffStats();
  }, []);

  useEffect(() => {
    loadStaffAccounts(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage]);

  // --- Actions ---

  const handleApproveStaff = async (accountId: string, username: string) => {
    if (
      !window.confirm(
        `⚠️ HAVE YOU VERIFIED THIS STAFF'S ID?\n\nApprove account for ${username}?\n\nLogin: Email + their chosen password.\nAn email notification will be sent.`,
      )
    )
      return;

    try {
      const result = await authAPI.approveAccount(accountId, adminId);

      if (result.emailSent === false) {
        alert(
          `✅ Staff account approved for ${username}, but the email notification failed to send.\n\nPlease inform them manually that they can login using their email and password.`,
        );
      } else {
        alert(
          `✅ Staff account approved!\n\n${username} can now login using:\n• Email\n• Their chosen password\n\n📧 An approval email has been sent.`,
        );
      }

      loadStaffAccounts(currentPage);
      loadStaffStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to approve account");
    }
  };

  const handleRejectStaff = async (accountId: string, username: string) => {
    if (
      !window.confirm(`Reject account for ${username}? This cannot be undone.`)
    )
      return;

    try {
      await authAPI.rejectAccount(accountId, adminId);
      alert(`Account for ${username} has been rejected.`);
      loadStaffAccounts(currentPage);
      loadStaffStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to reject account");
    }
  };

  const handleDeleteStaff = async (accountId: string, username: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the account for ${username}? This action cannot be undone.`,
      )
    )
      return;

    try {
      await authAPI.deleteStaffAccount(accountId);
      alert(`Staff account for ${username} has been permanently deleted.`);
      loadStaffAccounts(currentPage);
      loadStaffStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete account");
    }
  };

  const handleEditStaff = (staff: StaffAccount) => {
    setEditingStaff({ ...staff });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStaff) return;
    try {
      await authAPI.updateStaffAccount(editingStaff._id, {
        username: editingStaff.username,
        email: editingStaff.email,
        employeeId: editingStaff.employeeId,
        position: editingStaff.position,
        status: editingStaff.status,
      });
      alert(`Staff account for ${editingStaff.username} has been updated.`);
      setShowEditModal(false);
      setEditingStaff(null);
      loadStaffAccounts(currentPage);
      loadStaffStats();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update account");
    }
  };

  // --- Filtered list ---
  const filteredStaff = staffAccounts.filter((staff) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      staff.username?.toLowerCase().includes(term) ||
      staff.employeeId?.toLowerCase().includes(term) ||
      staff.position?.toLowerCase().includes(term) ||
      staff.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fade-in">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card-modern green">
          <div>
            <span className="label">Total Staff</span>
            <h2>{stats.total}</h2>
          </div>
          <span className="sub-text success">
            <i className="bi bi-people me-1"></i> All registered
          </span>
        </div>

        <div className="stat-card-modern emerald">
          <div>
            <span className="label">Active Staff</span>
            <h2>{stats.active}</h2>
          </div>
          <span className="sub-text success">
            <i className="bi bi-check-circle me-1"></i> Verified & Active
          </span>
        </div>

        <div className="stat-card-modern orange">
          <div>
            <span className="label">Recent Registrations</span>
            <h2>{stats.newThisWeek}</h2>
          </div>
          <span className="sub-text warning">
            <i className="bi bi-clock-history me-1"></i> This week
          </span>
        </div>

        <div className="stat-card-modern purple">
          <div>
            <span className="label">Pending Approval</span>
            <h2>{stats.pending}</h2>
          </div>
          <span className="sub-text purple-text">
            <i className="bi bi-exclamation-circle me-1"></i> Needs attention
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="modern-table-container">
        <div className="table-header-actions">
          <div className="search-wrapper-modern">
            <i className="bi bi-search"></i>
            <input
              type="text"
              className="search-input-modern"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2 bg-white">
              <i className="bi bi-funnel"></i> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success"></div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-info-circle me-2"></i>
            {searchTerm
              ? "No staff matching your search."
              : "No staff accounts found."}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-modern table-hover align-middle">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name / Email</th>
                    <th>Position</th>
                    <th>Date Applied</th>
                    <th>Last Active</th>
                    <th>View ID</th>
                    <th>Status</th>
                    <th className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => (
                    <tr key={staff._id}>
                      <td className="fw-bold text-dark">{staff.employeeId}</td>

                      <td>
                        <div className="student-info-cell">
                          <span className="student-name">{staff.username}</span>
                          <span className="student-email">{staff.email}</span>
                        </div>
                      </td>

                      <td>
                        <span className={getPositionBadgeClass(staff.position)}>
                          {staff.position}
                        </span>
                      </td>

                      <td>{new Date(staff.createdAt).toLocaleDateString()}</td>

                      <td>
                        {staff.lastLoginAt ? (
                          <span className="small">
                            {(() => {
                              const diff =
                                Date.now() -
                                new Date(staff.lastLoginAt).getTime();
                              const mins = Math.floor(diff / 60000);
                              const hrs = Math.floor(diff / 3600000);
                              const days = Math.floor(diff / 86400000);
                              if (mins < 1) return "Just now";
                              if (mins < 60) return `${mins}m ago`;
                              if (hrs < 24) return `${hrs}h ago`;
                              if (days < 7) return `${days}d ago`;
                              return new Date(
                                staff.lastLoginAt,
                              ).toLocaleDateString();
                            })()}
                          </span>
                        ) : (
                          <span className="text-muted small fst-italic">
                            Never
                          </span>
                        )}
                      </td>

                      <td>
                        {staff.idPictureUrl ? (
                          <button
                            className="btn btn-light btn-sm text-primary border"
                            onClick={() =>
                              setShowIdModal(staff.idPictureUrl || null)
                            }
                          >
                            <i className="bi bi-card-image me-1"></i> View
                          </button>
                        ) : (
                          <span className="text-muted small fst-italic">
                            No ID Uploaded
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`${getStatusBadge(staff.status)} rounded-pill px-3 py-1`}
                          style={{
                            textTransform: "capitalize",
                            fontSize: "0.75rem",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {staff.status}
                        </span>
                      </td>

                      <td className="text-end pe-3">
                        {staff.status === "pending" ? (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-outline-success"
                              title="Approve & Send Email"
                              onClick={() =>
                                handleApproveStaff(staff._id, staff.username)
                              }
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              title="Reject"
                              onClick={() =>
                                handleRejectStaff(staff._id, staff.username)
                              }
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-link text-muted p-0"
                              title="Edit"
                              onClick={() => handleEditStaff(staff)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-link text-danger p-0"
                              title="Delete"
                              onClick={() =>
                                handleDeleteStaff(staff._id, staff.username)
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalCount={totalCount}
                pageSize={rowsPerPage}
                onPageSizeChange={(newSize) => {
                  setRowsPerPage(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* View ID Modal */}
      {showIdModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999 }}
          onClick={() => setShowIdModal(null)}
        >
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "100vh", padding: "1rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "auto",
                maxWidth: "90vw",
                borderRadius: "16px",
                backgroundColor: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px 16px 0 0",
                }}
              >
                <h5
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    color: "#000000",
                  }}
                >
                  Staff ID Verification
                </h5>
                <button
                  type="button"
                  onClick={() => setShowIdModal(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#000000",
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>
              <div
                style={{
                  padding: "1.5rem",
                  backgroundColor: "#f9fafb",
                  textAlign: "center",
                  borderRadius: "0 0 16px 16px",
                }}
              >
                <img
                  src={showIdModal}
                  alt="Staff ID"
                  style={{
                    maxWidth: "85vw",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    borderRadius: "12px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Edit Staff Account</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingStaff.username}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editingStaff.email}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingStaff.employeeId}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          employeeId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Position</label>
                    <select
                      className="form-select"
                      value={editingStaff.position}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          position: e.target.value,
                        })
                      }
                    >
                      <option value="Nurse">Nurse</option>
                      <option value="Nurse Attendant">Nurse Attendant</option>
                      <option value="Administrative Aide">
                        Administrative Aide
                      </option>
                      <option value="Head Director">Head Director</option>
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={editingStaff.status}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
                  }}
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

export default StaffAccountsView;
