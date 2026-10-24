# VorldX Employee Attendance System

A full-stack employee attendance and workforce management system for modern organizations.

## Tech Stack

- **Frontend:** React, Vite, React Router, Axios, Lucide React, Recharts
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Mobile App:** React Native, Expo, AsyncStorage
- **Security:** JWT authentication, password hashing, and rate limiting

## User Roles

### Super Admin
- Manage HR Admin accounts.
- Manage attendance policies.
- View employee and HR attendance.
- Correct attendance with justification and audit logs.
- Approve or reject leave and work-from-home (WFH) requests.
- View reports and audit logs.

### HR Admin
- Create, edit, and deactivate employee accounts.
- View and manage employee attendance.
- Approve or reject employee leave and WFH requests.
- Access employee reports.

### Employee
- Check in and check out through the mobile app.
- Scan the office QR code for attendance.
- Apply for work-from-home and leave.
- View personal attendance history.

## Attendance Features

- Office start time: 9:00 AM IST.
- Check-in cutoff: 9:30 AM IST.
- Dynamic QR code refreshes every 18 seconds.
- WFH requires prior approval.
- Maximum of five approved WFH employees per day.
- Attendance corrections maintain an audit history.

## Project Structure

```text
VorldX-Employee-Attendance-System/
├── admin-web/
├── backend/
└── employee-app/
```

## Installation and Setup

### 1. Backend

Open a terminal in the project root and run:

```powershell
cd backend
npm install
npm test
npm start
```

API base URL: `http://localhost:5000/api`

Run `npm test` only if the backend defines a test script in its `package.json`.

### 2. Admin Dashboard

Open a new terminal in the project root:

```powershell
cd admin-web
npm install
npm run dev
```

Dashboard URL: `http://localhost:5173`

The actual port may differ if port 5173 is already in use.

### 3. Employee Mobile App

Open another terminal in the project root:

```powershell
cd employee-app
npm install
npx expo start
```

Follow the Expo instructions to run the application on a compatible device or emulator.

## Environment Variables

Configure the required environment variables before starting the backend. Refer to the project's environment configuration or example environment file, if available.

Keep passwords, JWT secrets, database credentials, and API keys private. Never commit real credentials to the repository.

## Project Status

VorldX is an ongoing full-stack project focused on employee attendance, workforce management, QR-based check-in, leave requests, and work-from-home approvals.

Features and security controls should be validated against the current implementation and deployment configuration before describing the project as production-ready.
