# MEDILOG System — Algorithms Based on Use Case Diagram

---

## 1. Student Registration (Sign Up) Algorithm

```
Algorithm: StudentSignUp
Input: username, email, LRN, studentId, department, program, yearLevel, idPhoto
Output: Registration confirmation or error

BEGIN
  1. Student navigates to Sign Up page
  2. Student selects "Student" role
  3. Student fills in registration form:
     a. Enter username
     b. Enter email address
     c. Enter LRN (Learner Reference Number)
     d. Enter student ID
     e. Select department
     f. Select program
     g. Select year level
     h. Upload ID photo
  4. System validates all required fields are filled
     4.1 IF any required field is empty THEN
         Display error: "Please fill in all required fields"
         RETURN to Step 3
     4.2 IF email format is invalid THEN
         Display error: "Invalid email format"
         RETURN to Step 3
  5. System checks if email already exists in database
     5.1 IF email already exists THEN
         Display error: "Email already registered"
         RETURN to Step 3
  6. System uploads ID photo to Cloudinary
  7. System creates new User record with:
     - role = "student"
     - status = "pending"
     - isVerified = false
  8. System saves user to database
  9. Display success: "Registration submitted. Awaiting admin approval."
END
```

---

## 2. User Login Algorithm

```
Algorithm: UserLogin
Input: email/studentId, password, reCAPTCHA token
Output: JWT token or error

BEGIN
  1. User navigates to Login page
  2. User selects role (Student/Staff/Admin)
  3. User enters credentials:
     a. Enter email (or studentId for Students)
     b. Enter password
     c. Complete reCAPTCHA verification
  4. System validates reCAPTCHA token
     4.1 IF reCAPTCHA fails THEN
         Display error: "reCAPTCHA verification failed"
         RETURN to Step 3
  5. System checks rate limit (5 attempts per 2 minutes)
     5.1 IF rate limit exceeded THEN
         Display error: "Too many login attempts. Try again later."
         RETURN
  6. System searches for user by email or studentId
     6.1 IF user not found THEN
         Display error: "Invalid credentials"
         RETURN to Step 3
  7. System checks user status
     7.1 IF status = "pending" THEN
         Display error: "Account pending approval"
         RETURN
     7.2 IF status = "rejected" THEN
         Display error: "Account has been rejected"
         RETURN
  8. System verifies password using bcrypt.compare()
     8.1 IF password mismatch THEN
         Display error: "Invalid credentials"
         RETURN to Step 3
  9. System checks if device is remembered
     9.1 IF device is remembered AND rememberMe not expired THEN
         Generate JWT token (30-day expiry)
         SKIP OTP verification
         GOTO Step 12
  10. System generates 6-digit OTP
  11. System sends OTP to user's email
      - Store OTP hash and expiry (10 minutes) in database
      - Redirect user to OTP verification screen
      - CALL VerifyOTP Algorithm
  12. System generates JWT token
  13. Update lastLoginAt timestamp
  14. Redirect user to appropriate dashboard:
      14.1 IF role = "student" THEN redirect to Student Dashboard
      14.2 IF role = "staff" OR "admin" THEN redirect to Admin Dashboard
  15. RETURN JWT token
END
```

---

## 3. OTP Verification Algorithm

```
Algorithm: VerifyOTP
Input: email/studentId, OTP code
Output: Authentication success or failure

BEGIN
  1. User receives OTP via email
  2. User enters 6-digit OTP code on verification screen
  3. System retrieves stored OTP for user
  4. System checks OTP expiry
     4.1 IF current time > otpExpiry THEN
         Display error: "OTP has expired. Request a new one."
         RETURN failure
  5. System compares entered OTP with stored OTP
     5.1 IF OTP does not match THEN
         Display error: "Invalid OTP"
         RETURN failure
  6. System clears OTP and otpExpiry from database
  7. System sets isVerified = true
  8. IF "Remember Me" was selected THEN
     Set rememberMe = true (expires in 3 days)
  9. RETURN success
END
```

---

## 4. Forgot/Reset Password Algorithm

```
Algorithm: ForgotAndResetPassword
Input: email, OTP, newPassword
Output: Password reset confirmation or error

BEGIN
  === Phase 1: Request Reset ===
  1. User clicks "Forgot Password" on login page
  2. User enters registered email address
  3. System checks rate limit for password reset requests
     3.1 IF rate limit exceeded THEN
         Display error: "Too many requests. Try again later."
         RETURN
  4. System searches for user by email
     4.1 IF user not found THEN
         Display generic message: "If email exists, OTP has been sent"
         RETURN (prevent email enumeration)
  5. System generates 6-digit OTP
  6. System stores OTP hash and expiry (10 minutes) in user record
  7. System sends OTP to email via Email Service
  8. Redirect to Reset Password form

  === Phase 2: Reset Password ===
  9. User enters OTP code
  10. User enters new password
  11. User confirms new password
  12. System validates new password strength
      12.1 IF password too weak THEN
           Display error: "Password does not meet requirements"
           RETURN to Step 10
  13. System verifies OTP (call VerifyOTP logic)
      13.1 IF OTP invalid or expired THEN
           Display error
           RETURN to Step 9
  14. System hashes new password with bcrypt
  15. System updates user password in database
  16. System clears OTP fields
  17. Display success: "Password reset successfully"
  18. Redirect to Login page
END
```

---

## 5. Submit Medical Record Algorithm

```
Algorithm: SubmitMedicalRecord
Input: recordType, formData, studentId
Output: Record submission confirmation or error

BEGIN
  1. Student navigates to "Submit Record" section
  2. Student selects record type:
     a. Physical Exam
     b. Medical Monitoring
     c. Medical Certificate
     d. Medicine Issuance
     e. Laboratory Request
  3. System displays appropriate form based on record type

  4. SWITCH (recordType):
     CASE "Physical Exam":
       Student fills: name, gender, course, year, date
     CASE "Medical Monitoring":
       Student fills: arrival, patientName, sex, degree, studentNo, symptoms, action
     CASE "Medical Certificate":
       Student fills: name, age, sex, civilStatus, school, idNumber, date
     CASE "Medicine Issuance":
       a. Student fills: date, course
       b. System fetches available medicines from pharmacy
       c. Student selects medicines and quantities
       d. Validate: at least 1 medicine with quantity > 0
     CASE "Laboratory Request":
       Student fills: issueDate, name
       Student selects lab tests (checkboxes):
         - Routine Urinalysis, CBC, Gram Stain,
         - Blood Chemistry, Pap Smear, Widhal Test
       Student optionally enters custom tests in "Others" field

  5. Student submits the form
  6. System validates all required fields
     6.1 IF validation fails THEN
         Display field-specific errors
         RETURN to Step 4
  7. System creates new record with:
     - studentId = current user's ID
     - studentName = current user's username
     - studentEmail = current user's email
     - status = "pending"
     - All form fields
  8. System saves record to database
  9. System creates Admin Notification:
     - targetRole = "admin"
     - message = "{studentName} submitted a new {recordType}"
     - recordId = new record's ID
     - recordType = selected type
  10. Display success: "Record submitted successfully. Awaiting review."
END
```

---

## 6. Approve/Reject Medical Record Algorithm

```
Algorithm: UpdateRecordStatus
Input: recordId, newStatus, adminNotes, additionalFields
Output: Updated record and student notification

BEGIN
  1. Admin/Staff navigates to Patient Records view
  2. Admin selects a pending record to review
  3. System displays full record details
  4. Admin reviews the submitted information

  5. Admin chooses action:
     5.1 IF action = "approve" THEN
         newStatus = "approved"
     5.2 IF action = "reject" THEN
         newStatus = "rejected"

  6. Admin fills additional fields based on record type:
     SWITCH (recordType):
       CASE "Medical Monitoring":
         Fill: meds, exit time, duration, personnel name
       CASE "Medical Certificate":
         Fill: diagnosis, remarks
       CASE "Medicine Issuance":
         Fill: diagnosis
       CASE "Laboratory Request":
         Fill: nurseOnDuty
       CASE "Physical Exam":
         (No additional admin fields)

  7. Admin optionally enters adminNotes
  8. Admin confirms the action

  9. System updates record:
     - status = newStatus
     - approvedBy = current admin's ID
     - approvedDate = current timestamp
     - adminNotes = entered notes
     - additional type-specific fields
  10. System saves updated record

  11. System creates Student Notification:
      - userId = record's studentId
      - targetRole = "student"
      - message = "Your {recordType} has been {newStatus}"
      - recordId = recordId
      - recordType = type

  12. System logs admin activity:
      - action = "record_{newStatus}"
      - actionDetails = { recordId, recordType, studentName }
      - ipAddress, userAgent

  13. Display success: "Record {newStatus} successfully"
END
```

---

## 7. Bulk Operations on Records Algorithm

```
Algorithm: BulkRecordOperations
Input: recordIds[], operation (update-status/delete), newStatus (if update)
Output: Bulk operation result

BEGIN
  1. Admin/Staff navigates to Patient Records view
  2. Admin selects multiple records via checkboxes
  3. Admin chooses bulk action:

  === Bulk Status Update ===
  4A. IF operation = "bulk-update-status" THEN
      a. Admin selects new status ("approved" or "rejected")
      b. System validates recordIds array is not empty
      c. FOR EACH recordId IN recordIds:
         i.   Find record by ID
         ii.  Update status to newStatus
         iii. Set approvedBy = current admin
         iv.  Set approvedDate = now
         v.   Create student notification
      d. System logs bulk activity
      e. Display: "{count} records updated to {newStatus}"

  === Bulk Delete ===
  4B. IF operation = "bulk-delete" THEN
      a. System validates recordIds array is not empty
      b. System displays confirmation dialog
      c. IF confirmed THEN
         FOR EACH recordId IN recordIds:
           Delete record from database
         System logs bulk delete activity
         Display: "{count} records deleted"
      d. IF cancelled THEN RETURN
END
```

---

## 8. Student Account Approval Algorithm

```
Algorithm: ApproveStudentAccount
Input: userId
Output: Account approved with credentials sent

BEGIN
  1. Admin navigates to Student Accounts view
  2. System displays list of pending student accounts
  3. Admin selects a pending student account
  4. System displays student details including:
     - Username, email, studentId, LRN
     - Department, program, year level
     - ID photo for verification
  5. Admin reviews student information and ID photo

  6. Admin clicks "Approve"
  7. System updates user record:
     - status = "approved"
     - approvedBy = current admin's ID
     - password = bcrypt.hash(student's LRN)
  8. System sends approval email to student:
     - Subject: "MEDILOG Account Approved"
     - Body: "Your account has been approved. Your initial password is your LRN."
  9. System logs admin activity:
     - action = "approve_student"
     - actionDetails = { studentName, studentEmail }
  10. Display success: "Student account approved"
END
```

---

## 9. Reject Student Account Algorithm

```
Algorithm: RejectStudentAccount
Input: userId, rejectionReason (optional)
Output: Account rejected with email notification

BEGIN
  1. Admin navigates to Student Accounts view
  2. Admin selects a pending student account
  3. Admin clicks "Reject"
  4. Admin optionally enters rejection reason
  5. System updates user record:
     - status = "rejected"
  6. System sends rejection email to student:
     - Subject: "MEDILOG Account Rejected"
     - Body: "Your account has been rejected." + reason (if provided)
  7. System logs admin activity:
     - action = "reject_student"
     - actionDetails = { studentName, reason }
  8. Display success: "Student account rejected"
END
```

---

## 10. Pharmacy Inventory Management Algorithm

```
Algorithm: ManagePharmacyInventory
Input: operation, medicineData
Output: Updated inventory

BEGIN
  === Add New Medicine ===
  1A. IF operation = "add" THEN
      a. Admin fills form: medicineId, name, category, stock, minStock, unit, expiry, location
      b. System validates medicineId is unique
         b1. IF duplicate THEN Display error: "Medicine ID already exists", RETURN
      c. System computes initial status:
         IF stock <= 0 OR stock < minStock * 0.5 THEN status = "critical"
         ELSE IF stock < minStock THEN status = "low"
         ELSE status = "adequate"
      d. System saves medicine to database
      e. Display success: "Medicine added"

  === Update Stock ===
  1B. IF operation = "update-stock" THEN
      a. Admin selects medicine from inventory
      b. Admin enters quantity change:
         - Positive value = Add stock
         - Negative value = Dispense/Dispose
      c. System calculates: newStock = currentStock + quantity
         c1. IF newStock < 0 THEN newStock = 0
      d. System recomputes status:
         IF newStock <= 0 OR newStock < minStock * 0.5 THEN status = "critical"
         ELSE IF newStock < minStock THEN status = "low"
         ELSE status = "adequate"
      e. System saves updated stock and status
      f. Display success: "Stock updated"

  === Update Details ===
  1C. IF operation = "update-details" THEN
      a. Admin selects medicine
      b. Admin updates fields (e.g., expiry date)
      c. System saves changes
      d. Display success: "Medicine updated"

  === Delete Medicine ===
  1D. IF operation = "delete" THEN
      a. Admin selects medicine
      b. System displays confirmation dialog
      c. IF confirmed THEN
         System deletes medicine from database
         Display success: "Medicine deleted"
END
```

---

## 11. AI Audio Transcription Algorithm

```
Algorithm: AIAudioTranscription
Input: audioFile, title, patientName
Output: Transcription text + AI summary

BEGIN
  1. Admin/Staff navigates to AI Assistant
  2. Admin selects "Audio Transcription" tab
  3. Admin fills form:
     a. Upload audio file (max 25MB)
     b. Enter title (optional)
     c. Enter patient name (optional)
  4. System validates file:
     4.1 IF file size > 25MB THEN
         Display error: "File too large (max 25MB)"
         RETURN
     4.2 IF file format unsupported THEN
         Display error: "Unsupported audio format"
         RETURN
  5. System creates AiTranscription record:
     - type = "audio"
     - status = "processing"
  6. System sends audio to Groq Whisper API
     6.1 IF API call fails THEN
         Update status = "failed"
         Display error: "Transcription failed"
         RETURN
  7. System receives transcriptionText from Groq Whisper
  8. System sends transcriptionText to Groq Llama 3.3 for summarization
     8.1 IF summarization fails THEN
         Save transcription without summary
         aiSummary = "Summary generation failed"
  9. System updates AiTranscription record:
     - transcriptionText = received text
     - aiSummary = generated summary
     - wordCount = count words in transcription
     - status = "completed"
     - createdBy = current admin's ID
  10. Display transcription result and AI summary
END
```

---

## 12. AI Image OCR Algorithm

```
Algorithm: AIImageOCR
Input: imageFile, title
Output: Extracted text from image

BEGIN
  1. Admin/Staff navigates to AI Assistant
  2. Admin selects "Image OCR" tab
  3. Admin uploads image file (JPEG, PNG, WEBP, GIF, BMP, TIFF; max 10MB)
  4. System validates file format and size
     4.1 IF invalid THEN Display error, RETURN
  5. System uploads image to Cloudinary
  6. System processes image with Tesseract.js OCR engine
     6.1 IF OCR fails THEN
         Update status = "failed"
         Display error: "Text extraction failed"
         RETURN
  7. System creates AiTranscription record:
     - type = "image"
     - extractedText = OCR result
     - imageUrl = Cloudinary URL
     - originalFileName = uploaded filename
     - status = "completed"
     - createdBy = current admin's ID
  8. Display extracted text
END
```

---

## 13. AI PDF Text Extraction Algorithm

```
Algorithm: AIPDFExtraction
Input: pdfFile, title
Output: Extracted text from PDF

BEGIN
  1. Admin/Staff navigates to AI Assistant
  2. Admin selects "PDF Extraction" tab
  3. Admin uploads PDF file (max 20MB)
  4. System validates file size and format
     4.1 IF invalid THEN Display error, RETURN
  5. System processes PDF with pdf-parse library
     5.1 IF extraction fails THEN
         Update status = "failed"
         Display error: "PDF extraction failed"
         RETURN
  6. System creates AiTranscription record:
     - type = "pdf"
     - extractedText = parsed text
     - status = "completed"
     - createdBy = current admin's ID
  7. Display extracted text
END
```

---

## 14. Predictive Analytics Algorithm

```
Algorithm: PredictiveAnalytics
Input: (none — uses historical data)
Output: Predictions for visits, disease risk, stock depletion

BEGIN
  1. Admin navigates to Predictive Analytics view
  2. System gathers historical data from database:
     a. All medical records (with dates, types, symptoms)
     b. Student profiles
     c. Pharmacy inventory records

  === Visit Forecasting ===
  3. System spawns Python subprocess with CatBoost model
  4. System passes historical visit data (dates, counts) to model
  5. CatBoost model predicts visits for next 7 days
  6. Return: daily predicted visit counts

  === Disease Risk Assessment ===
  7. System analyzes student medical history:
     a. Frequency of visits
     b. Types of conditions/symptoms
     c. Recurring patterns
  8. CatBoost model classifies risk levels:
     - High Risk: frequent visits + chronic symptoms
     - Medium Risk: moderate visit frequency
     - Low Risk: infrequent visits
  9. Return: list of students with risk levels

  === Stock Depletion Forecast ===
  10. System calculates average daily dispensing rate per medicine
  11. System computes: daysUntilDepletion = currentStock / avgDailyUsage
  12. Return: medicines sorted by depletion urgency

  13. System compiles all predictions into dashboard view
  14. Display: Visit forecast chart, risk table, stock alerts
END
```

---

## 15. Dashboard Insights Algorithm

```
Algorithm: DashboardInsights
Input: (none — uses aggregated data)
Output: Analytics overview and insights

BEGIN
  1. Admin/Staff navigates to Dashboard Overview

  === Overview Metrics ===
  2. System queries and computes:
     a. totalRecords = COUNT all medical records
     b. pendingRecords = COUNT records WHERE status = "pending"
     c. totalStudents = COUNT users WHERE role = "student" AND status = "approved"
     d. activeStaff = COUNT users WHERE role IN ("staff", "admin") AND status = "approved"
  3. Return overview metrics

  === Dashboard Insights ===
  4. System computes detailed insights:
     a. Top Program: GROUP records BY student program, ORDER BY count DESC, RETURN first
     b. Symptom Trends:
        i.   COUNT respiratory symptoms this week
        ii.  COUNT respiratory symptoms last week
        iii. Compute growth percentage
     c. Staff Performance:
        i.   GROUP approved records BY approvedBy
        ii.  COUNT per staff member
        iii. SORT by count DESC
     d. Record Type Distribution:
        i.   COUNT records BY recordType
        ii.  Compute percentages
     e. Staff Workload:
        i.   Distribute pending records across staff
  5. Display all insights with charts (Recharts)
END
```

---

## 16. Notification System Algorithm

```
Algorithm: NotificationSystem
Input: triggerEvent, targetUser/targetRole, message
Output: Notification created and delivered

BEGIN
  === Notification Creation ===
  1. System detects trigger event:
     a. Student submits record → notify admins
     b. Admin approves/rejects record → notify student

  2. System creates Notification record:
     - userId = target student ID (or null for admin-wide)
     - targetRole = "student" or "admin"
     - message = contextual message
     - recordId = related record
     - recordType = record type
     - studentName = student's name (for admin notifications)
     - isRead = false

  === Notification Retrieval (Student) ===
  3. Student opens notifications:
     a. System queries: Notification WHERE userId = studentId, ORDER BY createdAt DESC
     b. Display list of notifications with read/unread status

  === Notification Retrieval (Admin) ===
  4. Admin opens notifications:
     a. System queries: Notification WHERE targetRole = "admin", ORDER BY createdAt DESC
     b. Display list with student names

  === Mark as Read ===
  5. User marks notifications as read:
     a. System updates: isRead = true for selected notification IDs
     b. Recalculate unread count badge

  === Unread Count ===
  6. System periodically fetches unread count:
     a. COUNT Notification WHERE userId = X AND isRead = false
     b. Display badge number
END
```

---

## 17. Export Records Algorithm

```
Algorithm: ExportRecords
Input: format (CSV or XLSX), filters (optional)
Output: Downloadable file

BEGIN
  1. Admin/Staff navigates to Patient Records view
  2. Admin clicks "Export" button
  3. Admin selects format:
     a. CSV (Comma-Separated Values)
     b. XLSX (Excel Spreadsheet)
  4. System queries all records from database
     - Apply any active filters (status, gender, course, date range)
  5. System transforms records into tabular format:
     - Columns: Record Type, Student Name, Student ID, Date, Status,
                 Admin Notes, Approved By, Approved Date, [type-specific fields]
  6. SWITCH (format):
     CASE "csv":
       System generates CSV string with headers
       Set Content-Type: text/csv
     CASE "xlsx":
       System generates Excel workbook using exceljs
       Set Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  7. System sends file as download response
  8. Browser downloads file: "MEDILOG_Records.{format}"
END
```

---

## 18. System Backup and Restore Algorithm

```
Algorithm: SystemBackupAndRestore
Input: operation (create/list/download/restore), filename (for download/restore)
Output: Backup file or restoration result

BEGIN
  === Create Backup ===
  1A. IF operation = "create" THEN
      a. System generates timestamp filename:
         "MEDILOG_Backup_{ISO_TIMESTAMP}.json"
      b. System exports all collections from MongoDB:
         - Users, PhysicalExams, MedicalMonitorings,
         - MedicalCertificates, MedicineIssuances,
         - LaboratoryRequests, PharmacyInventory,
         - Notifications, AiTranscriptions, AdminActivityLogs
      c. System writes JSON to backend/backups/ directory
      d. Display success: "Backup created: {filename}"

  === List Backups ===
  1B. IF operation = "list" THEN
      a. System reads backend/backups/ directory
      b. System filters for MEDILOG_Backup_*.json files
      c. System returns list with filenames and file sizes
      d. Display backup list sorted by date (newest first)

  === Download Backup ===
  1C. IF operation = "download" THEN
      a. System validates filename exists in backups directory
         a1. IF not found THEN Display error: "Backup not found", RETURN
      b. System sends file as download response
      c. Browser downloads JSON backup file

  === Restore System ===
  1D. IF operation = "restore" THEN
      a. System validates backup file exists
      b. System displays confirmation: "This will replace ALL current data"
      c. IF confirmed THEN
         i.   System reads backup JSON file
         ii.  System drops all existing collections
         iii. System inserts backup data into each collection
         iv.  Display success: "System restored from {filename}"
      d. IF cancelled THEN RETURN
END
```

---

## 19. View Own Records (Student) Algorithm

```
Algorithm: ViewOwnRecords
Input: studentId, filters (optional: recordType)
Output: List of student's submitted records

BEGIN
  1. Student navigates to "History" or "My Records" section
  2. System sends request with student's ID
  3. System queries all 5 record collections:
     a. PhysicalExam WHERE studentId = currentUser
     b. MedicalMonitoring WHERE studentId = currentUser
     c. MedicalCertificate WHERE studentId = currentUser
     d. MedicineIssuance WHERE studentId = currentUser
     e. LaboratoryRequest WHERE studentId = currentUser
  4. IF recordType filter is applied THEN
     Filter results to only the selected type
  5. System merges and sorts all records by createdAt DESC
  6. System returns records with:
     - Record type label
     - Submission date
     - Current status (pending/approved/rejected)
     - Admin notes (if any)
  7. Display records in list/table view
  8. Student can click any record to view full details in modal
END
```

---

## 20. Staff Account Management Algorithm

```
Algorithm: ManageStaffAccounts
Input: operation, staffData
Output: Staff account action result

BEGIN
  === View Staff Accounts ===
  1A. Admin navigates to Staff Accounts view
      System queries: User WHERE role = "staff"
      Display list with: username, email, employeeId, position, status

  === Approve Staff ===
  1B. IF operation = "approve" THEN
      a. Admin selects pending staff account
      b. Admin reviews staff details and ID photo
      c. Admin clicks "Approve"
      d. System updates: status = "approved", approvedBy = currentAdmin
      e. System sends approval email to staff
      f. System logs admin activity
      g. Display: "Staff account approved"

  === Update Staff ===
  1C. IF operation = "update" THEN
      a. Admin selects staff account
      b. Admin modifies fields (position, employeeId, etc.)
      c. System saves changes
      d. Display: "Staff account updated"

  === Delete Staff ===
  1D. IF operation = "delete" THEN
      a. Admin selects staff account
      b. System displays confirmation dialog
      c. IF confirmed THEN
         System deletes user from database
         Display: "Staff account deleted"
END
```

---

## 21. Admin Activity Logging Algorithm

```
Algorithm: ActivityLogging
Input: adminId, action, actionDetails
Output: Activity log entry

BEGIN
  === Automatic Logging (triggered by admin actions) ===
  1. Admin/Staff performs an action (approve, reject, update, delete, etc.)
  2. System captures:
     - adminId = current user's ID
     - adminEmail = current user's email
     - adminUsername = current user's username
     - action = action type string
     - actionDetails = { relevant context data }
     - ipAddress = request IP
     - userAgent = request user agent string
     - status = "success"
  3. System creates AdminActivityLog record
  4. System saves to database (indexed by createdAt DESC)

  === View Activity Logs ===
  5. Admin navigates to Activity Logs view
  6. System queries AdminActivityLog, sorted by createdAt DESC
  7. Display: timestamp, admin name, action, details

  === Staff Activity Summary ===
  8. Admin navigates to Staff Activity Summary
  9. System aggregates logs:
     GROUP BY adminId → COUNT actions per staff
  10. Display: staff name, total actions, action breakdown
END
```

---

## 22. Change Password Algorithm

```
Algorithm: ChangePassword
Input: currentPassword, newPassword
Output: Password update confirmation or error

BEGIN
  1. User navigates to profile/settings
  2. User clicks "Change Password"
  3. User enters:
     a. Current password
     b. New password
     c. Confirm new password
  4. System validates:
     4.1 IF new password ≠ confirm password THEN
         Display error: "Passwords do not match"
         RETURN
     4.2 IF new password too weak THEN
         Display error: "Password must meet requirements"
         RETURN
  5. System verifies current password with bcrypt.compare()
     5.1 IF current password incorrect THEN
         Display error: "Current password is incorrect"
         RETURN
  6. System hashes new password with bcrypt
  7. System updates password in database
  8. Display success: "Password changed successfully"
END
```

---

## 23. Profile Picture Upload Algorithm

```
Algorithm: UploadProfilePicture
Input: userId, imageFile
Output: Updated profile picture URL

BEGIN
  1. User navigates to Profile section
  2. User clicks "Upload Profile Picture"
  3. User selects image file from device
  4. System validates file:
     4.1 IF not an image format THEN Display error, RETURN
     4.2 IF file too large THEN Display error, RETURN
  5. System uploads image to Cloudinary
  6. System receives Cloudinary URL
  7. System updates User record:
     - profilePictureUrl = Cloudinary URL
  8. Display updated profile picture
END
```
