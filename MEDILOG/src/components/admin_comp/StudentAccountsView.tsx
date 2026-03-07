import { useState, useEffect } from "react";
import { authAPI } from "../../services/api";
import PaginationControls from "./PaginationControls";

// --- Interfaces ---

interface StudentAccount {
  _id: string;
  username: string;
  email: string;
  lrn: string;
  studentId: string;
  defaultLoginMethod?: "email" | "studentId";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  idPictureUrl?: string;
  lastLoginAt?: string;
}

interface StudentAccountsViewProps {
  adminId: string;
  onPendingCountChange?: (count: number) => void;
}

const StudentAccountsView: React.FC<StudentAccountsViewProps> = ({
  adminId,
  onPendingCountChange,
}) => {
  // --- State ---
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountCurrentPage, setAccountCurrentPage] = useState(1);
  const [accountTotalPages, setAccountTotalPages] = useState(0);
  const [accountTotalCount, setAccountTotalCount] = useState(0);
  const [accountRowsPerPage, setAccountRowsPerPage] = useState(10);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [newThisWeek, setNewThisWeek] = useState(0);
  const [accountSearchTerm, setAccountSearchTerm] = useState("");

  // Edit Modal
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<StudentAccount | null>(
    null,
  );

  // Validation errors
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // ID Modal
  const [showIdModal, setShowIdModal] = useState<string | null>(null);

  // --- Validation Helpers ---

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "username":
        if (!value.trim()) return "Name is required.";
        if (value.trim().length < 2)
          return "Name must be at least 2 characters.";
        return "";
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email format.";
        return "";
      case "studentId":
        if (!value.trim()) return "Student ID is required.";
        return "";
      case "lrn":
        if (!value.trim()) return "LRN is required.";
        if (!/^\d+$/.test(value)) return "LRN must contain only digits.";
        if (value.length !== 12) return "LRN must be exactly 12 digits.";
        return "";
      default:
        return "";
    }
  };

  const validateAllFields = (
    account: StudentAccount,
  ): Record<string, string> => {
    const errors: Record<string, string> = {};
    errors.username = validateField("username", account.username);
    errors.email = validateField("email", account.email);
    errors.studentId = validateField("studentId", account.studentId);
    errors.lrn = validateField("lrn", account.lrn);
    // Remove empty entries
    Object.keys(errors).forEach((k) => {
      if (!errors[k]) delete errors[k];
    });
    return errors;
  };

  const handleEditFieldChange = (
    field: keyof StudentAccount,
    value: string,
  ) => {
    if (!editingAccount) return;
    const updated = { ...editingAccount, [field]: value };
    setEditingAccount(updated);
    // Real-time validation
    const err = validateField(field, value);
    setEditErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  // --- Data Loading ---

  const loadAccountStats = async () => {
    try {
      const pendingRes = await authAPI.getPendingAccounts();
      const pCount = pendingRes.count || 0;
      setPendingCount(pCount);
      onPendingCountChange?.(pCount);

      const totalRes = await authAPI.getTotalStudentCount();
      const tCount = totalRes.totalCount || 0;
      setAccountTotalCount(tCount);
      setActiveCount(Math.max(0, tCount - pCount));
    } catch (error) {
      console.error("Failed to load account stats");
    }
  };

  const loadStudentAccounts = async (
    page: number,
    limit: number = accountRowsPerPage,
  ) => {
    try {
      setLoadingAccounts(true);
      const response = await authAPI.getAllStudentAccounts(page, limit);
      setStudentAccounts(response.accounts || []);
      setAccountTotalPages(response.totalPages || 0);
      setAccountTotalCount(response.totalCount || 0);
      setAccountCurrentPage(response.currentPage || 1);

      // Calculate "New this week" based on fetched data
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recent = (response.accounts || []).filter(
        (acc: StudentAccount) => new Date(acc.createdAt) > oneWeekAgo,
      ).length;
      setNewThisWeek(recent);
    } catch (error) {
      console.error("Failed to load student accounts:", error);
      alert("Failed to load student accounts. Please check your connection.");
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStudentAccounts(1);
    loadAccountStats();
  }, []);

  // Page/rows change
  useEffect(() => {
    loadStudentAccounts(accountCurrentPage, accountRowsPerPage);
  }, [accountCurrentPage, accountRowsPerPage]);

  // --- CRUD Handlers ---

  const handleApproveAccount = async (
    accountId: string,
    username: string,
    defaultLoginMethod?: "email" | "studentId",
  ) => {
    const method = defaultLoginMethod || "email";

    if (
      !window.confirm(
        `⚠️ HAVE YOU VERIFIED THIS STUDENT'S ID?\n\nApprove account for ${username}?\n\nStudent's chosen login method: ${
          method === "studentId" ? "Student ID" : "Email"
        }\nPassword will be set to their LRN.\n\nAn email notification will be sent.`,
      )
    )
      return;

    try {
      const result = await authAPI.approveAccount(accountId, adminId);

      if (result.emailSent === false) {
        alert(
          `✅ Account approved for ${username}, but the email notification failed to send.\n\nPlease inform the student manually that they can login using:\n• ${
            method === "studentId" ? "Student ID" : "Email"
          }\n• LRN as password`,
        );
      } else {
        alert(
          `✅ Account approved!\n\n${username} can now login using:\n• ${
            method === "studentId" ? "Student ID" : "Email"
          }\n• LRN as password\n\n📧 An approval email has been sent. OTP will be required at login.`,
        );
      }

      loadStudentAccounts(accountCurrentPage);
      loadAccountStats();
    } catch (error: any) {
      console.error("Failed to approve account:", error);
      alert(error.response?.data?.message || "Failed to approve account");
    }
  };

  const handleRejectAccount = async (accountId: string, username: string) => {
    if (
      !window.confirm(
        `Reject account for ${username}? This action cannot be undone.`,
      )
    )
      return;

    try {
      await authAPI.rejectAccount(accountId, adminId);
      alert(`Account for ${username} has been rejected.`);
      loadStudentAccounts(accountCurrentPage);
      loadAccountStats();
    } catch (error: any) {
      console.error("Failed to reject account:", error);
      alert(error.response?.data?.message || "Failed to reject account");
    }
  };

  const handleDeleteAccount = async (accountId: string, username: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the account for ${username}? This action cannot be undone.`,
      )
    )
      return;
    try {
      await authAPI.deleteStudentAccount(accountId);
      alert(`Account for ${username} has been permanently deleted.`);
      loadStudentAccounts(accountCurrentPage);
      loadAccountStats();
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      alert(error.response?.data?.message || "Failed to delete account");
    }
  };

  const handleEditAccount = (account: StudentAccount) => {
    setEditingAccount({ ...account });
    setEditErrors({});
    setShowEditAccountModal(true);
  };

  const handleSaveAccountEdit = async () => {
    if (!editingAccount) return;
    const errors = validateAllFields(editingAccount);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await authAPI.updateStudentAccount(editingAccount._id, {
        username: editingAccount.username,
        email: editingAccount.email,
        lrn: editingAccount.lrn,
        studentId: editingAccount.studentId,
        status: editingAccount.status,
      });
      alert(`Account for ${editingAccount.username} has been updated.`);
      setShowEditAccountModal(false);
      setEditingAccount(null);
      loadStudentAccounts(accountCurrentPage);
      loadAccountStats();
    } catch (error: any) {
      console.error("Failed to update account:", error);
      alert(error.response?.data?.message || "Failed to update account");
    }
  };

  // --- Helpers ---

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

  // --- JSX ---

  return (
    <div className="fade-in">
      {/* 1. TOP STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card-modern green">
          <div>
            <span className="label">Total Students</span>
            <h2>{accountTotalCount}</h2>
          </div>
          <span className="sub-text success">
            <i className="bi bi-arrow-up-short"></i> Registered Accounts
          </span>
        </div>

        <div className="stat-card-modern emerald">
          <div>
            <span className="label">Active Students</span>
            <h2>{activeCount}</h2>
          </div>
          <span className="sub-text success">
            <i className="bi bi-check-circle me-1"></i> Verified & Active
          </span>
        </div>

        <div className="stat-card-modern orange">
          <div>
            <span className="label">Recent Registrations</span>
            <h2>{newThisWeek}</h2>
          </div>
          <span className="sub-text warning">
            <i className="bi bi-clock-history me-1"></i> This week
          </span>
        </div>

        <div className="stat-card-modern blue">
          <div>
            <span className="label">Pending Records</span>
            <h2>{pendingCount}</h2>
          </div>
          <span className="sub-text info">
            <i className="bi bi-exclamation-circle me-1"></i> Needs attention
          </span>
        </div>
      </div>

      {/* 2. MODERN TABLE CONTAINER */}
      <div className="modern-table-container">
        {/* Search & Filter Bar */}
        <div className="table-header-actions">
          <div className="search-wrapper-modern">
            <i className="bi bi-search"></i>
            <input
              type="text"
              className="search-input-modern"
              placeholder="Search by name, student ID, or LRN..."
              value={accountSearchTerm}
              onChange={(e) => setAccountSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Content */}
        {loadingAccounts ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success"></div>
          </div>
        ) : studentAccounts.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-info-circle me-2"></i>No student accounts found.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-modern table-hover align-middle">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name / Email</th>
                    <th>LRN</th>
                    <th>Date Applied</th>
                    <th>Last Visit</th>
                    <th>View ID</th>
                    <th>Status</th>
                    <th className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAccounts
                    .filter((account) => {
                      if (!accountSearchTerm) return true;
                      const term = accountSearchTerm.toLowerCase();
                      return (
                        account.username?.toLowerCase().includes(term) ||
                        account.studentId?.toLowerCase().includes(term) ||
                        account.lrn?.toLowerCase().includes(term)
                      );
                    })
                    .map((account) => (
                      <tr key={account._id}>
                        <td className="fw-bold text-dark">
                          {account.studentId}
                        </td>
                        <td>
                          <div className="student-info-cell">
                            <span className="student-name">
                              {account.username}
                            </span>
                            <span className="student-email">
                              {account.email}
                            </span>
                          </div>
                        </td>
                        <td>{account.lrn}</td>
                        <td>
                          {new Date(account.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {account.lastLoginAt ? (
                            <span className="small">
                              {(() => {
                                const diff =
                                  Date.now() -
                                  new Date(account.lastLoginAt).getTime();
                                const mins = Math.floor(diff / 60000);
                                const hrs = Math.floor(diff / 3600000);
                                const days = Math.floor(diff / 86400000);
                                if (mins < 1) return "Just now";
                                if (mins < 60) return `${mins}m ago`;
                                if (hrs < 24) return `${hrs}h ago`;
                                if (days < 7) return `${days}d ago`;
                                return new Date(
                                  account.lastLoginAt,
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
                          {account.idPictureUrl ? (
                            <button
                              className="btn btn-light btn-sm text-primary border"
                              onClick={() =>
                                setShowIdModal(account.idPictureUrl || null)
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
                            className={`${getStatusBadge(account.status)} rounded-pill px-3 py-1`}
                            style={{
                              textTransform: "capitalize",
                              fontSize: "0.75rem",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {account.status}
                          </span>
                        </td>
                        <td className="text-end pe-3">
                          {account.status === "pending" ? (
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                className="btn btn-sm btn-outline-success"
                                title="Approve & Send OTP"
                                onClick={() =>
                                  handleApproveAccount(
                                    account._id,
                                    account.username,
                                    account.defaultLoginMethod,
                                  )
                                }
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title="Reject"
                                onClick={() =>
                                  handleRejectAccount(
                                    account._id,
                                    account.username,
                                  )
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
                                onClick={() => handleEditAccount(account)}
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-link text-danger p-0"
                                title="Delete"
                                onClick={() =>
                                  handleDeleteAccount(
                                    account._id,
                                    account.username,
                                  )
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
                currentPage={accountCurrentPage}
                totalPages={accountTotalPages}
                onPageChange={(page) => setAccountCurrentPage(page)}
                totalCount={accountTotalCount}
                pageSize={accountRowsPerPage}
                onPageSizeChange={(newSize) => {
                  setAccountRowsPerPage(newSize);
                  setAccountCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* --- ID View Modal --- */}
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
                overflow: "hidden",
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
                  Student ID Verification
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
                  padding: "2.5rem",
                  backgroundColor: "#f9fafb",
                  textAlign: "center",
                }}
              >
                <img
                  src={showIdModal}
                  alt="Student ID"
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

      {/* --- Edit Account Modal --- */}
      {showEditAccountModal && editingAccount && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Edit Student Account</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowEditAccountModal(false);
                    setEditingAccount(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Name</label>
                    <input
                      type="text"
                      className={`form-control${editErrors.username ? " is-invalid" : ""}`}
                      value={editingAccount.username}
                      onChange={(e) =>
                        handleEditFieldChange("username", e.target.value)
                      }
                    />
                    {editErrors.username && (
                      <div className="invalid-feedback">
                        {editErrors.username}
                      </div>
                    )}
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className={`form-control${editErrors.email ? " is-invalid" : ""}`}
                      value={editingAccount.email}
                      onChange={(e) =>
                        handleEditFieldChange("email", e.target.value)
                      }
                    />
                    {editErrors.email && (
                      <div className="invalid-feedback">{editErrors.email}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Student ID</label>
                    <input
                      type="text"
                      className={`form-control${editErrors.studentId ? " is-invalid" : ""}`}
                      value={editingAccount.studentId}
                      onChange={(e) =>
                        handleEditFieldChange("studentId", e.target.value)
                      }
                    />
                    {editErrors.studentId && (
                      <div className="invalid-feedback">
                        {editErrors.studentId}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">LRN</label>
                    <input
                      type="text"
                      className={`form-control${editErrors.lrn ? " is-invalid" : ""}`}
                      value={editingAccount.lrn}
                      maxLength={12}
                      onChange={(e) =>
                        handleEditFieldChange("lrn", e.target.value)
                      }
                    />
                    {editErrors.lrn && (
                      <div className="invalid-feedback">{editErrors.lrn}</div>
                    )}
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={editingAccount.status}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
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
                    setShowEditAccountModal(false);
                    setEditingAccount(null);
                    setEditErrors({});
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSaveAccountEdit}
                  disabled={Object.keys(editErrors).length > 0}
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

export default StudentAccountsView;
