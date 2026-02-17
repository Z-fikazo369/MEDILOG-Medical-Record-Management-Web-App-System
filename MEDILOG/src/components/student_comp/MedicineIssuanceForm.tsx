import React, { useState, useEffect } from "react";
import type { StudentView } from "./studentTypes";
import { COURSE_OPTIONS } from "./courseOptions";
import { medicalAPI } from "../../services/api";

interface PharmacyMedicine {
  _id: string;
  name: string;
  stock: number;
  unit: string;
}

interface MedicineIssuanceFormProps {
  onSubmit: (data: {
    date: string;
    course: string;
    medicines: { name: string; quantity: number }[];
  }) => void;
  setActiveView: (view: StudentView) => void;
}

const MedicineIssuanceForm: React.FC<MedicineIssuanceFormProps> = ({
  onSubmit,
  setActiveView,
}) => {
  const [date, setDate] = useState("");
  const [course, setCourse] = useState("");
  const [medicineList, setMedicineList] = useState<PharmacyMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Fetch medicines from pharmacy inventory on mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await medicalAPI.getMedicineList();
        const meds: PharmacyMedicine[] = Array.isArray(data) ? data : [];
        setMedicineList(meds);
        const init: Record<string, number> = {};
        meds.forEach((med) => {
          init[med.name] = 0;
        });
        setQuantities(init);
      } catch (error) {
        console.error("Failed to fetch medicine list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  const handleQuantityChange = (medicineName: string, value: string) => {
    const num = parseInt(value, 10);
    setQuantities((prev) => ({
      ...prev,
      [medicineName]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const totalItems = Object.values(quantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!date || !course) {
      alert("Please fill in Date and Course fields.");
      return;
    }

    const medicines = medicineList
      .filter((med) => quantities[med.name] > 0)
      .map((med) => ({
        name: med.name,
        quantity: quantities[med.name],
      }));

    if (medicines.length === 0) {
      alert(
        "Please select at least one medicine with a quantity greater than 0.",
      );
      return;
    }

    onSubmit({ date, course, medicines });

    // Reset form
    setDate("");
    setCourse("");
    const init: Record<string, number> = {};
    medicineList.forEach((med) => {
      init[med.name] = 0;
    });
    setQuantities(init);
  };

  return (
    <div
      className="section onlineFormSection fade-in"
      style={{ maxWidth: "900px", margin: "0 auto" }}
    >
      {/* Outer Title */}
      <div className="mb-4">
        <h4 className="text-success fw-bold">Medicine Issuance</h4>
        <p className="text-muted">
          Request medicines from the clinic inventory
        </p>
      </div>

      <div className="card shadow-sm border-0">
        {/* Green Card Header */}
        <div className="card-header bg-success text-white py-3">
          <h5 className="mb-0 fw-bold">Medicine Issuance Form</h5>
        </div>

        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* Row 1: Date & Course */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Course</label>
                <select
                  className="form-select"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                  style={{
                    color: course ? undefined : "var(--text-muted, #6c757d)",
                  }}
                >
                  <option value="" disabled>
                    Select Course
                  </option>
                  {COURSE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Medicine Table */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Medicines{" "}
                <span className="text-muted fw-normal">
                  ({totalItems} item{totalItems !== 1 ? "s" : ""} selected)
                </span>
              </label>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-2">Loading medicines...</p>
                </div>
              ) : medicineList.length === 0 ? (
                <div className="alert alert-warning">
                  No medicines available in the pharmacy inventory.
                </div>
              ) : (
                <div
                  className="table-responsive border rounded"
                  style={{ maxHeight: "420px", overflowY: "auto" }}
                >
                  <table className="table table-hover table-sm mb-0 align-middle">
                    <thead
                      className="table-light"
                      style={{ position: "sticky", top: 0, zIndex: 1 }}
                    >
                      <tr>
                        <th style={{ width: "5%" }} className="text-center">
                          #
                        </th>
                        <th style={{ width: "70%" }}>Medicine Name</th>
                        <th style={{ width: "25%" }} className="text-center">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicineList.map((med, index) => (
                        <tr
                          key={med._id}
                          className={
                            quantities[med.name] > 0 ? "table-success" : ""
                          }
                        >
                          <td className="text-center text-muted">
                            {index + 1}
                          </td>
                          <td>{med.name}</td>
                          <td className="text-center">
                            <input
                              type="number"
                              className="form-control form-control-sm text-center"
                              style={{ width: "80px", margin: "0 auto" }}
                              min={0}
                              value={quantities[med.name] || 0}
                              onChange={(e) =>
                                handleQuantityChange(med.name, e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Diagnosis (Admin Only) */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Diagnosis</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="To be filled by admin"
                disabled
                style={{ cursor: "not-allowed" }}
              />
              <small className="text-muted">
                This field can only be filled by the admin.
              </small>
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary px-4 fw-bold">
                Submit
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary px-4 fw-bold"
                onClick={() => setActiveView("formOptions")}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MedicineIssuanceForm;
