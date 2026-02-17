import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  getAllMedicines,
  getMedicineList,
  addMedicine,
  updateMedicine,
  updateStock,
  deleteMedicine,
  seedInventory,
} from "../controllers/pharmacyController.js";

const router = express.Router();

// Student-accessible: get medicine names for issuance form
// GET /api/pharmacy/medicine-list
router.get("/medicine-list", protect, getMedicineList);

// All pharmacy routes require admin/staff auth
// GET  /api/pharmacy          — get all medicines
router.get("/", protect, isAdmin, getAllMedicines);

// POST /api/pharmacy          — add new medicine
router.post("/", protect, isAdmin, addMedicine);

// PUT  /api/pharmacy/:id       — update medicine details (expiry, etc.)
router.put("/:id", protect, isAdmin, updateMedicine);

// PUT  /api/pharmacy/:id/stock — update stock (add/dispense/dispose)
router.put("/:id/stock", protect, isAdmin, updateStock);

// DELETE /api/pharmacy/:id    — remove medicine
router.delete("/:id", protect, isAdmin, deleteMedicine);

// POST /api/pharmacy/seed     — seed initial 26 medicines (one-time)
router.post("/seed", protect, isAdmin, seedInventory);

export default router;
