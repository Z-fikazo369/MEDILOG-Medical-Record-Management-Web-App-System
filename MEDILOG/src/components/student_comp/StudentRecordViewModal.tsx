import React from "react";
import type {
  NewStudentData,
  MonitoringData,
  CertificateData,
  MedicineIssuanceData,
  LaboratoryRequestData,
  HistoryType,
} from "./studentTypes";

type AnyRecord =
  | NewStudentData
  | MonitoringData
  | CertificateData
  | MedicineIssuanceData
  | LaboratoryRequestData;

interface StudentRecordViewModalProps {
  show: boolean;
  onClose: () => void;
  record: AnyRecord | null;
  recordType: HistoryType;
}

const StudentRecordViewModal: React.FC<StudentRecordViewModalProps> = ({
  show,
  onClose,
  record,
  recordType,
}) => {
  if (!show || !record) return null;

  const getFormTitle = (): string => {
    switch (recordType) {
      case "physicalExam":
        return "Physical Examination Record";
      case "monitoring":
        return "Medical Monitoring Record";
      case "certificate":
        return "Medical Certificate";
      case "medicineIssuance":
        return "Medicine Issuance Record";
      case "laboratoryRequest":
        return "Laboratory Request Form";
      default:
        return "Record";
    }
  };

  const handlePrint = () => {
    const printableContent = document.getElementById(
      "student-printable-record",
    );
    if (!printableContent) return;

    const printContents = printableContent.innerHTML;
    const printWindow = window.open("", "", "height=700,width=900");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Print Record</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css">',
    );
    printWindow.document.write("<style>");
    printWindow.document.write(`
      body { font-size: 14px; color: #222; font-family: 'Segoe UI', Arial, sans-serif; }
      .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2c5f2d; padding-bottom: 12px; }
      .print-header h3 { color: #2c5f2d; margin-bottom: 2px; font-weight: 700; }
      .print-header h5 { margin-bottom: 4px; color: #333; }
      .field-row { display: flex; margin-bottom: 6px; padding: 4px 0; border-bottom: 1px dotted #ddd; }
      .field-label { font-weight: 600; color: #555; min-width: 180px; font-size: 13px; }
      .field-value { flex: 1; font-size: 14px; }
      .section-title { font-weight: 700; color: #2c5f2d; margin-top: 16px; margin-bottom: 8px; font-size: 15px; border-bottom: 1px solid #2c5f2d; padding-bottom: 4px; }
      .test-category { margin-bottom: 12px; }
      .test-category h6 { font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #444; }
      .test-item { font-size: 13px; margin-left: 12px; margin-bottom: 2px; }
      .test-checked { color: #198754; }
      .test-unchecked { color: #aaa; }
      .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
      .signature-block { text-align: center; width: 40%; }
      .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 6px; font-size: 13px; font-weight: 600; }
      .badge { font-size: 12px; padding: 4px 10px; border-radius: 4px; }
      .bg-success { background-color: #198754 !important; color: #fff; }
      .bg-warning { background-color: #ffc107 !important; color: #333; }
      .bg-danger { background-color: #dc3545 !important; color: #fff; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      table th, table td { border: 1px solid #ddd; padding: 6px 10px; font-size: 13px; }
      table th { background: #f8f9fa; font-weight: 600; }
      .no-print { display: none !important; }
      @media print { body { margin: 20px; } }
    `);
    printWindow.document.write("</style></head><body>");
    printWindow.document.write(printContents);
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const statusBadge = (status?: string) => {
    const s = status || "pending";
    const cls =
      s === "approved"
        ? "bg-success"
        : s === "rejected"
          ? "bg-danger"
          : "bg-warning text-dark";
    return <span className={`badge px-3 py-2 ${cls}`}>{s}</span>;
  };

  /* ---------------------------------------------------------- */
  /*  Renderers for each record type                            */
  /* ---------------------------------------------------------- */

  const renderPhysicalExam = () => {
    const pe = record as NewStudentData;
    return (
      <>
        <div className="field-row">
          <span className="field-label">Name</span>
          <span className="field-value">{pe.name}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Gender</span>
          <span className="field-value">{pe.gender}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Course</span>
          <span className="field-value">{pe.course}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Year</span>
          <span className="field-value">{pe.year}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Date</span>
          <span className="field-value">{pe.date}</span>
        </div>
        <div className="field-row no-print">
          <span className="field-label">Status</span>
          <span className="field-value">{statusBadge(pe.status)}</span>
        </div>
      </>
    );
  };

  const renderMonitoring = () => {
    const mon = record as MonitoringData;
    return (
      <>
        <div className="field-row">
          <span className="field-label">Patient Name</span>
          <span className="field-value">{mon.patientName}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Sex</span>
          <span className="field-value">{mon.sex}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Degree</span>
          <span className="field-value">{mon.degree}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Student No.</span>
          <span className="field-value">{mon.studentNo}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Arrival</span>
          <span className="field-value">{mon.arrival}</span>
        </div>
        {mon.exit && (
          <div className="field-row">
            <span className="field-label">Exit</span>
            <span className="field-value">{mon.exit}</span>
          </div>
        )}
        {mon.duration && (
          <div className="field-row">
            <span className="field-label">Duration</span>
            <span className="field-value">{mon.duration}</span>
          </div>
        )}
        <div className="field-row">
          <span className="field-label">Symptoms</span>
          <span className="field-value">{mon.symptoms}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Action Taken</span>
          <span className="field-value">{mon.action}</span>
        </div>
        {mon.meds && (
          <div className="field-row">
            <span className="field-label">Medication</span>
            <span className="field-value">{mon.meds}</span>
          </div>
        )}
        {mon.personnel && (
          <div className="field-row">
            <span className="field-label">Personnel</span>
            <span className="field-value">{mon.personnel}</span>
          </div>
        )}
        <div className="field-row no-print">
          <span className="field-label">Status</span>
          <span className="field-value">{statusBadge(mon.status)}</span>
        </div>
      </>
    );
  };

  const renderCertificate = () => {
    const cert = record as CertificateData;
    return (
      <>
        <div className="field-row">
          <span className="field-label">Name</span>
          <span className="field-value">{cert.name}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Age</span>
          <span className="field-value">{cert.age}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Sex</span>
          <span className="field-value">{cert.sex}</span>
        </div>
        {cert.civilStatus && (
          <div className="field-row">
            <span className="field-label">Civil Status</span>
            <span className="field-value">{cert.civilStatus}</span>
          </div>
        )}
        <div className="field-row">
          <span className="field-label">School</span>
          <span className="field-value">{cert.school}</span>
        </div>
        <div className="field-row">
          <span className="field-label">ID Number</span>
          <span className="field-value">{cert.idNumber}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Date</span>
          <span className="field-value">{cert.date}</span>
        </div>
        {cert.diagnosis && (
          <>
            <div className="section-title">Diagnosis</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{cert.diagnosis}</p>
          </>
        )}
        {cert.remarks && (
          <>
            <div className="section-title">Remarks</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{cert.remarks}</p>
          </>
        )}
        <div className="field-row no-print">
          <span className="field-label">Status</span>
          <span className="field-value">{statusBadge(cert.status)}</span>
        </div>
      </>
    );
  };

  const renderMedicineIssuance = () => {
    const mi = record as MedicineIssuanceData;
    return (
      <>
        <div className="field-row">
          <span className="field-label">Date</span>
          <span className="field-value">{mi.date}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Course</span>
          <span className="field-value">{mi.course}</span>
        </div>
        {mi.diagnosis && (
          <>
            <div className="section-title">Diagnosis</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{mi.diagnosis}</p>
          </>
        )}
        <div className="section-title">Medicines</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine Name</th>
              <th style={{ textAlign: "center" }}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {(mi.medicines || []).map((med, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{med.name}</td>
                <td style={{ textAlign: "center" }}>{med.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="field-row mt-3 no-print">
          <span className="field-label">Status</span>
          <span className="field-value">{statusBadge(mi.status)}</span>
        </div>
      </>
    );
  };

  const renderLaboratoryRequest = () => {
    const lr = record as LaboratoryRequestData;

    const renderTestCategory = (
      title: string,
      tests: { key: string; label: string }[],
      data: Record<string, boolean> | undefined,
    ) => {
      return (
        <div className="test-category">
          <h6>{title}</h6>
          {tests.map(({ key, label }) => {
            const checked = data?.[key] || false;
            return (
              <div
                key={key}
                className={`test-item ${checked ? "test-checked" : "test-unchecked"}`}
              >
                {checked ? "✓" : "○"} {label}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <>
        <div className="field-row">
          <span className="field-label">Name</span>
          <span className="field-value">{lr.name}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Issue Date</span>
          <span className="field-value">{lr.issueDate}</span>
        </div>
        {lr.nurseOnDuty && (
          <div className="field-row">
            <span className="field-label">Nurse on Duty</span>
            <span className="field-value">{lr.nurseOnDuty}</span>
          </div>
        )}

        <div className="section-title">Test Categories</div>
        <div className="row g-3">
          <div className="col-md-4">
            {renderTestCategory(
              "Routine/Urinalysis Tests",
              [
                { key: "pregnancy", label: "Pregnancy Test" },
                { key: "fecalysis", label: "Fecalysis" },
              ],
              lr.routineUrinalysisTests as Record<string, boolean> | undefined,
            )}
          </div>
          <div className="col-md-4">
            {renderTestCategory(
              "CBC with Diff Count",
              [
                { key: "hemoglobin", label: "Hemoglobin" },
                { key: "hematocrit", label: "Hematocrit" },
                { key: "bloodSugar", label: "Blood Sugar" },
                { key: "plateletCT", label: "Platelet CT/Wear" },
              ],
              lr.cbcTests as Record<string, boolean> | undefined,
            )}
          </div>
          <div className="col-md-4">
            {renderTestCategory(
              "Gram Stain",
              [
                { key: "hpsBhTest", label: "HPS/BH Test" },
                { key: "vaginalSmear", label: "Vaginal Smear" },
              ],
              lr.gramStain as Record<string, boolean> | undefined,
            )}
          </div>
          <div className="col-md-4">
            {renderTestCategory(
              "Blood Chemistry",
              [
                { key: "fbs", label: "FBS" },
                { key: "uricAcid", label: "Uric Acid" },
                { key: "cholesterol", label: "Total Cholesterol" },
                { key: "hdl", label: "HDL/LDL Profile" },
                { key: "tsh", label: "TSH" },
                { key: "totalProtein", label: "Total Protein" },
              ],
              lr.bloodChemistry as Record<string, boolean> | undefined,
            )}
          </div>
          <div className="col-md-4">
            {renderTestCategory(
              "Pap Smear",
              [
                { key: "cxrInterpretation", label: "CXR Interpretation" },
                { key: "ecgInterpretation", label: "ECG Interpretation" },
              ],
              lr.papSmear as Record<string, boolean> | undefined,
            )}
          </div>
          <div className="col-md-4">
            {renderTestCategory(
              "Widhal Test",
              [{ key: "salmonella", label: "Salmonella" }],
              lr.widhalTest as Record<string, boolean> | undefined,
            )}
          </div>
        </div>

        {lr.others && (
          <>
            <div className="section-title">Others</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{lr.others}</p>
          </>
        )}

        <div className="field-row mt-3 no-print">
          <span className="field-label">Status</span>
          <span className="field-value">{statusBadge(lr.status)}</span>
        </div>
      </>
    );
  };

  const renderRecordContent = () => {
    switch (recordType) {
      case "physicalExam":
        return renderPhysicalExam();
      case "monitoring":
        return renderMonitoring();
      case "certificate":
        return renderCertificate();
      case "medicineIssuance":
        return renderMedicineIssuance();
      case "laboratoryRequest":
        return renderLaboratoryRequest();
      default:
        return null;
    }
  };

  return (
    <div
      className="modal-backdrop-custom"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="modal-content-custom rounded shadow"
        style={{
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-3 modal-custom-header"
          style={{ borderBottom: "1px solid var(--border-color, #dee2e6)" }}
        >
          <h5
            className="mb-0 fw-bold"
            style={{ color: "var(--text-highlight, #2c5f2d)" }}
          >
            <i className="bi bi-file-earmark-text me-2"></i>
            {getFormTitle()}
          </h5>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-success btn-sm"
              onClick={handlePrint}
              title="Print this record"
            >
              <i className="bi bi-printer me-1"></i>Print
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={onClose}
              title="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Modal Body — Scrollable */}
        <div className="px-4 py-3" style={{ overflowY: "auto", flex: 1 }}>
          <div id="student-printable-record">
            {/* Print-only header (hidden on screen, visible in print window) */}
            <div className="print-header" style={{ display: "none" }}>
              <h3>MEDILOG</h3>
              <h5>{getFormTitle()}</h5>
            </div>

            {/* Record Fields */}
            {renderRecordContent()}

            {/* Signature Section (visible in the modal too, printed as blanks) */}
            <div className="signature-section mt-5">
              <div className="signature-block">
                <div className="signature-line">Student Signature</div>
              </div>
              <div className="signature-block">
                <div className="signature-line">Nurse / Admin Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRecordViewModal;
