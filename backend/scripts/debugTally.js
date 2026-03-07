import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

console.log("\n📊 DEBUG TALLY AGGREGATION:");
console.log("===========================\n");

// Simulate the exact aggregation from the controller
const dateFrom = "2026-02-14";
const dateTo = "2026-03-07";
const courseFilter = "Bachelor of Science in Computer Science";

const startDate = new Date(dateFrom);
startDate.setHours(0, 0, 0, 0);
const endDate = new Date(dateTo);
endDate.setHours(23, 59, 59, 999);

console.log("Input dates:", { dateFrom, dateTo });
console.log("Parsed dates:", {
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
});
console.log("Course filter:", courseFilter);

// Build pipeline exactly like the controller
const basePipeline = [
  {
    $addFields: {
      parsedDate: {
        $dateFromString: {
          dateString: { $substr: ["$date", 0, 10] },
          format: "%Y-%m-%d",
          onError: "$createdAt",
          onNull: "$createdAt",
        },
      },
    },
  },
  { $match: { parsedDate: { $gte: startDate, $lte: endDate } } },
];

const extraMatch = [
  { $match: { course: { $regex: new RegExp(courseFilter, "i") } } },
];

console.log("\nBase pipeline:", JSON.stringify(basePipeline, null, 2));
console.log("\nExtra match:", JSON.stringify(extraMatch, null, 2));

// First test: just date filter
console.log("\n--- Test 1: Date filter only ---");
const test1 = await db
  .collection("physicalexams")
  .aggregate([
    ...basePipeline,
    { $project: { date: 1, course: 1, parsedDate: 1 } },
  ])
  .toArray();
console.log("Records after date filter:", test1.length);
test1.forEach((r, i) =>
  console.log(
    `${i + 1}. date: ${r.date}, course: ${r.course}, parsedDate: ${r.parsedDate}`,
  ),
);

// Second test: date + course filter
console.log("\n--- Test 2: Date + course filter ---");
const test2 = await db
  .collection("physicalexams")
  .aggregate([
    ...basePipeline,
    ...extraMatch,
    { $project: { date: 1, course: 1, parsedDate: 1 } },
  ])
  .toArray();
console.log("Records after date + course filter:", test2.length);
test2.forEach((r, i) =>
  console.log(`${i + 1}. date: ${r.date}, course: ${r.course}`),
);

// Third test: full aggregation
console.log("\n--- Test 3: Full aggregation (grouped) ---");
const test3 = await db
  .collection("physicalexams")
  .aggregate([
    ...basePipeline,
    ...extraMatch,
    {
      $group: {
        _id: { course: "$course", year: "$year", gender: "$gender" },
        studentCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        course: "$_id.course",
        year: "$_id.year",
        gender: "$_id.gender",
        studentCount: 1,
      },
    },
    { $sort: { course: 1, year: 1 } },
  ])
  .toArray();
console.log("Grouped result:", test3);

await mongoose.disconnect();
console.log("\n✅ Done");
