import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import MedicalMonitoring from "../models/MedicalMonitoring.js";
import PhysicalExam from "../models/PhysicalExam.js";
import MedicalCertificate from "../models/MedicalCertificate.js";
import MedicineIssuance from "../models/MedicineIssuance.js";
import LaboratoryRequest from "../models/LaboratoryRequest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPT = path.join(
  __dirname,
  "..",
  "ml",
  "visit_forecast_service.py",
);
const MODEL_DIR = path.join(__dirname, "..", "ml", "models", "visit_forecast");

const VISIT_MODELS = [
  PhysicalExam,
  MedicalMonitoring,
  MedicalCertificate,
  MedicineIssuance,
  LaboratoryRequest,
];

const DEFAULT_MIN_TRAIN_WEEKS = 12;

function resolveMinTrainWeeks() {
  const raw = Number.parseInt(process.env.VISIT_FORECAST_MIN_WEEKS || "", 10);
  if (Number.isNaN(raw)) return DEFAULT_MIN_TRAIN_WEEKS;
  return Math.max(8, raw);
}

const MIN_TRAIN_WEEKS = resolveMinTrainWeeks();

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addMonths(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function parseMonthKey(key) {
  const [y, m] = key.split("-");
  return { year: Number(y), month: Number(m) };
}

function weekKey(year, week) {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function toWeekLabel(row) {
  return weekKey(row.year, row.week);
}

function getCurrentWeekStart() {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - mondayOffset);
  return now;
}

function isoWeekToDate(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const day = simple.getUTCDay();
  const isoWeekStart = new Date(simple);

  if (day <= 4 && day !== 0) {
    isoWeekStart.setUTCDate(simple.getUTCDate() - day + 1);
  } else {
    isoWeekStart.setUTCDate(simple.getUTCDate() + 8 - (day || 7));
  }

  return new Date(
    isoWeekStart.getUTCFullYear(),
    isoWeekStart.getUTCMonth(),
    isoWeekStart.getUTCDate(),
  );
}

function dateToIsoWeek(dateValue) {
  const date = new Date(
    Date.UTC(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
    ),
  );

  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);

  return {
    year: date.getUTCFullYear(),
    week,
  };
}

function buildContinuousWeeklySeries(weekCounts, minWeekDate, maxWeekDate) {
  const result = [];
  const cursor = new Date(minWeekDate);

  while (cursor <= maxWeekDate) {
    const { year, week } = dateToIsoWeek(cursor);
    const key = weekKey(year, week);
    result.push({
      year,
      week,
      count: weekCounts.get(key) || 0,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  return result;
}

function buildMonthlyEstimate(weeklyForecastRows = []) {
  return weeklyForecastRows.reduce(
    (sum, row) => sum + Number(row?.predictedVisits || 0),
    0,
  );
}

function buildContinuousSeries(monthCounts, minMonthDate, maxMonthDate) {
  const result = [];
  const cursor = new Date(minMonthDate);

  while (cursor <= maxMonthDate) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const key = monthKey(year, month);
    result.push({
      year,
      month,
      count: monthCounts.get(key) || 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

async function runVisitForecastPython(payload) {
  const venvPython = path.join(
    __dirname,
    "..",
    "..",
    ".venv",
    "Scripts",
    "python.exe",
  );
  const pythonCandidates =
    process.platform === "win32"
      ? [venvPython, "python", "py", "python3"]
      : ["python3", "python"];

  return new Promise((resolve) => {
    function trySpawn(index) {
      if (index >= pythonCandidates.length) {
        resolve({ ok: false, error: "No working Python interpreter found." });
        return;
      }

      const cmd = pythonCandidates[index];
      let proc;

      try {
        proc = spawn(cmd, [PYTHON_SCRIPT], {
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error) {
        trySpawn(index + 1);
        return;
      }

      let stdout = "";
      let stderr = "";
      let done = false;

      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          proc.kill();
          resolve({
            ok: false,
            error: "Python service timed out after 120 seconds.",
          });
        }
      }, 120000);

      proc.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      proc.on("close", (code) => {
        if (done) return;
        done = true;
        clearTimeout(timer);

        if (code !== 0) {
          // If interpreter exists but script failed, do not keep retrying endlessly.
          if (stderr) {
            resolve({
              ok: false,
              error: `Python exited with code ${code}: ${stderr.trim()}`,
            });
            return;
          }
          trySpawn(index + 1);
          return;
        }

        try {
          const parsed = JSON.parse(stdout || "{}");
          resolve(parsed);
        } catch (error) {
          resolve({
            ok: false,
            error: "Failed to parse Python JSON response.",
          });
        }
      });

      proc.on("error", () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        trySpawn(index + 1);
      });

      proc.stdin.write(JSON.stringify(payload));
      proc.stdin.end();
    }

    trySpawn(0);
  });
}

export async function collectCompletedMonthlyVisits() {
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const monthlyResults = await Promise.all(
    VISIT_MODELS.map((model) =>
      model.aggregate([
        { $match: { createdAt: { $lt: currentMonthStart } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ),
  );

  const monthCounts = new Map();

  monthlyResults.forEach((arr) => {
    arr.forEach((item) => {
      const year = item._id?.year;
      const month = item._id?.month;
      if (!year || !month) return;
      const key = monthKey(year, month);
      monthCounts.set(
        key,
        (monthCounts.get(key) || 0) + Number(item.count || 0),
      );
    });
  });

  if (monthCounts.size === 0) {
    return [];
  }

  const sortedKeys = [...monthCounts.keys()].sort();
  const first = parseMonthKey(sortedKeys[0]);

  const minMonthDate = new Date(first.year, first.month - 1, 1);
  const lastCompletedMonthDate = addMonths(currentMonthStart, -1);

  if (minMonthDate > lastCompletedMonthDate) {
    return [];
  }

  return buildContinuousSeries(
    monthCounts,
    minMonthDate,
    lastCompletedMonthDate,
  );
}

export async function collectCompletedWeeklyVisits(options = {}) {
  const { includeCurrentWeek = false } = options;
  const currentWeekStart = getCurrentWeekStart();
  const lastCompletedWeekStart = new Date(currentWeekStart);
  lastCompletedWeekStart.setDate(lastCompletedWeekStart.getDate() - 7);

  const cutoffDate = includeCurrentWeek ? new Date() : currentWeekStart;
  const currentIso = dateToIsoWeek(currentWeekStart);
  const currentWeekKey = weekKey(currentIso.year, currentIso.week);

  const weeklyResults = await Promise.all(
    VISIT_MODELS.map((model) =>
      model.aggregate([
        { $match: { createdAt: { $lt: cutoffDate } } },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: "$createdAt" },
              week: { $isoWeek: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ),
  );

  const weekCounts = new Map();

  weeklyResults.forEach((arr) => {
    arr.forEach((item) => {
      const year = item._id?.year;
      const week = item._id?.week;
      if (!year || !week) return;
      const key = weekKey(year, week);
      weekCounts.set(key, (weekCounts.get(key) || 0) + Number(item.count || 0));
    });
  });

  if (weekCounts.size === 0) {
    return [];
  }

  const sortedKeys = [...weekCounts.keys()].sort();
  const [firstYearPart, firstWeekPart] = sortedKeys[0].split("-W");
  const minWeekDate = isoWeekToDate(
    Number(firstYearPart),
    Number(firstWeekPart),
  );

  const maxWeekDate =
    includeCurrentWeek && weekCounts.has(currentWeekKey)
      ? currentWeekStart
      : lastCompletedWeekStart;

  if (minWeekDate > maxWeekDate) {
    return [];
  }

  return buildContinuousWeeklySeries(weekCounts, minWeekDate, maxWeekDate);
}

export async function trainVisitForecastModel() {
  let weeklySeries = await collectCompletedWeeklyVisits();
  let includesCurrentWeek = false;

  if (weeklySeries.length < MIN_TRAIN_WEEKS) {
    const weeklySeriesWithCurrent = await collectCompletedWeeklyVisits({
      includeCurrentWeek: true,
    });

    if (weeklySeriesWithCurrent.length > weeklySeries.length) {
      weeklySeries = weeklySeriesWithCurrent;
      includesCurrentWeek = true;
    }
  }

  if (weeklySeries.length < MIN_TRAIN_WEEKS) {
    return {
      ok: false,
      statusCode: 400,
      error: `Not enough weekly data to train. Need at least ${MIN_TRAIN_WEEKS} weeks. Found ${weeklySeries.length}.`,
      foundWeeks: weeklySeries.length,
      requiredWeeks: MIN_TRAIN_WEEKS,
      hint: "Current week is only counted if it already has visit data. Add more weekly history or retry after more data is encoded.",
    };
  }

  const serviceResult = await runVisitForecastPython({
    action: "train",
    modelDir: MODEL_DIR,
    minHistoryWeeks: MIN_TRAIN_WEEKS,
    weeklySeries,
  });

  if (!serviceResult?.ok) {
    return {
      ok: false,
      statusCode: 500,
      error: serviceResult?.error || "Training failed.",
      foundWeeks: weeklySeries.length,
      requiredWeeks: MIN_TRAIN_WEEKS,
    };
  }

  return {
    ok: true,
    statusCode: 200,
    ...serviceResult,
    weeklyForecast: {
      basis: "model-weekly",
      weeks: serviceResult?.nextWeeklyForecast || [],
      monthlyEstimate: buildMonthlyEstimate(
        serviceResult?.nextWeeklyForecast || [],
      ),
    },
    dataSummary: {
      completedWeeksUsed: weeklySeries.length,
      includesCurrentWeek,
      latestFourWeeks: weeklySeries.slice(-4),
    },
  };
}

export async function predictVisitForecast() {
  const weeklySeries = await collectCompletedWeeklyVisits();
  const weeklySeriesWithCurrent = await collectCompletedWeeklyVisits({
    includeCurrentWeek: true,
  });

  if (weeklySeries.length < 3) {
    return {
      ok: false,
      statusCode: 400,
      error:
        "Not enough completed weekly data to predict. Need at least 3 weeks.",
      foundWeeks: weeklySeries.length,
    };
  }

  let currentWeekProgress = null;
  if (weeklySeriesWithCurrent.length > weeklySeries.length) {
    const currentWeekRow =
      weeklySeriesWithCurrent[weeklySeriesWithCurrent.length - 1];
    const lastCompletedRow = weeklySeries[weeklySeries.length - 1];

    if (
      !lastCompletedRow ||
      currentWeekRow.year !== lastCompletedRow.year ||
      currentWeekRow.week !== lastCompletedRow.week
    ) {
      currentWeekProgress = {
        year: currentWeekRow.year,
        week: currentWeekRow.week,
        label: toWeekLabel(currentWeekRow),
        actual: currentWeekRow.count,
        predicted: null,
        isPartial: true,
      };
    }
  }

  const serviceResult = await runVisitForecastPython({
    action: "predict",
    modelDir: MODEL_DIR,
    weeklySeries,
  });

  if (!serviceResult?.ok) {
    const isMissingModel = (serviceResult?.error || "")
      .toLowerCase()
      .includes("model not found");

    return {
      ok: false,
      statusCode: isMissingModel ? 404 : 500,
      error: serviceResult?.error || "Prediction failed.",
    };
  }

  const evaluateResult = await runVisitForecastPython({
    action: "evaluate",
    modelDir: MODEL_DIR,
    minHistoryWeeks: MIN_TRAIN_WEEKS,
    weeklySeries,
  });

  const predictedByWeek = new Map(
    (evaluateResult?.evaluationPoints || [])
      .filter((point) => point?.week)
      .map((point) => [String(point.week), Number(point.predicted)]),
  );

  const weeklyHistory = weeklySeries.slice(-12).map((row) => {
    const label = toWeekLabel(row);
    return {
      year: row.year,
      week: row.week,
      label,
      actual: row.count,
      predicted: predictedByWeek.get(label) ?? null,
    };
  });

  const nextWeeklyForecast = (serviceResult?.nextWeeklyForecast || []).map(
    (row) => ({
      ...row,
      label: row?.label || weekKey(row?.year, row?.week),
    }),
  );

  const monthlyEstimate =
    Number(serviceResult?.monthlyEstimate) ||
    buildMonthlyEstimate(nextWeeklyForecast);

  if (currentWeekProgress) {
    const matchingForecast = nextWeeklyForecast.find(
      (row) => row.label === currentWeekProgress.label,
    );
    if (typeof matchingForecast?.predictedVisits === "number") {
      currentWeekProgress.predicted = matchingForecast.predictedVisits;
    }
  }

  return {
    ok: true,
    statusCode: 200,
    ...serviceResult,
    nextForecast: {
      targetMonth: { label: "Next 4 Weeks" },
      predictedVisits: monthlyEstimate,
    },
    weeklyForecast: {
      basis: "model-weekly",
      weeks: nextWeeklyForecast,
      monthlyEstimate,
    },
    currentWeekProgress,
    weeklyHistory,
    history: weeklyHistory,
  };
}
