// --- Student Dashboard Types ---

export interface NewStudentData {
  _id?: string;
  name: string;
  gender: string;
  course: string;
  year: string;
  date: string;
  status?: string;
  submissionDate?: string;
}

export interface MonitoringData {
  _id?: string;
  arrival: string;
  patientName: string;
  sex: string;
  degree: string;
  studentNo: string;
  symptoms: string;
  action: string;
  meds?: string;
  exit?: string;
  duration?: string;
  personnel?: string;
  status?: string;
  submissionDate?: string;
}

export interface CertificateData {
  _id?: string;
  name: string;
  age: string;
  sex: string;
  civilStatus?: string;
  school: string;
  idNumber: string;
  date: string;
  diagnosis?: string;
  remarks?: string;
  status?: string;
  submissionDate?: string;
}

export interface MedicineItem {
  name: string;
  quantity: number;
}

export interface MedicineIssuanceData {
  _id?: string;
  date: string;
  course: string;
  medicines: MedicineItem[];
  diagnosis?: string;
  status?: string;
  submissionDate?: string;
}

export interface LaboratoryRequestData {
  _id?: string;
  issueDate: string;
  name: string;
  nurseOnDuty?: string;
  routineUrinalysisTests?: { pregnancy: boolean; fecalysis: boolean };
  cbcTests?: {
    hemoglobin: boolean;
    hematocrit: boolean;
    bloodSugar: boolean;
    plateletCT: boolean;
  };
  gramStain?: { hpsBhTest: boolean; vaginalSmear: boolean };
  bloodChemistry?: {
    fbs: boolean;
    uricAcid: boolean;
    cholesterol: boolean;
    hdl: boolean;
    tsh: boolean;
    totalProtein: boolean;
  };
  papSmear?: { cxrInterpretation: boolean; ecgInterpretation: boolean };
  widhalTest?: { salmonella: boolean };
  others?: string;
  status?: string;
  submissionDate?: string;
}

export interface Notification {
  _id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  recordType: string;
}

export type StudentView =
  | "landing"
  | "profile"
  | "formOptions"
  | "newStudent"
  | "monitoring"
  | "certificate"
  | "medicineIssuance"
  | "laboratoryRequest"
  | "history"
  | "notifications";

export type HistoryType =
  | "physicalExam"
  | "monitoring"
  | "certificate"
  | "medicineIssuance"
  | "laboratoryRequest";
