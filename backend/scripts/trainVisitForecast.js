import dotenv from "dotenv";
import mongoose from "mongoose";
import { trainVisitForecastModel } from "../utils/visitForecastModel.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/medilog",
    );
    console.log("[ML] Connected to MongoDB.");

    const result = await trainVisitForecastModel();

    if (!result.ok) {
      console.error("[ML] Training failed:", result.error);
      if (typeof result.foundWeeks === "number") {
        console.error(`[ML] Completed weeks found: ${result.foundWeeks}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log("[ML] Training complete.");
    console.log(
      JSON.stringify(
        {
          nextWeeklyForecast: result.nextWeeklyForecast,
          nextForecast: result.nextForecast,
          weeklyForecast: result.weeklyForecast,
          metrics: result.metrics,
          lastCompletedWeek: result.lastCompletedWeek,
          dataSummary: result.dataSummary,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("[ML] Unexpected training error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
