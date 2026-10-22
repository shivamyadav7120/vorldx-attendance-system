import React, { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  QrCode,
  ChartNoAxesCombined,
  UserCog,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import Brand from "../components/Brand";

export default function AdminLayout() {
  const { user, logout, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const superAdminNav = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/hr-admins", label: "HR Admin Management", icon: UserCog },
    { to: "/employees", label: "Employee Management", icon: Users },
    { to: "/attendance", label: "Attendance Management", icon: CalendarCheck },
    { to: "/approvals", label: "WFH & Leave Requests", icon: ClipboardList, hasDot: true },
    { to: "/office-qr", label: "Office QR / Policy", icon: QrCode },
    { to: "/reports", label: "Reports & Analytics", icon: ChartNoAxesCombined },
    { to: "/audit-logs", label: "Audit Logs", icon: ShieldAlert },
    { to: "/organization", label: "Organization Settings", icon: Building2 },
  ];

  const hrAdminNav = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/employees", label: "Employee Management", icon: Users },
    { to: "/attendance", label: "Employee Attendance", icon: CalendarCheck },
    { to: "/approvals", label: "WFH & Leave Requests", icon: ClipboardList, hasDot: true },
    { to: "/reports", label: "Reports & Analytics", icon: ChartNoAxesCombined },
  ];

  const currentNav = isSuperAdmin ? superAdminNav : hrAdminNav;

  const page = [
    ...currentNav,
    { to: "/settings", label: "Settings" },
  ].find((item) => location.pathname === item.to);

  const name =
    user?.name ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "Administrator";

  const initials = name
    .split(/[ ._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function signOut() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">
          {isSuperAdmin ? "SUPER ADMIN CONSOLE" : "HR OPERATIONS"}
        </div>

        <nav className="side-nav">
          {currentNav.map(({ to, label, icon: Icon, hasDot }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {hasDot && <b className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <ShieldCheck size={18} />
            </div>
            <b>Enterprise Security</b>
            <p>Role-enforced API permissions and signed session tokens.</p>
          </div>

          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Settings size={18} />
            <span>Settings & Profile</span>
          </NavLink>

          <button className="nav-link logout-link" onClick={signOut}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>

          <div className="sidebar-version">
            VorldX Enterprise <span>v2.4</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{page?.label || "Console"}</strong>
          </div>

          <div className="topbar-actions">
            <div className="topbar-search">
              <Search size={16} />
              <input
                placeholder="Search employees or IDs…"
                onKeyDown={(event) => {
                  const query = event.currentTarget.value.trim();
                  if (event.key === "Enter" && query) {
                    navigate(
                      `/employees?search=${encodeURIComponent(query)}`
                    );
                  }
                }}
              />
            </div>

            <button
              className="icon-button notification-button"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <i />
            </button>

            <div className="user-chip">
              <div className="avatar avatar-small">{initials}</div>
              <div className="user-chip-text">
                <b>{name}</b>
                <span
                  className={`user-chip-role ${
                    isSuperAdmin ? "super-admin" : "hr-admin"
                  }`}
                >
                  {isSuperAdmin ? "SUPER ADMIN" : "HR ADMIN"}
                </span>
              </div>
              <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} VorldX Technologies. Enterprise Attendance System.</span>
          <span>Security Level: High · Encrypted Session</span>
        </footer>
      </main>
    </div>
  );
}
