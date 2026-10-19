
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Approvals from "./pages/Approvals";
import OfficeQR from "./pages/OfficeQR";
import Reports from "./pages/Reports";
import HRAdmins from "./pages/HRAdmins";
import Organization from "./pages/Organization";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";

function LandingRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="full-loader">
        <span className="loader-ring" />
        <p>Loading VorldX...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (user.role === "EMPLOYEE") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]} />
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/office-qr" element={<OfficeQR />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />

          <Route
            element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}
          >
            <Route path="/hr-admins" element={<HRAdmins />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/organization" element={<Organization />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<LandingRedirect />} />
    </Routes>
  );
}
