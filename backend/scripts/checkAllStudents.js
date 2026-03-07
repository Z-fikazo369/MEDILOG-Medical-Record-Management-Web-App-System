import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

async function checkAllStudents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const students = await mongoose.connection.db
      .collection("users")
      .find({ role: "student", status: "approved" })
      .toArray();

    console.log(`Found ${students.length} approved student(s)\n`);

    let broken = 0;
    for (const student of students) {
      if (!student.password || !student.lrn) {
        console.log(
          `⚠️  ${student.studentId} (${student.username}) - Missing password or LRN`,
        );
        broken++;
        continue;
      }

      const lrnMatch = await bcrypt.compare(student.lrn, student.password);
      if (!lrnMatch) {
        console.log(
          `❌ ${student.studentId} (${student.username}) - LRN "${student.lrn}" does NOT match password hash`,
        );
        broken++;
      } else {
        console.log(
          `✅ ${student.studentId} (${student.username}) - Password OK`,
        );
      }
    }

    console.log(
      `\n📊 Summary: ${students.length - broken} OK, ${broken} broken`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAllStudents();
