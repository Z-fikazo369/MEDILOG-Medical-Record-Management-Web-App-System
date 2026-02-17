import { useState, useEffect } from "react";
import { analyticsAPI } from "../../services/api";
import { DashboardCharts, type DashboardOverview } from "./DashboardCharts";
import {
  PredictiveAnalytics,
  type PredictiveData,
} from "./PredictiveAnalytics";

interface DashboardViewProps {
  pendingCount: number;
  onStatsLoaded?: (stats: {
    pendingCount: number;
    accountTotalCount: number;
  }) => void;
  isLimitedStaff?: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  pendingCount,
  onStatsLoaded,
  isLimitedStaff = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [mlData, setMlData] = useState<PredictiveData | null>(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlError, setMlError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [mlRetryCount, setMlRetryCount] = useState(0);

  const fetchPredictiveWithRetry = async (
    maxRetries = 2,
  ): Promise<PredictiveData | null> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await analyticsAPI.getPredictiveAnalytics();
        return result;
      } catch (err) {
        console.warn(
          `Predictive analytics attempt ${attempt + 1}/${maxRetries} failed:`,
          err,
        );
        if (attempt < maxRetries - 1) {
          // Wait 2 seconds before retrying
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
    return null;
  };

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setMlLoading(true);
      setMlError(false);

      // Fetch overview and predictive independently so one failure won't block the other
      const overviewPromise = analyticsAPI.getDashboardOverview();
      const predictivePromise = fetchPredictiveWithRetry(2);

      const [overviewResult, predictiveResult] = await Promise.allSettled([
        overviewPromise,
        predictivePromise,
      ]);

      if (overviewResult.status === "fulfilled") {
        const overview = overviewResult.value;
        setData(overview);
        setLastUpdated(new Date().toLocaleTimeString());
        onStatsLoaded?.({
          pendingCount: overview.accounts.pendingStudents,
          accountTotalCount: overview.accounts.totalAccounts,
        });
      } else {
        console.error(
          "Failed to load dashboard overview:",
          overviewResult.reason,
        );
      }

      if (
        predictiveResult.status === "fulfilled" &&
        predictiveResult.value !== null
      ) {
        setMlData(predictiveResult.value);
        setMlError(false);
      } else {
        console.error("Failed to load predictive analytics after retries");
        setMlError(true);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      if (!isSilent) setLoading(false);
      setMlLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-success"
          style={{ width: "3rem", height: "3rem" }}
        ></div>
        <p className="mt-3 text-muted">Loading Dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Failed to load dashboard data. Please try refreshing.
      </div>
    );
  }

  const growth = parseFloat(data.records.growth);
  const growthColor =
    growth > 0 ? "text-success" : growth < 0 ? "text-danger" : "text-muted";
  const growthIcon =
    growth > 0
      ? "bi-arrow-up-short"
      : growth < 0
        ? "bi-arrow-down-short"
        : "bi-dash";

  return (
    <div className="fade-in">
      {/* ===== HEADER ===== */}
      <div className="d-flex justify-content-end align-items-end mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
            <i className="bi bi-clock me-1"></i>
            Last updated: {lastUpdated}
          </span>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => fetchDashboardData(true)}
            title="Refresh"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* ===== TOP STAT CARDS (5) — hidden for limited staff ===== */}
      {!isLimitedStaff && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg">
            <div className="dashboard-stat-card">
              <div className="dsc-icon green">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="dsc-body">
                <div className="dsc-value">
                  {data.accounts.totalStudents.toLocaleString()}
                </div>
                <div className="dsc-label">Students</div>
                <div className={`dsc-sub ${growthColor}`}>
                  <i className={`bi ${growthIcon}`}></i>
                  {Math.abs(growth)}% this month
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg">
            <div className="dashboard-stat-card">
              <div className="dsc-icon blue">
                <i className="bi bi-person-gear"></i>
              </div>
              <div className="dsc-body">
                <div className="dsc-value">
                  {data.accounts.totalStaff.toLocaleString()}
                </div>
                <div className="dsc-label">Staff</div>
                <div className="dsc-sub text-primary">
                  <i className="bi bi-check-circle me-1"></i>
                  {data.accounts.totalStaff} active
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg">
            <div className="dashboard-stat-card">
              <div className="dsc-icon purple">
                <i className="bi bi-activity"></i>
              </div>
              <div className="dsc-body">
                <div className="dsc-value">
                  {data.records.totalThisMonth.toLocaleString()}
                </div>
                <div className="dsc-label">Exams</div>
                <div className="dsc-sub text-muted">
                  <i className="bi bi-clock me-1"></i>This month
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg">
            <div className="dashboard-stat-card">
              <div className="dsc-icon orange">
                <i className="bi bi-capsule"></i>
              </div>
              <div className="dsc-body">
                <div className="dsc-value">
                  {data.pharmacy.totalItems.toLocaleString()}
                </div>
                <div className="dsc-label">Pharmacy</div>
                <div
                  className={`dsc-sub ${data.pharmacy.lowStock + data.pharmacy.critical > 0 ? "text-danger" : "text-success"}`}
                >
                  <i
                    className={`bi ${data.pharmacy.lowStock + data.pharmacy.critical > 0 ? "bi-exclamation-triangle" : "bi-check-circle"} me-1`}
                  ></i>
                  {data.pharmacy.lowStock + data.pharmacy.critical > 0
                    ? `${data.pharmacy.lowStock + data.pharmacy.critical} low stock`
                    : "All stocked"}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg">
            <div className="dashboard-stat-card">
              <div className="dsc-icon teal">
                <i className="bi bi-lightning-charge-fill"></i>
              </div>
              <div className="dsc-body">
                <div className="dsc-value">
                  {data.activity.today.toLocaleString()}
                </div>
                <div className="dsc-label">Activities</div>
                <div className="dsc-sub text-info">
                  <i className="bi bi-lightning me-1"></i>Today
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAILED STATS ROW (3 cards) — hidden for limited staff ===== */}
      {!isLimitedStaff && (
        <div className="row g-3 mb-4">
          {/* Student Accounts */}
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div
                  className="d-flex align-items-center gap-2 mb-3"
                  style={{ color: "#334155" }}
                >
                  <i className="bi bi-people-fill fs-5"></i>
                  <span className="fw-bold">Student Accounts</span>
                </div>
                <DetailRow
                  label="Total Students"
                  value={data.accounts.totalStudents.toLocaleString()}
                />
                <DetailRow
                  label="Active"
                  value={data.accounts.totalStudents.toLocaleString()}
                  badgeClass="bg-success-subtle text-success"
                />
                <DetailRow
                  label="Recent Check-ups"
                  value={data.records.totalThisMonth.toLocaleString()}
                  badgeClass="bg-light text-muted"
                />
                <DetailRow
                  label="Pending Records"
                  value={data.records.totalPending.toLocaleString()}
                  badgeClass="bg-warning-subtle text-warning"
                />
              </div>
            </div>
          </div>

          {/* Staff Accounts */}
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div
                  className="d-flex align-items-center gap-2 mb-3"
                  style={{ color: "#3b82f6" }}
                >
                  <i className="bi bi-person-gear fs-5"></i>
                  <span className="fw-bold">Staff Accounts</span>
                </div>
                <DetailRow
                  label="Total Staff"
                  value={data.accounts.totalStaff.toLocaleString()}
                />
                <DetailRow
                  label="Pending Approval"
                  value={data.accounts.pendingStaff.toLocaleString()}
                  badgeClass="bg-warning-subtle text-warning"
                />
                <DetailRow
                  label="Total Accounts"
                  value={data.accounts.totalAccounts.toLocaleString()}
                  badgeClass="bg-primary-subtle text-primary"
                />
                <DetailRow
                  label="Activities This Week"
                  value={data.activity.thisWeek.toLocaleString()}
                  badgeClass="bg-success-subtle text-success"
                />
              </div>
            </div>
          </div>

          {/* Patient Records */}
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div
                  className="d-flex align-items-center gap-2 mb-3"
                  style={{ color: "#8b5cf6" }}
                >
                  <i className="bi bi-file-earmark-medical fs-5"></i>
                  <span className="fw-bold">Patient Records</span>
                </div>
                <DetailRow
                  label="Physical Exams"
                  value={
                    data.records.stats.physicalExam?.allTime?.toLocaleString() ||
                    "0"
                  }
                />
                <DetailRow
                  label="Active Monitoring"
                  value={
                    data.records.stats.monitoring?.pending?.toLocaleString() ||
                    "0"
                  }
                  badgeClass="bg-info-subtle text-info"
                />
                <DetailRow
                  label="Certificates Issued"
                  value={
                    data.records.stats.certificate?.approved?.toLocaleString() ||
                    "0"
                  }
                  badgeClass="bg-light text-muted"
                />
                <DetailRow
                  label="Lab Requests"
                  value={
                    data.records.stats.laboratoryRequest?.allTime?.toLocaleString() ||
                    "0"
                  }
                  badgeClass="bg-danger-subtle text-danger"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHARTS ROW (Monthly Trends + Activity Distribution) ===== */}
      <DashboardCharts data={data} />

      {/* ===== PREDICTIVE ANALYTICS (CatBoost ML) ===== */}
      {mlLoading ? (
        <div className="text-center py-4 mt-4">
          <div className="spinner-border spinner-border-sm text-success me-2"></div>
          <span className="text-muted">
            Loading Predictive Analytics... This may take a moment on first
            load.
          </span>
        </div>
      ) : mlData ? (
        <PredictiveAnalytics data={mlData} />
      ) : mlError ? (
        <div
          className="mt-4 p-4 rounded-4 text-center"
          style={{
            background: "rgba(99, 102, 241, 0.04)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
          }}
        >
          <div className="mb-3">
            <i
              className="bi bi-cpu-fill"
              style={{ fontSize: "2rem", color: "#6366f1" }}
            ></i>
          </div>
          <h6 className="fw-bold mb-1">Predictive Analytics</h6>
          <p className="text-muted small mb-3">
            Failed to load CatBoost ML predictions. The service may be
            temporarily unavailable.
          </p>
          <button
            className="btn btn-sm px-4 py-2"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
            }}
            onClick={async () => {
              setMlLoading(true);
              setMlError(false);
              setMlRetryCount((c) => c + 1);
              try {
                const result = await fetchPredictiveWithRetry(2);
                if (result) {
                  setMlData(result);
                  setMlError(false);
                } else {
                  setMlError(true);
                }
              } catch (err) {
                console.error("Retry predictive analytics failed:", err);
                setMlError(true);
              } finally {
                setMlLoading(false);
              }
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retry Loading
          </button>
        </div>
      ) : null}
    </div>
  );
};

/* ===== DETAIL ROW SUB-COMPONENT ===== */
const DetailRow: React.FC<{
  label: string;
  value: string;
  badgeClass?: string;
}> = ({ label, value, badgeClass }) => (
  <div
    className="d-flex justify-content-between align-items-center py-2"
    style={{ borderBottom: "1px solid #f1f5f9" }}
  >
    <span className="text-muted fw-medium small">{label}</span>
    {badgeClass ? (
      <span
        className={`badge ${badgeClass} px-2 py-1`}
        style={{ fontSize: "0.75rem", fontWeight: 700 }}
      >
        {value}
      </span>
    ) : (
      <span className="fw-bold small">{value}</span>
    )}
  </div>
);

export default DashboardView;
