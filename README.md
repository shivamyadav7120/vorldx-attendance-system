# VorldX Employee Attendance System

A production-ready full-stack attendance and workforce management system built for modern hybrid organizations.

---

## 🏛 System Architecture & Tech Stack

- **Admin Web Dashboard (`admin-web/`)**: React 18, Vite, React Router 6, Axios, Lucide React, Recharts.
- **Backend API Server (`backend/`)**: Node.js, Express, MongoDB Atlas / Mongoose, JWT, bcryptjs, Helmet, CORS, Rate Limiting, Node test runner.
- **Employee Mobile Application (`employee-app/`)**: React Native with Expo SDK 52, JavaScript, Expo Camera (`CameraView` for QR scanning), AsyncStorage.

---

## 👥 User Roles & Permissions

1. **Super Admin**:
   - Full system access.
   - Create, edit, and deactivate HR Admin accounts.
   - Manage attendance policies (9:00 AM start, 9:30 AM cutoff, late policy, daily WFH limit, QR expiry).
   - View workforce attendance (both employees and HR admins).
   - Mark and correct attendance with mandatory justification and audit logging.
   - Approve or reject employee and HR leave/WFH requests.
   - View system audit logs and detailed analytics.

2. **HR Admin**:
   - Create, edit, and deactivate employee accounts only.
   - Cannot create, modify, or deactivate Super Admin or HR Admin accounts.
   - View employee attendance and mark/correct employee attendance with audit history.
   - Approve or reject employee leave and WFH requests (enforcing max 5 WFH/day).
   - View workforce reports and employee directory.

3. **Employee**:
   - Mobile app access.
   - Scan office dynamic 18-second rolling QR code for check-in.
   - Apply for WFH (with date overlap and daily capacity checks).
   - Apply for leave (casual, sick, earned, emergency).
   - View personal attendance history, today's status, and decision notes.
   - Check out at the end of the day.

---

## ⚡ Attendance Engine & Rules

- **Office Start Time**: 09:00 AM (IST / `Asia/Kolkata`).
- **Check-in Cutoff Time**: 09:30 AM (IST).
- **Cutoff Behavior**:
  - Arrivals $\le$ 09:30 AM are marked `PRESENT`.
  - Arrivals > 09:30 AM follow the configured company policy: `MARK_LATE` (marked `LATE`), `MARK_ABSENT` (marked `ABSENT`), or `MARK_HALF_DAY` (marked `HALF_DAY`).
- **Dynamic Office QR**:
  - Server-issued cryptographically secure token.
  - Automatically expires and refreshes every 18 seconds.
  - Single-use consumption prevents photo-sharing and replay attacks.
- **Work-From-Home (WFH)**:
  - Allowed only after prior request approval.
  - Concurrency-safe enforcement of maximum 5 approved WFH employees per day.
- **Correction History**:
  - Original check-in, check-out, and status records are never overwritten silently.
  - Immutable correction history records previous values, new values, timestamp, reason, and admin identity.

---

## 🚀 Quick Start Guide (PowerShell Commands)

### 1. Backend Server
```powershell
cd C:\Users\Lenovo\OneDrive\Desktop\VorldX-Employee-Attendance-System\backend
npm install
npm test
npm start
```
- API Base URL: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### 2. Admin Web Dashboard
```powershell
cd C:\Users\Lenovo\OneDrive\Desktop\VorldX-Employee-Attendance-System\admin-web
npm install
npm run dev
```
- Admin Dashboard URL: `http://localhost:5173`

### 3. Employee Mobile App (Expo)
```powershell
cd C:\Users\Lenovo\OneDrive\Desktop\VorldX-Employee-Attendance-System\employee-app
npx expo start
```
- Press `a` for Android Emulator, `w` for Web preview, or scan the Metro QR code using the Expo Go mobile app.

---

## 🔑 Default Seed Accounts

- **Super Admin**:
  - Email: `superadmin@vorldx.com`
  - Password: `SuperAdminPassword123!` (or value configured in `.env`)
- **HR Admin**:
  - Email: `vorldxadminister@gmail.com`
  - Password: (configured in `backend/.env`)
