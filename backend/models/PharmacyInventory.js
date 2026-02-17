import mongoose from "mongoose";

const pharmacyInventorySchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      required: true,
      unique: true, // e.g. "MED-001"
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "Tablet",
    },
    expiry: {
      type: String,
      required: true, // e.g. "Dec 2026"
    },
    status: {
      type: String,
      enum: ["adequate", "low", "critical"],
      default: "critical",
    },
    location: {
      type: String,
      required: true, // e.g. "Shelf A-1"
    },
  },
  {
    timestamps: true,
  },
);

// Auto-compute status before saving
pharmacyInventorySchema.pre("save", function (next) {
  const stock = this.stock;
  const minStock = this.minStock;

  if (stock <= 0) {
    this.status = "critical";
  } else if (stock < minStock * 0.5) {
    this.status = "critical";
  } else if (stock < minStock) {
    this.status = "low";
  } else {
    this.status = "adequate";
  }

  next();
});

const PharmacyInventory = mongoose.model(
  "PharmacyInventory",
  pharmacyInventorySchema,
);

export default PharmacyInventory;
