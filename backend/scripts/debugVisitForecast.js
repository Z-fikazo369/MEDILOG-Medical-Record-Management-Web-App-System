import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
sixMonthsAgo.setHours(0, 0, 0, 0);

const collections = [
  "medicalmonitorings",
  "medicalcertificates",
  "physicalexams",
  "medicineissuances",
  "laboratoryrequests",
];

const dailyCounts = {};

for (const col of collections) {
  const results = await db
    .collection(col)
    .aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
  results.forEach((r) => {
    dailyCounts[r._id] = (dailyCounts[r._id] || 0) + r.count;
  });
}

// Fill all days in range
const today = new Date();
const cursor = new Date(sixMonthsAgo);
const allDays = [];
while (cursor <= today) {
  const key = cursor.toISOString().split("T")[0];
  allDays.push({ date: key, count: dailyCounts[key] || 0 });
  cursor.setDate(cursor.getDate() + 1);
}

console.log("\n📊 DAILY VISIT COUNTS (last 6 months):");
console.log("Date         | Count");
console.log("-------------|------");

// Only show days with data + surrounding context
const withData = allDays.filter((d) => d.count > 0);
withData.forEach((d) => console.log(`${d.date} |  ${d.count}`));

console.log(`\n📈 Summary:`);
console.log(`  Total days in range : ${allDays.length}`);
console.log(`  Days with visits    : ${withData.length}`);
console.log(`  Days with 0 visits  : ${allDays.length - withData.length}`);

const counts = allDays.map((d) => d.count);
const unique = [...new Set(counts)].sort((a, b) => a - b);
console.log(`  Unique count values : [${unique.join(", ")}]`);

// Show the training split analysis (lookback=14)
const lookback = 14;
const trainY = counts.slice(lookback, Math.floor(counts.length * 0.8));
const valY = counts.slice(Math.floor(counts.length * 0.8));
const trainUnique = [...new Set(trainY)];
const valUnique = [...new Set(valY)];

console.log(`\n🔬 CatBoost Training Analysis:`);
console.log(`  Total samples       : ${counts.length - lookback}`);
console.log(`  Train samples       : ${trainY.length}`);
console.log(`  Val samples         : ${valY.length}`);
console.log(
  `  Train unique targets: [${trainUnique.sort((a, b) => a - b).join(", ")}]`,
);
console.log(
  `  Val unique targets  : [${valUnique.sort((a, b) => a - b).join(", ")}]`,
);
console.log(
  `  ALL EQUAL in train? : ${trainUnique.length <= 1 ? "YES ← THIS IS THE PROBLEM" : "NO"}`,
);

await mongoose.disconnect();
