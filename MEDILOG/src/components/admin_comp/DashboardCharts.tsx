import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ==================== INTERFACES ====================

export interface RecordTypeStats {
  thisMonth: number;
  lastMonth: number;
  allTime: number;
  pending: number;
  approved: number;
  rejected: number;
  todayCount: number;
}

export interface DashboardOverview {
  accounts: {
    totalStudents: number;
    totalStaff: number;
    pendingStudents: number;
    pendingStaff: number;
    totalAccounts: number;
  };
  records: {
    stats: Record<string, RecordTypeStats>;
    totalThisMonth: number;
    totalLastMonth: number;
    totalAllTime: number;
    totalPending: number;
    growth: string;
  };
  pharmacy: {
    totalItems: number;
    totalStock: number;
    adequate: number;
    lowStock: number;
    critical: number;
    lowStockItems: {
      name: string;
      stock: number;
      minStock: number;
      status: string;
      unit: string;
    }[];
  };
  monthlyTrends: {
    month: string;
    physicalExam: number;
    monitoring: number;
    certificate: number;
    medicineIssuance: number;
    laboratoryRequest: number;
    total: number;
  }[];
  statusDistribution: {
    pending: number;
    approved: number;
    rejected: number;
  };
  recordsByType: { name: string; value: number }[];
  activity: {
    total: number;
    today: number;
    thisWeek: number;
  };
  topCourses: { _id: string; count: number }[];
  genderDistribution: { name: string; value: number }[];
}

interface DashboardChartsProps {
  data: DashboardOverview;
}

// ==================== COLOR PALETTE ====================
const CHART_COLORS = {
  emerald: "#10b981",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  orange: "#f97316",
  teal: "#14b8a6",
};

const ACTIVITY_COLORS = [
  { name: "Patient Mgmt", color: "#3b82f6" },
  { name: "Monitoring", color: "#10b981" },
  { name: "Exams", color: "#f97316" },
  { name: "Certificates", color: "#a855f7" },
  { name: "Pharmacy", color: "#14b8a6" },
];

// ==================== COMPONENT ====================
export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  const trendData = data.monthlyTrends;

  // Activity distribution for donut chart
  const latestMonth = trendData[trendData.length - 1];
  const totalLatest = latestMonth
    ? latestMonth.physicalExam +
      latestMonth.monitoring +
      latestMonth.certificate +
      latestMonth.medicineIssuance +
      latestMonth.laboratoryRequest
    : 1;

  const activityData = latestMonth
    ? [
        {
          name: "Physical Exams",
          value: Math.round((latestMonth.physicalExam / totalLatest) * 100),
          color: "#3b82f6",
        },
        {
          name: "Monitoring",
          value: Math.round((latestMonth.monitoring / totalLatest) * 100),
          color: "#10b981",
        },
        {
          name: "Certificates",
          value: Math.round((latestMonth.certificate / totalLatest) * 100),
          color: "#f97316",
        },
        {
          name: "Medicine",
          value: Math.round((latestMonth.medicineIssuance / totalLatest) * 100),
          color: "#a855f7",
        },
        {
          name: "Lab Requests",
          value: Math.round(
            (latestMonth.laboratoryRequest / totalLatest) * 100,
          ),
          color: "#14b8a6",
        },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="row g-3 mb-4">
      {/* Monthly Trends (Line Chart) */}
      <div className="col-12 col-lg-6">
        <div
          className="card shadow-sm h-100"
          style={{
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #10b981",
          }}
        >
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <i
                className="bi bi-graph-up-arrow fs-5"
                style={{ color: "#334155" }}
              ></i>
              <h6 className="fw-bold mb-0">Monthly Trends</h6>
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={CHART_COLORS.emerald}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS.emerald }}
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="physicalExam"
                    stroke={CHART_COLORS.purple}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS.purple }}
                    name="Exams"
                  />
                  <Line
                    type="monotone"
                    dataKey="certificate"
                    stroke={CHART_COLORS.blue}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS.blue }}
                    name="Certificates"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div
              className="d-flex justify-content-center gap-3 mt-2"
              style={{ fontSize: "0.75rem" }}
            >
              <span className="d-flex align-items-center gap-1 text-muted">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: CHART_COLORS.emerald,
                    display: "inline-block",
                  }}
                ></span>{" "}
                Total
              </span>
              <span className="d-flex align-items-center gap-1 text-muted">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: CHART_COLORS.purple,
                    display: "inline-block",
                  }}
                ></span>{" "}
                Exams
              </span>
              <span className="d-flex align-items-center gap-1 text-muted">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: CHART_COLORS.blue,
                    display: "inline-block",
                  }}
                ></span>{" "}
                Certificates
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Distribution (Donut Chart) */}
      <div className="col-12 col-lg-6">
        <div
          className="card shadow-sm h-100"
          style={{
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #3b82f6",
          }}
        >
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <i
                className="bi bi-activity fs-5"
                style={{ color: "#334155" }}
              ></i>
              <h6 className="fw-bold mb-0">
                Activity Distribution (This Month)
              </h6>
            </div>
            <div className="d-flex align-items-center">
              {/* Legend */}
              <div
                className="d-flex flex-column gap-2 ps-2"
                style={{ width: "45%" }}
              >
                {activityData.map((item, idx) => (
                  <div
                    key={idx}
                    className="d-flex justify-content-between align-items-center small"
                    style={{ paddingRight: "1rem" }}
                  >
                    <span style={{ color: item.color, fontWeight: 500 }}>
                      {item.name}
                    </span>
                    <span className="text-muted">{item.value}%</span>
                  </div>
                ))}
              </div>
              {/* Donut */}
              <div style={{ width: "55%", height: 240 }}>
                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {activityData.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={entry.color}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                    No data yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
