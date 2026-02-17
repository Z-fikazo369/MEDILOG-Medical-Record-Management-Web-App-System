import PharmacyInventory from "../models/PharmacyInventory.js";

// =============================================
//  GET MEDICINE NAMES — student-accessible, returns names only
//  GET /api/pharmacy/medicine-list
// =============================================
export const getMedicineList = async (req, res) => {
  try {
    const medicines = await PharmacyInventory.find()
      .select("name stock unit")
      .sort({ medicineId: 1 });
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicine list:", error);
    res.status(500).json({ message: "Failed to fetch medicine list" });
  }
};

// =============================================
//  GET ALL — fetch entire inventory
//  GET /api/pharmacy
// =============================================
export const getAllMedicines = async (req, res) => {
  try {
    const medicines = await PharmacyInventory.find().sort({ medicineId: 1 });
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching pharmacy inventory:", error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

// =============================================
//  ADD NEW MEDICINE
//  POST /api/pharmacy
// =============================================
export const addMedicine = async (req, res) => {
  try {
    const {
      medicineId,
      name,
      category,
      stock,
      minStock,
      unit,
      expiry,
      location,
    } = req.body;

    // Check for duplicate medicineId
    const exists = await PharmacyInventory.findOne({ medicineId });
    if (exists) {
      return res
        .status(400)
        .json({ message: `Medicine ID "${medicineId}" already exists` });
    }

    const medicine = new PharmacyInventory({
      medicineId,
      name,
      category,
      stock: stock || 0,
      minStock: minStock || 0,
      unit: unit || "Tablet",
      expiry,
      location,
    });

    const saved = await medicine.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ message: "Failed to add medicine" });
  }
};

// =============================================
//  UPDATE MEDICINE DETAILS (expiry, etc.)
//  PUT /api/pharmacy/:id
// =============================================
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiry } = req.body;

    const medicine = await PharmacyInventory.findById(id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    if (expiry !== undefined) medicine.expiry = expiry;

    const updated = await medicine.save();
    res.json(updated);
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ message: "Failed to update medicine" });
  }
};

// =============================================
//  UPDATE STOCK — add, dispense, or dispose
//  PUT /api/pharmacy/:id/stock
// =============================================
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params; // MongoDB _id
    const { action, quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const medicine = await PharmacyInventory.findById(id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    switch (action) {
      case "Add Stock":
        medicine.stock += quantity;
        break;
      case "Dispense / Usage":
        medicine.stock = Math.max(0, medicine.stock - quantity);
        break;
      case "Dispose (Expired)":
        medicine.stock = Math.max(0, medicine.stock - quantity);
        break;
      default:
        return res.status(400).json({ message: "Invalid action type" });
    }

    // Status is auto-computed by the pre-save hook
    const updated = await medicine.save();
    res.json(updated);
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Failed to update stock" });
  }
};

// =============================================
//  DELETE MEDICINE
//  DELETE /api/pharmacy/:id
// =============================================
export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await PharmacyInventory.findByIdAndDelete(id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({ message: `Deleted: ${medicine.name}` });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ message: "Failed to delete medicine" });
  }
};

// =============================================
//  SEED — populate initial 26 medicines (one-time)
//  POST /api/pharmacy/seed
// =============================================
export const seedInventory = async (req, res) => {
  try {
    const count = await PharmacyInventory.countDocuments();
    if (count > 0) {
      return res.status(400).json({
        message:
          "Inventory already seeded. Delete all first if you want to re-seed.",
      });
    }

    const initialData = [
      {
        medicineId: "MED-001",
        name: "Amoxicillin 500mg",
        category: "Antibiotic",
        stock: 0,
        minStock: 100,
        unit: "Capsule",
        expiry: "Dec 2026",
        location: "Shelf A-1",
      },
      {
        medicineId: "MED-002",
        name: "Azithromycin 500mg",
        category: "Antibiotic",
        stock: 0,
        minStock: 50,
        unit: "Tablet",
        expiry: "Nov 2026",
        location: "Shelf A-2",
      },
      {
        medicineId: "MED-003",
        name: "Ciprofloxacin 500mg",
        category: "Antibiotic",
        stock: 0,
        minStock: 50,
        unit: "Tablet",
        expiry: "Mar 2027",
        location: "Shelf A-3",
      },
      {
        medicineId: "MED-004",
        name: "Cloxacillin 500mg",
        category: "Antibiotic",
        stock: 0,
        minStock: 50,
        unit: "Capsule",
        expiry: "Aug 2026",
        location: "Shelf A-4",
      },
      {
        medicineId: "MED-005",
        name: "Co-Amoxiclav 625mg",
        category: "Antibiotic",
        stock: 0,
        minStock: 40,
        unit: "Tablet",
        expiry: "Oct 2026",
        location: "Shelf A-5",
      },
      {
        medicineId: "MED-006",
        name: "Paracetamol 500mg",
        category: "Analgesic",
        stock: 0,
        minStock: 300,
        unit: "Tablet",
        expiry: "Jan 2028",
        location: "Shelf B-1",
      },
      {
        medicineId: "MED-007",
        name: "Mefenamic Acid 500mg",
        category: "Analgesic",
        stock: 0,
        minStock: 100,
        unit: "Capsule",
        expiry: "Dec 2027",
        location: "Shelf B-2",
      },
      {
        medicineId: "MED-008",
        name: "Celecoxib 200mg",
        category: "Pain Reliever",
        stock: 0,
        minStock: 50,
        unit: "Capsule",
        expiry: "Jul 2027",
        location: "Shelf B-3",
      },
      {
        medicineId: "MED-009",
        name: "Norgesic Forte",
        category: "Muscle Relaxant",
        stock: 0,
        minStock: 60,
        unit: "Tablet",
        expiry: "Sep 2026",
        location: "Shelf B-4",
      },
      {
        medicineId: "MED-010",
        name: "Buscopan Plus",
        category: "Antispasmodic",
        stock: 0,
        minStock: 50,
        unit: "Tablet",
        expiry: "Feb 2027",
        location: "Shelf B-5",
      },
      {
        medicineId: "MED-011",
        name: "Cetirizine 10mg",
        category: "Antihistamine",
        stock: 0,
        minStock: 100,
        unit: "Tablet",
        expiry: "May 2027",
        location: "Shelf C-1",
      },
      {
        medicineId: "MED-012",
        name: "Salbutamol Neb",
        category: "Respiratory",
        stock: 0,
        minStock: 30,
        unit: "Nebule",
        expiry: "Jun 2026",
        location: "Shelf C-2",
      },
      {
        medicineId: "MED-013",
        name: "Ambroxol 30mg",
        category: "Mucolytic",
        stock: 0,
        minStock: 50,
        unit: "Tablet",
        expiry: "Apr 2027",
        location: "Shelf C-3",
      },
      {
        medicineId: "MED-014",
        name: "Acetylcysteine Sachet",
        category: "Mucolytic",
        stock: 0,
        minStock: 20,
        unit: "Sachet",
        expiry: "Dec 2025",
        location: "Shelf C-4",
      },
      {
        medicineId: "MED-015",
        name: "Omeprazole 20mg",
        category: "Antacid",
        stock: 0,
        minStock: 80,
        unit: "Capsule",
        expiry: "Mar 2027",
        location: "Shelf D-1",
      },
      {
        medicineId: "MED-016",
        name: "Loperamide",
        category: "Antidiarrheal",
        stock: 0,
        minStock: 50,
        unit: "Capsule",
        expiry: "Aug 2027",
        location: "Shelf D-2",
      },
      {
        medicineId: "MED-017",
        name: "Kremil S",
        category: "Antacid",
        stock: 0,
        minStock: 100,
        unit: "Tablet",
        expiry: "Nov 2026",
        location: "Shelf D-3",
      },
      {
        medicineId: "MED-018",
        name: "Metoclopramide",
        category: "Antiemetic",
        stock: 0,
        minStock: 30,
        unit: "Tablet",
        expiry: "Feb 2027",
        location: "Shelf D-4",
      },
      {
        medicineId: "MED-019",
        name: "Hyoscine",
        category: "Injectable",
        stock: 0,
        minStock: 10,
        unit: "Ampule",
        expiry: "Oct 2025",
        location: "ER Cabinet",
      },
      {
        medicineId: "MED-020",
        name: "Diphenhydramine",
        category: "Injectable",
        stock: 0,
        minStock: 10,
        unit: "Ampule",
        expiry: "Dec 2025",
        location: "ER Cabinet",
      },
      {
        medicineId: "MED-021",
        name: "Tetanus Toxoid",
        category: "Vaccine",
        stock: 0,
        minStock: 20,
        unit: "Ampule",
        expiry: "Jan 2026",
        location: "Fridge",
      },
      {
        medicineId: "MED-022",
        name: "Hydrocortisone",
        category: "Injectable",
        stock: 0,
        minStock: 10,
        unit: "Vial",
        expiry: "Mar 2026",
        location: "ER Cabinet",
      },
      {
        medicineId: "MED-023",
        name: "Silver Sulfadiazine",
        category: "Topical",
        stock: 0,
        minStock: 15,
        unit: "Tube",
        expiry: "May 2026",
        location: "Shelf E-1",
      },
      {
        medicineId: "MED-024",
        name: "Mupirocin Ointment",
        category: "Topical",
        stock: 0,
        minStock: 10,
        unit: "Tube",
        expiry: "Jun 2027",
        location: "Shelf E-1",
      },
      {
        medicineId: "MED-025",
        name: "Multivitamins w/ Iron",
        category: "Supplement",
        stock: 0,
        minStock: 200,
        unit: "Tablet",
        expiry: "Dec 2028",
        location: "Shelf F-1",
      },
      {
        medicineId: "MED-026",
        name: "Hydrite Sachet",
        category: "Electrolytes",
        stock: 0,
        minStock: 50,
        unit: "Sachet",
        expiry: "Jul 2027",
        location: "Shelf F-2",
      },
    ];

    const result = await PharmacyInventory.insertMany(initialData);
    res
      .status(201)
      .json({ message: `Seeded ${result.length} medicines`, data: result });
  } catch (error) {
    console.error("Error seeding inventory:", error);
    res.status(500).json({ message: "Failed to seed inventory" });
  }
};
