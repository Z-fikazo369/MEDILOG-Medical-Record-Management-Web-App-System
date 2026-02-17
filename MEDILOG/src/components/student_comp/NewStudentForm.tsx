import React from "react";
import type { StudentView } from "./studentTypes";
import { COURSE_OPTIONS } from "./courseOptions";

interface NewStudentFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setActiveView: (view: StudentView) => void;
}

const NewStudentForm: React.FC<NewStudentFormProps> = ({
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
        <h4 className="text-success fw-bold">New Student</h4>
        <p className="text-muted">Student health assessment form</p>
      </div>

      <div className="card shadow-sm border-0">
        {/* Green Card Header */}
        <div className="card-header bg-success text-white py-3">
          <h5 className="mb-0 fw-bold">New Student Form</h5>
        </div>

        <div className="card-body p-4">
          <form onSubmit={onSubmit}>
            {/* Row 1: Name & Gender */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Gender</label>
                <select name="gender" className="form-select" required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="LGBTQ+">LGBTQ+</option>
                </select>
              </div>
            </div>

            {/* Row 2: Course & Year */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Course</label>
                <select
                  name="course"
                  className="form-select"
                  required
                  style={{ color: "var(--text-dark, #212529)" }}
                >
                  <option value="" disabled>
                    Select Course
                  </option>
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Year Level</label>
                <select name="year" className="form-select" required>
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </div>
            </div>

            {/* Row 3: Date */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                name="date"
                className="form-control"
                required
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

export default NewStudentForm;
