import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/studentportal.css";
import { medicalAPI, userAPI } from "../services/api";
import FaceCaptureModal from "../components/common/FaceCaptureModal";
import LoadingOverlay from "../components/common/LoadingOverlay";

// --- Student Sub-Components ---
import StudentSidebar from "../components/student_comp/StudentSidebar";
import StudentProfileView from "../components/student_comp/StudentProfileView";
import StudentFormOptionsView from "../components/student_comp/StudentFormOptionsView";
import NewStudentForm from "../components/student_comp/NewStudentForm";
import MonitoringForm from "../components/student_comp/MonitoringForm";
import CertificateForm from "../components/student_comp/CertificateForm";
import MedicineIssuanceForm from "../components/student_comp/MedicineIssuanceForm";
import LaboratoryRequestForm from "../components/student_comp/LaboratoryRequestForm";
import StudentHistoryView from "../components/student_comp/StudentHistoryView";
import StudentNotificationsView from "../components/student_comp/StudentNotificationsView";
import StudentLandingView from "../components/student_comp/StudentLandingView";

// --- Types ---
import type {
  StudentView,
  NewStudentData,
  MonitoringData,
  CertificateData,
  MedicineIssuanceData,
  LaboratoryRequestData,
  Notification,
} from "../components/student_comp/studentTypes";

const StudentDashboard: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  // --- Navigation State ---
  const [activeView, setActiveView] = useState<StudentView>("landing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- History Data ---
  const [newStudentHistory, setNewStudentHistory] = useState<NewStudentData[]>(
    [],
  );
  const [monitoringHistory, setMonitoringHistory] = useState<MonitoringData[]>(
    [],
  );
  const [certificateHistory, setCertificateHistory] = useState<
    CertificateData[]
  >([]);
  const [medicineIssuanceHistory, setMedicineIssuanceHistory] = useState<
    MedicineIssuanceData[]
  >([]);
  const [laboratoryRequestHistory, setLaboratoryRequestHistory] = useState<
    LaboratoryRequestData[]
  >([]);

  // --- Notifications ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Upload Modal State ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showFaceCaptureModal, setShowFaceCaptureModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===================== HANDLERS =====================

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate("/");
    }, 1200);
  };

  // --- Form Submit Handlers ---
  const handleNewStudentSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "physicalExam" as const,
      name: formData.get("name") as string,
      gender: formData.get("gender") as string,
      course: formData.get("course") as string,
      year: formData.get("year") as string,
      date: formData.get("date") as string,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("New Student form submitted successfully!");
      form.reset();
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };

  const handleMedMonitoringSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "monitoring" as const,
      arrival: formData.get("arrival") as string,
      patientName: formData.get("patientName") as string,
      sex: formData.get("sex") as string,
      degree: formData.get("degree") as string,
      studentNo: formData.get("studentNo") as string,
      symptoms: formData.get("symptoms") as string,
      action: formData.get("action") as string,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("Medical Monitoring form submitted successfully!");
      form.reset();
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };

  const handleMedCertSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "certificate" as const,
      name: formData.get("name") as string,
      age: formData.get("age") as string,
      sex: formData.get("sex") as string,
      civilStatus: formData.get("status") as string,
      school: formData.get("school") as string,
      idNumber: formData.get("idNumber") as string,
      date: formData.get("date") as string,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("Medical Certificate form submitted successfully!");
      form.reset();
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };

  const handleMedicineIssuanceSubmit = async (formData: {
    date: string;
    course: string;
    medicines: { name: string; quantity: number }[];
  }) => {
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "medicineIssuance" as const,
      date: formData.date,
      course: formData.course,
      medicines: formData.medicines,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("Medicine Issuance form submitted successfully!");
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };

  const handleLaboratoryRequestSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "laboratoryRequest" as const,
      issueDate: formData.get("issueDate") as string,
      name: formData.get("name") as string,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("Laboratory Request form submitted successfully!");
      form.reset();
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };

  // --- Data Loading ---
  const loadStudentHistory = async () => {
    if (!user?._id) return;
    try {
      const response = await medicalAPI.getStudentRecords(user._id);
      setNewStudentHistory(response.physicalExams || []);
      setMonitoringHistory(response.monitoring || []);
      setCertificateHistory(response.certificates || []);
      setMedicineIssuanceHistory(response.medicineIssuances || []);
      setLaboratoryRequestHistory(response.laboratoryRequests || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const loadNotifications = async () => {
    if (!user?._id) return;
    try {
      const response = await medicalAPI.getStudentNotifications(user._id);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleMarkAsRead = async () => {
    if (!user?._id || unreadCount === 0) return;
    try {
      await medicalAPI.markNotificationsAsRead(user._id);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const fetchStudentData = async (_isSilent = false) => {
    try {
      if (!user?._id) return;
      const [unreadRes, notifsRes] = await Promise.all([
        medicalAPI.getUnreadCount(user._id),
        medicalAPI.getStudentNotifications(user._id),
      ]);
      setUnreadCount(unreadRes.count || 0);
      setNotifications(notifsRes.notifications || []);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (!user) return;
    fetchStudentData(false);
    loadStudentHistory();

    const intervalId = setInterval(() => {
      fetchStudentData(true);
      if (activeView === "history") {
        loadStudentHistory();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user, activeView]);

  // --- Upload Handlers ---
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
    } else {
      setSelectedFile(null);
      setUploadError("");
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
            role: response.user.role,
            message: response.message,
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
      const status = err.response?.status;
      let errorMessage = "Upload failed. Please try again.";
      if (status === 400 && serverMessage === "No file uploaded") {
        errorMessage = `Upload failed: Server did not receive the file. (Check backend key or Multer setup.)`;
      } else if (serverMessage) {
        errorMessage = `Upload failed: ${serverMessage}`;
      } else if (status === 400) {
        errorMessage = "Upload failed (Bad Request).";
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

  // --- Avatar ---
  const getAvatarSrc = () => {
    if (user?.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.username || "User",
    )}&background=2c5f2d&color=fff&size=128&bold=true`;
  };

  // --- Notification Click Handler ---
  const handleNotificationsClick = () => {
    setActiveView("notifications");
    loadNotifications();
    handleMarkAsRead();
  };

  // --- Render Active View ---
  const renderView = () => {
    switch (activeView) {
      case "profile":
        return (
          <StudentProfileView
            user={user}
            getAvatarSrc={getAvatarSrc}
            onUploadClick={() => setShowUploadModal(true)}
          />
        );
      case "formOptions":
        return <StudentFormOptionsView setActiveView={setActiveView} />;
      case "newStudent":
        return (
          <NewStudentForm
            onSubmit={handleNewStudentSubmit}
            setActiveView={setActiveView}
          />
        );
      case "monitoring":
        return (
          <MonitoringForm
            onSubmit={handleMedMonitoringSubmit}
            setActiveView={setActiveView}
          />
        );
      case "certificate":
        return (
          <CertificateForm
            onSubmit={handleMedCertSubmit}
            setActiveView={setActiveView}
          />
        );
      case "medicineIssuance":
        return (
          <MedicineIssuanceForm
            onSubmit={handleMedicineIssuanceSubmit}
            setActiveView={setActiveView}
          />
        );
      case "laboratoryRequest":
        return (
          <LaboratoryRequestForm
            onSubmit={handleLaboratoryRequestSubmit}
            setActiveView={setActiveView}
          />
        );
      case "history":
        return (
          <StudentHistoryView
            newStudentHistory={newStudentHistory}
            monitoringHistory={monitoringHistory}
            certificateHistory={certificateHistory}
            medicineIssuanceHistory={medicineIssuanceHistory}
            laboratoryRequestHistory={laboratoryRequestHistory}
          />
        );
      case "notifications":
        return <StudentNotificationsView notifications={notifications} />;
      case "landing":
      default:
        return <StudentLandingView />;
    }
  };

  // ===================== JSX =====================
  return (
    <>
      <LoadingOverlay show={loggingOut} message="Signing out..." />
      <div className="d-flex">
        {/* --- Sidebar --- */}
        <StudentSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          unreadCount={unreadCount}
          onNotificationsClick={handleNotificationsClick}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        {/* --- Main Container --- */}
        <div className={`flex-grow-1 d-flex flex-column`}>
          {/* Header */}
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
              <div className="header-greeting">
                <h5
                  className="mb-0"
                  style={{
                    color: "var(--primary-green)",
                    fontWeight: 700,
                    fontSize: "1.4rem",
                    letterSpacing: "0.3px",
                  }}
                >
                  Student Portal
                </h5>
              </div>
            </div>

            <div className="user-info d-flex align-items-center gap-3">
              {activeView === "landing" && (
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "var(--text-dark)",
                    }}
                  >
                    Hello, {user?.username.split(" ")[0]}! 👋
                  </span>
                  <p
                    className="mb-0"
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Welcome to your student health portal.
                  </p>
                </div>
              )}
              <div
                className="position-relative profile-picture-container"
                onClick={() => setActiveView("profile")}
                title="View Profile"
                style={{
                  cursor: "pointer",
                  border: "3px solid var(--text-dark, #000)",
                  borderRadius: "50%",
                  width: "56px",
                  height: "56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={getAvatarSrc()}
                  alt={user?.username}
                  className="rounded-circle"
                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="content flex-grow-1">{renderView()}</div>
        </div>

        {/* --- Profile Upload Modal --- */}
        {showUploadModal && (
          <div className="modal-backdrop">
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
                  <div className="alert alert-danger mb-3">{uploadError}</div>
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
        )}

        {/* --- Face Capture Modal --- */}
        <FaceCaptureModal
          show={showFaceCaptureModal}
          onClose={() => setShowFaceCaptureModal(false)}
          onCapture={handleFaceCapture}
        />
      </div>
    </>
  );
};

export default StudentDashboard;
