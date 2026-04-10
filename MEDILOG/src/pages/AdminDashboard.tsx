import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI, userAPI, medicalAPI } from "../services/api";
import "../styles/adminportal.css";
import AdminSidebar from "../components/admin_comp/AdminSidebar";
import DashboardView from "../components/admin_comp/DashboardView";
import StudentAccountsView from "../components/admin_comp/StudentAccountsView";
import PatientRecordsView from "../components/admin_comp/PatientRecordsView";
import BackupRestoreView from "../components/admin_comp/BackupRestoreView";
import StaffAccountsView from "../components/admin_comp/StaffAccountsView";
import PharmacyInventoryView from "../components/admin_comp/PharmacyInventoryView";
import AiAssistantView from "../components/admin_comp/AiAssistantView";
import StaffActivityView from "../components/admin_comp/StaffActivityView";
import FaceCaptureModal from "../components/common/FaceCaptureModal";
import LoadingOverlay from "../components/common/LoadingOverlay";

// --- Types ---

type ViewType =
  | "dashboard"
  | "patientRecords"
  | "accounts"
  | "staffAccounts"
  | "pharmacy"
  | "backup"
  | "aiAssistant"
  | "activityLog";
type RecordType =
  | "physicalExam"
  | "monitoring"
  | "certificate"
  | "medicineIssuance"
  | "laboratoryRequest";

const AdminDashboard: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  // --- Core Navigation State ---
  const [view, setView] = useState<ViewType>("dashboard");
  const [recordType, setRecordType] = useState<RecordType>("physicalExam");
  const [pendingCount, setPendingCount] = useState(0);
  const [staffPendingCount, setStaffPendingCount] = useState(0);
  const [recordPendingCounts, setRecordPendingCounts] = useState<
    Record<string, number>
  >({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- Profile Upload Modal State ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFaceCaptureModal, setShowFaceCaptureModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // --- Admin Notifications ---
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Fetch all admin data (pending counts + notifications) ---
  const fetchAdminData = async (silent = false) => {
    if (!user) return;
    try {
      const [pendingData, staffData, recordData, unreadData] =
        await Promise.all([
          authAPI.getPendingAccounts(),
          authAPI.getPendingStaffAccounts(),
          medicalAPI.getPendingRecordCounts(),
          medicalAPI.getAdminUnreadCount(),
        ]);
      setPendingCount(pendingData.count || 0);
      setStaffPendingCount(staffData.count || 0);
      setRecordPendingCounts(recordData);
      setAdminUnreadCount(unreadData.count || 0);
    } catch (error) {
      if (!silent) console.error("Failed to fetch admin data:", error);
    }
  };

  // Initial fetch + polling every 5 seconds
  useEffect(() => {
    if (!user) return;
    fetchAdminData();

    const intervalId = setInterval(() => {
      fetchAdminData(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user]);

  // Load full notifications when dropdown opens
  const handleNotifBellClick = async () => {
    setShowNotifDropdown((prev) => !prev);
    if (!showNotifDropdown) {
      try {
        const data = await medicalAPI.getAdminNotifications();
        setAdminNotifications(data.notifications || []);
        // Mark as read
        await medicalAPI.markAdminNotificationsAsRead();
        setAdminUnreadCount(0);
      } catch (error) {
        console.error("Failed to load admin notifications:", error);
      }
    }
  };

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
    });
  };

  const getNotifIconInfo = (recordType: string) => {
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
        return {
          icon: "bi-bell",
          color: "#6b7280",
          bg: "rgba(107,114,128,0.1)",
        };
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate("/");
    }, 1200);
  };

  // --- File Upload Handlers ---

  const handleFile = (file: File | null) => {
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setUploadError("");
      } else {
        setSelectedFile(null);
        setUploadError("Invalid file type. Please upload a PNG, JPG, or JPEG.");
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files ? e.target.files[0] : null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files ? e.dataTransfer.files[0] : null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !user?._id) {
      setUploadError("Please select a file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await userAPI.uploadProfilePicture(user._id, formData);

      if (login && response.user) {
        const token = sessionStorage.getItem("authToken");
        if (token) {
          login({
            user: response.user,
            token: token,
            message: "Profile updated",
            role: response.user.role,
          });
        } else {
          logout();
        }
      }

      alert(response.message || "Upload successful!");
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      let errorMessage = "Upload failed. Please try again.";

      if (serverMessage === "No file uploaded") {
        errorMessage =
          "Upload failed: Server did not receive the file. (Check backend key or Multer setup.)";
      } else if (serverMessage) {
        errorMessage = `Upload failed: ${serverMessage}`;
      }

      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFaceCapture = (imageBlob: Blob) => {
    const file = new File([imageBlob], "face-capture.jpg", {
      type: "image/jpeg",
    });
    setSelectedFile(file);
    setShowFaceCaptureModal(false);
    setUploadError("");
  };

  // --- Helper Functions ---

  // Determine if this user is limited staff (not Head Director)
  const isLimitedStaff =
    user?.role === "staff" && user?.position !== "Head Director";

  const normalizedEmail = (user?.email || "").trim().toLowerCase();
  const normalizedPosition = (user?.position || "").trim().toLowerCase();
  const isSuperAdminOrHead =
    normalizedEmail === "admin@medilog.com" ||
    normalizedPosition.includes("head");

  useEffect(() => {
    if (!isSuperAdminOrHead) return;

    if (view === "aiAssistant" || view === "patientRecords") {
      setView("dashboard");
    }
  }, [isSuperAdminOrHead, view]);

  const getAvatarSrc = () => {
    if (user?.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.username || "Admin",
    )}&background=2c5f2d&color=fff&size=200&font-size=0.4&bold=true`;
  };

  // --- JSX Render ---

  return (
    <>
      <LoadingOverlay show={loggingOut} message="Signing out..." />
      <div className="d-flex admin-wrapper">
        {/* --- SIDEBAR --- */}
        <AdminSidebar
          view={view}
          setView={setView}
          recordType={recordType}
          setRecordType={setRecordType}
          pendingCount={pendingCount}
          staffPendingCount={staffPendingCount}
          recordPendingCounts={recordPendingCounts}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          userRole={user?.role}
          userPosition={user?.position}
          isSuperAdminOrHead={isSuperAdminOrHead}
        />

        <div className={`flex-grow-1 d-flex flex-column`}>
          {/* --- HEADER --- */}
          <header className="main-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <button
                className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
                style={{ width: "38px", height: "38px", borderRadius: "8px" }}
              >
                <i className="bi bi-list" style={{ fontSize: "1.3rem" }}></i>
              </button>
              <div>
                <h5
                  className="mb-0"
                  style={{
                    color: "var(--primary-green)",
                    fontWeight: 700,
                    fontSize: "1.4rem",
                    letterSpacing: "0.3px",
                  }}
                >
                  {user?.role === "staff" ? "Staff Portal" : "Admin Portal"}
                </h5>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* View title + greeting */}
              <div className="text-end d-none d-sm-block">
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    color: "var(--text-dark)",
                  }}
                >
                  Welcome! 👋
                </span>
                <p
                  className="mb-0"
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {user?.position || "Administrator"}
                </p>
              </div>

              {/* Notification Bell */}
              <div ref={notifDropdownRef} style={{ position: "relative" }}>
                <div
                  className="notification-btn-container"
                  onClick={handleNotifBellClick}
                >
                  <i className="bi bi-bell"></i>
                  {adminUnreadCount > 0 && (
                    <span className="header-badge">{adminUnreadCount}</span>
                  )}
                </div>

                {/* Notification Dropdown */}
                {showNotifDropdown && (
                  <div className="admin-notif-dropdown">
                    <div className="admin-notif-header">
                      <span
                        className="fw-semibold"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Notifications
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#94a3b8",
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: 12,
                        }}
                      >
                        {adminNotifications.length}
                      </span>
                    </div>
                    <div className="admin-notif-body">
                      {adminNotifications.length === 0 ? (
                        <div className="text-center py-4">
                          <i
                            className="bi bi-bell-slash"
                            style={{ fontSize: "1.8rem", color: "#cbd5e1" }}
                          ></i>
                          <p
                            style={{
                              color: "#94a3b8",
                              fontSize: "0.78rem",
                              marginTop: 6,
                              marginBottom: 0,
                            }}
                          >
                            No new notifications
                          </p>
                        </div>
                      ) : (
                        adminNotifications
                          .slice(0, 8)
                          .map((notif: any, idx: number) => {
                            const iconInfo = getNotifIconInfo(notif.recordType);
                            return (
                              <div
                                key={notif._id || idx}
                                className={`admin-notif-item${!notif.isRead ? " admin-notif-unread" : ""}`}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: iconInfo.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <i
                                    className={`bi ${iconInfo.icon}`}
                                    style={{
                                      color: iconInfo.color,
                                      fontSize: "0.9rem",
                                    }}
                                  ></i>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p
                                    style={{
                                      fontSize: "0.76rem",
                                      fontWeight: !notif.isRead ? 600 : 400,
                                      color: "#1e293b",
                                      margin: 0,
                                      lineHeight: 1.35,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                    }}
                                  >
                                    {notif.message}
                                  </p>
                                  <span
                                    style={{
                                      fontSize: "0.65rem",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    {getRelativeTime(notif.createdAt)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div
                onClick={() => setShowUploadModal(true)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={getAvatarSrc()}
                  alt="Admin"
                  className="rounded-circle shadow-sm"
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "cover",
                    border: "3px solid var(--text-dark, #000)",
                  }}
                />
              </div>
            </div>
          </header>

          {/* --- VIEW TITLE CARD --- */}
          <div className="content-view-header">
            <h4 className="content-view-title">
              <i
                className={`bi ${
                  view === "dashboard"
                    ? "bi-grid-1x2-fill"
                    : view === "accounts"
                      ? "bi-people-fill"
                      : view === "staffAccounts"
                        ? "bi-person-gear"
                        : view === "pharmacy"
                          ? "bi-capsule"
                          : view === "patientRecords"
                            ? "bi-journal-medical"
                            : view === "backup"
                              ? "bi-cloud-arrow-up-fill"
                              : view === "activityLog"
                                ? "bi-clock-history"
                                : "bi-robot"
                } me-2`}
              ></i>
              {view === "dashboard"
                ? "Dashboard Overview"
                : view === "accounts"
                  ? "Student Accounts"
                  : view === "staffAccounts"
                    ? "Staff Accounts"
                    : view === "pharmacy"
                      ? "Pharmacy Inventory"
                      : view === "patientRecords"
                        ? "Medical Records"
                        : view === "backup"
                          ? "System Backup"
                          : view === "activityLog"
                            ? "Activity Log"
                            : "AI Assistant"}
            </h4>
            <p className="content-view-subtitle">
              {view === "dashboard" &&
                "Monitor system performance and activity at a glance."}
              {view === "accounts" && "Manage student records and information."}
              {view === "staffAccounts" &&
                "Manage staff members and permissions."}
              {view === "pharmacy" && "Track medicine stock and inventory."}
              {view === "patientRecords" && "View and manage medical records."}
              {view === "backup" && "Backup and restore system data."}
              {view === "activityLog" &&
                "Track staff transactions and system activity."}
              {view === "aiAssistant" &&
                "Audio-to-text and image-to-text tools."}
            </p>
          </div>

          <div className="content">
            {/* --- DASHBOARD VIEW (kept mounted, hidden via CSS to preserve state) --- */}
            <div style={{ display: view === "dashboard" ? "block" : "none" }}>
              <DashboardView
                pendingCount={pendingCount}
                onStatsLoaded={(stats) => setPendingCount(stats.pendingCount)}
                isLimitedStaff={isLimitedStaff}
                isSuperAdminOrHead={isSuperAdminOrHead}
              />
            </div>

            {/* --- STUDENT ACCOUNTS VIEW --- */}
            {!isLimitedStaff && view === "accounts" && (
              <StudentAccountsView
                adminId={user?._id || ""}
                onPendingCountChange={setPendingCount}
              />
            )}

            {/* --- STAFF ACCOUNTS VIEW --- */}
            {!isLimitedStaff && view === "staffAccounts" && (
              <StaffAccountsView
                adminId={user?._id || ""}
                onPendingCountChange={setStaffPendingCount}
              />
            )}

            {/* --- PHARMACY INVENTORY VIEW --- */}
            {view === "pharmacy" && <PharmacyInventoryView />}

            {/* --- PATIENT RECORDS VIEW --- */}
            {!isSuperAdminOrHead && view === "patientRecords" && (
              <PatientRecordsView recordType={recordType} />
            )}

            {/* --- BACKUP & RESTORE VIEW --- */}
            {!isLimitedStaff && view === "backup" && user && (
              <BackupRestoreView adminUsername={user.username} />
            )}

            {/* --- ACTIVITY LOG VIEW --- */}
            {!isLimitedStaff && view === "activityLog" && <StaffActivityView />}

            {/* --- AI ASSISTANT VIEW --- */}
            {!isSuperAdminOrHead && view === "aiAssistant" && (
              <AiAssistantView />
            )}
          </div>
        </div>

        {/* --- Profile Upload Modal --- */}
        {showUploadModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Upload Profile Picture</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setUploadError("");
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {uploadError && (
                    <div className="alert alert-danger">{uploadError}</div>
                  )}

                  <div
                    className={`upload-drop-zone ${
                      isDragging ? "is-dragging" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                  >
                    <div className="upload-icon">
                      <i className="bi bi-cloud-arrow-up"></i>
                    </div>
                    <p>Choose a file or drag & drop it here</p>
                    <span className="upload-formats">
                      JPEG, PNG, or JPG only
                    </span>
                    <span
                      className="btn-browse"
                      style={{ pointerEvents: "none" }}
                    >
                      Browse File
                    </span>
                    <input
                      type="file"
                      id="pfpFile"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </div>

                  <div className="text-center my-3">
                    <span className="text-muted">or</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-info w-100 mb-3"
                    onClick={() => setShowFaceCaptureModal(true)}
                  >
                    <i className="bi bi-camera me-2"></i>Capture Photo with
                    Camera
                  </button>

                  {selectedFile && (
                    <div className="file-preview">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setUploadError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleUploadSubmit}
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Face Capture Modal */}
        <FaceCaptureModal
          show={showFaceCaptureModal}
          onClose={() => setShowFaceCaptureModal(false)}
          onCapture={handleFaceCapture}
        />
      </div>
    </>
  );
};

export default AdminDashboard;
