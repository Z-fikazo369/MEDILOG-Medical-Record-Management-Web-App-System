import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import {
  collectCompletedWeeklyVisits,
  predictVisitForecast,
} from "../utils/visitForecastModel.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_DIR = path.join(__dirname, "..", "ml", "models", "visit_forecast");
const METADATA_PATH = path.join(MODEL_DIR, "metadata.json");
const PLOT_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "ml",
  "visit_forecast_plot.py",
);
const FORECAST_SERVICE_PATH = path.join(
  __dirname,
  "..",
  "ml",
  "visit_forecast_service.py",
);
const REPORT_MD_PATH = path.join(MODEL_DIR, "visit_forecast_report.md");
const DEFAULT_MIN_TRAIN_WEEKS = 12;

function resolveMinTrainWeeks() {
  const raw = Number.parseInt(process.env.VISIT_FORECAST_MIN_WEEKS || "", 10);
  if (Number.isNaN(raw)) return DEFAULT_MIN_TRAIN_WEEKS;
  return Math.max(8, raw);
}

const MIN_TRAIN_WEEKS = resolveMinTrainWeeks();

function toWeekLabel(row) {
  return `${row.year}-W${String(row.week).padStart(2, "0")}`;
}

async function readMetadata() {
  try {
    const content = await fs.readFile(METADATA_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function formatTableRows(
  history,
  weeklyForecast = [],
  predictedByWeek = new Map(),
) {
  const rows = history.map((row) => ({
    period: toWeekLabel(row),
    actual: row.count,
    predicted: predictedByWeek.get(toWeekLabel(row)) ?? null,
  }));

  weeklyForecast.forEach((week) => {
    rows.push({
      period:
        week.label || `${week.year}-W${String(week.week).padStart(2, "0")}`,
      actual: null,
      predicted: week.predictedVisits ?? null,
    });
  });

  return rows;
}

function markdownTable(headers, rows) {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return [head, sep, body].join("\n");
}

async function runPlotGenerator(payload) {
  const venvPython = path.join(
    __dirname,
    "..",
    "..",
    ".venv",
    "Scripts",
    "python.exe",
  );

  const candidates =
    process.platform === "win32"
      ? [venvPython, "python", "py", "python3"]
      : ["python3", "python"];

  return new Promise((resolve) => {
    const trySpawn = (index) => {
      if (index >= candidates.length) {
        resolve({
          ok: false,
          error: "No working Python interpreter found for plot generation.",
        });
        return;
      }

      const cmd = candidates[index];
      let proc;
      try {
        proc = spawn(cmd, [PLOT_SCRIPT_PATH], {
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch {
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
          resolve({ ok: false, error: "Plot generation timed out." });
        }
      }, 120000);

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      proc.on("close", (code) => {
        if (done) return;
        done = true;
        clearTimeout(timer);

        if (code !== 0) {
          if (stderr) {
            resolve({ ok: false, error: stderr.trim() });
            return;
          }
          trySpawn(index + 1);
          return;
        }

        try {
          resolve(JSON.parse(stdout || "{}"));
        } catch {
          resolve({ ok: false, error: "Invalid JSON from plot generator." });
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
    };

    trySpawn(0);
  });
}

async function runForecastService(payload) {
  const venvPython = path.join(
    __dirname,
    "..",
    "..",
    ".venv",
    "Scripts",
    "python.exe",
  );

  const candidates =
    process.platform === "win32"
      ? [venvPython, "python", "py", "python3"]
      : ["python3", "python"];

  return new Promise((resolve) => {
    const trySpawn = (index) => {
      if (index >= candidates.length) {
        resolve({
          ok: false,
          error: "No working Python interpreter found for forecast evaluation.",
        });
        return;
      }

      const cmd = candidates[index];
      let proc;
      try {
        proc = spawn(cmd, [FORECAST_SERVICE_PATH], {
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch {
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
          resolve({ ok: false, error: "Forecast service timed out." });
        }
      }, 120000);

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      proc.on("close", (code) => {
        if (done) return;
        done = true;
        clearTimeout(timer);

        if (code !== 0) {
          if (stderr) {
            resolve({ ok: false, error: stderr.trim() });
            return;
          }
          trySpawn(index + 1);
          return;
        }

        try {
          resolve(JSON.parse(stdout || "{}"));
        } catch {
          resolve({ ok: false, error: "Invalid JSON from forecast service." });
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
    };

    trySpawn(0);
  });
}

async function run() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/medilog",
    );

    const [history, predictionResult, metadata] = await Promise.all([
      collectCompletedWeeklyVisits(),
      predictVisitForecast(),
      readMetadata(),
    ]);

    if (!predictionResult.ok) {
      console.error("[ML] Forecast prediction failed:", predictionResult.error);
      process.exitCode = 1;
      return;
    }

    const weeklyForecast = predictionResult.weeklyForecast?.weeks || [];

    const evaluationResult = await runForecastService({
      action: "evaluate",
      modelDir: MODEL_DIR,
      minHistoryWeeks: MIN_TRAIN_WEEKS,
      weeklySeries: history,
    });

    if (!evaluationResult.ok) {
      console.error("[ML] Evaluation failed:", evaluationResult.error);
      process.exitCode = 1;
      return;
    }

    const metrics = evaluationResult.metrics ||
      metadata.metrics || { overall: {} };
    const evaluationPoints = evaluationResult.evaluationPoints || [];
    const predictedByWeek = new Map(
      evaluationPoints
        .filter((p) => p?.week)
        .map((p) => [String(p.week), Number(p.predicted)]),
    );
    const rows = formatTableRows(history, weeklyForecast, predictedByWeek);

    console.log("\n[ML] Visit Forecast Table");
    console.table(
      rows.map((r) => ({
        period: r.period,
        actual: r.actual ?? "-",
        predicted: r.predicted ?? "-",
      })),
    );

    console.log("\n[ML] Metrics Table");
    console.table([
      {
        scope: "overall",
        mae: metrics.overall?.mae ?? "-",
        rmse: metrics.overall?.rmse ?? "-",
        mape: metrics.overall?.mape ?? "-",
        r2: metrics.overall?.r2 ?? "-",
      },
    ]);

    console.log("\n[ML] Regression Points (Actual vs Predicted)");
    console.table(
      evaluationPoints.map((p) => ({
        period: p.week,
        actual: p.actual,
        predicted: p.predicted,
        error: p.error,
      })),
    );

    const reportMarkdown = [
      "# Visit Forecast Regression Report",
      "",
      `Generated at: ${new Date().toISOString()}`,
      "",
      "## Forecast Table",
      "",
      markdownTable(
        ["Week", "Actual Visits", "Predicted Visits"],
        rows.map((r) => [
          r.period,
          r.actual == null ? "-" : String(r.actual),
          r.predicted == null ? "-" : String(r.predicted),
        ]),
      ),
      "",
      "## Metrics Table",
      "",
      markdownTable(
        ["Scope", "MAE", "RMSE", "MAPE", "R2"],
        [
          [
            "Overall",
            String(metrics.overall?.mae ?? "-"),
            String(metrics.overall?.rmse ?? "-"),
            String(metrics.overall?.mape ?? "-"),
            String(metrics.overall?.r2 ?? "-"),
          ],
        ],
      ),
      "",
      "## Regression Points Table",
      "",
      markdownTable(
        ["Week", "Actual", "Predicted", "Error"],
        evaluationPoints.map((p) => [
          String(p.week ?? "-"),
          String(p.actual ?? "-"),
          String(p.predicted ?? "-"),
          String(p.error ?? "-"),
        ]),
      ),
      "",
    ].join("\n");

    await fs.mkdir(MODEL_DIR, { recursive: true });
    await fs.writeFile(REPORT_MD_PATH, reportMarkdown, "utf-8");

    const plotResult = await runPlotGenerator({
      evaluationPoints,
      outputDir: MODEL_DIR,
    });

    if (!plotResult.ok) {
      console.warn("[ML] Plot generation warning:", plotResult.error);
    } else {
      console.log("\n[ML] Generated visualization files:");
      console.log(`- ${plotResult.scatterChart}`);
      console.log(`- ${plotResult.residualsPlot}`);
    }

    console.log(`\n[ML] Markdown report: ${REPORT_MD_PATH}`);
  } catch (error) {
    console.error("[ML] Failed to generate report:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
