import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import AiTranscription from "../models/AiTranscription.js";

dotenv.config();

const SUPER_ADMIN_EMAIL = "admin@medilog.com";

function getArg(prefix) {
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (!match) return "";
  return match.slice(prefix.length).trim();
}

function isRestrictedAccount(user) {
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();
  const position = String(user?.position || "")
    .trim()
    .toLowerCase();
  return email === SUPER_ADMIN_EMAIL || position.includes("head");
}

function isNurseAccount(user) {
  const position = String(user?.position || "")
    .trim()
    .toLowerCase();
  return (
    user?.role === "staff" &&
    user?.status === "approved" &&
    position.includes("nurse")
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const targetEmailArg = getArg("--to=").toLowerCase();

  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/medilog",
  );

  const users = await User.find(
    { role: { $in: ["admin", "staff"] } },
    { username: 1, email: 1, role: 1, position: 1, status: 1, createdAt: 1 },
  )
    .sort({ createdAt: 1 })
    .lean();

  const restrictedSources = users.filter(isRestrictedAccount);
  if (restrictedSources.length === 0) {
    console.log("No super admin/head accounts found. Nothing to migrate.");
    return;
  }

  const nurseCandidates = users.filter(isNurseAccount);
  let targetNurse = null;

  if (targetEmailArg) {
    targetNurse = nurseCandidates.find(
      (user) => String(user.email || "").toLowerCase() === targetEmailArg,
    );
    if (!targetNurse) {
      throw new Error(
        `Target nurse account not found or not eligible: ${targetEmailArg}`,
      );
    }
  } else {
    targetNurse =
      nurseCandidates.find(
        (user) =>
          !String(user.position || "")
            .toLowerCase()
            .includes("head"),
      ) || nurseCandidates[0];

    if (!targetNurse) {
      throw new Error(
        "No approved nurse account found. Use --to=<nurse_email> after creating one.",
      );
    }
  }

  const sourcesToMove = restrictedSources.filter(
    (source) => String(source._id) !== String(targetNurse._id),
  );

  if (sourcesToMove.length === 0) {
    console.log(
      "No source accounts left to migrate after excluding target nurse.",
    );
    return;
  }

  const sourceRows = [];
  for (const source of sourcesToMove) {
    const total = await AiTranscription.countDocuments({
      createdBy: source._id,
    });
    sourceRows.push({
      id: String(source._id),
      username: source.username,
      email: source.email,
      role: source.role,
      position: source.position || "",
      records: total,
    });
  }

  const beforeTargetCount = await AiTranscription.countDocuments({
    createdBy: targetNurse._id,
  });
  const totalSourceRecords = sourceRows.reduce(
    (sum, row) => sum + row.records,
    0,
  );

  const preview = {
    dryRun,
    targetNurse: {
      id: String(targetNurse._id),
      username: targetNurse.username,
      email: targetNurse.email,
      role: targetNurse.role,
      position: targetNurse.position || "",
      recordsBefore: beforeTargetCount,
    },
    sourcesToMove: sourceRows,
    totalRecordsToMove: totalSourceRecords,
  };

  console.log(JSON.stringify(preview, null, 2));

  if (dryRun) {
    console.log("Dry run only. No records were changed.");
    return;
  }

  const sourceIds = sourcesToMove.map((source) => source._id);

  const updateResult = await AiTranscription.updateMany(
    { createdBy: { $in: sourceIds } },
    { $set: { createdBy: targetNurse._id } },
  );

  const afterTargetCount = await AiTranscription.countDocuments({
    createdBy: targetNurse._id,
  });

  console.log(
    JSON.stringify(
      {
        message: "AI Assistant ownership migration completed.",
        matchedRecords: updateResult.matchedCount,
        modifiedRecords: updateResult.modifiedCount,
        targetNurse: {
          id: String(targetNurse._id),
          email: targetNurse.email,
          recordsBefore: beforeTargetCount,
          recordsAfter: afterTargetCount,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
