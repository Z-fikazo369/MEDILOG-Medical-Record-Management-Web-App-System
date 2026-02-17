import React from "react";

const StudentLandingView: React.FC = () => {
  return (
    <div className="landing-page" style={{ display: "block" }}>
      <div className="card shadow-sm">
        <div className="card-header bg-success text-white">INFIRMARY STAFF</div>
        <div className="card-body">
          {/* Staff 1 */}
          <div className="border rounded p-3 mb-3">
            <h4 className="mb-1">Debie-lyn P. Dolojan</h4>
            <p className="text-muted mb-2">Nurse </p>
            <div
              style={{ maxWidth: "350px" }}
              className="d-flex flex-column gap-2 mt-2"
            >
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Schedule: TTH 8am - 4pm & F 7:30a - 5pm
              </span>
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Counter: 3
              </span>
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Number: 0983245729
              </span>
            </div>
            <h6 className="mt-3">SERVICES:</h6>
            <ul className="list-group mt-2">
              <li className="list-group-item">
                <span className="fw-bold">Emergency & Critical Care</span>
              </li>
              <li className="list-group-item">
                <span className="fw-bold">
                  Emotional & Psychological Support
                </span>
              </li>
              <li className="list-group-item">
                <span className="fw-bold">Emergency & First Aid Care</span>
              </li>
            </ul>
          </div>

          {/* Staff 2 */}
          <div className="border rounded p-3 mb-3">
            <h4 className="mb-1">Frequin C. Ramos</h4>
            <p className="text-muted mb-2">Dentist</p>
            <div
              style={{ maxWidth: "350px" }}
              className="d-flex flex-column gap-2 mt-2"
            >
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Schedule: T 7am - 4pm & W 8:30a - 5pm
              </span>
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Counter: 1
              </span>
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Number: 0932756434
              </span>
            </div>
            <h6 className="mt-3">SERVICES:</h6>
            <ul className="list-group mt-2">
              <li className="list-group-item">
                <span className="fw-bold">
                  Emergency dental care (relief of pain, swelling, broken teeth)
                </span>
              </li>
              <li className="list-group-item">
                <span className="fw-bold">Preventive Care</span>
              </li>
              <li className="list-group-item">
                <span className="fw-bold">Root canal treatment</span>
              </li>
            </ul>
          </div>

          {/* Staff 3 */}
          <div className="border rounded p-3 mb-3">
            <h4 className="mb-1">Precious S. Paguyo</h4>
            <p className="text-muted mb-2">Nurse</p>
            <div
              style={{ maxWidth: "350px" }}
              className="d-flex flex-column gap-2 mt-2"
            >
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Schedule: MW 7am - 4pm & T 8:30a - 5pm
              </span>
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Counter: 1
              </span>
              <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                Number: 09853080160
              </span>
            </div>
            <h6 className="mt-3">SERVICES:</h6>
            <ul className="list-group mt-2">
              <li className="list-group-item">
                <span className="fw-bold">Oral Health Education</span>
              </li>
              <li className="list-group-item">
                <span className="fw-bold">Administrative & Record-Keeping</span>
              </li>
              <li className="list-group-item">
                <span className="fw-bold">Patient Care & Monitoring</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="card shadow-sm mt-4">
        <div className="card-header bg-success text-white">DESCRIPTION</div>
        <div className="card-body">
          <div className="border rounded p-3 mb-3">
            <h5 className="mb-1">PHYSICAL EXAMINATION OF NEW STUDENT'S</h5>
            <p className="text-muted mb-2">
              This form is specifically designed for all new enrollees of ISU.
              It serves as a requirement to evaluate the student's overall
              physical health and fitness before being officially admitted.
            </p>
          </div>
          <div className="border rounded p-3 mb-3">
            <h5 className="mb-1">MEDICAL MONITORING</h5>
            <p className="text-muted mb-2">
              This form is intended for students undergoing On-the-Job Training
              (OJT) and those enrolled in the National Service Training Program
              (NSTP).
            </p>
          </div>
          <div className="border rounded p-3 mb-3">
            <h5 className="mb-1">MEDICAL CERTIFICATE</h5>
            <p className="text-muted mb-2">
              This form is available for all ISU staff and students who may need
              proof of their medical evaluation or fitness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLandingView;
