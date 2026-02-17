import React from "react";
import type { StudentView } from "./studentTypes";

interface CertificateFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setActiveView: (view: StudentView) => void;
}

const CertificateForm: React.FC<CertificateFormProps> = ({
  onSubmit,
  setActiveView,
}) => {
  return (
    <div className="section onlineFormSection fade-in">
      {/* Outer Title */}
      <div className="mb-4">
        <h4 className="text-success fw-bold">Medical Certificate</h4>
        <p className="text-muted">Request for medical certificate</p>
      </div>

      <div className="card shadow-sm border-0">
        {/* Green Header */}
        <div className="card-header bg-success text-white py-3">
          <h5 className="mb-0 fw-bold">Medical Certificate</h5>
        </div>

        <div className="card-body p-4">
          <form onSubmit={onSubmit}>
            {/* Row 1 */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Name of Patient
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Age</label>
                <input
                  type="text"
                  name="age"
                  className="form-control"
                  placeholder="Enter age"
                  required
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Sex</label>
                <select name="sex" className="form-select" required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Civil Status</label>
                <select name="status" className="form-select" required>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Student/Employee of:
                </label>
                <input
                  type="text"
                  name="school"
                  className="form-control"
                  placeholder="Enter school/company"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Student/Employee ID Number
                </label>
                <input
                  type="text"
                  name="idNumber"
                  className="form-control"
                  placeholder="Enter ID"
                  required
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Diagnosis
                </label>
                <input
                  type="text"
                  name="diagnosis"
                  className="form-control bg-light text-muted"
                  placeholder="Only Admin can fill out this."
                  readOnly
                />
              </div>
            </div>

            {/* Row 5 */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-muted">
                Remarks
              </label>
              <textarea
                name="remarks"
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

export default CertificateForm;
