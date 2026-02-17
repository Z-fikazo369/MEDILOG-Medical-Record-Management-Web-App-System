import React, { useState, useMemo, useEffect, useCallback } from "react";
import api from "../../services/api";

// --- Types ---
interface Medicine {
  _id: string; // MongoDB ObjectId
  medicineId: string; // Display ID like "MED-001"
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  expiry: string;
  status: "adequate" | "low" | "critical";
  location: string;
}

type ActionType = "Add Stock" | "Dispense / Usage" | "Dispose (Expired)";

// --- Helper: parse "Mon YYYY" expiry to a Date for comparison ---
const parseExpiry = (expiry: string): Date | null => {
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const parts = expiry.split(" ");
  if (parts.length !== 2) return null;
  const month = months[parts[0]];
  const year = parseInt(parts[1], 10);
  if (month === undefined || isNaN(year)) return null;
  // Last day of that month
  return new Date(year, month + 1, 0);
};

// --- Helper: generate next ID ---
const generateNextId = (inventory: Medicine[]): string => {
  const maxNum = inventory.reduce((max, med) => {
    const num = parseInt(med.medicineId.replace("MED-", ""), 10);
    return num > max ? num : max;
  }, 0);
  return `MED-${String(maxNum + 1).padStart(3, "0")}`;
};

const PharmacyInventoryView: React.FC = () => {
  const [inventory, setInventory] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // --- Form State ---
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [actionType, setActionType] = useState<ActionType>("Add Stock");
  const [quantity, setQuantity] = useState<number>(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);

  // --- Add New Item Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    category: "",
    stock: 0,
    minStock: 0,
    unit: "Tablet",
    expiry: "",
    location: "",
  });

  // --- Last updated timestamp ---
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // --- Fetch inventory from MongoDB on mount ---
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const { data } = await api.get("/pharmacy");

      // If database is empty, seed the 26 initial medicines
      if (data.length === 0) {
        try {
          await api.post("/pharmacy/seed");
          const { data: seeded } = await api.get("/pharmacy");
          setInventory(seeded);
        } catch {
          // Seed may fail if already seeded — just use what we got
          setInventory(data);
        }
      } else {
        setInventory(data);
      }
    } catch (err: any) {
      console.error("Failed to fetch pharmacy inventory:", err);
      setErrorMsg(
        err.response?.data?.message || "Failed to load inventory from server.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // =============================================
  //  HELPER: reset the Update Stock form
  // =============================================
  const resetForm = () => {
    setSelectedMed(null);
    setActionType("Add Stock");
    setQuantity(0);
    setNotes("");
  };

  // =============================================
  //  SELECT a medicine from the table
  // =============================================
  const handleEditClick = (med: Medicine) => {
    setSelectedMed(med);
    setQuantity(0);
    setNotes("");
    setActionType("Add Stock");
    setIsEditingExpiry(false);
  };

  // Live version of the selected medicine (always in sync with inventory)
  const liveMed = selectedMed
    ? inventory.find((m) => m._id === selectedMed._id) || null
    : null;

  // =============================================
  //  CONFIRM UPDATE — the main stock logic
  // =============================================
  const handleConfirmUpdate = async () => {
    if (!liveMed || quantity <= 0) return;

    try {
      const { data: updated } = await api.put(
        `/pharmacy/${liveMed._id}/stock`,
        {
          action: actionType,
          quantity,
        },
      );

      // Update local state with the server response
      setInventory((prev) =>
        prev.map((med) => (med._id === updated._id ? updated : med)),
      );

      setLastUpdated(new Date());
      setSuccessMsg(
        `✓ ${actionType}: ${quantity} ${liveMed.unit}(s) of ${liveMed.name}`,
      );
      resetForm();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to update stock.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // =============================================
  //  ADD NEW ITEM
  // =============================================
  const handleAddNewItem = async () => {
    if (
      !newMed.name.trim() ||
      !newMed.category.trim() ||
      !newMed.expiry.trim() ||
      !newMed.location.trim()
    )
      return;

    try {
      const { data: saved } = await api.post("/pharmacy", {
        medicineId: generateNextId(inventory),
        name: newMed.name.trim(),
        category: newMed.category.trim(),
        stock: newMed.stock,
        minStock: newMed.minStock,
        unit: newMed.unit,
        expiry: newMed.expiry.trim(),
        location: newMed.location.trim(),
      });

      setInventory((prev) => [...prev, saved]);
      setLastUpdated(new Date());
      setShowAddModal(false);
      setNewMed({
        name: "",
        category: "",
        stock: 0,
        minStock: 0,
        unit: "Tablet",
        expiry: "",
        location: "",
      });
      setSuccessMsg(`✓ Added new medicine: ${saved.name}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to add medicine.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // =============================================
  //  DELETE a medicine
  // =============================================
  const handleDelete = async (mongoId: string) => {
    const med = inventory.find((m) => m._id === mongoId);
    if (!med) return;
    if (
      !window.confirm(
        `Are you sure you want to remove "${med.name}" from the inventory?`,
      )
    )
      return;

    try {
      await api.delete(`/pharmacy/${mongoId}`);
      setInventory((prev) => prev.filter((m) => m._id !== mongoId));
      if (selectedMed?._id === mongoId) resetForm();
      setLastUpdated(new Date());
      setSuccessMsg(`✓ Removed: ${med.name}`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to delete medicine.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // =============================================
  //  SEARCH — by medicine name only
  // =============================================
  const filteredInventory = inventory.filter((med) => {
    if (!searchTerm) return true;
    return med.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // =============================================
  //  COMPUTED STATS (auto-recalculated)
  // =============================================
  const totalItems = inventory.length;
  const totalStock = inventory.reduce((acc, curr) => acc + curr.stock, 0);
  // Low Stock = all items below their minStock (includes both "low" and "critical")
  const lowStockCount = inventory.filter((i) => i.stock < i.minStock).length;
  const criticalCount = inventory.filter((i) => i.status === "critical").length;
  const adequateCount = inventory.filter((i) => i.status === "adequate").length;

  // =============================================
  //  ALERTS — dynamically generated
  // =============================================
  const alerts = useMemo(() => {
    const now = new Date();
    const items: {
      type: "critical" | "low" | "expired" | "expiring" | "good";
      icon: string;
      message: React.ReactNode;
    }[] = [];

    // Find expired medicines
    const expiredMeds = inventory.filter((med) => {
      const d = parseExpiry(med.expiry);
      return d && d < now;
    });

    // Find expiring soon (within 3 months)
    const threeMonths = new Date(
      now.getFullYear(),
      now.getMonth() + 3,
      now.getDate(),
    );
    const expiringSoon = inventory.filter((med) => {
      const d = parseExpiry(med.expiry);
      return d && d >= now && d <= threeMonths;
    });

    // Critical stock items
    const criticalMeds = inventory.filter((i) => i.status === "critical");
    if (criticalMeds.length > 0) {
      items.push({
        type: "critical",
        icon: "bi bi-exclamation-triangle-fill",
        message: (
          <span>
            <strong>
              {criticalMeds.length} item{criticalMeds.length > 1 ? "s" : ""}
            </strong>{" "}
            critically low: {criticalMeds.map((m) => m.name).join(", ")}
          </span>
        ),
      });
    }

    // Low stock items
    const lowMeds = inventory.filter((i) => i.status === "low");
    if (lowMeds.length > 0) {
      items.push({
        type: "low",
        icon: "bi bi-graph-down-arrow",
        message: (
          <span>
            <strong>
              {lowMeds.length} item{lowMeds.length > 1 ? "s" : ""}
            </strong>{" "}
            below reorder level: {lowMeds.map((m) => m.name).join(", ")}
          </span>
        ),
      });
    }

    // Expired medicines
    if (expiredMeds.length > 0) {
      items.push({
        type: "expired",
        icon: "bi bi-calendar-x-fill",
        message: (
          <span>
            <strong>
              {expiredMeds.length} item{expiredMeds.length > 1 ? "s" : ""}
            </strong>{" "}
            expired:{" "}
            {expiredMeds.map((m) => `${m.name} (${m.expiry})`).join(", ")}
          </span>
        ),
      });
    }

    // Expiring soon
    if (expiringSoon.length > 0) {
      items.push({
        type: "expiring",
        icon: "bi bi-clock-history",
        message: (
          <span>
            <strong>
              {expiringSoon.length} item{expiringSoon.length > 1 ? "s" : ""}
            </strong>{" "}
            expiring within 3 months:{" "}
            {expiringSoon.map((m) => `${m.name} (${m.expiry})`).join(", ")}
          </span>
        ),
      });
    }

    // All clear
    if (
      criticalMeds.length === 0 &&
      lowMeds.length === 0 &&
      expiredMeds.length === 0 &&
      expiringSoon.length === 0
    ) {
      items.push({
        type: "good",
        icon: "bi bi-check-circle-fill",
        message: (
          <span>
            All medicines are adequately stocked and within expiry dates.
          </span>
        ),
      });
    } else if (adequateCount > 0) {
      items.push({
        type: "good",
        icon: "bi bi-check-circle-fill",
        message: (
          <span>
            <strong>{adequateCount}</strong> of {totalItems} medicines are
            adequately stocked.
          </span>
        ),
      });
    }

    return items;
  }, [inventory, adequateCount, totalItems]);

  // =============================================
  //  STATUS BADGE helper
  // =============================================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "adequate":
        return "stock-badge adequate";
      case "low":
        return "stock-badge low";
      case "critical":
        return "stock-badge critical";
      default:
        return "stock-badge";
    }
  };

  // Format last updated
  const formatLastUpdated = (date: Date) => {
    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fade-in">
      {/* --- Success Toast --- */}
      {successMsg && (
        <div
          className="alert alert-success alert-dismissible fade show d-flex align-items-center py-2 mb-3"
          role="alert"
          style={{ fontSize: "0.9rem" }}
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMsg}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMsg("")}
          ></button>
        </div>
      )}

      {/* --- Error Toast --- */}
      {errorMsg && (
        <div
          className="alert alert-danger alert-dismissible fade show d-flex align-items-center py-2 mb-3"
          role="alert"
          style={{ fontSize: "0.9rem" }}
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMsg}
          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorMsg("")}
          ></button>
        </div>
      )}

      {/* --- Loading State --- */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading pharmacy inventory...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* --- 1. Top Stats Cards --- */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md">
              <div className="pharmacy-stat-card green">
                <span className="stat-label">Total Medicines</span>
                <h3>{totalItems}</h3>
                <span className="stat-sub sub-green">Unique items listed</span>
              </div>
            </div>
            <div className="col-12 col-md">
              <div className="pharmacy-stat-card blue">
                <span className="stat-label">Total Stock</span>
                <h3>{totalStock.toLocaleString()}</h3>
                <span className="stat-sub sub-blue">Units available</span>
              </div>
            </div>
            <div className="col-12 col-md">
              <div className="pharmacy-stat-card orange">
                <span className="stat-label">Low Stock</span>
                <h3>{lowStockCount}</h3>
                <span className="stat-sub sub-orange">Restock needed</span>
              </div>
            </div>
            <div className="col-12 col-md">
              <div className="pharmacy-stat-card red">
                <span className="stat-label">Critical</span>
                <h3>{criticalCount}</h3>
                <span className="stat-sub sub-red">Urgent attention</span>
              </div>
            </div>
            <div className="col-12 col-md">
              <div className="pharmacy-stat-card purple">
                <span className="stat-label">Adequate</span>
                <h3>{adequateCount}</h3>
                <span className="stat-sub sub-purple">Well stocked</span>
              </div>
            </div>
          </div>

          {/* --- 2. Search Bar --- */}
          <div className="bg-white p-3 rounded-3 border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div
              className="position-relative"
              style={{ width: "100%", maxWidth: "500px" }}
            >
              <i
                className="bi bi-search position-absolute text-muted"
                style={{ top: "10px", left: "15px" }}
              ></i>
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search by medicine name..."
                style={{ background: "#f9fafb" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <i className="bi bi-plus-lg"></i> Add New Item
              </button>
            </div>
          </div>

          {/* --- 3. Inventory Table + Update Stock Sidebar --- */}
          <div className="row g-4">
            <div
              className={showSidebar ? "col-12 col-lg-8" : "col-12"}
              style={{ transition: "all 0.3s ease" }}
            >
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">ISU Medicine Inventory</h5>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted">
                      Updated: {formatLastUpdated(lastUpdated)}
                    </small>
                    {!showSidebar && (
                      <button
                        className="btn btn-sm btn-outline-success ms-2"
                        onClick={() => setShowSidebar(true)}
                        title="Show Update Stock panel"
                      >
                        <i className="bi bi-layout-sidebar-reverse me-1"></i>
                        Update Stock
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body p-0">
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "600px", overflowY: "auto" }}
                  >
                    <table className="table table-hover align-middle mb-0">
                      <thead
                        className="bg-light sticky-top"
                        style={{ zIndex: 1 }}
                      >
                        <tr>
                          <th className="ps-4">ID</th>
                          <th>Medicine Name</th>
                          <th>Category</th>
                          <th>Stock / Unit</th>
                          <th>Status</th>
                          <th>Expiry</th>
                          <th className="text-end pe-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventory.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center text-muted py-5"
                            >
                              <i className="bi bi-search me-2"></i>
                              No medicines found matching "{searchTerm}"
                            </td>
                          </tr>
                        ) : (
                          filteredInventory.map((med) => (
                            <tr
                              key={med._id}
                              style={{ cursor: "pointer" }}
                              className={
                                selectedMed?._id === med._id
                                  ? "table-active"
                                  : ""
                              }
                              onClick={() => handleEditClick(med)}
                            >
                              <td className="ps-4 text-muted small">
                                {med.medicineId}
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <span className="fw-bold text-dark">
                                    {med.name}
                                  </span>
                                  <small
                                    className="text-muted"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {med.location}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {med.category}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <span className="fw-bold">{med.stock}</span>
                                  <small
                                    className="text-muted"
                                    style={{ fontSize: "0.7rem" }}
                                  >
                                    {med.unit}s
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span className={getStatusBadge(med.status)}>
                                  {med.status}
                                </span>
                              </td>
                              <td>
                                {(() => {
                                  const d = parseExpiry(med.expiry);
                                  const isExpired = d && d < new Date();
                                  return (
                                    <span
                                      className={
                                        isExpired ? "text-danger fw-bold" : ""
                                      }
                                    >
                                      {med.expiry}{" "}
                                      {isExpired && (
                                        <i className="bi bi-exclamation-circle-fill ms-1"></i>
                                      )}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="text-end pe-4">
                                <button
                                  className="btn btn-sm btn-light border text-danger"
                                  title="Remove medicine"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(med._id);
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer bg-white py-2 text-muted small text-end">
                  Showing {filteredInventory.length} of {inventory.length} items
                </div>
              </div>
            </div>

            {/* RIGHT Sidebar: Update Stock Form */}
            {showSidebar && (
              <div
                className="col-12 col-lg-4"
                style={{ transition: "all 0.3s ease" }}
              >
                <div className="inventory-side-panel h-100">
                  <div className="panel-section">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">
                        <i className="bi bi-arrow-repeat me-2 text-success"></i>
                        Update Stock
                      </h5>
                      <div className="d-flex gap-1">
                        {liveMed && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={resetForm}
                            title="Clear form"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setShowSidebar(false)}
                          title="Hide panel"
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    </div>

                    {!liveMed ? (
                      <div className="text-center text-muted py-5">
                        <i
                          className="bi bi-hand-index-thumb"
                          style={{ fontSize: "2.5rem", opacity: 0.3 }}
                        ></i>
                        <p className="mt-3 mb-0">
                          Click a medicine from the table to update its stock.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Selected medicine info card */}
                        <div
                          className="p-3 rounded-3 mb-4"
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div
                                className="fw-bold text-dark"
                                style={{ fontSize: "1.05rem" }}
                              >
                                {liveMed.name}
                              </div>
                              <small className="text-muted">
                                {liveMed.category} · {liveMed.location}
                              </small>
                            </div>
                            <span className={getStatusBadge(liveMed.status)}>
                              {liveMed.status}
                            </span>
                          </div>
                        </div>

                        {/* Form fields stacked vertically for sidebar */}
                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <label className="form-label small text-muted mb-1">
                              Current Stock
                            </label>
                            <div className="form-control bg-light fw-bold">
                              {liveMed.stock} {liveMed.unit}s
                            </div>
                          </div>
                          <div className="col-6">
                            <label className="form-label small text-muted mb-1">
                              Min. Stock
                            </label>
                            <div className="form-control bg-light">
                              {liveMed.minStock} {liveMed.unit}s
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label small text-muted mb-1 d-flex justify-content-between align-items-center">
                            Expiry
                            {!isEditingExpiry ? (
                              <span
                                className="text-primary"
                                style={{
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                }}
                                onClick={() => {
                                  setIsEditingExpiry(true);
                                  setEditExpiry(liveMed.expiry);
                                }}
                              >
                                <i className="bi bi-pencil-fill me-1"></i>Edit
                              </span>
                            ) : (
                              <span
                                className="text-secondary"
                                style={{
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                }}
                                onClick={() => setIsEditingExpiry(false)}
                              >
                                Cancel
                              </span>
                            )}
                          </label>
                          {isEditingExpiry ? (
                            <div className="d-flex gap-2">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Dec 2026"
                                value={editExpiry}
                                onChange={(e) => setEditExpiry(e.target.value)}
                              />
                              <button
                                className="btn btn-sm btn-success px-3"
                                disabled={
                                  !editExpiry.trim() ||
                                  editExpiry.trim() === liveMed.expiry
                                }
                                onClick={async () => {
                                  try {
                                    const { data: updated } = await api.put(
                                      `/pharmacy/${liveMed._id}`,
                                      { expiry: editExpiry.trim() },
                                    );
                                    setInventory((prev) =>
                                      prev.map((m) =>
                                        m._id === updated._id ? updated : m,
                                      ),
                                    );
                                    setIsEditingExpiry(false);
                                    setLastUpdated(new Date());
                                    setSuccessMsg(
                                      `✓ Expiry updated: ${liveMed.name} → ${editExpiry.trim()}`,
                                    );
                                    setTimeout(() => setSuccessMsg(""), 4000);
                                  } catch (err: any) {
                                    setErrorMsg(
                                      err.response?.data?.message ||
                                        "Failed to update expiry.",
                                    );
                                    setTimeout(() => setErrorMsg(""), 4000);
                                  }
                                }}
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="form-control bg-light">
                              {liveMed.expiry}
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label small text-muted mb-1">
                            Action
                          </label>
                          <select
                            className="form-select"
                            value={actionType}
                            onChange={(e) =>
                              setActionType(e.target.value as ActionType)
                            }
                          >
                            <option value="Add Stock">Add Stock</option>
                            <option value="Dispense / Usage">
                              Dispense / Usage
                            </option>
                            <option value="Dispose (Expired)">
                              Dispose (Expired)
                            </option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label small text-muted mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(Math.max(0, Number(e.target.value)))
                            }
                            min={0}
                            max={
                              actionType !== "Add Stock"
                                ? liveMed.stock
                                : undefined
                            }
                          />
                          {actionType !== "Add Stock" &&
                            quantity > liveMed.stock && (
                              <small className="text-danger">
                                Cannot exceed current stock ({liveMed.stock})
                              </small>
                            )}
                          {actionType === "Add Stock" && quantity > 0 && (
                            <small className="text-success">
                              New stock: {liveMed.stock + quantity}
                            </small>
                          )}
                          {actionType !== "Add Stock" &&
                            quantity > 0 &&
                            quantity <= liveMed.stock && (
                              <small className="text-muted">
                                Remaining: {liveMed.stock - quantity}
                              </small>
                            )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label small text-muted mb-1">
                            Notes <span className="text-muted">(optional)</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Reason for update..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>

                        <button
                          className="btn btn-success w-100 py-2 fw-bold"
                          disabled={
                            quantity <= 0 ||
                            (actionType !== "Add Stock" &&
                              quantity > liveMed.stock)
                          }
                          onClick={handleConfirmUpdate}
                        >
                          <i className="bi bi-check2-circle me-2"></i> Confirm
                          Update
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* --- 4. Alerts Panel (Full Width Below) --- */}
          <div className="row g-4 mt-0">
            <div className="col-12">
              <div className="inventory-side-panel">
                <div className="panel-section">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-bell me-2 text-warning"></i>Inventory
                    Alerts
                  </h5>

                  {alerts.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i
                        className="bi bi-check-circle"
                        style={{ fontSize: "2rem", opacity: 0.3 }}
                      ></i>
                      <p className="mt-2 mb-0 small">No alerts at this time.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-3">
                      {alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`alert-item flex-fill ${alert.type === "expired" ? "critical" : alert.type === "expiring" ? "low" : alert.type}`}
                          style={{ minWidth: "250px" }}
                        >
                          <i className={alert.icon}></i>
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================
          ADD NEW ITEM MODAL
         ============================ */}
      {showAddModal && (
        <div
          className="modal-backdrop fade show"
          style={{ zIndex: 1040 }}
          onClick={() => setShowAddModal(false)}
        ></div>
      )}
      {showAddModal && (
        <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-capsule me-2 text-success"></i>Add New
                  Medicine
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body pt-3">
                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Medicine Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Amoxicillin 500mg"
                    value={newMed.name}
                    onChange={(e) =>
                      setNewMed({ ...newMed, name: e.target.value })
                    }
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-muted">
                      Category <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Antibiotic"
                      value={newMed.category}
                      onChange={(e) =>
                        setNewMed({ ...newMed, category: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted">Unit</label>
                    <select
                      className="form-select"
                      value={newMed.unit}
                      onChange={(e) =>
                        setNewMed({ ...newMed, unit: e.target.value })
                      }
                    >
                      <option>Tablet</option>
                      <option>Capsule</option>
                      <option>Sachet</option>
                      <option>Ampule</option>
                      <option>Vial</option>
                      <option>Tube</option>
                      <option>Nebule</option>
                      <option>Bottle</option>
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-muted">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      value={newMed.stock}
                      onChange={(e) =>
                        setNewMed({
                          ...newMed,
                          stock: Math.max(0, Number(e.target.value)),
                        })
                      }
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted">
                      Min. Stock Level
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      value={newMed.minStock}
                      onChange={(e) =>
                        setNewMed({
                          ...newMed,
                          minStock: Math.max(0, Number(e.target.value)),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-muted">
                      Expiry <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dec 2026"
                      value={newMed.expiry}
                      onChange={(e) =>
                        setNewMed({ ...newMed, expiry: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted">
                      Location <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Shelf A-1"
                      value={newMed.location}
                      onChange={(e) =>
                        setNewMed({ ...newMed, location: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-light border"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success fw-bold"
                  disabled={
                    !newMed.name.trim() ||
                    !newMed.category.trim() ||
                    !newMed.expiry.trim() ||
                    !newMed.location.trim()
                  }
                  onClick={handleAddNewItem}
                >
                  <i className="bi bi-plus-lg me-1"></i> Add Medicine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyInventoryView;
