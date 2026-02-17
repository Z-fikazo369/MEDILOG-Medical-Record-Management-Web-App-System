/**
 * ============================================================
 *  MEDILOG — CatBoost Algorithm Test Data Seeder
 * ============================================================
 *  Creates 30 days of realistic medical records para ma-trigger
 *  lahat ng CatBoost models:
 *
 *    ✅ Patient Visit Forecast   (needs 24+ days of records)
 *    ✅ Disease Risk Prediction  (needs 10+ symptom/diagnosis texts)
 *    ✅ Student Health Risk      (needs 10+ students with visits)
 *    ✅ Stock Depletion Forecast (needs medicine issuance records)
 *
 *  HOW TO RUN:
 *    cd backend
 *    node scripts/seedTestData.js
 *
 *  HOW TO UNDO (delete all seeded data):
 *    node scripts/seedTestData.js --undo
 * ============================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import User from "../models/User.js";
import MedicalMonitoring from "../models/MedicalMonitoring.js";
import MedicalCertificate from "../models/MedicalCertificate.js";
import PhysicalExam from "../models/PhysicalExam.js";
import MedicineIssuance from "../models/MedicineIssuance.js";
import LaboratoryRequest from "../models/LaboratoryRequest.js";

// ==================== CONFIG ====================
const SEED_TAG = "CATBOOST_TEST_SEED"; // Used to identify & undo seeded data
const SEED_EMAIL_DOMAIN = "@medilog.seed"; // Identifies seeded users
const DAYS_TO_SEED = 90;

// ==================== HELPERS ====================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function dateOffset(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randomInt(7, 17), randomInt(0, 59), randomInt(0, 59));
  return d;
}

// ==================== TEST DATA POOLS ====================
const FIRST_NAMES = [
  "Juan",
  "Maria",
  "Jose",
  "Ana",
  "Pedro",
  "Liza",
  "Mark",
  "Jenny",
  "Carlo",
  "Sofia",
  "Miguel",
  "Ria",
  "Angelo",
  "Camille",
  "Rafael",
  "Hannah",
  "Vincent",
  "Ella",
  "Christian",
  "Nicole",
];
const LAST_NAMES = [
  "Santos",
  "Reyes",
  "Cruz",
  "Garcia",
  "Mendoza",
  "Torres",
  "Ramos",
  "Villanueva",
  "Flores",
  "Gonzales",
  "Lopez",
  "Martinez",
  "Hernandez",
  "Perez",
  "Rivera",
  "Aquino",
  "Bautista",
  "De Leon",
  "Castillo",
  "Soriano",
];
const PROGRAMS = [
  "BS Computer Science",
  "BS Information Technology",
  "BS Nursing",
  "BS Accountancy",
  "BS Psychology",
  "BS Education",
  "BS Engineering",
  "BS Business Administration",
  "BS Criminology",
  "BS Architecture",
];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const GENDERS = ["Male", "Female"];

// ===== SYMPTOM / DIAGNOSIS POOLS (for Disease Risk) =====
const SYMPTOM_POOLS = {
  respiratory: [
    "May ubo at sipon, may lagnat din po",
    "Sore throat and cough for 3 days, may trangkaso",
    "Hirap huminga, asthma attack, sneezing",
    "Cold symptoms with fever and flu-like body ache",
    "Persistent cough with phlegm, sipon at lagnat",
    "Sneezing, runny nose, mild fever",
  ],
  hypertension: [
    "Severe headache and dizziness, feeling hilo",
    "High blood pressure reading, sakit ng ulo",
    "Persistent migraine, elevated BP",
    "Hypertension symptoms — dizziness, blurred vision",
    "Sudden headache with hilo, BP high",
  ],
  mentalHealth: [
    "Anxiety and stress from exams, di makatulog",
    "Insomnia for 2 weeks, feeling depressed",
    "Panic attacks, stress-related fatigue",
    "Depression symptoms, loss of motivation, pagod",
    "Sleep problems, nervous, mental fatigue",
  ],
  cardiovascular: [
    "Chest pain and palpitations after exercise",
    "Shortness of breath, hirap huminga at dibdib",
    "Heart racing, irregular heartbeat, palpitation",
    "Cardiac concerns — chest tightness after activity",
  ],
  diabetes: [
    "Frequent urination, madalas umihi, thirsty always",
    "High blood sugar reading, diabetes concern",
    "Insulin check-up, hyperglycemia symptoms",
  ],
  general: [
    "General check-up, no specific complaints",
    "Follow-up visit for previous condition",
    "Stomach ache and nausea",
    "Back pain and body aches",
    "Allergic reaction — skin rash",
    "Eye strain and mild headache",
    "Sprained ankle from sports",
    "Minor wound from accident",
  ],
};

const DIAGNOSIS_POOLS = {
  respiratory: [
    "Upper Respiratory Tract Infection (URTI)",
    "Acute bronchitis with cough",
    "Influenza / Flu",
    "Asthma exacerbation",
  ],
  hypertension: [
    "Stage 1 Hypertension, for monitoring",
    "Migraine associated with elevated BP",
    "Tension headache, BP counseling",
  ],
  mentalHealth: [
    "Generalized Anxiety Disorder (mild)",
    "Stress-related insomnia",
    "Adjustment disorder — academic stress",
  ],
  cardiovascular: [
    "Benign palpitations, cardiac clearance",
    "Chest wall pain — musculoskeletal",
  ],
  diabetes: [
    "Pre-diabetes, blood sugar monitoring",
    "Diabetes Type 2, for follow-up",
  ],
  general: [
    "Acute gastroenteritis",
    "Allergic dermatitis",
    "Minor contusion",
    "Healthy, cleared for sports",
  ],
};

const MEDICINES = [
  { name: "Paracetamol", qty: [1, 3] },
  { name: "Ibuprofen", qty: [1, 2] },
  { name: "Amoxicillin", qty: [1, 2] },
  { name: "Cetirizine", qty: [1, 2] },
  { name: "Mefenamic Acid", qty: [1, 3] },
  { name: "Biogesic", qty: [1, 4] },
  { name: "Loperamide", qty: [1, 2] },
  { name: "Salbutamol", qty: [1, 1] },
];

// ==================== DAILY PLAN ====================
// Defines how many of each record type to create per day
// Varies to create realistic patterns (weekdays busier than weekends)
function getDailyPlan(dayIndex) {
  const isWeekend = new Date(dateOffset(dayIndex)).getDay() % 6 === 0;
  if (isWeekend) {
    return {
      monitoring: 0,
      certificate: 0,
      physicalExam: 0,
      medicineIssuance: 0,
      labRequest: 0,
    };
  }

  // Vary volume cyclically for realistic 3-month patterns
  // Simulates: start of semester (low), midterms (high), post-midterms (medium), finals (high)
  const phase = dayIndex % 30; // 30-day cycle
  const base =
    phase < 8 ? "low" : phase < 15 ? "medium" : phase < 22 ? "high" : "medium";
  const plans = {
    low: {
      monitoring: randomInt(1, 2),
      certificate: randomInt(0, 1),
      physicalExam: randomInt(0, 1),
      medicineIssuance: randomInt(0, 1),
      labRequest: randomInt(0, 1),
    },
    medium: {
      monitoring: randomInt(2, 4),
      certificate: randomInt(1, 2),
      physicalExam: randomInt(1, 2),
      medicineIssuance: randomInt(1, 2),
      labRequest: randomInt(0, 1),
    },
    high: {
      monitoring: randomInt(3, 5),
      certificate: randomInt(1, 3),
      physicalExam: randomInt(1, 3),
      medicineIssuance: randomInt(2, 3),
      labRequest: randomInt(1, 2),
    },
  };
  return plans[base];
}

// ==================== RAW INSERT (bypasses Mongoose timestamps) ====================
async function rawInsert(Model, doc, customDate) {
  const _id = new mongoose.Types.ObjectId();
  await Model.collection.insertOne({
    _id,
    ...doc,
    createdAt: customDate,
    updatedAt: customDate,
  });
  return _id;
}

// ==================== STUDENT POOL ====================
async function getOrCreateTestStudents() {
  // Check if test students exist already (identified by email domain)
  const existing = await User.find({
    email: { $regex: SEED_EMAIL_DOMAIN },
  }).lean();
  if (existing.length >= 15) {
    console.log(`  ↳ Found ${existing.length} existing test students`);
    return existing;
  }

  // Delete any partial seeded users first
  if (existing.length > 0) {
    await User.deleteMany({ email: { $regex: SEED_EMAIL_DOMAIN } });
  }

  console.log("  ↳ Creating 20 test student accounts...");
  const students = [];
  for (let i = 0; i < 20; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const gender = GENDERS[i % 2];

    const student = await User.create({
      username: `${firstName} ${lastName}`,
      email: `test.student${i + 1}${SEED_EMAIL_DOMAIN}`,
      password: "TestPassword123!",
      lrn: `LRN-SEED-${String(i + 1).padStart(4, "0")}`,
      studentId: `SEED-${String(2024000 + i)}`,
      department:
        "College of " +
        randomPick(["Engineering", "Arts", "Science", "Education"]),
      program: PROGRAMS[i % PROGRAMS.length],
      yearLevel: YEAR_LEVELS[i % 4],
      role: "student",
      status: "approved",
      isVerified: true,
      firstLoginCompleted: true,
    });
    // Store gender alongside the student for record generation
    students.push({ ...student.toObject(), _gender: gender });
  }
  return students;
}

// ==================== MAIN SEEDER ====================
async function seedData() {
  console.log("\n🌱 MEDILOG CatBoost Test Data Seeder");
  console.log("====================================\n");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");

  const students = await getOrCreateTestStudents();

  const counts = {
    monitoring: 0,
    certificate: 0,
    physicalExam: 0,
    medicineIssuance: 0,
    labRequest: 0,
  };

  console.log("\n📅 Seeding 30 days of records...\n");
  console.log("  Day | Date       | Mon | Cert | PE  | Med | Lab ");
  console.log("  ----|------------|-----|------|-----|-----|-----");

  for (let day = DAYS_TO_SEED; day >= 0; day--) {
    const plan = getDailyPlan(day);
    const date = dateOffset(day);
    const dateStr = date.toISOString().split("T")[0];

    // ----- Medical Monitoring -----
    for (let i = 0; i < plan.monitoring; i++) {
      const s = randomPick(students);
      const category = randomPick(Object.keys(SYMPTOM_POOLS));
      const symptoms = randomPick(SYMPTOM_POOLS[category]);
      const sex = s._gender || randomPick(GENDERS);

      await rawInsert(
        MedicalMonitoring,
        {
          studentId: s._id,
          studentName: s.username,
          studentEmail: s.email,
          arrival: `${randomInt(7, 16)}:${String(randomInt(0, 59)).padStart(2, "0")}`,
          patientName: s.username,
          sex,
          degree: s.program || "BS Computer Science",
          studentNo: s.studentId || "SEED-0000",
          symptoms,
          action: randomPick([
            "Rest",
            "Medication given",
            "Referred to clinic",
            "Observation",
          ]),
          meds: randomPick([
            "Paracetamol 500mg",
            "Biogesic",
            "Ibuprofen 200mg",
            "",
          ]),
          exit: `${randomInt(8, 17)}:${String(randomInt(0, 59)).padStart(2, "0")}`,
          duration: `${randomInt(10, 60)} mins`,
          personnel: "Test Nurse",
          status: "approved",
          approvedDate: date,
          adminNotes: SEED_TAG,
        },
        date,
      );
      counts.monitoring++;
    }

    // ----- Medical Certificate -----
    for (let i = 0; i < plan.certificate; i++) {
      const s = randomPick(students);
      const category = randomPick(Object.keys(DIAGNOSIS_POOLS));
      const diagnosis = randomPick(DIAGNOSIS_POOLS[category]);
      const sex = s._gender || randomPick(GENDERS);

      await rawInsert(
        MedicalCertificate,
        {
          studentId: s._id,
          studentName: s.username,
          studentEmail: s.email,
          name: s.username,
          age: String(randomInt(17, 24)),
          sex,
          civilStatus: "Single",
          school: "MEDILOG University",
          idNumber: s.studentId || "SEED-0000",
          date: dateStr,
          diagnosis,
          remarks: randomPick([
            "Fit to return to class",
            "Needs follow-up",
            "Excused from PE",
            "",
          ]),
          status: "approved",
          approvedDate: date,
          adminNotes: SEED_TAG,
        },
        date,
      );
      counts.certificate++;
    }

    // ----- Physical Exam -----
    for (let i = 0; i < plan.physicalExam; i++) {
      const s = randomPick(students);
      const gender = s._gender || randomPick(GENDERS);

      await rawInsert(
        PhysicalExam,
        {
          studentId: s._id,
          studentName: s.username,
          studentEmail: s.email,
          name: s.username,
          gender,
          course: s.program || "BS Computer Science",
          year: randomPick(YEAR_LEVELS),
          date: dateStr,
          status: "approved",
          approvedDate: date,
          adminNotes: SEED_TAG,
        },
        date,
      );
      counts.physicalExam++;
    }

    // ----- Medicine Issuance -----
    for (let i = 0; i < plan.medicineIssuance; i++) {
      const s = randomPick(students);
      const numMeds = randomInt(1, 3);
      const meds = [];
      const usedMeds = new Set();
      for (let m = 0; m < numMeds; m++) {
        let med = randomPick(MEDICINES);
        while (usedMeds.has(med.name)) med = randomPick(MEDICINES);
        usedMeds.add(med.name);
        meds.push({
          name: med.name,
          quantity: randomInt(med.qty[0], med.qty[1]),
        });
      }

      await rawInsert(
        MedicineIssuance,
        {
          studentId: s._id,
          studentName: s.username,
          studentEmail: s.email,
          date: dateStr,
          course: s.program || "BS Computer Science",
          medicines: meds,
          diagnosis: randomPick([
            "Headache",
            "Flu-like symptoms",
            "Stomach pain",
            "Fever",
            "",
          ]),
          status: "approved",
          approvedDate: date,
          adminNotes: SEED_TAG,
        },
        date,
      );
      counts.medicineIssuance++;
    }

    // ----- Laboratory Request -----
    for (let i = 0; i < plan.labRequest; i++) {
      const s = randomPick(students);

      await rawInsert(
        LaboratoryRequest,
        {
          studentId: s._id,
          studentName: s.username,
          studentEmail: s.email,
          issueDate: dateStr,
          name: s.username,
          nurseOnDuty: "Test Nurse",
          routineUrinalysisTests: {
            pregnancy: Math.random() > 0.7,
            fecalysis: Math.random() > 0.5,
          },
          cbcTests: {
            hemoglobin: true,
            hematocrit: Math.random() > 0.5,
            bloodSugar: Math.random() > 0.6,
            plateletCT: Math.random() > 0.7,
          },
          gramStain: { hpsBhTest: false, vaginalSmear: false },
          bloodChemistry: {
            fbs: Math.random() > 0.5,
            uricAcid: false,
            cholesterol: Math.random() > 0.7,
            hdl: false,
            tsh: false,
            totalProtein: false,
          },
          papSmear: { cxrInterpretation: false, ecgInterpretation: false },
          widhalTest: { salmonella: false },
          status: "approved",
          approvedDate: date,
          adminNotes: SEED_TAG,
        },
        date,
      );
      counts.labRequest++;
    }

    // Print row
    const d = day.toString().padStart(3);
    const mon = plan.monitoring.toString().padStart(3);
    const cert = plan.certificate.toString().padStart(4);
    const pe = plan.physicalExam.toString().padStart(3);
    const med = plan.medicineIssuance.toString().padStart(3);
    const lab = plan.labRequest.toString().padStart(3);
    console.log(
      `   ${d} | ${dateStr} | ${mon} | ${cert} |${pe}  |${med}  |${lab}`,
    );
  }

  console.log("\n  ────────────────────────────────────────────");
  console.log("  📊 TOTALS:");
  console.log(`     Medical Monitoring  : ${counts.monitoring}`);
  console.log(`     Medical Certificate : ${counts.certificate}`);
  console.log(`     Physical Exams      : ${counts.physicalExam}`);
  console.log(`     Medicine Issuance   : ${counts.medicineIssuance}`);
  console.log(`     Laboratory Requests : ${counts.labRequest}`);
  console.log(
    `     TOTAL RECORDS       : ${Object.values(counts).reduce((a, b) => a + b, 0)}`,
  );
  console.log(`     Test Students       : ${students.length}`);

  // ===== ALGORITHM READINESS CHECK =====
  const totalRecordDays = DAYS_TO_SEED;
  const totalTexts = counts.monitoring + counts.certificate;

  console.log("\n  ✅ ALGORITHM READINESS:");
  console.log(
    `     Visit Forecast      : ${totalRecordDays >= 24 ? "✅ READY" : "❌ Need more days"} (${totalRecordDays}/24 days)`,
  );
  console.log(
    `     Disease Risk        : ${totalTexts >= 10 ? "✅ READY" : "❌ Need more texts"} (${totalTexts}/10 texts)`,
  );
  console.log(
    `     Student Risk        : ${students.length >= 10 ? "✅ READY" : "❌ Need more students"} (${students.length}/10 students)`,
  );
  console.log(
    `     Stock Depletion     : ${counts.medicineIssuance >= 1 ? "✅ READY" : "❌ Need issuances"} (${counts.medicineIssuance} records)`,
  );

  console.log("\n  🎉 Done! Open your dashboard to see CatBoost in action.\n");

  await mongoose.disconnect();
}

// ==================== UNDO ====================
async function undoSeed() {
  console.log("\n🗑️  UNDOING seed data...\n");
  await mongoose.connect(process.env.MONGODB_URI);

  const results = await Promise.all([
    MedicalMonitoring.deleteMany({ adminNotes: SEED_TAG }),
    MedicalCertificate.deleteMany({ adminNotes: SEED_TAG }),
    PhysicalExam.deleteMany({ adminNotes: SEED_TAG }),
    MedicineIssuance.deleteMany({ adminNotes: SEED_TAG }),
    LaboratoryRequest.deleteMany({ adminNotes: SEED_TAG }),
    User.deleteMany({ email: { $regex: SEED_EMAIL_DOMAIN } }),
  ]);

  const names = [
    "MedicalMonitoring",
    "MedicalCertificate",
    "PhysicalExam",
    "MedicineIssuance",
    "LaboratoryRequest",
    "Users",
  ];
  results.forEach((r, i) => {
    console.log(`  ✅ Deleted ${r.deletedCount} ${names[i]} records`);
  });

  console.log("\n  🧹 All seed data removed.\n");
  await mongoose.disconnect();
}

// ==================== ENTRY ====================
const isUndo = process.argv.includes("--undo");

if (isUndo) {
  undoSeed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  seedData().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
