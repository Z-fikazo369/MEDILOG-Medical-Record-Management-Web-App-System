import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const STUDENT_ID = "23-2857"; // Change this to the student ID you're testing

async function checkStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const user = await mongoose.connection.db
      .collection("users")
      .findOne({ studentId: STUDENT_ID });

    if (!user) {
      console.log("❌ No user found with studentId:", STUDENT_ID);
      process.exit(1);
    }

    console.log("\n📋 Student Data:");
    console.log("  Username:", user.username);
    console.log("  Email:", user.email);
    console.log("  Student ID:", user.studentId);
    console.log("  LRN:", user.lrn);
    console.log("  Role:", user.role);
    console.log("  Status:", user.status);
    console.log("  Has Password:", user.password ? "YES" : "NO");
    console.log(
      "  Password Hash (first 20 chars):",
      user.password ? user.password.substring(0, 20) + "..." : "N/A",
    );

    if (user.password && user.lrn) {
      // Test if LRN matches the stored password hash
      const lrnMatch = await bcrypt.compare(user.lrn, user.password);
      console.log("\n🔐 Password Test:");
      console.log(`  Does LRN "${user.lrn}" match stored hash?`, lrnMatch);

      // Also test if studentId matches (common mistake)
      const idMatch = await bcrypt.compare(user.studentId, user.password);
      console.log(
        `  Does StudentID "${user.studentId}" match stored hash?`,
        idMatch,
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkStudent();
