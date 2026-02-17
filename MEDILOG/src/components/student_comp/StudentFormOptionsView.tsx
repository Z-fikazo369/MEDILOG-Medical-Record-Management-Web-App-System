import React from "react";
import type { StudentView } from "./studentTypes";

interface StudentFormOptionsViewProps {
  setActiveView: (view: StudentView) => void;
}

const StudentFormOptionsView: React.FC<StudentFormOptionsViewProps> = ({
  setActiveView,
}) => {
  return (
    <div
      className="section onlineFormSection fade-in"
      style={{ display: "block" }}
    >
      <div className="row g-4 mt-2">
        {/* --- CARD 1: Physical Exam --- */}
        <div className="col-12 col-md-6 col-lg-4">
          <div
            onClick={() => setActiveView("newStudent")}
            className="modern-card"
          >
            <div className="card-icon-box">
              <i className="bi bi-person-vcard"></i>
            </div>
            <div className="card-text-content">
              <h5>Physical Exam</h5>
              <p>Form for new student health assessment.</p>
            </div>
            <div className="card-arrow">
              <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>

        {/* --- CARD 2: Medical Monitoring --- */}
        <div className="col-12 col-md-6 col-lg-4">
          <div
            onClick={() => setActiveView("monitoring")}
            className="modern-card"
          >
            <div className="card-icon-box">
              <i className="bi bi-heart-pulse"></i>
            </div>
            <div className="card-text-content">
              <h5>Monitoring</h5>
              <p>Log consultation & treatment details.</p>
            </div>
            <div className="card-arrow">
              <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>

        {/* --- CARD 3: Medical Certificate --- */}
        <div className="col-12 col-md-6 col-lg-4">
          <div
            onClick={() => setActiveView("certificate")}
            className="modern-card"
          >
            <div className="card-icon-box">
              <i className="bi bi-file-earmark-medical"></i>
            </div>
            <div className="card-text-content">
              <h5>Certificate</h5>
              <p>Request medical clearance or certs.</p>
            </div>
            <div className="card-arrow">
              <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>

        {/* --- CARD 4: Medicine Issuance --- */}
        <div className="col-12 col-md-6 col-lg-4">
          <div
            onClick={() => setActiveView("medicineIssuance")}
            className="modern-card"
          >
            <div className="card-icon-box">
              <i className="bi bi-capsule"></i>
            </div>
            <div className="card-text-content">
              <h5>Medicine Issuance</h5>
              <p>Request medicines from the clinic.</p>
            </div>
            <div className="card-arrow">
              <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>

        {/* --- CARD 5: Laboratory Request --- */}
        <div className="col-12 col-md-6 col-lg-4">
          <div
            onClick={() => setActiveView("laboratoryRequest")}
            className="modern-card"
          >
            <div className="card-icon-box">
              <i className="bi bi-clipboard2-pulse"></i>
            </div>
            <div className="card-text-content">
              <h5>Laboratory Request</h5>
              <p>Submit a laboratory test request.</p>
            </div>
            <div className="card-arrow">
              <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFormOptionsView;
