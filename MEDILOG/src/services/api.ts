// File: services/api.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  // ❌ REMOVED: Default Content-Type header that was breaking FormData uploads
});

// ✅ Interceptor para sa Token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ CRITICAL FIX: Only set Content-Type to JSON if NOT FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    // ✅ If it IS FormData, let Axios automatically set multipart/form-data

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ✅ Interceptor para sa 401 (Expired Token)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // ✅ CHECK MUNA: Baka nasa login page na, wag na mag-redirect loop
      if (window.location.pathname !== "/") {
        console.error("Unauthorized! Logging out...");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("authUser");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

// --- Interfaces ---

export interface User {
  _id: string;
  username: string;
  email: string;
  lrn: string;
  studentId: string;
  role: "student" | "admin" | "staff";
  position?: string;
  employeeId?: string;
  status: "pending" | "approved" | "rejected";
  defaultLoginMethod?: "email" | "studentId";
  isVerified: boolean;
  firstLoginCompleted: boolean;
  rememberMe: boolean;
  profilePictureUrl?: string;
  department?: string;
  program?: string;
  yearLevel?: string;
}

export interface AuthResponse {
  role: any;
  message: string;
  user: User;
  token: string;
  requiresOTP?: boolean;
  email?: string;
}

export interface PaginatedRecordsResponse {
  records: any[];
  recordType: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface SignupData {
  username: string;
  email: string;
  password?: string;
  lrn: string;
  studentId: string;
  preferredLoginMethod?: "email" | "studentId";
  role: "student" | "admin";
}

export interface LoginData {
  email: string;
  password: string;
  role?: "student" | "admin";
  captchaToken: string;
}

export interface OTPData {
  email: string;
  otp: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordData {
  email: string;
  loginRole?: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordData {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface MedicalRecordData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  recordType: "newStudent" | "monitoring" | "certificate";
  [key: string]: any;
}
export interface DashboardInsights {
  topProgram: {
    name: string;
    count: number;
  };
  symptomTrend: {
    thisWeek: number;
    lastWeek: number;
    changePercentage: number;
  };
}

export type SortConfig = {
  key: string;
  order: "asc" | "desc";
};

// --- Auth API (UPDATED with Backup Functions) ---
export const authAPI = {
  signup: async (data: FormData) => {
    const response = await api.post("/users", data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post("/login", data);
    return response.data;
  },

  verifyOTP: async (data: OTPData): Promise<AuthResponse> => {
    const response = await api.post("/verify-otp", data);
    return response.data;
  },

  resendOTP: async (email: string) => {
    const response = await api.post("/resend-otp", { email });
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    const response = await api.post("/forgot-password", data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData) => {
    const response = await api.post("/reset-password", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.post("/users/change-password", data);
    return response.data;
  },

  getPendingAccounts: async () => {
    const response = await api.get("/accounts/pending");
    return response.data;
  },

  getAllStudentAccounts: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/accounts/all?page=${page}&limit=${limit}`);
    return response.data;
  },

  approveAccount: async (userId: string, adminId: string) => {
    const response = await api.post(`/accounts/${userId}/approve`, {
      adminId,
    });
    return response.data;
  },

  rejectAccount: async (userId: string, adminId: string, reason?: string) => {
    const response = await api.post(`/accounts/${userId}/reject`, {
      adminId,
      reason,
    });
    return response.data;
  },

  getTotalStudentCount: async (): Promise<{ totalCount: number }> => {
    const response = await api.get("/accounts/total");
    return response.data;
  },

  deleteStudentAccount: async (userId: string) => {
    const response = await api.delete(`/accounts/${userId}`);
    return response.data;
  },

  updateStudentAccount: async (
    userId: string,
    data: {
      username?: string;
      email?: string;
      lrn?: string;
      studentId?: string;
      status?: string;
    },
  ) => {
    const response = await api.put(`/accounts/${userId}`, data);
    return response.data;
  },

  // --- Staff Account Management ---
  getAllStaffAccounts: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/staff/all?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPendingStaffAccounts: async () => {
    const response = await api.get("/staff/pending");
    return response.data;
  },

  getTotalStaffCount: async (): Promise<{ totalCount: number }> => {
    const response = await api.get("/staff/total");
    return response.data;
  },

  deleteStaffAccount: async (userId: string) => {
    const response = await api.delete(`/staff/${userId}`);
    return response.data;
  },

  updateStaffAccount: async (
    userId: string,
    data: {
      username?: string;
      email?: string;
      employeeId?: string;
      position?: string;
      status?: string;
    },
  ) => {
    const response = await api.put(`/staff/${userId}`, data);
    return response.data;
  },

  createSystemBackup: async () => {
    const response = await api.post("/users/backup/create");
    return response.data;
  },

  getBackupList: async () => {
    const response = await api.get("/users/backup/list");
    return response.data;
  },

  downloadBackup: async (filename: string) => {
    const response = await api.get(`/users/backup/download/${filename}`, {
      responseType: "blob",
    });
    return response;
  },

  restoreSystem: async (formData: FormData) => {
    const response = await api.post("/users/backup/restore", formData);
    return response.data;
  },
};

// --- User API ---
export const userAPI = {
  uploadProfilePicture: async (userId: string, formData: FormData) => {
    const response = await api.post(`/users/${userId}/upload-pfp`, formData);
    return response.data;
  },
};

// --- Medical API ---
export const medicalAPI = {
  createRecord: async (data: any) => {
    const response = await api.post("/records", data);
    return response.data;
  },

  getStudentRecords: async (studentId: string, type?: string) => {
    const url = type
      ? `/records/student/${studentId}?type=${type}`
      : `/records/student/${studentId}`;
    const response = await api.get(url);
    return response.data;
  },

  getAllRecords: async (
    type?: string,
    page: number = 1,
    sortConfig: SortConfig[] = [{ key: "createdAt", order: "desc" }],
    limit: number = 10,
    filters: Record<string, string> = {},
  ): Promise<PaginatedRecordsResponse> => {
    const sortBy = sortConfig.map((s) => s.key).join(",");
    const sortOrder = sortConfig.map((s) => s.order).join(",");

    const filterParams = Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    let url = type
      ? `/records/all?type=${type}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${limit}`
      : `/records/all?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${limit}`;
    if (filterParams) url += `&${filterParams}`;

    const response = await api.get(url);
    return response.data;
  },

  updateRecord: async (id: string, recordType: string, data: any) => {
    const response = await api.put(`/records/${id}`, { recordType, ...data });
    return response.data;
  },

  deleteRecord: async (id: string, recordType: string) => {
    const response = await api.delete(
      `/records/${id}?recordType=${recordType}`,
    );
    return response.data;
  },

  bulkDeleteRecords: async (ids: string[], recordType: string) => {
    const response = await api.post("/records/bulk-delete", {
      ids,
      recordType,
    });
    return response.data;
  },

  bulkUpdateStatus: async (
    ids: string[],
    recordType: string,
    status: "approved" | "rejected",
    adminId: string,
  ) => {
    const response = await api.post("/records/bulk-update-status", {
      ids,
      recordType,
      status,
      adminId,
    });
    return response.data;
  },

  getAggregation: async (
    recordType: string,
    dateFrom?: string,
    dateTo?: string,
    extraFilters?: Record<string, string>,
  ) => {
    let url = `/records/aggregation?recordType=${recordType}`;
    if (dateFrom) url += `&dateFrom=${dateFrom}`;
    if (dateTo) url += `&dateTo=${dateTo}`;
    if (extraFilters) {
      Object.entries(extraFilters)
        .filter(([, v]) => v)
        .forEach(([k, v]) => {
          url += `&${k}=${encodeURIComponent(v)}`;
        });
    }
    const response = await api.get(url);
    return response.data;
  },

  exportTallyRecords: async (
    recordType: string,
    dateFrom?: string,
    dateTo?: string,
    extraFilters?: Record<string, string>,
  ) => {
    let url = `/records/tally-export?recordType=${recordType}`;
    if (dateFrom) url += `&dateFrom=${dateFrom}`;
    if (dateTo) url += `&dateTo=${dateTo}`;
    if (extraFilters) {
      Object.entries(extraFilters)
        .filter(([, v]) => v)
        .forEach(([k, v]) => {
          url += `&${k}=${encodeURIComponent(v)}`;
        });
    }
    const response = await api.get(url, { responseType: "blob" });
    return response;
  },

  exportRecords: async (
    recordType: string,
    format: "csv" | "excel" = "csv",
    sortConfig: SortConfig[],
    filters: Record<string, string> = {},
  ) => {
    const sortBy = sortConfig.map((s) => s.key).join(",");
    const sortOrder = sortConfig.map((s) => s.order).join(",");

    const filterParams = Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    let url = `/records/export?recordType=${recordType}&format=${format}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    if (filterParams) url += `&${filterParams}`;

    const response = await api.get(url, {
      responseType: "blob",
    });
    return response;
  },

  getPendingRecordCounts: async () => {
    const response = await api.get("/records/pending-counts");
    return response.data;
  },

  getStudentNotifications: async (studentId: string) => {
    const response = await api.get(`/notifications/student/${studentId}`);
    return response.data;
  },

  getUnreadCount: async (studentId: string) => {
    const response = await api.get(
      `/notifications/student/${studentId}/unread-count`,
    );
    return response.data;
  },

  markNotificationsAsRead: async (studentId: string) => {
    const response = await api.post(
      `/notifications/student/${studentId}/mark-read`,
    );
    return response.data;
  },

  // Admin notifications
  getAdminNotifications: async () => {
    const response = await api.get("/notifications/admin");
    return response.data;
  },

  getAdminUnreadCount: async () => {
    const response = await api.get("/notifications/admin/unread-count");
    return response.data;
  },

  markAdminNotificationsAsRead: async () => {
    const response = await api.post("/notifications/admin/mark-read");
    return response.data;
  },

  getMedicineList: async () => {
    const response = await api.get("/pharmacy/medicine-list");
    return response.data;
  },
};

// ✅ Admin Management API (Activity Logs, etc.)
export const adminAPI = {
  getActivityLogs: async (
    params: {
      page?: number;
      limit?: number;
      action?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      staffId?: string;
    } = {},
  ) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.action) searchParams.set("action", params.action);
    if (params.search) searchParams.set("search", params.search);
    if (params.startDate) searchParams.set("startDate", params.startDate);
    if (params.endDate) searchParams.set("endDate", params.endDate);
    if (params.staffId) searchParams.set("staffId", params.staffId);
    const response = await api.get(
      `/users/activity-logs?${searchParams.toString()}`,
    );
    return response.data;
  },

  getStaffSummary: async () => {
    const response = await api.get("/users/activity-logs/staff-summary");
    return response.data;
  },
};

export const analyticsAPI = {
  getDashboardInsights: async (): Promise<DashboardInsights> => {
    const response = await api.get("/analytics/insights");
    return response.data;
  },

  getDashboardOverview: async () => {
    const response = await api.get("/analytics/dashboard-overview");
    return response.data;
  },

  getPredictiveAnalytics: async () => {
    const response = await api.get("/analytics/predictive", {
      timeout: 120000, // 2 minutes — CatBoost ML training can be slow on first load
    });
    return response.data;
  },
};

// ✅ AI Assistant API
export const aiAssistantAPI = {
  getStats: async () => {
    const response = await api.get("/ai-assistant/stats");
    return response.data;
  },

  getTranscriptions: async (
    page: number = 1,
    limit: number = 20,
    type?: string,
  ) => {
    let url = `/ai-assistant/transcriptions?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    const response = await api.get(url);
    return response.data;
  },

  saveTranscription: async (data: {
    type: "audio" | "image";
    title?: string;
    transcriptionText?: string;
    extractedText?: string;
    audioDuration?: number;
    originalFileName?: string;
    wordCount?: number;
    patientName?: string;
  }) => {
    const response = await api.post("/ai-assistant/transcriptions", data);
    return response.data;
  },

  // NEW: Upload audio file for Groq Whisper transcription + Llama summary
  uploadAudioConsultation: async (formData: FormData) => {
    const response = await api.post(
      "/ai-assistant/transcriptions/audio",
      formData,
      { timeout: 120000 }, // 2 min — Whisper can be slow on long audio
    );
    return response.data;
  },

  uploadImageOCR: async (formData: FormData) => {
    const response = await api.post(
      "/ai-assistant/transcriptions/ocr",
      formData,
    );
    return response.data;
  },

  uploadPDF: async (formData: FormData) => {
    const response = await api.post(
      "/ai-assistant/transcriptions/pdf",
      formData,
    );
    return response.data;
  },

  regenerateSummary: async (id: string) => {
    const response = await api.post(
      `/ai-assistant/transcriptions/${id}/regenerate-summary`,
    );
    return response.data;
  },

  deleteTranscription: async (id: string) => {
    const response = await api.delete(`/ai-assistant/transcriptions/${id}`);
    return response.data;
  },
};

export default api;
