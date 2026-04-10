import dotenv from "dotenv";
import mongoose from "mongoose";
import { predictVisitForecast } from "../utils/visitForecastModel.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/medilog",
    );
    console.log("[ML] Connected to MongoDB.");

    const result = await predictVisitForecast();

    if (!result.ok) {
      console.error("[ML] Prediction failed:", result.error);
      process.exitCode = 1;
      return;
    }

    console.log("[ML] Prediction complete.");
    console.log(
      JSON.stringify(
        {
          nextForecast: result.nextForecast,
          weeklyForecast: result.weeklyForecast,
          lastCompletedWeek: result.lastCompletedWeek,
          currentWeekProgress: result.currentWeekProgress,
          weeklyHistory: result.weeklyHistory,
          history: result.history,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("[ML] Unexpected prediction error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
