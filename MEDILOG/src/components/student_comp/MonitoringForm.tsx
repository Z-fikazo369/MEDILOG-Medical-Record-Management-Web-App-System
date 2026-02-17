import React from "react";
import type { StudentView } from "./studentTypes";
import { COURSE_OPTIONS } from "./courseOptions";

interface MonitoringFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setActiveView: (view: StudentView) => void;
}

const MonitoringForm: React.FC<MonitoringFormProps> = ({
  onSubmit,
  setActiveView,
}) => {
  return (
    <div
      className="section onlineFormSection fade-in"
      style={{ maxWidth: "720px", margin: "0 auto" }}
    >
      {/* Outer Title */}
      <div className="mb-4">
        <h4 className="text-success fw-bold">Medical Monitoring</h4>
        <p className="text-muted">Log consultation & treatment details</p>
      </div>

      <div className="card shadow-sm border-0">
        {/* Green Card Header */}
        <div className="card-header bg-success text-white py-3">
          <h5 className="mb-0 fw-bold">Monitoring Form</h5>
        </div>

        <div className="card-body p-4">
          <form onSubmit={onSubmit}>
            {/* Row 1 */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Time of Arrival
                </label>
                <input
                  type="time"
                  name="arrival"
                  className="form-control"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Name of Patient
                </label>
                <input
                  type="text"
                  name="patientName"
                  className="form-control"
                  placeholder="Enter patient name"
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
                <label className="form-label fw-semibold">Degree/Program</label>
                <select
                  name="degree"
                  className="form-select"
                  required
                  style={{ color: "var(--text-dark, #212529)" }}
                >
                  <option value="" disabled>
                    Select Program
                  </option>
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Student Number</label>
                <input
                  type="text"
                  name="studentNo"
                  className="form-control"
                  placeholder="Enter ID number"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Signs/Symptoms</label>
                <input
                  type="text"
                  name="symptoms"
                  className="form-control"
                  placeholder="Describe symptoms"
                  required
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Action Taken</label>
              <input
                type="text"
                name="action"
                className="form-control"
                required
              />
            </div>

            {/* Admin Only Fields (Grayed out) */}
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted">
                Meds/Treatment
              </label>
              <input
                type="text"
                name="meds"
                className="form-control bg-light text-muted"
                placeholder="Only Admin can fill out this."
                readOnly
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Time of Exit
                </label>
                <input
                  type="time"
                  name="exit"
                  className="form-control bg-light text-muted"
                  readOnly
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-muted">
                  Duration of Service
                </label>
                <input
                  type="text"
                  name="duration"
                  className="form-control bg-light text-muted"
                  placeholder="Only Admin can fill out this."
                  readOnly
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-muted">
                Attending Medical Personnel
              </label>
              <input
                type="text"
                name="personnel"
                className="form-control bg-light text-muted"
                placeholder="Only Admin can fill out this."
                readOnly
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

export default MonitoringForm;
