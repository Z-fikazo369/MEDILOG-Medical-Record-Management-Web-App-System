import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const STUDENT_ID = "23-2857"; // Change this to fix a specific student

async function resetStudentPassword() {
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

    console.log(`\n👤 Found: ${user.username} (LRN: ${user.lrn})`);

    // Hash the LRN properly as the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.lrn, salt);

    // Update directly in DB (bypass Mongoose pre-save hook to avoid double-hash)
    await mongoose.connection.db
      .collection("users")
      .updateOne(
        { studentId: STUDENT_ID },
        { $set: { password: hashedPassword } },
      );

    // Verify the fix
    const verifyMatch = await bcrypt.compare(user.lrn, hashedPassword);
    console.log(`✅ Password reset to LRN: ${user.lrn}`);
    console.log(`🔐 Verification: LRN matches new hash? ${verifyMatch}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetStudentPassword();
