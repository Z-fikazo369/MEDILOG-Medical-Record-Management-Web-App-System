import mongoose from "mongoose";

const medicineItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const medicineIssuanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },

    // Form fields
    date: { type: String, required: true },
    course: { type: String, required: true },
    medicines: {
      type: [medicineItemSchema],
      required: true,
      validate: {
        validator: function (arr) {
          // At least one medicine must have quantity > 0
          return arr.some((item) => item.quantity > 0);
        },
        message: "At least one medicine must have a quantity greater than 0.",
      },
    },
    // Admin fields
    diagnosis: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: { type: Date },
    adminNotes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("MedicineIssuance", medicineIssuanceSchema);
