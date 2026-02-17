# MEDILOG — Comprehensive Project Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 17, 2026  
> **Development Methodology:** Agile (Iterative & Incremental)  
> **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started (Onboarding Guide)](#2-getting-started-onboarding-guide)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Backend Documentation](#6-backend-documentation)
   - 6.1 [Server Configuration](#61-server-configuration)
   - 6.2 [Database Models & Schemas](#62-database-models--schemas)
   - 6.3 [API Reference](#63-api-reference)
   - 6.4 [Middleware](#64-middleware)
   - 6.5 [Utilities](#65-utilities)
7. [Frontend Documentation](#7-frontend-documentation)
   - 7.1 [Application Entry & Routing](#71-application-entry--routing)
   - 7.2 [State Management](#72-state-management)
   - 7.3 [Services (API Layer)](#73-services-api-layer)
   - 7.4 [Pages](#74-pages)
   - 7.5 [Components](#75-components)
   - 7.6 [TypeScript Types & Interfaces](#76-typescript-types--interfaces)
   - 7.7 [Styles](#77-styles)
8. [Machine Learning Module](#8-machine-learning-module)
9. [AI Assistant Module](#9-ai-assistant-module)
10. [Authentication & Security](#10-authentication--security)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)
13. [User Guides](#13-user-guides)
14. [Agile Development Notes](#14-agile-development-notes)
15. [Maintenance & Debugging Guide](#15-maintenance--debugging-guide)
16. [Collaboration Guidelines](#16-collaboration-guidelines)
17. [Glossary](#17-glossary)

---

## 1. Project Overview

### What is MEDILOG?

**MEDILOG** is a full-stack web-based Medical Information Logging System designed for university/school infirmaries. It digitizes and streamlines the management of student medical records, pharmacy inventory, and clinical workflows. The system provides separate portals for students and administrators/staff, incorporating AI-powered features for medical document processing and predictive health analytics.

### Why Does MEDILOG Exist?

Traditional school infirmaries rely on paper-based record-keeping, which is:

- **Slow** — Manual lookup of student medical history takes time
- **Error-prone** — Handwritten records can be lost, damaged, or misread
- **Non-analytical** — Paper records cannot generate insights or predictions

MEDILOG solves these problems by providing:

- **Digital medical record submission and management** for 5 record types
- **Real-time pharmacy inventory tracking** with automated stock alerts
- **AI-powered medical document transcription** (audio, image OCR, PDF)
- **Predictive health analytics** using CatBoost machine learning models
- **Automated notifications** for students when records are processed
- **System backup and restore** capabilities for data safety

### Core Features at a Glance

| Feature                       | Description                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Student Portal**            | Submit physical exams, medical monitoring, certificates, medicine issuance, lab requests                   |
| **Admin Portal**              | Review/approve/reject records, manage accounts, view dashboard analytics                                   |
| **Pharmacy Management**       | Track medicine inventory with stock levels, expiry dates, auto-status computation                          |
| **AI Assistant**              | Audio transcription (Groq Whisper), Image OCR (Tesseract.js), PDF extraction, AI summarization (Llama 3.3) |
| **Predictive Analytics**      | CatBoost ML models for visit forecasting, disease risk, student risk, stock depletion                      |
| **Notification System**       | Real-time status updates for students when records are approved/rejected                                   |
| **Backup & Restore**          | Full system JSON backups with download and restore capability                                              |
| **Multi-role Authentication** | Student, Staff, and Admin roles with OTP verification and rate limiting                                    |

---

## 2. Getting Started (Onboarding Guide)

### Prerequisites

Before setting up MEDILOG, ensure you have the following installed:

| Tool        | Minimum Version | Purpose                              |
| ----------- | --------------- | ------------------------------------ |
| **Node.js** | v18+            | Backend server & frontend dev server |
| **npm**     | v9+             | Package management                   |
| **Python**  | 3.9+            | CatBoost ML service                  |
| **MongoDB** | 6.0+ (or Atlas) | Database                             |
| **Git**     | 2.40+           | Version control                      |

### Installation Steps

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "Soft Eng 2 System"
```

#### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the required environment variables (see [Section 12](#12-environment-variables)).

#### Step 3: Python ML Setup

```bash
cd backend/ml
pip install -r requirements.txt
```

This installs `catboost>=1.2` and `numpy>=1.24` for the ML prediction service.

#### Step 4: Frontend Setup

```bash
cd MEDILOG
npm install
```

Create a `.env` file in `MEDILOG/` with the frontend environment variables.

#### Step 5: Run the Application

**Terminal 1 — Backend Server:**

```bash
cd backend
npm run dev
```

Server starts on `http://localhost:5000`.

**Terminal 2 — Frontend Dev Server:**

```bash
cd MEDILOG
npm run dev
```

Vite dev server starts on `http://localhost:5173`.

#### Step 6: Create Default Admin

On first startup, the server automatically creates a default admin account via `createDefaultAdmin()` in `config/db.js`. Check the `authController.js` for default credentials.

Alternatively:

```bash
cd backend
npm run create-admin
```

### Verifying the Setup

1. Open `http://localhost:5173` — you should see the MEDILOG landing page
2. Backend health: `http://localhost:5000` — server should be running on port 5000
3. MongoDB: Ensure your MongoDB instance is accessible at the URI in your `.env`

---

## 3. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React + TypeScript + Vite                    │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │   │
│  │  │ Landing Page │  │Student Portal│  │ Admin Portal   │   │   │
│  │  └─────────────┘  └──────────────┘  └───────────────┘   │   │
│  │              ↕ Axios HTTP Client (api.ts)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST API (JSON)
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
│  ┌────────────┐  ┌────────────────┐  ┌───────────────────────┐  │
│  │  Auth       │  │ Medical Records│  │  Pharmacy Inventory   │  │
│  │  Middleware │  │  Controllers   │  │  Controllers          │  │
│  └────────────┘  └────────────────┘  └───────────────────────┘  │
│  ┌────────────┐  ┌────────────────┐  ┌───────────────────────┐  │
│  │ Analytics   │  │ AI Assistant   │  │  Admin/Backup         │  │
│  │ Controller  │  │ Controller     │  │  Controllers          │  │
│  └─────┬──────┘  └───────┬────────┘  └───────────────────────┘  │
│        │                 │                                       │
│        ↓                 ↓                                       │
│  ┌──────────┐    ┌──────────────┐                               │
│  │ CatBoost │    │ Groq API     │                               │
│  │ Python   │    │ (Whisper +   │                               │
│  │ Service  │    │  Llama 3.3)  │                               │
│  └──────────┘    └──────────────┘                               │
│                                                                  │
│              ↕ Mongoose ODM                                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    MongoDB (Atlas/Local)                         │
│  ┌────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │ Users  │ │PhysicalExams │ │MedMonitoring │ │MedCertificate│  │
│  └────────┘ └──────────────┘ └──────────────┘ └─────────────┘  │
│  ┌──────────────┐ ┌────────────────┐ ┌──────────────────────┐   │
│  │MedicineIssue │ │LaboratoryReqs  │ │PharmacyInventory     │   │
│  └──────────────┘ └────────────────┘ └──────────────────────┘   │
│  ┌──────────────┐ ┌────────────────┐ ┌──────────────────────┐   │
│  │Notifications │ │AiTranscriptions│ │AdminActivityLogs     │   │
│  └──────────────┘ └────────────────┘ └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ↓                         ↓
┌──────────────────┐       ┌──────────────────┐
│   Cloudinary     │       │    Gmail SMTP     │
│   (File Storage) │       │   (Email/OTP)     │
└──────────────────┘       └──────────────────┘
```

### Data Flow

1. **Student submits a medical record** → React form → `medicalAPI.createRecord()` → POST `/api/records` → `medicalRecordController.createRecord()` → saves to MongoDB → creates Notification for admin
2. **Admin approves a record** → `medicalAPI.updateRecord()` → PUT `/api/records/:id` → updates status to `approved` → creates Notification for student → triggers approval email
3. **Analytics request** → `analyticsAPI.getPredictiveAnalytics()` → GET `/api/analytics/predictive` → controller aggregates data from MongoDB → spawns Python CatBoost subprocess → returns predictions as JSON
4. **AI transcription** → Admin uploads audio → POST `/api/ai-assistant/transcriptions/audio` → Groq Whisper transcribes → Llama 3.3 summarizes → saves to MongoDB

### Design Decisions

| Decision                        | Rationale                                                                |
| ------------------------------- | ------------------------------------------------------------------------ |
| **Monorepo structure**          | Frontend and backend in same repository for easier coordination          |
| **MongoDB (NoSQL)**             | Flexible schema for diverse medical record types                         |
| **CatBoost via subprocess**     | Python ML ecosystem is superior; spawning avoids Node.js ML limitations  |
| **Groq API for AI**             | Fast inference (Whisper + Llama) without self-hosting GPU models         |
| **Cloudinary for file storage** | Scalable cloud image hosting with transformation capabilities            |
| **Session-based JWT**           | Stored in `sessionStorage` for security; 30-day expiry for "Remember Me" |
| **Rate limiting**               | Prevents brute-force attacks on login and OTP endpoints                  |

---

## 4. Technology Stack

### Frontend

| Technology                     | Version       | Purpose                                                 |
| ------------------------------ | ------------- | ------------------------------------------------------- |
| **React**                      | 19.1.1        | UI component library                                    |
| **TypeScript**                 | 5.9.3         | Type-safe JavaScript                                    |
| **Vite**                       | 7.1.7         | Build tool & dev server                                 |
| **React Router DOM**           | 7.9.4         | Client-side routing                                     |
| **Axios**                      | 1.12.2        | HTTP client for API calls                               |
| **Bootstrap**                  | 5.3.8         | CSS framework & UI components                           |
| **Bootstrap Icons**            | 1.13.1        | Icon library                                            |
| **Chart.js + react-chartjs-2** | 4.5.1 / 5.3.1 | Dashboard charts                                        |
| **Recharts**                   | 3.2.1         | Advanced analytics charts (Line, Pie, Radar, Area, Bar) |
| **Tesseract.js**               | 7.0.0         | Client-side OCR for image text extraction               |
| **react-google-recaptcha**     | 3.1.0         | reCAPTCHA v2 for login security                         |

### Backend

| Technology             | Version | Purpose                              |
| ---------------------- | ------- | ------------------------------------ |
| **Node.js**            | 18+     | JavaScript runtime                   |
| **Express**            | 4.18.2  | REST API framework                   |
| **Mongoose**           | 8.0.0   | MongoDB ODM (Object Document Mapper) |
| **bcryptjs**           | 2.4.3   | Password hashing                     |
| **jsonwebtoken**       | 9.0.2   | JWT authentication                   |
| **Groq SDK**           | 0.37.0  | AI transcription & summarization API |
| **Cloudinary**         | 1.41.3  | Cloud image/file storage             |
| **Multer**             | 2.0.2   | File upload handling                 |
| **Nodemailer**         | 6.10.1  | Email sending (OTP, notifications)   |
| **express-rate-limit** | 8.2.1   | API rate limiting                    |
| **ExcelJS**            | 4.4.0   | Excel file generation for exports    |
| **json2csv**           | 6.0.0   | CSV file generation for exports      |
| **pdf-parse**          | 2.4.5   | PDF text extraction                  |
| **dotenv**             | 16.6.1  | Environment variable management      |
| **nodemon**            | 3.0.1   | Dev server auto-restart              |

### Machine Learning (Python)

| Technology   | Version | Purpose                     |
| ------------ | ------- | --------------------------- |
| **CatBoost** | ≥1.2    | Gradient boosting ML models |
| **NumPy**    | ≥1.24   | Numerical computation       |

### Infrastructure

| Service           | Purpose                                |
| ----------------- | -------------------------------------- |
| **MongoDB Atlas** | Cloud-hosted database                  |
| **Cloudinary**    | Image & file cloud storage             |
| **Gmail SMTP**    | Transactional emails (OTP, approvals)  |
| **Groq Cloud**    | AI inference (Whisper + Llama 3.3 70B) |
| **Vercel**        | Frontend deployment                    |

---

## 5. Project Structure

```
Soft Eng 2 System/
│
├── DOCUMENTATION.md                    # ← This file
│
├── backend/                            # Node.js + Express REST API
│   ├── server.js                       # Application entry point
│   ├── package.json                    # Backend dependencies & scripts
│   │
│   ├── config/
│   │   ├── db.js                       # MongoDB connection + default admin creation
│   │   └── cloudinary.js               # Cloudinary + Multer storage configuration
│   │
│   ├── middleware/
│   │   └── authMiddleware.js           # JWT protect + isAdmin middleware
│   │
│   ├── models/                         # Mongoose schemas (10 models)
│   │   ├── User.js                     # User accounts (student/admin/staff)
│   │   ├── PhysicalExam.js             # Physical examination records
│   │   ├── MedicalMonitoring.js        # Medical monitoring/consultation records
│   │   ├── MedicalCertificate.js       # Medical certificate requests
│   │   ├── MedicineIssuance.js         # Medicine dispensing records
│   │   ├── LaboratoryRequest.js        # Laboratory test requests
│   │   ├── PharmacyInventory.js        # Pharmacy stock tracking
│   │   ├── Notification.js             # User notifications
│   │   ├── AiTranscription.js          # AI transcription records
│   │   └── AdminActivityLog.js         # Admin activity logging (stub)
│   │
│   ├── controllers/                    # Business logic (8 controllers)
│   │   ├── authController.js           # Signup, login, OTP, account management
│   │   ├── medicalRecordController.js  # CRUD + bulk ops + export for records
│   │   ├── adminController.js          # System backup & restore
│   │   ├── userController.js           # Profile picture upload
│   │   ├── pharmacyController.js       # Pharmacy inventory CRUD + seed
│   │   ├── analyticsController.js      # Dashboard stats + ML predictions
│   │   ├── aiAssistantController.js    # Audio/image/PDF processing
│   │   └── notificationController.js   # Notification CRUD
│   │
│   ├── routes/                         # Express route definitions (8 files)
│   │   ├── authRoutes.js               # /api/auth/*
│   │   ├── medicalRecordRoutes.js      # /api/medical/*
│   │   ├── adminRoutes.js              # /api/users/backup/*
│   │   ├── userRoutes.js               # /api/users/*
│   │   ├── pharmacyRoutes.js           # /api/pharmacy/*
│   │   ├── analyticsRoutes.js          # /api/analytics/*
│   │   ├── aiAssistantRoutes.js        # /api/ai-assistant/*
│   │   └── notificationRoutes.js       # /api/notifications/*
│   │
│   ├── utils/                          # Shared utilities
│   │   ├── aiSummarizer.js             # Groq Llama summarizer + offline fallback
│   │   ├── emailService.js             # Nodemailer email templates
│   │   ├── generateOTP.js              # 6-digit OTP generator
│   │   └── generateToken.js            # JWT token generator (30-day expiry)
│   │
│   ├── ml/                             # Python ML service
│   │   ├── catboost_service.py         # 4 CatBoost models (848 lines)
│   │   ├── requirements.txt            # Python dependencies
│   │   └── models/                     # Trained .cbm model files (auto-generated)
│   │       ├── disease_risk.cbm
│   │       ├── stock_depletion.cbm
│   │       ├── student_risk.cbm
│   │       └── visit_forecast.cbm
│   │
│   ├── scripts/                        # Utility scripts
│   │   ├── createAdmin.js              # Manual admin account creation
│   │   ├── seedTestData.js             # Seed test data for development
│   │   ├── checkSeedData.js            # Verify seeded data
│   │   └── debugVisitForecast.js       # Debug ML visit forecasting
│   │
│   └── backups/                        # System backup JSON files
│       └── MEDILOG_Backup_*.json
│
├── MEDILOG/                            # React frontend (Vite + TypeScript)
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Frontend dependencies & scripts
│   ├── vite.config.ts                  # Vite build configuration
│   ├── vercel.json                     # Vercel SPA rewrite rules
│   ├── tsconfig.json                   # TypeScript configuration
│   │
│   └── src/
│       ├── App.tsx                     # Root component with React Router
│       ├── main.tsx                    # ReactDOM entry point
│       ├── index.css                   # Global CSS variables & resets
│       │
│       ├── context/
│       │   ├── AuthContext.tsx          # Authentication state management
│       │   └── ThemeContext.tsx         # Dark/light theme state
│       │
│       ├── services/
│       │   └── api.ts                  # All API functions (530 lines)
│       │
│       ├── types/
│       │   └── index.ts                # Shared TypeScript interfaces
│       │
│       ├── pages/
│       │   ├── LandingPage.tsx         # Public marketing page
│       │   ├── StudentDashboard.tsx    # Student portal (630 lines)
│       │   └── AdminDashboard.tsx      # Admin portal (472 lines)
│       │
│       ├── components/
│       │   ├── Logo.tsx                # MEDILOG SVG logo
│       │   ├── ProtectedRoute.tsx      # Auth guard component
│       │   ├── ThemeToggle.tsx         # Theme toggle button
│       │   │
│       │   ├── auth/                   # Authentication components
│       │   │   ├── LoginForm.tsx
│       │   │   ├── SignupForm.tsx
│       │   │   ├── OTPVerification.tsx
│       │   │   ├── ForgotPassword.tsx
│       │   │   └── RoleSelection.tsx
│       │   │
│       │   ├── common/
│       │   │   └── FaceCaptureModal.tsx # Webcam face capture
│       │   │
│       │   ├── admin_comp/             # Admin portal components
│       │   │   ├── AdminSidebar.tsx
│       │   │   ├── DashboardView.tsx
│       │   │   ├── DashboardCharts.tsx
│       │   │   ├── PredictiveAnalytics.tsx
│       │   │   ├── AnalyticsAssistant.tsx
│       │   │   ├── PatientRecordsView.tsx
│       │   │   ├── StudentAccountsView.tsx
│       │   │   ├── StaffAccountsView.tsx
│       │   │   ├── PharmacyInventoryView.tsx
│       │   │   ├── AiAssistantView.tsx
│       │   │   ├── BackupRestoreView.tsx
│       │   │   └── PaginationControls.tsx
│       │   │
│       │   └── student_comp/           # Student portal components
│       │       ├── StudentSidebar.tsx
│       │       ├── StudentLandingView.tsx
│       │       ├── StudentProfileView.tsx
│       │       ├── StudentFormOptionsView.tsx
│       │       ├── NewStudentForm.tsx
│       │       ├── MonitoringForm.tsx
│       │       ├── CertificateForm.tsx
│       │       ├── MedicineIssuanceForm.tsx
│       │       ├── LaboratoryRequestForm.tsx
│       │       ├── StudentHistoryView.tsx
│       │       ├── StudentRecordViewModal.tsx
│       │       ├── StudentNotificationsView.tsx
│       │       ├── courseOptions.ts
│       │       └── studentTypes.ts
│       │
│       ├── styles/
│       │   ├── LandingPage.css
│       │   ├── AuthStyles.css
│       │   ├── adminportal.css
│       │   └── studentportal.css
│       │
│       └── assets/                     # Static images
│           ├── 97122.jpg
│           ├── Infirmary1.jpg
│           └── react.svg
│
└── catboost_info/                      # CatBoost training logs (auto-generated)
```

---

## 6. Backend Documentation

### 6.1 Server Configuration

**File:** `backend/server.js`

The Express server is the central entry point for the backend. It:

1. **Loads environment variables** via `dotenv.config()`
2. **Configures CORS** with `origin: true` (all origins), credentials enabled, and exposed rate-limit headers
3. **Parses JSON** request bodies via `express.json()`
4. **Connects to MongoDB** via `connectDB()`, which also creates the default admin account
5. **Registers 8 route groups** under specific base paths
6. **Listens** on `PORT` (default `5000`)

**Route Mounting:**

| Base Path           | Route File            | Domain                                      |
| ------------------- | --------------------- | ------------------------------------------- |
| `/api`              | `authRoutes`          | Authentication & account management         |
| `/api`              | `medicalRecordRoutes` | Medical record CRUD                         |
| `/api/users`        | `adminRoutes`         | System backup operations                    |
| `/api/users`        | `userRoutes`          | Profile picture upload + backup (duplicate) |
| `/api`              | `notificationRoutes`  | Student notifications                       |
| `/api/analytics`    | `analyticsRoutes`     | Dashboard analytics & ML predictions        |
| `/api/pharmacy`     | `pharmacyRoutes`      | Pharmacy inventory management               |
| `/api/ai-assistant` | `aiAssistantRoutes`   | AI transcription tools                      |

**NPM Scripts:**

| Command                | Action                                              |
| ---------------------- | --------------------------------------------------- |
| `npm start`            | Production start (`node server.js`)                 |
| `npm run dev`          | Development with auto-restart (`nodemon server.js`) |
| `npm run create-admin` | Create admin account via script                     |

---

### 6.2 Database Models & Schemas

MEDILOG uses **MongoDB** with **Mongoose** ODM. There are **10 models** across 3 categories:

#### User Management

##### User Model

**File:** `backend/models/User.js`

The central user model supporting three roles: `student`, `admin`, and `staff`.

| Field                 | Type            | Constraints                             | Description                         |
| --------------------- | --------------- | --------------------------------------- | ----------------------------------- |
| `username`            | String          | required                                | Display name                        |
| `email`               | String          | required, unique                        | Login email / OTP delivery          |
| `password`            | String          | optional                                | Bcrypt-hashed password              |
| `lrn`                 | String          | —                                       | Learner Reference Number (students) |
| `studentId`           | String          | —                                       | Student ID number                   |
| `profilePictureUrl`   | String          | default `""`                            | Cloudinary profile picture URL      |
| `idPictureUrl`        | String          | default `""`                            | Cloudinary ID picture URL           |
| `department`          | String          | —                                       | Academic department                 |
| `program`             | String          | —                                       | Academic program/course             |
| `yearLevel`           | String          | —                                       | Year level (1–5)                    |
| `employeeId`          | String          | —                                       | Staff employee ID                   |
| `position`            | String          | —                                       | Staff position title                |
| `role`                | String          | enum: `student`, `admin`, `staff`       | User role, default `student`        |
| `status`              | String          | enum: `pending`, `approved`, `rejected` | Account approval status             |
| `defaultLoginMethod`  | String          | enum: `email`, `studentId`              | Preferred login method              |
| `isVerified`          | Boolean         | default `false`                         | OTP verification status             |
| `firstLoginCompleted` | Boolean         | default `false`                         | First login flag                    |
| `rememberMe`          | Boolean         | default `false`                         | Trusted device flag                 |
| `rememberMeExpiry`    | Date            | —                                       | Trust expiration date               |
| `lastLoginAt`         | Date            | —                                       | Last successful login               |
| `otp`                 | String          | —                                       | Current OTP code                    |
| `otpExpiry`           | Date            | —                                       | OTP expiration time                 |
| `approvedBy`          | ObjectId → User | —                                       | Admin who approved the account      |

**Pre-save Hook:** Automatically hashes `password` with bcrypt (10 salt rounds) when modified.

**Instance Method:** `matchPassword(enteredPassword)` — compares plaintext input against the stored bcrypt hash.

---

#### Medical Records (5 Models)

All medical record models share common fields:

| Common Field              | Type            | Description                         |
| ------------------------- | --------------- | ----------------------------------- |
| `studentId`               | ObjectId → User | Reference to submitting student     |
| `studentName`             | String          | Student's name (denormalized)       |
| `studentEmail`            | String          | Student's email (denormalized)      |
| `status`                  | String          | `pending` / `approved` / `rejected` |
| `approvedBy`              | ObjectId → User | Admin who processed the record      |
| `approvedDate`            | Date            | When record was processed           |
| `adminNotes`              | String          | Admin comments                      |
| `createdAt` / `updatedAt` | Date            | Auto-generated timestamps           |

##### PhysicalExam Model

**File:** `backend/models/PhysicalExam.js`

For new student physical examination records.

| Unique Field | Type   | Description                 |
| ------------ | ------ | --------------------------- |
| `name`       | String | Patient name                |
| `gender`     | String | Gender (Male/Female/LGBTQ+) |
| `course`     | String | Academic program            |
| `year`       | String | Year level                  |
| `date`       | String | Exam date                   |

##### MedicalMonitoring Model

**File:** `backend/models/MedicalMonitoring.js`

For clinic visit monitoring/consultation records.

| Unique Field  | Type   | Description                                |
| ------------- | ------ | ------------------------------------------ |
| `arrival`     | String | Time of arrival                            |
| `patientName` | String | Patient name                               |
| `sex`         | String | Patient sex                                |
| `degree`      | String | Degree/program                             |
| `studentNo`   | String | Student number                             |
| `symptoms`    | String | Signs and symptoms                         |
| `action`      | String | Action taken                               |
| `meds`        | String | Medications/treatment _(admin-only)_       |
| `exit`        | String | Time of exit _(admin-only)_                |
| `duration`    | String | Duration of service _(admin-only)_         |
| `personnel`   | String | Attending medical personnel _(admin-only)_ |

##### MedicalCertificate Model

**File:** `backend/models/MedicalCertificate.js`

For medical certificate requests.

| Unique Field  | Type   | Description                       |
| ------------- | ------ | --------------------------------- |
| `name`        | String | Patient name                      |
| `age`         | String | Patient age                       |
| `sex`         | String | Patient sex                       |
| `civilStatus` | String | Civil status                      |
| `school`      | String | School name                       |
| `idNumber`    | String | Student ID                        |
| `date`        | String | Request date                      |
| `diagnosis`   | String | Medical diagnosis _(admin-only)_  |
| `remarks`     | String | Additional remarks _(admin-only)_ |

##### MedicineIssuance Model

**File:** `backend/models/MedicineIssuance.js`

For medicine dispensing records. Uses an embedded sub-schema for individual medicine items.

| Unique Field | Type                        | Description                              |
| ------------ | --------------------------- | ---------------------------------------- |
| `date`       | String                      | Issuance date                            |
| `course`     | String                      | Student's course                         |
| `medicines`  | Array of `{name, quantity}` | Medicines requested (min 1 with qty > 0) |
| `diagnosis`  | String                      | Diagnosis _(admin-only)_                 |

##### LaboratoryRequest Model

**File:** `backend/models/LaboratoryRequest.js`

For laboratory test requests with categorized test checkboxes.

| Test Category           | Tests (Boolean fields)                             |
| ----------------------- | -------------------------------------------------- |
| **Routine Urinalysis**  | pregnancy, fecalysis                               |
| **CBC with Diff Count** | hemoglobin, hematocrit, bloodSugar, plateletCT     |
| **Gram Stain**          | hpsBhTest, vaginalSmear                            |
| **Blood Chemistry**     | fbs, uricAcid, cholesterol, hdl, tsh, totalProtein |
| **Pap Smear**           | cxrInterpretation, ecgInterpretation               |
| **Widhal Test**         | salmonella                                         |
| **Others**              | Free-text field                                    |

Admin-only field: `nurseOnDuty`

---

#### Supporting Models

##### PharmacyInventory Model

**File:** `backend/models/PharmacyInventory.js`

| Field        | Type   | Constraints                         | Description                                |
| ------------ | ------ | ----------------------------------- | ------------------------------------------ |
| `medicineId` | String | required, unique                    | Identifier (e.g., `"MED-001"`)             |
| `name`       | String | required                            | Medicine name                              |
| `category`   | String | required                            | Category (Antibiotics, Analgesics, etc.)   |
| `stock`      | Number | required, min 0                     | Current stock count                        |
| `minStock`   | Number | required, min 0                     | Minimum safe stock threshold               |
| `unit`       | String | required                            | Unit of measurement (Tablet, Bottle, etc.) |
| `expiry`     | String | required                            | Expiration date (e.g., `"Dec 2026"`)       |
| `status`     | String | enum: `adequate`, `low`, `critical` | Auto-computed by pre-save hook             |
| `location`   | String | required                            | Shelf location (e.g., `"Shelf A-1"`)       |

**Pre-save Hook:** Auto-computes `status`:

- `stock <= 0` → `critical`
- `stock < minStock * 0.5` → `critical`
- `stock < minStock` → `low`
- Otherwise → `adequate`

##### Notification Model

**File:** `backend/models/Notification.js`

| Field        | Type            | Constraints              | Description            |
| ------------ | --------------- | ------------------------ | ---------------------- |
| `userId`     | ObjectId → User | required, indexed        | Recipient user         |
| `message`    | String          | required                 | Notification message   |
| `recordId`   | ObjectId        | required                 | Related record ID      |
| `recordType` | String          | required                 | Record type identifier |
| `isRead`     | Boolean         | default `false`, indexed | Read/unread status     |

##### AiTranscription Model

**File:** `backend/models/AiTranscription.js`

| Field               | Type            | Description                            |
| ------------------- | --------------- | -------------------------------------- |
| `type`              | String          | `audio` or `image`                     |
| `title`             | String          | Transcription title                    |
| `transcriptionText` | String          | Audio transcription text               |
| `aiSummary`         | String          | AI-generated summary                   |
| `audioDuration`     | Number          | Audio duration in seconds              |
| `patientName`       | String          | Patient name (if identified)           |
| `extractedText`     | String          | OCR/PDF extracted text                 |
| `imageUrl`          | String          | Cloudinary image URL                   |
| `originalFileName`  | String          | Original uploaded filename             |
| `createdBy`         | ObjectId → User | Admin who created it                   |
| `wordCount`         | Number          | Word count of processed text           |
| `status`            | String          | `completed`, `processing`, or `failed` |

##### AdminActivityLog Model

**File:** `backend/models/AdminActivityLog.js`

Minimal stub model (activity logging feature removed, kept to prevent crashes).

| Field           | Type            |
| --------------- | --------------- |
| `adminId`       | ObjectId → User |
| `action`        | String          |
| `actionDetails` | Mixed           |
| `status`        | String          |

---

### 6.3 API Reference

MEDILOG exposes **47 REST API endpoints** across 8 route groups.

#### Authentication & Account Management (`/api`)

##### Public Endpoints

| Method | Endpoint               | Rate Limit | Description                                             |
| ------ | ---------------------- | ---------- | ------------------------------------------------------- |
| `POST` | `/api/users`           | —          | **Sign up** a new user (multipart form with ID picture) |
| `POST` | `/api/verify-otp`      | —          | **Verify OTP** code after signup/login                  |
| `POST` | `/api/login`           | 5 req/2min | **Login** with email + password + reCAPTCHA token       |
| `POST` | `/api/resend-otp`      | 3 req/5min | **Resend OTP** email                                    |
| `POST` | `/api/forgot-password` | 3 req/5min | **Request password reset** OTP                          |
| `POST` | `/api/reset-password`  | —          | **Reset password** with OTP verification                |

##### Protected Endpoints (require JWT)

| Method | Endpoint                     | Role | Description         |
| ------ | ---------------------------- | ---- | ------------------- |
| `POST` | `/api/users/change-password` | Any  | Change own password |

##### Admin-Only Endpoints (require JWT + admin/staff role)

**Student Account Management:**

| Method   | Endpoint                         | Description                            |
| -------- | -------------------------------- | -------------------------------------- |
| `GET`    | `/api/accounts/pending`          | Get pending student accounts count     |
| `GET`    | `/api/accounts/all?page=&limit=` | Paginated list of all student accounts |
| `POST`   | `/api/accounts/:userId/approve`  | Approve a student account              |
| `POST`   | `/api/accounts/:userId/reject`   | Reject a student account               |
| `GET`    | `/api/accounts/total`            | Total student count                    |
| `DELETE` | `/api/accounts/:userId`          | Delete a student account               |
| `PUT`    | `/api/accounts/:userId`          | Update student account details         |

**Staff Account Management:**

| Method   | Endpoint                      | Description                          |
| -------- | ----------------------------- | ------------------------------------ |
| `GET`    | `/api/staff/all?page=&limit=` | Paginated list of all staff accounts |
| `GET`    | `/api/staff/pending`          | Get pending staff accounts count     |
| `GET`    | `/api/staff/total`            | Total staff count                    |
| `DELETE` | `/api/staff/:userId`          | Delete a staff account               |
| `PUT`    | `/api/staff/:userId`          | Update staff account details         |

---

#### Medical Records (`/api`)

All endpoints require JWT authentication. Admin/staff required where noted.

| Method   | Endpoint                                             | Role   | Description                                      |
| -------- | ---------------------------------------------------- | ------ | ------------------------------------------------ | ------------------------------ |
| `POST`   | `/api/records`                                       | Any    | Create a new medical record                      |
| `GET`    | `/api/records/student/:studentId?type=`              | Any    | Get student's own records (optional type filter) |
| `GET`    | `/api/records/all?type=&page=&limit=&sort=&filters=` | Admin  | Paginated records with multi-sort & filters      |
| `PUT`    | `/api/records/:id`                                   | Admin  | Update a record (approve/reject/edit)            |
| `DELETE` | `/api/records/:id`                                   | Admin  | Delete a record                                  |
| `POST`   | `/api/records/bulk-delete`                           | Admin  | Bulk delete records by IDs                       |
| `POST`   | `/api/records/bulk-update-status`                    | Admin  | Bulk approve/reject records                      |
| `GET`    | `/api/records/aggregation?recordType=`               | Admin  | Hierarchical aggregation statistics              |
| `GET`    | `/api/records/export?recordType=&format=csv          | excel` | Admin                                            | Export records as CSV or Excel |
| `GET`    | `/api/records/pending-counts`                        | Admin  | Pending counts per record type                   |

**Record Types** (used in `type` query parameter):

| Type Value          | Model              |
| ------------------- | ------------------ |
| `newStudent`        | PhysicalExam       |
| `monitoring`        | MedicalMonitoring  |
| `certificate`       | MedicalCertificate |
| `medicineIssuance`  | MedicineIssuance   |
| `laboratoryRequest` | LaboratoryRequest  |

---

#### Pharmacy Inventory (`/api/pharmacy`)

| Method   | Endpoint                      | Role  | Description                                           |
| -------- | ----------------------------- | ----- | ----------------------------------------------------- |
| `GET`    | `/api/pharmacy/medicine-list` | Any   | Get medicine names + stock + unit (for student forms) |
| `GET`    | `/api/pharmacy/`              | Admin | Get full inventory details                            |
| `POST`   | `/api/pharmacy/`              | Admin | Add a new medicine                                    |
| `PUT`    | `/api/pharmacy/:id`           | Admin | Update medicine details (e.g., expiry)                |
| `PUT`    | `/api/pharmacy/:id/stock`     | Admin | Update stock (Add / Dispense / Dispose)               |
| `DELETE` | `/api/pharmacy/:id`           | Admin | Delete a medicine                                     |
| `POST`   | `/api/pharmacy/seed`          | Admin | Seed 26 default medicines (one-time)                  |

**Stock Update Actions** (for `PUT /:id/stock`):

| Action                | Body                                             | Effect                       |
| --------------------- | ------------------------------------------------ | ---------------------------- |
| `"Add Stock"`         | `{ action: "Add Stock", quantity: 50 }`          | Adds to current stock        |
| `"Dispense / Usage"`  | `{ action: "Dispense / Usage", quantity: 5 }`    | Subtracts from stock (min 0) |
| `"Dispose (Expired)"` | `{ action: "Dispose (Expired)", quantity: 100 }` | Subtracts from stock (min 0) |

---

#### Analytics (`/api/analytics`)

All endpoints require JWT + admin/staff role.

| Method | Endpoint                               | Description                                           |
| ------ | -------------------------------------- | ----------------------------------------------------- |
| `GET`  | `/api/analytics/insights`              | Dashboard insights (top program + symptom trends)     |
| `GET`  | `/api/analytics/dashboard-overview`    | Full dashboard data (11 sections of aggregated stats) |
| `GET`  | `/api/analytics/predictive?force=true` | Predictive analytics from CatBoost ML (10-min cache)  |

**Predictive Analytics Response:**

```json
{
  "forecast": [
    { "month": "Sep 2025", "actual": 45, "predicted": null },
    { "month": "Mar 2026", "actual": null, "predicted": 62 }
  ],
  "forecastIncrease": "12.5",
  "riskRadar": [{ "subject": "Respiratory", "A": 85.2, "fullMark": 100 }],
  "stockForecasts": [
    {
      "name": "Paracetamol",
      "daysLeft": 15,
      "status": "WARNING",
      "stockoutDate": "2026-03-04"
    }
  ],
  "studentRisk": [{ "name": "Low Risk", "value": 120, "color": "#10b981" }],
  "totalStudents": 200,
  "mlMetrics": {
    "accuracy": "87.5%",
    "precision": "85.2%",
    "recall": "83.1%",
    "f1Score": "84.1%",
    "aucRoc": "0.89",
    "method": "catboost",
    "modelsActive": 4
  }
}
```

---

#### AI Assistant (`/api/ai-assistant`)

All endpoints require JWT + admin/staff role (router-level middleware).

| Method   | Endpoint                                                  | Description                                            |
| -------- | --------------------------------------------------------- | ------------------------------------------------------ |
| `GET`    | `/api/ai-assistant/stats`                                 | Transcription statistics (counts, word totals)         |
| `GET`    | `/api/ai-assistant/transcriptions?page=&limit=&type=`     | Paginated transcription history                        |
| `POST`   | `/api/ai-assistant/transcriptions`                        | Save a transcription record                            |
| `POST`   | `/api/ai-assistant/transcriptions/audio`                  | Upload audio → Groq Whisper transcription + AI summary |
| `POST`   | `/api/ai-assistant/transcriptions/ocr`                    | Upload image → OCR text extraction + AI summary        |
| `POST`   | `/api/ai-assistant/transcriptions/pdf`                    | Upload PDF → text extraction + AI summary              |
| `POST`   | `/api/ai-assistant/transcriptions/:id/regenerate-summary` | Regenerate AI summary for existing transcription       |
| `DELETE` | `/api/ai-assistant/transcriptions/:id`                    | Delete a transcription record                          |

**File Upload Limits:**

| Type  | Max Size | Formats                                   |
| ----- | -------- | ----------------------------------------- |
| Audio | 25 MB    | webm, ogg, wav, mp3, mpeg, mp4, m4a, flac |
| Image | 10 MB    | jpeg, png, webp, gif, bmp, tiff           |
| PDF   | 20 MB    | application/pdf                           |

---

#### Notifications (`/api/notifications`)

> **Note:** These endpoints currently have **no authentication middleware**.

| Method | Endpoint                                             | Description                    |
| ------ | ---------------------------------------------------- | ------------------------------ |
| `GET`  | `/api/notifications/student/:studentId`              | Get student's notifications    |
| `GET`  | `/api/notifications/student/:studentId/unread-count` | Get unread notification count  |
| `POST` | `/api/notifications/student/:studentId/mark-read`    | Mark all notifications as read |

---

#### System Backup (`/api/users/backup`)

All endpoints require JWT + admin role.

| Method | Endpoint                               | Description                                     |
| ------ | -------------------------------------- | ----------------------------------------------- |
| `POST` | `/api/users/backup/create`             | Create full system backup (JSON)                |
| `GET`  | `/api/users/backup/list`               | List available backup files                     |
| `GET`  | `/api/users/backup/download/:filename` | Download a backup file                          |
| `POST` | `/api/users/backup/restore`            | Restore from backup (**501 — Not Implemented**) |

---

#### User Profile (`/api/users`)

| Method | Endpoint                        | Role | Description                          |
| ------ | ------------------------------- | ---- | ------------------------------------ |
| `POST` | `/api/users/:userId/upload-pfp` | Any  | Upload profile picture to Cloudinary |

---

### 6.4 Middleware

**File:** `backend/middleware/authMiddleware.js`

Two middleware functions that form the authentication chain:

#### `protect` — JWT Authentication Guard

**Flow:**

1. Extracts token from `Authorization: Bearer <token>` header
2. Verifies token using `jsonwebtoken` + `JWT_SECRET`
3. Looks up user: `User.findById(decoded.id).select("-password")`
4. Attaches user object to `req.user`
5. Calls `next()` on success

**Error Responses:**

- `401 Unauthorized` — No token provided or invalid/expired token

#### `isAdmin` — Role Authorization Guard

**Flow:**

1. Reads `req.user.role` (set by `protect` middleware)
2. Allows if role is `"admin"` **or** `"staff"`
3. Blocks otherwise

**Error Response:**

- `403 Forbidden` — "Not authorized as admin"

**Usage in routes:**

```javascript
router.get("/records/all", protect, isAdmin, getAllRecords);
```

---

### 6.5 Utilities

#### AI Summarizer (`backend/utils/aiSummarizer.js`)

Provides medical text summarization with a two-tier fallback system:

**Tier 1 — Groq Llama 3.3 70B Versatile:**

- Uses Groq API for cloud-based summarization
- Two specialized system prompts:
  - **Audio prompt:** For doctor-patient consultation transcripts → produces 2-paragraph clinical summaries
  - **Document prompt:** For OCR/PDF medical documents → captures document type, findings, action items
- Configuration: temperature 0.3, max 400 tokens, top_p 0.9
- Input trimmed to 4000 characters

**Tier 2 — Offline Extractive Summary (fallback):**

- Pure algorithmic approach — no API needed
- Scores sentences by: position bonuses, medical keyword density (60+ keywords in English and Filipino), numeric content, medication patterns, assessment phrases
- Returns top 4 highest-scoring sentences in original order
- Filipino medical terms supported: "sumasakit", "lagnat", "ubo", "sipon", "nireseta", "gamot", etc.

#### Email Service (`backend/utils/emailService.js`)

Uses **Nodemailer** with Gmail SMTP transport.

**Functions:**

| Function                                            | Purpose                               | Template                                             |
| --------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| `sendOTPEmail(to, subject, otp)`                    | Sends OTP verification email          | Large OTP code display, "expires in 5 minutes"       |
| `sendApprovalEmail(to, username, loginMethod, lrn)` | Student account approval notification | Rich HTML with login credentials, "Login Now" button |
| `sendStaffApprovalEmail(to, username, position)`    | Staff account approval notification   | Purple-branded HTML with position display            |

All templates feature gradient headers, step-by-step instructions, and security warnings.

#### OTP Generator (`backend/utils/generateOTP.js`)

Generates a random **6-digit numeric OTP** (100000–999999) as a string.

```javascript
Math.floor(100000 + Math.random() * 900000).toString();
```

#### Token Generator (`backend/utils/generateToken.js`)

Creates a **JWT** with `{ id }` payload, signed with `JWT_SECRET`, expiring in **30 days**.

```javascript
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
```

---

## 7. Frontend Documentation

### 7.1 Application Entry & Routing

**File:** `MEDILOG/src/App.tsx`

The root component wraps the entire application in `AuthProvider` and `ThemeProvider` contexts, then defines routes via React Router:

| Route                | Component          | Access                      | Description                              |
| -------------------- | ------------------ | --------------------------- | ---------------------------------------- |
| `/`                  | `LandingPage`      | Public                      | Marketing/info page                      |
| `/login/:role`       | `LoginForm`        | Public                      | Login form (role = `student` or `admin`) |
| `/signup`            | `SignupForm`       | Public                      | New account registration                 |
| `/verify-otp/:role`  | `OTPVerification`  | Public                      | OTP verification page                    |
| `/forgot-password`   | `ForgotPassword`   | Public                      | Password reset flow                      |
| `/student/dashboard` | `StudentDashboard` | Protected (`student`)       | Student portal                           |
| `/admin/dashboard`   | `AdminDashboard`   | Protected (`admin`/`staff`) | Admin/staff portal                       |

**Entry Point:** `MEDILOG/src/main.tsx`

- Renders `<App />` inside `<StrictMode>`
- Imports Bootstrap CSS, Bootstrap Icons, Bootstrap JS bundle, and global `index.css`

---

### 7.2 State Management

MEDILOG uses **React Context API** for global state management (no Redux or external state library).

#### AuthContext (`MEDILOG/src/context/AuthContext.tsx`)

Manages authentication state with `sessionStorage` persistence.

| State             | Type           | Description                       |
| ----------------- | -------------- | --------------------------------- |
| `user`            | `User \| null` | Current authenticated user object |
| `loading`         | `boolean`      | Auth restoration in progress      |
| `isAuthenticated` | `boolean`      | Computed: `user !== null`         |

**Methods:**

- `login(authData)` — Sets user state + stores in `sessionStorage`
- `logout()` — Clears user state + `sessionStorage`, redirects to `/`

**Behavior:** On mount, restores user from `sessionStorage`. Shows a loading spinner until restoration completes.

#### ThemeContext (`MEDILOG/src/context/ThemeContext.tsx`)

Manages dark/light theme with `localStorage` persistence.

| State   | Type                | Description   |
| ------- | ------------------- | ------------- |
| `theme` | `"light" \| "dark"` | Current theme |

**Methods:**

- `toggleTheme()` — Toggles theme, updates `data-theme` HTML attribute and `localStorage`

---

### 7.3 Services (API Layer)

**File:** `MEDILOG/src/services/api.ts` (530 lines)

All API communication is centralized in this file via an Axios instance.

**Axios Configuration:**

- **Base URL:** `VITE_API_URL` env var or `http://localhost:5000/api`
- **Request interceptor:** Attaches `Bearer` token from `sessionStorage`, auto-sets `Content-Type: application/json` (skipped for `FormData`)
- **Response interceptor:** On `401`, clears session and redirects to `/`

**API Namespaces:**

| Namespace        | Functions    | Domain                                     |
| ---------------- | ------------ | ------------------------------------------ |
| `authAPI`        | 24 functions | Auth, account management, backup           |
| `userAPI`        | 1 function   | Profile picture upload                     |
| `medicalAPI`     | 14 functions | Records CRUD, notifications, pharmacy list |
| `analyticsAPI`   | 3 functions  | Dashboard insights & ML predictions        |
| `aiAssistantAPI` | 8 functions  | Transcription management                   |

**Total:** 50 API functions mapping to 47 backend endpoints.

---

### 7.4 Pages

#### Landing Page (`MEDILOG/src/pages/LandingPage.tsx`)

The public-facing marketing page. Features:

- **Scroll-reactive navbar** with MEDILOG logo
- **Hero section** with animated orbiting medical icons
- **Core features grid** (4 cards: Secure Records, Simple Access, Smart System, Pharmacy Inventory)
- **Target audience section** with benefits
- **Developer team cards** (3 team members with roles and descriptions)
- **Footer** with copyright

**Navigation links:** "Sign In" → `/login/student`, "Get Started" → `/signup`

#### Student Dashboard (`MEDILOG/src/pages/StudentDashboard.tsx`)

The main student portal — a single-page dashboard with view switching (630 lines).

**Features:**

- Sidebar navigation with 10 possible views
- Profile picture upload (file upload + webcam face capture via `FaceCaptureModal`)
- Medical form submission (5 record types)
- Submission history with tabbed view
- Real-time notification polling (5-second interval)
- Profile viewing

**Student Views:**
| View | Component | Description |
|------|-----------|-------------|
| `landing` | `StudentLandingView` | Welcome page with infirmary info |
| `profile` | `StudentProfileView` | User profile display |
| `formOptions` | `StudentFormOptionsView` | Form type selection cards |
| `newStudent` | `NewStudentForm` | Physical exam form |
| `monitoring` | `MonitoringForm` | Medical monitoring form |
| `certificate` | `CertificateForm` | Medical certificate form |
| `medicineIssuance` | `MedicineIssuanceForm` | Medicine issuance form |
| `laboratoryRequest` | `LaboratoryRequestForm` | Lab request form |
| `history` | `StudentHistoryView` | Tabbed submission history |
| `notifications` | `StudentNotificationsView` | Notification list |

#### Admin Dashboard (`MEDILOG/src/pages/AdminDashboard.tsx`)

The admin/staff management portal (472 lines).

**Features:**

- Collapsible sidebar navigation
- 7 distinct view panels
- Profile picture upload with face capture
- Role-based access control (limited staff cannot see accounts/backup)
- Pending count badges on sidebar items

**Admin Views:**
| View | Component | Description |
|------|-----------|-------------|
| `dashboard` | `DashboardView` | Overview stats, charts, ML predictions |
| `patientRecords` | `PatientRecordsView` | Full medical record management |
| `accounts` | `StudentAccountsView` | Student account CRUD |
| `staffAccounts` | `StaffAccountsView` | Staff account CRUD |
| `pharmacy` | `PharmacyInventoryView` | Pharmacy inventory management |
| `backup` | `BackupRestoreView` | System backup & restore |
| `aiAssistant` | `AiAssistantView` | AI transcription tools |

---

### 7.5 Components

#### Authentication Components

| Component           | File                       | Description                                                                                                                                                                             |
| ------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LoginForm**       | `auth/LoginForm.tsx`       | Email/password login with reCAPTCHA v2. Inline OTP verification flow. "Trust this device" option. Toggles between Student and Staff login                                               |
| **SignupForm**      | `auth/SignupForm.tsx`      | Dual-mode registration: Student (LRN, Student ID, department, program, year) vs Staff (Employee ID, position, strong password). ID picture upload required. 9 departments, 54+ programs |
| **OTPVerification** | `auth/OTPVerification.tsx` | Standalone OTP page. "Remember device" checkbox. Resend OTP button with cooldown                                                                                                        |
| **ForgotPassword**  | `auth/ForgotPassword.tsx`  | Two-step flow: (1) Enter email → receive OTP, (2) Enter OTP + new password → reset                                                                                                      |
| **RoleSelection**   | `auth/RoleSelection.tsx`   | Student/Admin role chooser (replaced by LandingPage in current routing)                                                                                                                 |

#### Common Components

| Component            | File                          | Props                                                     | Description                                                                                 |
| -------------------- | ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Logo**             | `Logo.tsx`                    | `size?: "small"\|"medium"\|"large"`, `showText?: boolean` | SVG MEDILOG logo with green cross + folded corner                                           |
| **ThemeToggle**      | `ThemeToggle.tsx`             | —                                                         | Moon/sun icon button, uses `useTheme()`                                                     |
| **ProtectedRoute**   | `ProtectedRoute.tsx`          | `children`, `requiredRole?`                               | Auth guard: loader during hydration, redirects if unauthorized, allows staff → admin routes |
| **FaceCaptureModal** | `common/FaceCaptureModal.tsx` | `show`, `onClose`, `onCapture`                            | Webcam face detection with face-api.js TinyFaceDetector, oval guide overlay                 |

#### Admin Components

| Component                 | File                                   | Key Features                                                                                                                                                 |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AdminSidebar**          | `admin_comp/AdminSidebar.tsx`          | Collapsible sidebar with badge counts, expandable Records submenu (5 record types), role-based link visibility                                               |
| **DashboardView**         | `admin_comp/DashboardView.tsx`         | 5 stat cards + detailed stats row + charts + predictive analytics. Independent data loading with retry logic                                                 |
| **DashboardCharts**       | `admin_comp/DashboardCharts.tsx`       | Recharts LineChart (6-month trends for 5 record types) + PieChart (activity distribution donut)                                                              |
| **PredictiveAnalytics**   | `admin_comp/PredictiveAnalytics.tsx`   | CatBoost ML visualizations: AreaChart (visit forecast), RadarChart (health risk), BarChart (student risk), stock depletion progress bars, ML metrics display |
| **AnalyticsAssistant**    | `admin_comp/AnalyticsAssistant.tsx`    | Top program by monitoring + respiratory symptom trend (week-over-week %)                                                                                     |
| **PatientRecordsView**    | `admin_comp/PatientRecordsView.tsx`    | 2264-line component. Multi-column sortable table, advanced filters, search, single/bulk CRUD, export to CSV/Excel, print table, record detail modal          |
| **StudentAccountsView**   | `admin_comp/StudentAccountsView.tsx`   | Full CRUD for students. 4 stat cards, searchable paginated table, approve/reject/edit/delete, ID picture viewer                                              |
| **StaffAccountsView**     | `admin_comp/StaffAccountsView.tsx`     | Same as StudentAccountsView but for staff. Employee ID/Position fields, position badge styling                                                               |
| **PharmacyInventoryView** | `admin_comp/PharmacyInventoryView.tsx` | 1160-line component. Medicine table, stock update panel (Add/Dispense/Dispose), add medicine modal, expiry editing, auto-seed, status indicators             |
| **AiAssistantView**       | `admin_comp/AiAssistantView.tsx`       | 1241-line component. Audio recording → Groq Whisper, Image OCR (Tesseract.js), PDF extraction, transcription history, summary regeneration                   |
| **BackupRestoreView**     | `admin_comp/BackupRestoreView.tsx`     | Create/list/download backups, restore from JSON upload, "What Gets Backed Up" info panel                                                                     |
| **PaginationControls**    | `admin_comp/PaginationControls.tsx`    | Reusable: "Showing X to Y of Z", rows per page selector (5/10/15/25/50), Previous/Next                                                                       |

#### Student Components

| Component                    | File                                        | Key Features                                                                                                     |
| ---------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **StudentSidebar**           | `student_comp/StudentSidebar.tsx`           | Dashboard/Forms (expandable: 5 sub-items)/History/Notifications nav. Unread badge on notifications               |
| **StudentLandingView**       | `student_comp/StudentLandingView.tsx`       | Infirmary staff info (3 staff cards), description of each form type                                              |
| **StudentProfileView**       | `student_comp/StudentProfileView.tsx`       | Avatar, username, role, email, Student ID, LRN, department, program, year level                                  |
| **StudentFormOptionsView**   | `student_comp/StudentFormOptionsView.tsx`   | 5 form option cards with icons and descriptions                                                                  |
| **NewStudentForm**           | `student_comp/NewStudentForm.tsx`           | Name, Gender (Male/Female/LGBTQ+), Course (54 options), Year (1–5), Date                                         |
| **MonitoringForm**           | `student_comp/MonitoringForm.tsx`           | Arrival, Patient Name, Sex, Degree/Program, Student No, Symptoms, Action. Admin-only fields grayed out           |
| **CertificateForm**          | `student_comp/CertificateForm.tsx`          | Name, Age, Sex, Civil Status, School, ID Number, Date. Admin-only: Diagnosis, Remarks                            |
| **MedicineIssuanceForm**     | `student_comp/MedicineIssuanceForm.tsx`     | Date, Course, dynamic medicine table from pharmacy inventory, quantity inputs                                    |
| **LaboratoryRequestForm**    | `student_comp/LaboratoryRequestForm.tsx`    | Issue Date, Name. Categorized test checkboxes (all admin-only)                                                   |
| **StudentHistoryView**       | `student_comp/StudentHistoryView.tsx`       | 5-tab history viewer, paginated rows per type, status badges, view modal trigger                                 |
| **StudentRecordViewModal**   | `student_comp/StudentRecordViewModal.tsx`   | Full record details modal with print functionality (styled print window with MEDILOG header, signature sections) |
| **StudentNotificationsView** | `student_comp/StudentNotificationsView.tsx` | Paginated notification list with record-type icons, read/unread styling                                          |

#### Data Files

| File                            | Content                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| `student_comp/courseOptions.ts` | Array of 54 ISU university programs (PhD, Masters, BS, Diploma levels) |
| `student_comp/studentTypes.ts`  | TypeScript interfaces for all student data structures                  |

---

### 7.6 TypeScript Types & Interfaces

#### Shared Types (`MEDILOG/src/types/index.ts`)

```typescript
interface User {
  _id: string;
  username: string;
  email: string;
  role: "student" | "admin" | "staff";
  isVerified: boolean;
  firstLoginCompleted: boolean;
  rememberMe: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
```

#### API Types (`MEDILOG/src/services/api.ts`)

```typescript
interface User {
  _id: string;
  username: string;
  email: string;
  lrn: string;
  studentId: string;
  role: "student" | "admin" | "staff";
  position?: string;
  employeeId?: string;
  profilePictureUrl?: string;
  department?: string;
  program?: string;
  yearLevel?: string;
  status: "pending" | "approved" | "rejected";
  defaultLoginMethod?: "email" | "studentId";
  isVerified: boolean;
  firstLoginCompleted: boolean;
  rememberMe: boolean;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
  requiresOTP?: boolean;
  email?: string;
}

interface PaginatedRecordsResponse {
  records: any[];
  recordType: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface SignupData {
  username: string;
  email: string;
  password?: string;
  lrn: string;
  studentId: string;
  preferredLoginMethod?: "email" | "studentId";
  role: "student" | "admin";
}

interface LoginData {
  email: string;
  password: string;
  role?: "student" | "admin";
  captchaToken: string;
}

interface MedicalRecordData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  recordType: "newStudent" | "monitoring" | "certificate";
  [key: string]: any;
}

type SortConfig = {
  key: string;
  order: "asc" | "desc";
};
```

#### Student Types (`MEDILOG/src/components/student_comp/studentTypes.ts`)

```typescript
interface NewStudentData {
  _id?: string;
  name: string;
  gender: string;
  course: string;
  year: string;
  date: string;
  status?: string;
}

interface MonitoringData {
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
}

interface CertificateData {
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
}

interface MedicineItem {
  name: string;
  quantity: number;
}

interface MedicineIssuanceData {
  _id?: string;
  date: string;
  course: string;
  medicines: MedicineItem[];
  diagnosis?: string;
  status?: string;
}

interface LaboratoryRequestData {
  _id?: string;
  issueDate: string;
  name: string;
  routineUrinalysisTests?: { pregnancy?: boolean; fecalysis?: boolean };
  cbcTests?: {
    hemoglobin?: boolean;
    hematocrit?: boolean;
    bloodSugar?: boolean;
    plateletCT?: boolean;
  };
  gramStain?: { hpsBhTest?: boolean; vaginalSmear?: boolean };
  bloodChemistry?: {
    fbs?: boolean;
    uricAcid?: boolean;
    cholesterol?: boolean;
    hdl?: boolean;
    tsh?: boolean;
    totalProtein?: boolean;
  };
  papSmear?: { cxrInterpretation?: boolean; ecgInterpretation?: boolean };
  widhalTest?: { salmonella?: boolean };
  others?: string;
  status?: string;
}

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  recordType: string;
}

type StudentView =
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

type HistoryType =
  | "physicalExam"
  | "monitoring"
  | "certificate"
  | "medicineIssuance"
  | "laboratoryRequest";
```

#### Predictive Analytics Types

```typescript
interface PredictiveData {
  forecast: {
    month: string;
    actual: number | null;
    predicted: number | null;
  }[];
  forecastIncrease: string;
  riskRadar: { subject: string; A: number; fullMark: number }[];
  stockForecasts: {
    name: string;
    daysLeft: number;
    status: "CRITICAL" | "WARNING" | "NORMAL";
    stockoutDate: string;
    currentStock: number;
    unit: string;
    widthPercent: number;
  }[];
  studentRisk: { name: string; value: number; color: string }[];
  totalStudents: number;
  mlMetrics: {
    accuracy: string;
    precision: string;
    recall: string;
    f1Score: string;
    aucRoc: string;
    method?: string;
    modelsActive?: number;
  };
}
```

---

### 7.7 Styles

MEDILOG uses CSS with CSS custom properties (variables) for theming. Four style files:

| File                | Scope          | Description                                                              |
| ------------------- | -------------- | ------------------------------------------------------------------------ |
| `index.css`         | Global         | CSS variables (colors, shadows), reset styles, auth layout (~1040 lines) |
| `LandingPage.css`   | Landing page   | Hero section, navbar, features grid, team cards, footer                  |
| `AuthStyles.css`    | Auth pages     | Login, signup, OTP form styling                                          |
| `adminportal.css`   | Admin portal   | Dashboard, sidebar, tables, stat cards, charts                           |
| `studentportal.css` | Student portal | Dashboard, sidebar, forms, history rows, notifications                   |

**Theming:** Dark/light mode powered by CSS `[data-theme="dark"]` attribute selector, managed by `ThemeContext`.

---

## 8. Machine Learning Module

### Overview

MEDILOG integrates **CatBoost** machine learning models for predictive health analytics. The ML service runs as a Python subprocess (`backend/ml/catboost_service.py`, 848 lines) invoked from the Node.js analytics controller.

### Architecture

```
analyticsController.js → runCatBoostService() → spawns Python process
                         ↓
                    catboost_service.py (stdin → JSON → stdout)
                         ↓
                    4 Model Predictions → JSON output
```

**Model Caching:** Trained `.cbm` model files are cached in `backend/ml/models/` and reused if less than 1 hour old, avoiding unnecessary retraining.

**Fallback:** If Python/CatBoost is unavailable, the analytics controller falls back to statistical methods (linear regression, keyword counting, heuristic thresholds).

### Model 1: Visit Forecasting

| Property          | Value                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Type**          | CatBoostRegressor                                                                                     |
| **File**          | `models/visit_forecast.cbm`                                                                           |
| **Input**         | Daily visit counts (last 6 months)                                                                    |
| **Features (10)** | month, day, weekday, is_weekend, lag_1, lag_7, lag_14, rolling_mean_7, rolling_mean_14, rolling_std_7 |
| **Training**      | 300 iterations, learning rate 0.05, depth 4, RMSE loss, 80/20 split, early stopping at 50             |
| **Output**        | 6-month historical + 4-month predicted monthly visit totals                                           |
| **Metric**        | Forecast increase percentage                                                                          |

### Model 2: Disease Risk Assessment

| Property             | Value                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| **Type**             | CatBoostClassifier                                                             |
| **File**             | `models/disease_risk.cbm`                                                      |
| **Categories**       | Hypertension, Diabetes, Respiratory, Cardiovascular, Mental Health, None/Other |
| **Input**            | Symptom and diagnosis text strings                                             |
| **Features**         | Bag-of-words (top 150 most frequent words, len > 2)                            |
| **Label Assignment** | Keyword matching with Filipino/English medical terms                           |
| **Training**         | 200 iterations, MultiClass loss, auto balanced class weights                   |
| **Output**           | Risk score per category (0–100 scale) for radar chart                          |

**Disease Keywords (sample):**

- Respiratory: cough, ubo, sipon, lagnat, asthma, flu, trangkaso
- Diabetes: diabetes, blood sugar, insulin, glucose
- Hypertension: hypertension, high blood, mataas presyon, dizziness
- Mental Health: anxiety, stress, depression, insomnia, mental

### Model 3: Student Health Risk Classification

| Property         | Value                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Type**         | CatBoostClassifier                                                                 |
| **File**         | `models/student_risk.cbm`                                                          |
| **Features (5)** | visitCount, uniqueConditions, genderCode, daysSinceLastVisit, avgDaysBetweenVisits |
| **Labels**       | High (≥5 visits), Medium (≥2 visits), Low (<2 visits)                              |
| **Training**     | 200 iterations, MultiClass, Balanced weights                                       |
| **Output**       | Distribution of Low/Medium/High risk students                                      |

### Model 4: Stock Depletion Forecasting

| Property         | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| **Type**         | CatBoostRegressor                                                    |
| **File**         | `models/stock_depletion.cbm`                                         |
| **Input**        | Inventory data + 90-day medicine usage history                       |
| **Features (5)** | month, dayOfWeek, dayOfMonth, medicine_index, stockAtTime            |
| **Target**       | Quantity consumed                                                    |
| **Training**     | 150 iterations, depth 3, RMSE                                        |
| **Output**       | Top 5 medicines by depletion urgency with days left & stockout dates |

### ML Metrics

All models report aggregated metrics:

- **Accuracy** — Overall prediction correctness
- **Precision** — Positive prediction quality (macro-averaged)
- **Recall** — Detection rate (macro-averaged)
- **F1 Score** — Harmonic mean of precision & recall
- **AUC-ROC** — Area under ROC curve (synthesized approximation)

Cache: Results are cached in-memory for **10 minutes** to avoid repeated expensive computations. Use `?force=true` query parameter to bypass cache.

---

## 9. AI Assistant Module

### Overview

The AI Assistant is an admin/staff-only tool that processes medical documents through three modalities: **audio transcription**, **image OCR**, and **PDF extraction**. All processing produces AI-generated summaries.

### Audio Transcription Pipeline

```
Admin records audio (MediaRecorder API in browser)
        ↓
Upload to POST /api/ai-assistant/transcriptions/audio
        ↓
Server writes temp file → Groq Whisper Large V3 (language: "tl" / Tagalog)
        ↓
Transcription text → Groq Llama 3.3 70B summarization
        ↓
Save AiTranscription record to MongoDB
        ↓
Return transcription + summary to frontend
```

### Image OCR Pipeline

```
Admin uploads image (JPEG/PNG/WebP)
        ↓
Client-side: Tesseract.js TinyFaceDetector extracts text
Server-side: Upload to Cloudinary (medilog_ocr folder)
        ↓
Extracted text → Groq Llama 3.3 70B summarization (document prompt)
        ↓
Save AiTranscription record to MongoDB
```

### PDF Extraction Pipeline

```
Admin uploads PDF document
        ↓
Server: pdf-parse extracts text content
Upload to Cloudinary (medilog_pdf folder, raw format)
        ↓
Extracted text → Groq Llama 3.3 70B summarization (document prompt)
        ↓
Save AiTranscription record to MongoDB
```

### Summary Regeneration

Any existing transcription can have its AI summary regenerated by calling the regeneration endpoint. This re-runs the Llama 3.3 summarizer on the stored text.

### Offline Fallback

When Groq API is unavailable, the system falls back to extractive summarization:

- Scores sentences using medical keyword density, position, numeric content, and medication patterns
- Supports Filipino medical terminology
- Returns top 4 highest-scoring sentences in original order

---

## 10. Authentication & Security

### Authentication Flow

```
                    ┌─────────────────────────────────────────┐
                    │                SIGNUP                     │
                    │                                          │
                    │  1. User fills signup form               │
                    │  2. Upload ID picture → Cloudinary       │
                    │  3. POST /api/users                      │
                    │  4. Server creates user (status: pending)│
                    │  5. Generates OTP → sends email          │
                    │  6. User enters OTP (verify-otp page)    │
                    │  7. isVerified = true                    │
                    │  8. Awaits admin approval                │
                    └─────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │            ADMIN APPROVAL                │
                    │                                          │
                    │  1. Admin views pending accounts         │
                    │  2. Reviews ID picture                   │
                    │  3. Approves → status: approved          │
                    │  4. Sends approval email with credentials│
                    │  5. Student can now login                │
                    └─────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │                LOGIN                     │
                    │                                          │
                    │  1. Email + password + reCAPTCHA token   │
                    │  2. POST /api/login (rate limited)       │
                    │  3. Server validates credentials         │
                    │  4. Generates OTP → sends email          │
                    │  5. User enters OTP                      │
                    │  6. JWT returned (30-day expiry)         │
                    │  7. Token stored in sessionStorage       │
                    │  8. If "Remember Me" → skip OTP next time│
                    └─────────────────────────────────────────┘
```

### Security Measures

| Measure                | Implementation                                             |
| ---------------------- | ---------------------------------------------------------- |
| **Password Hashing**   | bcrypt with 10 salt rounds                                 |
| **JWT Authentication** | 30-day token, stored in `sessionStorage`                   |
| **OTP Verification**   | 6-digit code, 5-minute expiry, required for login          |
| **Rate Limiting**      | Login: 5 req/2min per IP. OTP: 3 req/5min per IP           |
| **reCAPTCHA v2**       | Required on login form (anti-bot)                          |
| **Role-Based Access**  | `protect` + `isAdmin` middleware chain                     |
| **CORS**               | Enabled with credentials for cross-origin requests         |
| **ID Verification**    | Photo ID upload required during signup, reviewed by admin  |
| **Session Management** | `sessionStorage` (cleared on tab close unless Remember Me) |

### Role Permissions Matrix

| Feature                 | Student | Staff | Admin |
| ----------------------- | ------- | ----- | ----- |
| Submit medical forms    | ✅      | ❌    | ❌    |
| View own records        | ✅      | ❌    | ❌    |
| View notifications      | ✅      | ❌    | ❌    |
| View dashboard          | ❌      | ✅    | ✅    |
| Manage medical records  | ❌      | ✅    | ✅    |
| Manage pharmacy         | ❌      | ✅    | ✅    |
| Use AI Assistant        | ❌      | ✅    | ✅    |
| View analytics          | ❌      | ✅    | ✅    |
| Manage student accounts | ❌      | ❌\*  | ✅    |
| Manage staff accounts   | ❌      | ❌    | ✅    |
| System backup/restore   | ❌      | ❌\*  | ✅    |

\*Limited staff (checked via `isLimitedStaff` in frontend) may be restricted from account management and backup features.

---

## 11. Deployment

### Frontend Deployment (Vercel)

**Configuration:** `MEDILOG/vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Standard SPA catch-all rewrite. All routes rewrite to `index.html` for React Router client-side routing.

**Build command:**

```bash
cd MEDILOG
npm run build   # tsc -b && vite build
```

Output: `MEDILOG/dist/`

### Backend Deployment

The backend runs as a Node.js process. Typically deployed to:

- **Railway**, **Render**, or **Heroku** for Node.js hosting
- Requires Python 3.9+ runtime available for CatBoost ML service

**Start command:**

```bash
cd backend
npm start   # node server.js
```

### Infrastructure Dependencies

| Service          | Required | Purpose                                                 |
| ---------------- | -------- | ------------------------------------------------------- |
| MongoDB Atlas    | Yes      | Database (set `MONGODB_URI`)                            |
| Cloudinary       | Yes      | Image/file storage (set cloud credentials)              |
| Gmail SMTP       | Yes      | OTP/notification emails (set `EMAIL_USER`/`EMAIL_PASS`) |
| Groq Cloud       | Optional | AI transcription & summarization (set `GROQ_API_KEY`)   |
| Google reCAPTCHA | Yes      | Frontend login security (set `VITE_RECAPTCHA_SITE_KEY`) |

---

## 12. Environment Variables

### Backend (`backend/.env`)

| Variable                | Required | Description                      |
| ----------------------- | -------- | -------------------------------- |
| `PORT`                  | No       | Server port (default: `5000`)    |
| `MONGODB_URI`           | Yes      | MongoDB connection string        |
| `JWT_SECRET`            | Yes      | Secret key for JWT signing       |
| `CLOUDINARY_CLOUD_NAME` | Yes      | Cloudinary cloud name            |
| `CLOUDINARY_API_KEY`    | Yes      | Cloudinary API key               |
| `CLOUDINARY_API_SECRET` | Yes      | Cloudinary API secret            |
| `EMAIL_USER`            | Yes      | Gmail address for sending emails |
| `EMAIL_PASS`            | Yes      | Gmail app password               |
| `FRONTEND_URL`          | Yes      | Frontend URL (for email links)   |
| `GROQ_API_KEY`          | No       | Groq API key (for AI features)   |

### Frontend (`MEDILOG/.env`)

| Variable                  | Required | Description                                              |
| ------------------------- | -------- | -------------------------------------------------------- |
| `VITE_API_URL`            | Yes      | Backend API base URL (e.g., `http://localhost:5000/api`) |
| `VITE_RECAPTCHA_SITE_KEY` | Yes      | Google reCAPTCHA v2 site key                             |

---

## 13. User Guides

### For Students

#### Registering an Account

1. Navigate to the MEDILOG landing page
2. Click **"Get Started"** or **"Sign In"** → **"Create Account"**
3. Select **Student** role
4. Fill in: Username, Email, LRN, Student ID, Department, Program, Year Level
5. Upload a clear photo of your school ID
6. Submit the form
7. Check your email for a **6-digit OTP code**
8. Enter the OTP on the verification page
9. Wait for admin approval (you'll receive an email when approved)

#### Submitting a Medical Record

1. Log in to your Student Dashboard
2. Click **"Online Form"** in the sidebar
3. Choose the type of record:
   - **Physical Exam** — For new student physical examination
   - **Medical Monitoring** — For clinic visit consultation
   - **Medical Certificate** — To request a medical certificate
   - **Medicine Issuance** — To request medicines from the pharmacy
   - **Laboratory Request** — To request lab tests
4. Fill in all required fields
5. Click **Submit**
6. Your record will appear as **"Pending"** in your History tab
7. You'll receive a notification when it's approved or rejected

#### Viewing Your History

1. Click **"History"** in the sidebar
2. Use the 5 tabs to filter by record type
3. Click **"View"** on any record to see full details
4. Use the **Print** button in the modal to print your record

### For Admins/Staff

#### Managing Medical Records

1. Click **"Patient Records"** in the sidebar
2. Select the record type from the submenu (Physical Exam, Monitoring, etc.)
3. Use the search bar, filters, and sorting to find records
4. Actions per record:
   - **View** — Full record details in a modal
   - **Approve** — Changes status to `approved` and notifies the student
   - **Reject** — Changes status to `rejected` with optional reason
   - **Edit** — Modify record fields (admin-only fields like diagnosis)
   - **Delete** — Remove the record
5. **Bulk Actions:** Select multiple records using checkboxes, then use bulk approve/reject/delete
6. **Export:** Click Export button → choose CSV or Excel → enter custom filename

#### Managing Pharmacy Inventory

1. Click **"Pharmacy"** in the sidebar
2. View all medicines with stock levels, expiry, and status indicators
3. **Add Medicine:** Click "Add Medicine" button → fill in all fields
4. **Update Stock:** Click a medicine row → use the sidebar panel:
   - **Add Stock** — Increase inventory
   - **Dispense / Usage** — Record medicine given to student
   - **Dispose (Expired)** — Remove expired stock
5. **Seed Inventory:** On first use, click "Seed" to populate 26 default medicines

#### Using the AI Assistant

1. Click **"AI Assistant"** in the sidebar
2. Choose a mode:
   - **Audio:** Record a consultation → transcribed via Whisper → summarized by AI
   - **Image:** Upload a medical document photo → OCR text extraction → AI summary
   - **PDF:** Upload a PDF document → text extraction → AI summary
3. View transcription history with pagination
4. Regenerate summaries or delete old transcriptions

#### System Backup

1. Click **"Backup"** in the sidebar (admin only)
2. **Create Backup:** Click "Create Backup" → downloads all system data as JSON
3. **View Backups:** See list of existing backups with date and size
4. **Download:** Click download icon on any backup to save locally

---

## 14. Agile Development Notes

### Development Methodology

MEDILOG is developed using the **Agile framework** with iterative and incremental delivery. Key Agile practices applied:

#### Sprint Structure

- Features are developed in focused sprints
- Each sprint delivers a working increment of the system
- Continuous integration of new features with existing functionality

#### Feature Backlog (Implemented)

| Sprint       | Features Delivered                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint 1** | User authentication (signup, login, OTP), Student portal, Admin portal, Basic medical record submission                                  |
| **Sprint 2** | 5 medical record types (Physical Exam, Monitoring, Certificate, Medicine Issuance, Lab Request), Record approval workflow, Notifications |
| **Sprint 3** | Pharmacy inventory management, Dashboard analytics with charts, Account management (student + staff)                                     |
| **Sprint 4** | AI Assistant (audio transcription, OCR, PDF extraction, AI summarization), CatBoost predictive analytics                                 |
| **Sprint 5** | System backup/restore, Export to CSV/Excel, Bulk operations, Advanced filtering/sorting, Profile picture upload with face detection      |

#### Agile Principles Applied

1. **Working Software > Documentation** — Functional features delivered each sprint
2. **Responding to Change** — Architecture supports easy addition of new record types and features
3. **Customer Collaboration** — Student and admin portals designed based on actual infirmary workflows
4. **Individuals and Interactions** — Filipino-language support in AI features reflects team's cultural context

#### Continuous Improvement Areas

- Notification endpoints need authentication middleware (identified security gap)
- Restore system endpoint intentionally disabled (501) for safety — requires manual implementation
- AdminActivityLog model is a stub — comprehensive logging could be added in future sprints

---

## 15. Maintenance & Debugging Guide

### Common Issues & Solutions

#### Backend Won't Start

| Symptom                    | Likely Cause                          | Solution                                                                                     |
| -------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `Port 5000 in use`         | Previous process didn't shut down     | Kill process on port 5000: `Get-NetTCPConnection -LocalPort 5000` → `Stop-Process -Id <PID>` |
| `MongoDB connection error` | MongoDB URI incorrect or service down | Check `MONGODB_URI` in `.env`, verify MongoDB Atlas is reachable                             |
| `Cannot find module`       | Missing dependencies                  | Run `npm install` in `backend/`                                                              |

#### Frontend Build Issues

| Symptom               | Likely Cause                | Solution                                                          |
| --------------------- | --------------------------- | ----------------------------------------------------------------- |
| TypeScript errors     | Type mismatches             | Run `npx tsc --noEmit` to see all type errors                     |
| Vite dev server crash | Port conflict               | Use `npx vite --port 3000`                                        |
| API calls failing     | Backend not running or CORS | Check if backend is on port 5000, verify `VITE_API_URL` in `.env` |

#### ML Predictions Not Working

| Symptom                                   | Likely Cause                               | Solution                                       |
| ----------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| `Statistical fallback` method in response | Python not found or CatBoost not installed | Install: `pip install catboost numpy`          |
| Old predictions                           | Models cached for 10 min                   | Add `?force=true` to analytics request         |
| CatBoost training fails                   | Not enough data (< 10 samples)             | Seed test data: `node scripts/seedTestData.js` |

#### AI Assistant Issues

| Symptom                               | Likely Cause           | Solution                                   |
| ------------------------------------- | ---------------------- | ------------------------------------------ |
| Audio transcription fails             | Missing `GROQ_API_KEY` | Set Groq API key in `.env`                 |
| OCR returns empty text                | Low quality image      | Use higher resolution, clearer image       |
| Summary is extractive (keyword-based) | Groq API unavailable   | Check Groq API key and internet connection |

### Key Files for Debugging

| Area           | File to Check                          | What to Look For                     |
| -------------- | -------------------------------------- | ------------------------------------ |
| API routes     | `backend/routes/*.js`                  | Route paths, middleware chain        |
| Business logic | `backend/controllers/*.js`             | Error handling, data validation      |
| Database       | `backend/config/db.js`                 | Connection string, connection events |
| Authentication | `backend/middleware/authMiddleware.js` | Token validation, role checks        |
| ML service     | `backend/ml/catboost_service.py`       | stderr logs (`[CatBoost]` prefix)    |
| Frontend API   | `MEDILOG/src/services/api.ts`          | Axios interceptors, base URL         |

### Database Inspection

```bash
# Connect to MongoDB shell
mongosh "your-mongodb-uri"

# Common queries
db.users.countDocuments({ role: "student", status: "approved" })
db.medicalmonitorings.find({ status: "pending" }).limit(5)
db.pharmacyinventories.find({ status: "critical" })
db.notifications.find({ userId: ObjectId("..."), isRead: false })
```

### Logs

- **Backend:** Console output from `nodemon` (server logs, errors, request info)
- **ML Service:** Python stderr output prefixed with `[CatBoost]`
- **Frontend:** Browser DevTools console + Network tab

---

## 16. Collaboration Guidelines

### Code Organization Conventions

| Convention      | Example                                                         |
| --------------- | --------------------------------------------------------------- |
| **Models**      | PascalCase, singular: `User.js`, `PhysicalExam.js`              |
| **Controllers** | camelCase + "Controller": `authController.js`                   |
| **Routes**      | camelCase + "Routes": `authRoutes.js`                           |
| **Components**  | PascalCase: `LoginForm.tsx`, `DashboardView.tsx`                |
| **Styles**      | kebab-case: `adminportal.css`, `LandingPage.css`                |
| **Types**       | PascalCase interfaces: `User`, `AuthResponse`, `PredictiveData` |

### Adding a New Medical Record Type

To add a new record type (e.g., "Dental Checkup"):

1. **Create Model:** `backend/models/DentalCheckup.js` — define Mongoose schema with common fields (`studentId`, `studentName`, `studentEmail`, `status`, etc.)
2. **Update Controller:** In `medicalRecordController.js`, add the new type to the model mapping and CRUD logic
3. **Update Routes:** No changes needed (controller handles type routing)
4. **Create Student Form:** `MEDILOG/src/components/student_comp/DentalCheckupForm.tsx`
5. **Update Student Types:** Add interface to `studentTypes.ts`
6. **Update Student Dashboard:** Add view switch case and sidebar entry
7. **Update Admin Record View:** Add column definitions in `PatientRecordsView.tsx`
8. **Update Analytics:** Add to aggregation queries in `analyticsController.js`

### Adding a New API Endpoint

1. Define route in the appropriate `backend/routes/*.js` file
2. Create controller function in the matching `backend/controllers/*.js` file
3. Apply `protect` and/or `isAdmin` middleware as needed
4. Add frontend API function in `MEDILOG/src/services/api.ts`
5. Call from the appropriate component

### Git Workflow

Follow standard Agile/Git Flow:

- `main` — Production-ready code
- `develop` — Integration branch for current sprint
- `feature/*` — Individual feature branches
- `bugfix/*` — Bug fix branches

---

## 17. Glossary

| Term                   | Definition                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **LRN**                | Learner Reference Number — unique ID assigned to Philippine students by DepEd                  |
| **OTP**                | One-Time Password — 6-digit code sent via email for verification                               |
| **JWT**                | JSON Web Token — stateless authentication token                                                |
| **CatBoost**           | Gradient boosting machine learning library by Yandex                                           |
| **Groq**               | AI inference platform providing Whisper (speech-to-text) and Llama (LLM) APIs                  |
| **OCR**                | Optical Character Recognition — extracting text from images                                    |
| **ISU**                | Isabela State University — the target institution                                              |
| **CRUD**               | Create, Read, Update, Delete — standard data operations                                        |
| **ODM**                | Object Document Mapper — Mongoose's role in mapping JS objects to MongoDB documents            |
| **SPA**                | Single Page Application — React Router handles routing client-side                             |
| **RBAC**               | Role-Based Access Control — different permissions for student/staff/admin                      |
| **CORS**               | Cross-Origin Resource Sharing — allows frontend to communicate with backend on different ports |
| **Multipart**          | Form data encoding that supports file uploads (used with Multer)                               |
| **Rate Limiting**      | Restricting the number of API requests per time window to prevent abuse                        |
| **Extractive Summary** | Summary composed of selected sentences from the original text (no AI generation)               |
| **Bag-of-Words**       | Text representation where each word's frequency is a feature (used in disease risk model)      |

---

## Appendix A: Complete API Endpoint Index

| #   | Method | Path                                                      | Auth  | Description            |
| --- | ------ | --------------------------------------------------------- | ----- | ---------------------- |
| 1   | POST   | `/api/users`                                              | —     | Sign up                |
| 2   | POST   | `/api/verify-otp`                                         | —     | Verify OTP             |
| 3   | POST   | `/api/login`                                              | —     | Login                  |
| 4   | POST   | `/api/resend-otp`                                         | —     | Resend OTP             |
| 5   | POST   | `/api/forgot-password`                                    | —     | Forgot password        |
| 6   | POST   | `/api/reset-password`                                     | —     | Reset password         |
| 7   | POST   | `/api/users/change-password`                              | JWT   | Change password        |
| 8   | GET    | `/api/accounts/pending`                                   | Admin | Pending students       |
| 9   | GET    | `/api/accounts/all`                                       | Admin | All students           |
| 10  | POST   | `/api/accounts/:userId/approve`                           | Admin | Approve student        |
| 11  | POST   | `/api/accounts/:userId/reject`                            | Admin | Reject student         |
| 12  | GET    | `/api/accounts/total`                                     | Admin | Student count          |
| 13  | DELETE | `/api/accounts/:userId`                                   | Admin | Delete student         |
| 14  | PUT    | `/api/accounts/:userId`                                   | Admin | Update student         |
| 15  | GET    | `/api/staff/all`                                          | Admin | All staff              |
| 16  | GET    | `/api/staff/pending`                                      | Admin | Pending staff          |
| 17  | GET    | `/api/staff/total`                                        | Admin | Staff count            |
| 18  | DELETE | `/api/staff/:userId`                                      | Admin | Delete staff           |
| 19  | PUT    | `/api/staff/:userId`                                      | Admin | Update staff           |
| 20  | POST   | `/api/records`                                            | JWT   | Create record          |
| 21  | GET    | `/api/records/student/:studentId`                         | JWT   | Student records        |
| 22  | GET    | `/api/records/all`                                        | Admin | All records            |
| 23  | PUT    | `/api/records/:id`                                        | Admin | Update record          |
| 24  | DELETE | `/api/records/:id`                                        | Admin | Delete record          |
| 25  | POST   | `/api/records/bulk-delete`                                | Admin | Bulk delete            |
| 26  | POST   | `/api/records/bulk-update-status`                         | Admin | Bulk status update     |
| 27  | GET    | `/api/records/aggregation`                                | Admin | Aggregation stats      |
| 28  | GET    | `/api/records/export`                                     | Admin | Export records         |
| 29  | GET    | `/api/records/pending-counts`                             | Admin | Pending counts         |
| 30  | GET    | `/api/pharmacy/medicine-list`                             | JWT   | Medicine list          |
| 31  | GET    | `/api/pharmacy/`                                          | Admin | Full inventory         |
| 32  | POST   | `/api/pharmacy/`                                          | Admin | Add medicine           |
| 33  | PUT    | `/api/pharmacy/:id`                                       | Admin | Update medicine        |
| 34  | PUT    | `/api/pharmacy/:id/stock`                                 | Admin | Update stock           |
| 35  | DELETE | `/api/pharmacy/:id`                                       | Admin | Delete medicine        |
| 36  | POST   | `/api/pharmacy/seed`                                      | Admin | Seed inventory         |
| 37  | GET    | `/api/analytics/insights`                                 | Admin | Dashboard insights     |
| 38  | GET    | `/api/analytics/dashboard-overview`                       | Admin | Dashboard overview     |
| 39  | GET    | `/api/analytics/predictive`                               | Admin | ML predictions         |
| 40  | GET    | `/api/ai-assistant/stats`                                 | Admin | Transcription stats    |
| 41  | GET    | `/api/ai-assistant/transcriptions`                        | Admin | Transcription list     |
| 42  | POST   | `/api/ai-assistant/transcriptions`                        | Admin | Save transcription     |
| 43  | POST   | `/api/ai-assistant/transcriptions/audio`                  | Admin | Audio transcription    |
| 44  | POST   | `/api/ai-assistant/transcriptions/ocr`                    | Admin | Image OCR              |
| 45  | POST   | `/api/ai-assistant/transcriptions/pdf`                    | Admin | PDF extraction         |
| 46  | POST   | `/api/ai-assistant/transcriptions/:id/regenerate-summary` | Admin | Regenerate summary     |
| 47  | DELETE | `/api/ai-assistant/transcriptions/:id`                    | Admin | Delete transcription   |
| 48  | GET    | `/api/notifications/student/:studentId`                   | —     | Get notifications      |
| 49  | GET    | `/api/notifications/student/:studentId/unread-count`      | —     | Unread count           |
| 50  | POST   | `/api/notifications/student/:studentId/mark-read`         | —     | Mark read              |
| 51  | POST   | `/api/users/:userId/upload-pfp`                           | JWT   | Upload profile picture |
| 52  | POST   | `/api/users/backup/create`                                | Admin | Create backup          |
| 53  | GET    | `/api/users/backup/list`                                  | Admin | List backups           |
| 54  | GET    | `/api/users/backup/download/:filename`                    | Admin | Download backup        |
| 55  | POST   | `/api/users/backup/restore`                               | Admin | Restore (501)          |

---

_This documentation was generated on February 17, 2026 for the MEDILOG Medical Information Logging System._
