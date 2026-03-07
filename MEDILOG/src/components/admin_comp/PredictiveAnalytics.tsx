import {
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ==================== INTERFACES ====================
export interface PredictiveData {
  forecast: {
    month: string;
    actual: number | null;
    predicted: number | null;
  }[];
  forecastIncrease: string;
  riskRadar: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
  stockForecasts: {
    name: string;
    daysLeft: number;
    status: "CRITICAL" | "WARNING" | "NORMAL";
    stockoutDate: string;
    currentStock: number;
    unit: string;
    widthPercent: number;
  }[];
  studentRisk: {
    name: string;
    value: number;
    color: string;
  }[];
  totalStudents: number;
  mlMetrics: {
    accuracy: string;
    precision: string;
    recall: string;
    f1Score: string;
    aucRoc: string;
    method?: string;
    modelsActive?: number;
  };
}

interface PredictiveAnalyticsProps {
  data: PredictiveData;
}

// ==================== SUB-COMPONENTS ====================

const MLMetricCard: React.FC<{
  title: string;
  value: string;
  width: string;
}> = ({ title, value, width }) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-body p-3">
      <div className="text-muted small fw-medium mb-1">{title}</div>
      <div className="fw-bold fs-5" style={{ color: "#1e293b" }}>
        {value}%
      </div>
      <div
        className="mt-2 rounded-pill overflow-hidden"
        style={{ height: 6, background: "#f1f5f9" }}
      >
        <div
          className="rounded-pill h-100"
          style={{
            width,
            background: "#6366f1",
            transition: "width 0.8s ease",
          }}
        ></div>
      </div>
    </div>
  </div>
);

const StockItem: React.FC<{
  name: string;
  daysLeft: number;
  status: string;
  stockoutDate: string;
  widthPercent: number;
  currentStock: number;
  unit: string;
}> = ({
  name,
  daysLeft,
  status,
  stockoutDate,
  widthPercent,
  currentStock,
  unit,
}) => {
  const statusClasses: Record<string, string> = {
    CRITICAL: "bg-danger-subtle text-danger border border-danger-subtle",
    WARNING: "bg-warning-subtle text-warning border border-warning-subtle",
    NORMAL: "bg-success-subtle text-success border border-success-subtle",
  };

  const barColors: Record<string, string> = {
    CRITICAL: "#ef4444",
    WARNING: "#f59e0b",
    NORMAL: "#10b981",
  };

  return (
    <div
      className="p-3 rounded-3 mb-2"
      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span className="fw-bold small" style={{ color: "#334155" }}>
          {name}
        </span>
        <span
          className={`badge ${statusClasses[status] || statusClasses.NORMAL}`}
          style={{ fontSize: "0.65rem", fontWeight: 700 }}
        >
          {status}
        </span>
      </div>
      <div
        className="d-flex justify-content-between mb-2"
        style={{ fontSize: "0.7rem", color: "#94a3b8" }}
      >
        <span>
          <i className="bi bi-clock me-1"></i>
          {daysLeft >= 999 ? "No usage data" : `${daysLeft} days left`}
        </span>
        <span>
          {daysLeft < 999
            ? `Stockout: ${stockoutDate}`
            : `Stock: ${currentStock} ${unit}`}
        </span>
      </div>
      <div
        className="rounded-pill overflow-hidden"
        style={{ height: 6, background: "#e2e8f0" }}
      >
        <div
          className="rounded-pill h-100"
          style={{
            width: `${widthPercent}%`,
            background: barColors[status] || barColors.NORMAL,
            transition: "width 0.6s ease",
          }}
        ></div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  data,
}) => {
  const metrics = [
    {
      title: "Accuracy",
      value: data.mlMetrics.accuracy,
      width: `${data.mlMetrics.accuracy}%`,
    },
    {
      title: "Precision",
      value: data.mlMetrics.precision,
      width: `${data.mlMetrics.precision}%`,
    },
    {
      title: "Recall",
      value: data.mlMetrics.recall,
      width: `${data.mlMetrics.recall}%`,
    },
    {
      title: "F1-Score",
      value: data.mlMetrics.f1Score,
      width: `${data.mlMetrics.f1Score}%`,
    },
    {
      title: "AUC-ROC",
      value: data.mlMetrics.aucRoc,
      width: `${data.mlMetrics.aucRoc}%`,
    },
  ];

  const isCatBoost = data.mlMetrics.method === "catboost";
  const modelsActive = data.mlMetrics.modelsActive || 0;

  return (
    <div
      className="mt-4 p-4 rounded-4"
      style={{
        background: "rgba(99, 102, 241, 0.04)",
        border: "1px solid rgba(99, 102, 241, 0.15)",
      }}
    >
      {/* Forecast + Risk Radar */}
      <div className="row g-3 mb-4">
        {/* Patient Visit Forecast */}
        <div className="col-12 col-lg-6">
          <div
            className="card shadow-sm h-100"
            style={{
              border: "1px solid #e5e7eb",
              borderLeft: "4px solid #8b5cf6",
            }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(139, 92, 246, 0.1)",
                      color: "#8b5cf6",
                    }}
                  >
                    <i
                      className="bi bi-activity"
                      style={{ fontSize: "0.85rem" }}
                    ></i>
                  </span>
                  <span className="fw-bold small">Patient Visit Forecast</span>
                  <span
                    className="badge ms-2"
                    style={{
                      fontSize: "0.55rem",
                      background: "rgba(79,70,229,0.1)",
                      color: "#4f46e5",
                      fontWeight: 700,
                    }}
                  >
                    CatBoost
                  </span>
                </div>
                <span
                  className="badge"
                  style={{
                    fontSize: "0.6rem",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  95% Confidence
                </span>
              </div>

              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.forecast}>
                    <defs>
                      <linearGradient
                        id="colorActual"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorPred"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorActual)"
                      name="Actual Visits"
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#8b5cf6"
                      strokeDasharray="5 5"
                      fillOpacity={0.6}
                      fill="url(#colorPred)"
                      name="Predicted"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div
                className="d-flex justify-content-center gap-4 mt-2"
                style={{ fontSize: "0.7rem", fontWeight: 500 }}
              >
                <span style={{ color: "#10b981" }}>—●— Actual Visits</span>
                <span style={{ color: "#8b5cf6" }}>
                  - -●- - Predicted Visits
                </span>
              </div>

              <div
                className="mt-2 p-2 rounded-2"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.72rem",
                  color: "#64748b",
                }}
              >
                <i className="bi bi-exclamation-triangle me-1"></i>
                Forecasts future patient visit volumes by analyzing historical
                visit patterns, seasonal trends, and clinic activity data to
                predict how many patients are expected per month — helping staff
                prepare resources ahead of time.
              </div>

              <div
                className="mt-3 p-2 rounded-2"
                style={{
                  background: "rgba(139, 92, 246, 0.06)",
                  border: "1px solid rgba(139, 92, 246, 0.15)",
                  fontSize: "0.75rem",
                  color: "#6d28d9",
                }}
              >
                <strong>Model Insight:</strong> Predicted{" "}
                {data.forecastIncrease}% increase in patient visits over next 4
                months. Consider staff scheduling adjustments.
              </div>
            </div>
          </div>
        </div>

        {/* Disease Risk Predictions */}
        <div className="col-12 col-lg-6">
          <div
            className="card shadow-sm h-100"
            style={{
              border: "1px solid #e5e7eb",
              borderLeft: "4px solid #10b981",
            }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                    }}
                  >
                    <i
                      className="bi bi-exclamation-triangle"
                      style={{ fontSize: "0.85rem" }}
                    ></i>
                  </span>
                  <span className="fw-bold small">
                    Disease Risk Predictions
                  </span>
                  <span
                    className="badge ms-2"
                    style={{
                      fontSize: "0.55rem",
                      background: "rgba(79,70,229,0.1)",
                      color: "#4f46e5",
                      fontWeight: 700,
                    }}
                  >
                    CatBoost
                  </span>
                </div>
                <span
                  className="badge"
                  style={{
                    fontSize: "0.6rem",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  Population Analysis
                </span>
              </div>

              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={data.riskRadar}
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Risk Score"
                      dataKey="A"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.45}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="d-flex justify-content-center mb-2">
                <span
                  className="d-flex align-items-center gap-1"
                  style={{
                    fontSize: "0.7rem",
                    color: "#ef4444",
                    fontWeight: 700,
                  }}
                >
                  ■ Risk Score
                </span>
              </div>

              <div
                className="p-2 rounded-2 mb-2"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.72rem",
                  color: "#64748b",
                }}
              >
                <i className="bi bi-exclamation-triangle me-1"></i>
                Assesses disease risk levels across multiple categories by
                evaluating aggregated student health records, consultation
                frequency, and diagnosed conditions to calculate a risk score
                per disease — enabling early intervention for high-risk areas.
              </div>

              <div className="row g-2 mt-1" style={{ fontSize: "0.75rem" }}>
                {data.riskRadar.map((item, idx) => (
                  <div key={idx} className="col-6">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">{item.subject}</span>
                      <span className="fw-bold">
                        {item.A}%
                        {item.A >= 60 && (
                          <span className="text-danger ms-1">↗</span>
                        )}
                        {item.A < 30 && (
                          <span className="text-success ms-1">↘</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Stock Depletion + Student Risk */}
      <div className="row g-3">
        {/* Medicine Stock Depletion Forecast */}
        <div className="col-12 col-lg-6">
          <div
            className="card shadow-sm h-100"
            style={{
              border: "1px solid #e5e7eb",
              borderLeft: "4px solid #f97316",
            }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2"
                  style={{
                    width: 28,
                    height: 28,
                    background: "rgba(249, 115, 22, 0.1)",
                    color: "#f97316",
                  }}
                >
                  <i
                    className="bi bi-capsule"
                    style={{ fontSize: "0.85rem" }}
                  ></i>
                </span>
                <span className="fw-bold small">
                  Medicine Stock Depletion Forecast
                </span>
                <span
                  className="badge ms-2"
                  style={{
                    fontSize: "0.55rem",
                    background: "rgba(79,70,229,0.1)",
                    color: "#4f46e5",
                    fontWeight: 700,
                  }}
                >
                  CatBoost
                </span>
              </div>

              <div
                className="p-2 rounded-2 mb-3"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.72rem",
                  color: "#64748b",
                }}
              >
                <i className="bi bi-exclamation-triangle me-1"></i>
                Predicts when pharmacy medicines will run out by tracking daily
                consumption rates, dispensing history, and current stock levels
                to estimate remaining stock life for each item — so the clinic
                can reorder before supplies are depleted.
              </div>

              {data.stockForecasts.length > 0 ? (
                <>
                  {data.stockForecasts.map((item, idx) => (
                    <StockItem key={idx} {...item} />
                  ))}
                  <div
                    className="mt-3 p-2 rounded-2"
                    style={{
                      background: "rgba(249, 115, 22, 0.06)",
                      border: "1px solid rgba(249, 115, 22, 0.15)",
                      fontSize: "0.75rem",
                      color: "#c2410c",
                    }}
                  >
                    <strong>Recommendation:</strong>{" "}
                    {data.stockForecasts.some((s) => s.status === "CRITICAL")
                      ? "Reorder critical items immediately. Consider automated restocking alerts."
                      : "Stock levels are stable. Continue monitoring depletion trends."}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4 small">
                  No stock data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Health Risk Distribution */}
        <div className="col-12 col-lg-6">
          <div
            className="card shadow-sm h-100"
            style={{
              border: "1px solid #e5e7eb",
              borderLeft: "4px solid #3b82f6",
            }}
          >
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-2"
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "#3b82f6",
                    }}
                  >
                    <i
                      className="bi bi-people"
                      style={{ fontSize: "0.85rem" }}
                    ></i>
                  </span>
                  <span className="fw-bold small">
                    Student Health Risk Distribution
                  </span>
                  <span
                    className="badge ms-2"
                    style={{
                      fontSize: "0.55rem",
                      background: "rgba(79,70,229,0.1)",
                      color: "#4f46e5",
                      fontWeight: 700,
                    }}
                  >
                    CatBoost
                  </span>
                </div>

                <div
                  className="p-2 rounded-2 mb-3"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.72rem",
                    color: "#64748b",
                  }}
                >
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Categorizes students into health risk tiers by analyzing each
                  student's visit frequency, diagnosed conditions, and medical
                  history to assign a risk level — helping the clinic prioritize
                  follow-ups for at-risk students.
                </div>

                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.studentRisk}
                      barSize={40}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal
                        vertical
                        stroke="#f1f5f9"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip cursor={{ fill: "transparent" }} />
                      <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                        name="Students"
                      >
                        {data.studentRisk.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3">
                  {data.studentRisk.map((item, idx) => (
                    <div
                      key={idx}
                      className="d-flex justify-content-between align-items-center py-2 small"
                      style={{
                        borderBottom:
                          idx < data.studentRisk.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: item.color,
                            display: "inline-block",
                          }}
                        ></span>
                        <span
                          className="fw-medium"
                          style={{ color: "#475569" }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold">{item.value} students</span>
                        <span
                          className="badge"
                          style={{
                            background: "#f1f5f9",
                            color: "#64748b",
                            fontSize: "0.65rem",
                            fontWeight: 600,
                          }}
                        >
                          {data.totalStudents > 0
                            ? Math.round(
                                (item.value / data.totalStudents) * 100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="mt-3 p-2 rounded-2"
                style={{
                  background: "rgba(59, 130, 246, 0.06)",
                  border: "1px solid rgba(59, 130, 246, 0.15)",
                  fontSize: "0.75rem",
                  color: "#1e40af",
                }}
              >
                <strong>Insight:</strong>{" "}
                {data.studentRisk.find((r) => r.name === "High Risk")?.value ||
                  0}{" "}
                students flagged as high-risk. Proactive health screening
                recommended.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
