import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const counts = {
  "Test Students": await db
    .collection("users")
    .countDocuments({ email: { $regex: "@medilog.seed" } }),
  "Medical Monitoring": await db
    .collection("medicalmonitorings")
    .countDocuments({ adminNotes: "CATBOOST_TEST_SEED" }),
  "Medical Certificates": await db
    .collection("medicalcertificates")
    .countDocuments({ adminNotes: "CATBOOST_TEST_SEED" }),
  "Physical Exams": await db
    .collection("physicalexams")
    .countDocuments({ adminNotes: "CATBOOST_TEST_SEED" }),
  "Medicine Issuance": await db
    .collection("medicineissuances")
    .countDocuments({ adminNotes: "CATBOOST_TEST_SEED" }),
  "Laboratory Requests": await db
    .collection("laboratoryrequests")
    .countDocuments({ adminNotes: "CATBOOST_TEST_SEED" }),
};

console.log("\n📊 SEED DATA IN MONGODB:");
console.log("========================");
let total = 0;
for (const [name, count] of Object.entries(counts)) {
  console.log(`  ${name.padEnd(22)}: ${count}`);
  total += count;
}
console.log(`  ${"TOTAL".padEnd(22)}: ${total}\n`);

// Show a sample record
const sample = await db
  .collection("medicalmonitorings")
  .findOne({ adminNotes: "CATBOOST_TEST_SEED" });
if (sample) {
  console.log("📝 Sample Medical Monitoring record:");
  console.log(`  Student  : ${sample.studentName}`);
  console.log(`  Symptoms : ${sample.symptoms}`);
  console.log(`  Created  : ${sample.createdAt}`);
  console.log(`  Status   : ${sample.status}\n`);
}

await mongoose.disconnect();
