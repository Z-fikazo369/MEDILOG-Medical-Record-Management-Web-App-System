import React from "react";
import type { StudentView } from "./studentTypes";

interface LaboratoryRequestFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setActiveView: (view: StudentView) => void;
}

const LaboratoryRequestForm: React.FC<LaboratoryRequestFormProps> = ({
  onSubmit,
  setActiveView,
}) => {
  return (
    <div className="section onlineFormSection fade-in">
      {/* Outer Title */}
      <div className="mb-4">
        <h4 className="text-success fw-bold">Laboratory Request</h4>
        <p className="text-muted">Submit a laboratory request form</p>
      </div>

      <div className="card shadow-sm border-0">
        {/* Green Header */}
        <div className="card-header bg-success text-white py-3">
          <h5 className="mb-0 fw-bold">Laboratory Request Form</h5>
        </div>

        <div className="card-body p-4">
          <form onSubmit={onSubmit}>
            {/* Row 1: Student-editable fields */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Issue Date</label>
                <input
                  type="date"
                  name="issueDate"
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {/* Nurse on Duty - Admin only */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Nurse on Duty
                </label>
                <input
                  type="text"
                  className="form-control bg-light text-muted"
                  placeholder="Only Admin can fill out this."
                  readOnly
                />
              </div>
            </div>

            {/* Test Categories - All Admin-only (read-only for students) */}
            <h6 className="fw-bold text-muted mt-4 mb-3">
              <i className="bi bi-lock me-1"></i> Test Categories (Admin Only)
            </h6>

            <div className="row g-3 mb-4">
              {/* Routine/Urinalysis Tests */}
              <div className="col-md-6 col-lg-4">
                <div className="p-3 bg-light rounded border">
                  <h6
                    className="fw-bold text-muted mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Routine/Urinalysis Tests
                  </h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Pregnancy Test
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Fecalysis
                    </label>
                  </div>
                </div>
              </div>

              {/* CBC with Diff Count */}
              <div className="col-md-6 col-lg-4">
                <div className="p-3 bg-light rounded border">
                  <h6
                    className="fw-bold text-muted mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    CBC with Diff Count
                  </h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Hemoglobin
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Hematocrit
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Blood Sugar
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Platelet CT/Wear
                    </label>
                  </div>
                </div>
              </div>

              {/* Gram Stain */}
              <div className="col-md-6 col-lg-4">
                <div className="p-3 bg-light rounded border">
                  <h6
                    className="fw-bold text-muted mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Gram Stain
                  </h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      HPS/BH Test
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Vaginal Smear
                    </label>
                  </div>
                </div>
              </div>

              {/* Blood Chemistry */}
              <div className="col-md-6 col-lg-4">
                <div className="p-3 bg-light rounded border">
                  <h6
                    className="fw-bold text-muted mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Blood Chemistry
                  </h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      FBS
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Uric Acid
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Total Cholesterol
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      HDL/LDL Profile
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      TSH
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Total Protein
                    </label>
                  </div>
                </div>
              </div>

              {/* Pap Smear */}
              <div className="col-md-6 col-lg-4">
                <div className="p-3 bg-light rounded border">
                  <h6
                    className="fw-bold text-muted mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Pap Smear
                  </h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      CXR Interpretation
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      ECG Interpretation
                    </label>
                  </div>
                </div>
              </div>

              {/* Widhal Test */}
              <div className="col-md-6 col-lg-4">
                <div className="p-3 bg-light rounded border">
                  <h6
                    className="fw-bold text-muted mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Widhal Test
                  </h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled
                    />
                    <label className="form-check-label text-muted small">
                      Salmonella
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Others - Admin only */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-muted">
                Others
              </label>
              <textarea
                className="form-control bg-light text-muted"
                placeholder="Only Admin can fill out this."
                readOnly
                rows={2}
              />
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2">
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

export default LaboratoryRequestForm;
