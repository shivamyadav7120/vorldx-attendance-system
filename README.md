# VorldX Employee Attendance System

A full-stack employee attendance and workforce management system for modern organizations.

## Tech Stack

- **Frontend:** React, Vite, React Router, Axios, Lucide React, Recharts
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Mobile App:** React Native, Expo, AsyncStorage
- **Security:** JWT authentication, password hashing, rate limiting

## User Roles

### Super Admin
- Manage HR Admin accounts.
- Manage attendance policies.
- View employee and HR attendance.
- Correct attendance with justification and audit logs.
- Approve or reject leave and WFH requests.
- View reports and audit logs.

### HR Admin
- Create, edit, and deactivate employee accounts.
- View and manage employee attendance.
- Approve or reject employee leave and WFH requests.
- Access employee reports.

### Employee
- Check in and check out through the mobile app.
- Scan the office QR code for attendance.
- Apply for work from home and leave.
- View personal attendance history.

## Attendance Features

- Office start time: 9:00 AM IST.
- Check-in cutoff: 9:30 AM IST.
- Dynamic QR code refreshes every 18 seconds.
- WFH requires prior approval.
- Maximum five approved WFH employees per day.
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

```powershell
cd backend
npm install
npm test
npm start
```

API URL: `http://localhost:5000/api`

### 2. Admin Dashboard

Open a new terminal:

```powershell
cd admin-web
npm install
npm run dev
```

Dashboard URL: `http://localhost:5173`

### 3. Employee Mobile App

Open another terminal:

```powershell
cd employee-app
npm install
npx expo start
```

Follow the Expo instructions to run the application on your device or emulator.

## Environment Variables

Configure the required environment variables before starting the backend.

Keep passwords, JWT secrets, database credentials, and API keys private. Never commit real credentials to the repository.

## Project Status

VorldX is an ongoing full-stack project focused on employee attendance, workforce management, QR-based check-in, leave requests, and work-from-home approvals.