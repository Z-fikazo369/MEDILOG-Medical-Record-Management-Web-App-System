import { useState, useEffect } from "react";
import { analyticsAPI } from "../../services/api";
import { DashboardCharts, type DashboardOverview } from "./DashboardCharts";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface VisitForecastResponse {
  forecast?: {
    targetMonth?: {
      year?: number;
      month?: number;
      label?: string;
    };
    predictedVisits?: number;
  };
  weeklyForecast?: {
    basis?: string;
    monthlyEstimate?: number;
    weeks?: {
      year?: number;
      week?: number;
      label?: string;
      predictedVisits?: number;
      sharePercent?: number;
    }[];
  };
  weeklyHistory?: {
    year?: number;
    week?: number;
    month?: number;
    count?: number;
    label?: string;
    actual?: number;
    predicted?: number | null;
  }[];
  history?: {
    year?: number;
    week?: number;
    month?: number;
    count?: number;
    label?: string;
    actual?: number;
    predicted?: number | null;
  }[];
  lastCompletedWeek?: {
    year?: number;
    week?: number;
    label?: string;
  };
  currentWeekProgress?: {
    year?: number;
    week?: number;
    label?: string;
    actual?: number;
    predicted?: number | null;
    isPartial?: boolean;
  };
  modelMetadata?: {
    trainedAt?: string;
  };
}

function isoWeekStartDate(year: number, week: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const day = simple.getUTCDay();
  const isoStart = new Date(simple);

  if (day <= 4 && day !== 0) {
    isoStart.setUTCDate(simple.getUTCDate() - day + 1);
  } else {
    isoStart.setUTCDate(simple.getUTCDate() + 8 - (day || 7));
  }

  return new Date(
    isoStart.getUTCFullYear(),
    isoStart.getUTCMonth(),
    isoStart.getUTCDate(),
  );
}

function toDateStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekOrLabelToDateStamp(item: {
  year?: number;
  week?: number;
  month?: number;
  label?: string;
}): string | null {
  if (
    typeof item.year === "number" &&
    typeof item.week === "number" &&
    item.week > 0
  ) {
    return toDateStamp(isoWeekStartDate(item.year, item.week));
  }

  if (
    typeof item.year === "number" &&
    typeof item.month === "number" &&
    item.month > 0
  ) {
    return toDateStamp(new Date(item.year, item.month - 1, 1));
  }

  if (typeof item.label === "string") {
    const isoMatch = item.label.match(/^(\d{4})-W(\d{2})$/);
    if (isoMatch) {
      const y = Number(isoMatch[1]);
      const w = Number(isoMatch[2]);
      return toDateStamp(isoWeekStartDate(y, w));
    }

    const dateLike = item.label.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateLike) {
      return item.label;
    }
  }

  return null;
}

interface DashboardViewProps {
  pendingCount: number;
  onStatsLoaded?: (stats: {
    pendingCount: number;
    accountTotalCount: number;
  }) => void;
  isLimitedStaff?: boolean;
  isSuperAdminOrHead?: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  pendingCount,
  onStatsLoaded,
  isLimitedStaff = false,
  isSuperAdminOrHead = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [visitForecast, setVisitForecast] =
    useState<VisitForecastResponse | null>(null);
  const [forecastError, setForecastError] = useState("");
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const overview = await analyticsAPI.getDashboardOverview();
      setData(overview);
      setLastUpdated(new Date().toLocaleTimeString());
      onStatsLoaded?.({
        pendingCount: overview.accounts.pendingStudents,
        accountTotalCount: overview.accounts.totalAccounts,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchVisitForecast = async (isSilent = false) => {
    try {
      if (!isSilent) setForecastLoading(true);
      const result = await analyticsAPI.getVisitForecast();
      setVisitForecast(result);
      setForecastError("");
    } catch (error) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } };
          }
        )?.response?.data?.message || "Visit forecast unavailable.";
      setForecastError(message);
      console.error("Failed to load visit forecast:", error);
    } finally {
      if (!isSilent) setForecastLoading(false);
    }
  };

  const refreshAllData = async (isSilent = false) => {
    await Promise.all([
      fetchDashboardData(isSilent),
      fetchVisitForecast(isSilent),
    ]);
  };

  const handleRetrain = async () => {
    try {
      setRetrainLoading(true);
      setRetrainMessage("");
      const result = await analyticsAPI.retrainVisitForecast();
      const baseMessage = result?.message || "Visit forecast model retrained.";
      const detailParts: string[] = [];

      if (typeof result?.dataSummary?.completedWeeksUsed === "number") {
        detailParts.push(`used ${result.dataSummary.completedWeeksUsed} weeks`);
      }
      if (result?.dataSummary?.includesCurrentWeek === true) {
        detailParts.push("included current week");
      }

      const details =
        detailParts.length > 0 ? ` (${detailParts.join(", ")})` : "";
      setRetrainMessage(`${baseMessage}${details}`);
      await fetchVisitForecast(true);
    } catch (error) {
      const responseData = (
        error as {
          response?: {
            data?: {
              message?: string;
              hint?: string;
              foundWeeks?: number;
              requiredWeeks?: number;
            };
          };
        }
      )?.response?.data;
      const fallbackErrorText =
        (error as { message?: string; code?: string })?.message ||
        "Failed to retrain visit forecast.";

      const baseMessage = responseData?.message || fallbackErrorText;

      const detailParts: string[] = [];
      if (
        typeof responseData?.foundWeeks === "number" &&
        typeof responseData?.requiredWeeks === "number"
      ) {
        detailParts.push(
          `(found ${responseData.foundWeeks}/${responseData.requiredWeeks} weeks)`,
        );
      }
      if (responseData?.hint) {
        detailParts.push(responseData.hint);
      }

      const details = detailParts.length > 0 ? ` ${detailParts.join(" ")}` : "";
      setRetrainMessage(`Failed: ${baseMessage}${details}`);
      console.error("Visit forecast retrain failed:", error);
    } finally {
      setRetrainLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData(false);
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

  const forecastTargetLabel =
    visitForecast?.forecast?.targetMonth?.label || "N/A";
  const predictedVisits = visitForecast?.forecast?.predictedVisits;
  const weeklyForecast = visitForecast?.weeklyForecast;
  const weeklyRows = weeklyForecast?.weeks || [];
  const monthlyEstimate =
    typeof weeklyForecast?.monthlyEstimate === "number"
      ? weeklyForecast.monthlyEstimate
      : predictedVisits;
  const lastCompletedDateStamp = weekOrLabelToDateStamp({
    year: visitForecast?.lastCompletedWeek?.year,
    week: visitForecast?.lastCompletedWeek?.week,
    label: visitForecast?.lastCompletedWeek?.label,
  });
  const lastCompletedLabel = lastCompletedDateStamp || "No completed week yet";
  const retrainIsError = retrainMessage.toLowerCase().includes("failed");

  const weeklyHistory =
    visitForecast?.weeklyHistory && visitForecast.weeklyHistory.length > 0
      ? visitForecast.weeklyHistory
      : visitForecast?.history || [];
  const currentWeekProgress = visitForecast?.currentWeekProgress;
  const currentWeekLabel = currentWeekProgress
    ? weekOrLabelToDateStamp(currentWeekProgress) ||
      currentWeekProgress.label ||
      "Current week"
    : "";

  type ChartPoint = {
    period: string;
    actual: number | null;
    predicted: number | null;
    kind: "history" | "current-week-progress" | "forecast";
  };

  const chartMap = new Map<string, ChartPoint>();

  const upsertChartPoint = (
    period: string | null,
    values: Partial<Omit<ChartPoint, "period">>,
  ) => {
    if (!period) return;

    const existing = chartMap.get(period) || {
      period,
      actual: null,
      predicted: null,
      kind: "forecast" as const,
    };

    chartMap.set(period, {
      ...existing,
      ...values,
    });
  };

  weeklyHistory.forEach((item) => {
    const period = weekOrLabelToDateStamp(item);
    const actual =
      typeof item.actual === "number"
        ? item.actual
        : typeof item.count === "number"
          ? item.count
          : null;
    const predicted =
      typeof item.predicted === "number" ? item.predicted : null;

    upsertChartPoint(period, {
      actual,
      predicted,
      kind: "history",
    });
  });

  if (currentWeekProgress) {
    const period = weekOrLabelToDateStamp(currentWeekProgress);
    const actual =
      typeof currentWeekProgress.actual === "number"
        ? currentWeekProgress.actual
        : null;
    const predicted =
      typeof currentWeekProgress.predicted === "number"
        ? currentWeekProgress.predicted
        : null;

    upsertChartPoint(period, {
      actual,
      predicted,
      kind: "current-week-progress",
    });
  }

  weeklyRows.forEach((item) => {
    const period = weekOrLabelToDateStamp(item);
    const predicted =
      typeof item.predictedVisits === "number" ? item.predictedVisits : null;

    if (predicted === null) return;

    const existing = period ? chartMap.get(period) : null;
    upsertChartPoint(period, {
      predicted,
      kind:
        existing?.kind === "history" ||
        existing?.kind === "current-week-progress"
          ? existing.kind
          : "forecast",
    });
  });

  const chartData = [...chartMap.values()].sort((a, b) =>
    a.period.localeCompare(b.period),
  );

  const maxSeriesValue = chartData.reduce((max, item) => {
    const actualValue = typeof item.actual === "number" ? item.actual : 0;
    const predValue = typeof item.predicted === "number" ? item.predicted : 0;
    const value = Math.max(actualValue, predValue);
    return value > max ? value : max;
  }, 0);
  const yAxisBase = Math.max(10, maxSeriesValue);
  const yAxisPadding = Math.max(6, Math.ceil(yAxisBase * 0.12));
  const yAxisMax = Math.ceil((yAxisBase + yAxisPadding) / 5) * 5;

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
    <div
      className={`fade-in dashboard-view ${isSuperAdminOrHead ? "dashboard-super" : ""}`}
    >
      {/* ===== HEADER ===== */}
      <div className="dashboard-toolbar d-flex justify-content-end align-items-end">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
            <i className="bi bi-clock me-1"></i>
            Last updated: {lastUpdated}
          </span>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => refreshAllData(true)}
            title="Refresh"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {isLimitedStaff && (
        <div
          className="card shadow-sm mb-4"
          style={{ border: "1px solid #e5e7eb" }}
        >
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(14, 116, 144, 0.12)",
                      color: "#0e7490",
                    }}
                  >
                    <i
                      className="bi bi-graph-up-arrow"
                      style={{ fontSize: "0.9rem" }}
                    ></i>
                  </span>
                  <span className="fw-bold" style={{ color: "#0f172a" }}>
                    Visit Forecast
                  </span>
                </div>
                <div className="small text-muted">
                  Forecast window: <strong>{forecastTargetLabel}</strong>
                </div>
              </div>

              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleRetrain}
                disabled={retrainLoading}
              >
                {retrainLoading ? "Retraining..." : "Retrain Model"}
              </button>
            </div>

            {forecastLoading ? (
              <div className="small text-muted">Loading visit forecast...</div>
            ) : forecastError ? (
              <div className="alert alert-warning mb-0 py-2 px-3 small">
                {forecastError}
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-12">
                  <div
                    className="p-3 rounded-3"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(240,253,244,0.95) 0%, rgba(236,253,245,0.85) 100%)",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <div
                      className="small mb-2"
                      style={{ color: "#166534", fontWeight: 600 }}
                    >
                      Weekly Actual vs Predicted
                    </div>
                    <div style={{ height: 230 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="2 6"
                            stroke="#dcfce7"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="period"
                            tickFormatter={(value) => String(value)}
                            interval="preserveStartEnd"
                            tick={{ fontSize: 11, fill: "#166534" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            domain={[0, yAxisMax]}
                            tick={{ fontSize: 11, fill: "#166534" }}
                            tickCount={6}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#14532d",
                              border: "none",
                              borderRadius: 10,
                              color: "#f0fdf4",
                            }}
                            labelStyle={{ color: "#bbf7d0", fontWeight: 700 }}
                            itemStyle={{ color: "#f0fdf4" }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            name="Actual"
                            stroke="#16a34a"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              fill: "#ffffff",
                              stroke: "#16a34a",
                              strokeWidth: 2,
                            }}
                            activeDot={{
                              r: 6,
                              fill: "#dcfce7",
                              stroke: "#15803d",
                              strokeWidth: 2,
                            }}
                            connectNulls={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            name="Predicted"
                            stroke="#eab308"
                            strokeWidth={3}
                            strokeDasharray="8 4"
                            dot={{
                              r: 4,
                              fill: "#ffffff",
                              stroke: "#eab308",
                              strokeWidth: 2,
                            }}
                            activeDot={{
                              r: 6,
                              fill: "#fef9c3",
                              stroke: "#a16207",
                              strokeWidth: 2,
                            }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div className="small text-muted mb-1">
                      Monthly Estimate (next 4 weeks sum)
                    </div>
                    <div
                      className="fw-bold"
                      style={{ fontSize: "1.6rem", color: "#0f172a" }}
                    >
                      {typeof monthlyEstimate === "number"
                        ? monthlyEstimate.toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div className="small text-muted mb-1">
                      Last Completed Week
                    </div>
                    <div className="fw-semibold" style={{ color: "#1e293b" }}>
                      {lastCompletedLabel}
                    </div>
                  </div>
                </div>

                {currentWeekProgress && (
                  <div className="col-12">
                    <div
                      className="p-3 rounded-3"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <div className="small text-muted mb-1">
                            Current Week (In-progress)
                          </div>
                          <div
                            className="fw-semibold"
                            style={{ color: "#1e293b" }}
                          >
                            {currentWeekLabel}
                          </div>
                        </div>
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                          Partial actual
                        </span>
                      </div>
                      <div className="small mt-2" style={{ color: "#334155" }}>
                        Actual so far:{" "}
                        {typeof currentWeekProgress.actual === "number"
                          ? currentWeekProgress.actual.toLocaleString()
                          : "-"}
                        {typeof currentWeekProgress.predicted === "number"
                          ? ` | Predicted: ${currentWeekProgress.predicted.toLocaleString()}`
                          : ""}
                      </div>
                    </div>
                  </div>
                )}

                {weeklyRows.length > 0 && (
                  <div className="col-12">
                    <div
                      className="p-3 rounded-3"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <div className="small text-muted">
                          Weekly Prediction (next 4 weeks)
                        </div>
                        <div className="small text-muted">
                          Basis: Model-weekly forecast
                        </div>
                      </div>

                      <div className="row g-2">
                        {weeklyRows.map((week) => (
                          <div
                            className="col-6 col-md-3"
                            key={`${week.year}-${week.week}-${week.label}`}
                          >
                            <div
                              className="p-2 rounded-2 h-100"
                              style={{
                                border: "1px solid #dbeafe",
                                background: "#eff6ff",
                              }}
                            >
                              <div className="small text-muted">
                                {weekOrLabelToDateStamp(week) ||
                                  week.label ||
                                  "Forecast week"}
                              </div>
                              <div
                                className="fw-semibold"
                                style={{ color: "#1e3a8a" }}
                              >
                                {typeof week.predictedVisits === "number"
                                  ? week.predictedVisits.toLocaleString()
                                  : "-"}
                              </div>
                              <div className="small text-muted">
                                {typeof week.sharePercent === "number"
                                  ? `${week.sharePercent}% share`
                                  : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {retrainMessage && (
              <div
                className={`mt-3 small ${retrainIsError ? "text-danger" : "text-success"}`}
              >
                {retrainMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TOP STAT CARDS (5) — hidden for limited staff ===== */}
      {!isLimitedStaff && (
        <div className="dashboard-stat-grid">
          <div className="dashboard-stat-cell">
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
          <div className="dashboard-stat-cell">
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
          <div className="dashboard-stat-cell">
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
          <div className="dashboard-stat-cell">
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
          <div className="dashboard-stat-cell">
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
        <div
          className={`dashboard-detail-grid ${isSuperAdminOrHead ? "dashboard-detail-grid-super" : ""}`}
        >
          {/* Student Accounts */}
          <div className="dashboard-detail-cell">
            <div
              className="card shadow-sm h-100 dashboard-section-card"
              style={{
                border: "1px solid #e5e7eb",
                borderLeft: "4px solid #2c5f2d",
              }}
            >
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
          <div className="dashboard-detail-cell">
            <div
              className="card shadow-sm h-100 dashboard-section-card"
              style={{
                border: "1px solid #e5e7eb",
                borderLeft: "4px solid #3b82f6",
              }}
            >
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

          {!isSuperAdminOrHead && (
            <div className="dashboard-detail-cell">
              <div
                className="card shadow-sm h-100 dashboard-section-card"
                style={{
                  border: "1px solid #e5e7eb",
                  borderLeft: "4px solid #8b5cf6",
                }}
              >
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
          )}
        </div>
      )}

      {/* ===== CHARTS ROW (Monthly Trends + Activity Distribution) ===== */}
      {!isSuperAdminOrHead && (
        <div className="dashboard-chart-wrap">
          <DashboardCharts data={data} />
        </div>
      )}
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
