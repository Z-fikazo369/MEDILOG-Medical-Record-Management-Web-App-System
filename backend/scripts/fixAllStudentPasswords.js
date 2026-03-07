import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

async function fixAllStudentPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const students = await mongoose.connection.db
      .collection("users")
      .find({ role: "student", status: "approved" })
      .toArray();

    console.log(`Found ${students.length} approved student(s)\n`);

    let fixed = 0;
    let alreadyOk = 0;

    for (const student of students) {
      if (!student.lrn) {
        console.log(`⚠️  ${student.studentId} - No LRN, skipping`);
        continue;
      }

      // Check if already correct
      if (student.password) {
        const lrnMatch = await bcrypt.compare(student.lrn, student.password);
        if (lrnMatch) {
          console.log(
            `✅ ${student.studentId} (${student.username}) - Already OK`,
          );
          alreadyOk++;
          continue;
        }
      }

      // Fix: hash the LRN properly and update directly in DB
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(student.lrn, salt);

      await mongoose.connection.db
        .collection("users")
        .updateOne(
          { _id: student._id },
          { $set: { password: hashedPassword } },
        );

      console.log(
        `🔧 ${student.studentId} (${student.username}) - FIXED (password reset to LRN: ${student.lrn})`,
      );
      fixed++;
    }

    console.log(`\n📊 Summary: ${fixed} fixed, ${alreadyOk} already OK`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixAllStudentPasswords();
