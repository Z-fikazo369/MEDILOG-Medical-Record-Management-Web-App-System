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
import FaceCaptureModal from "../components/common/FaceCaptureModal";

// --- Types ---

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

  // --- Fetch pending count for sidebar badge ---
  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      try {
        const data = await authAPI.getPendingAccounts();
        setPendingCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch pending count:", error);
      }
    };
    const fetchStaffPending = async () => {
      try {
        const data = await authAPI.getPendingStaffAccounts();
        setStaffPendingCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch staff pending count:", error);
      }
    };
    fetchPending();
    fetchStaffPending();

    const fetchRecordPendingCounts = async () => {
      try {
        const data = await medicalAPI.getPendingRecordCounts();
        setRecordPendingCounts(data);
      } catch (error) {
        console.error("Failed to fetch record pending counts:", error);
      }
    };
    fetchRecordPendingCounts();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
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
    <div className="d-flex">
      {/* --- SIDEBAR --- */}
      <AdminSidebar
        view={view}
        setView={setView}
        setRecordType={setRecordType}
        pendingCount={pendingCount}
        staffPendingCount={staffPendingCount}
        recordPendingCounts={recordPendingCounts}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        userRole={user?.role}
        userPosition={user?.position}
      />

      <div
        className={`flex-grow-1 d-flex flex-column ${sidebarCollapsed ? "sidebar-collapsed-margin" : ""}`}
      >
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
              <h3 className="fw-bold text-dark mb-0">
                {view === "dashboard"
                  ? `Hello ${user?.position || "Admin"}!`
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
                            : "AI Assistant"}
              </h3>
              {view === "dashboard" && (
                <p className="text-muted mb-0 small">
                  Welcome to your dashboard!
                </p>
              )}
              {view === "accounts" && (
                <p className="text-muted mb-0 small">
                  Manage student records and information
                </p>
              )}
              {view === "staffAccounts" && (
                <p className="text-muted mb-0 small">
                  Manage staff members and permissions
                </p>
              )}
              {view === "pharmacy" && (
                <p className="text-muted mb-0 small">
                  Track medicine stock and inventory
                </p>
              )}
              {view === "aiAssistant" && (
                <p className="text-muted mb-0 small">
                  Audio-to-text and image-to-text tools
                </p>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-4">
            {/* Profile */}
            <div
              onClick={() => setShowUploadModal(true)}
              className="d-flex align-items-center gap-3 cursor-pointer"
            >
              <div className="text-end d-none d-sm-block">
                <h6 className="mb-0 fw-bold">{user?.username}</h6>
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {user?.position || "Administrator"}
                </small>
              </div>
              <img
                src={getAvatarSrc()}
                alt="Admin"
                className="rounded-circle shadow-sm border border-2 border-black"
                style={{ width: "45px", height: "45px", objectFit: "cover" }}
              />
            </div>
          </div>
        </header>

        <div className="content">
          {/* --- DASHBOARD VIEW --- */}
          {view === "dashboard" && (
            <DashboardView
              pendingCount={pendingCount}
              onStatsLoaded={(stats) => setPendingCount(stats.pendingCount)}
              isLimitedStaff={isLimitedStaff}
            />
          )}

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
          {view === "patientRecords" && (
            <PatientRecordsView recordType={recordType} />
          )}

          {/* --- BACKUP & RESTORE VIEW --- */}
          {!isLimitedStaff && view === "backup" && user && (
            <BackupRestoreView adminUsername={user.username} />
          )}

          {/* --- AI ASSISTANT VIEW --- */}
          {view === "aiAssistant" && <AiAssistantView />}
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
                  <span className="upload-formats">JPEG, PNG, or JPG only</span>
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
                  <i className="bi bi-camera me-2"></i>Capture Photo with Camera
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
  );
};

export default AdminDashboard;
