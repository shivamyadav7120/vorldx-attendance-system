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

const mainLinks = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/employees",
    label: "Employees",
    icon: Users,
  },
  {
    to: "/attendance",
    label: "Attendance",
    icon: CalendarCheck,
  },
  {
    to: "/approvals",
    label: "WFH & Leave",
    icon: ClipboardList,
  },
  {
    to: "/office-qr",
    label: "Office QR",
    icon: QrCode,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: ChartNoAxesCombined,
  },
];

export default function AdminLayout() {
  const { user, logout, isSuperAdmin } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const page = [
    ...mainLinks,
    { to: "/hr-admins", label: "HR Admins" },
    { to: "/audit-logs", label: "Audit Logs" },
    { to: "/organization", label: "Organization" },
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

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
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

        <div className="workspace-label">WORKSPACE</div>

        <nav className="side-nav">
          {mainLinks.map(({ to, label, icon: Icon }) => (
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

              {to === "/approvals" && (
                <b className="nav-dot" />
              )}
            </NavLink>
          ))}
        </nav>

        {isSuperAdmin && (
          <>
            <div className="workspace-label nav-section-label">
              ADMINISTRATION
            </div>

            <nav className="side-nav">
              <NavLink
                to="/hr-admins"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <UserCog size={18} />
                <span>HR Admins</span>
              </NavLink>

              <NavLink
                to="/audit-logs"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <ShieldAlert size={18} />
                <span>Audit Logs</span>
              </NavLink>

              <NavLink
                to="/organization"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <Building2 size={18} />
                <span>Organization</span>
              </NavLink>
            </nav>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <ShieldCheck size={18} />
            </div>

            <b>Workspace protected</b>
            <p>Your admin session is secured.</p>
          </div>

          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>

          <button
            className="nav-link logout-link"
            onClick={signOut}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>

          <div className="sidebar-version">
            VorldX Admin <span>v1.0</span>
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
            <strong>{page?.label || "Admin"}</strong>
          </div>

          <div className="topbar-actions">
            <div className="topbar-search">
              <Search size={16} />

              <input
                placeholder="Search workspace…"
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
              <Bell size={19} />
              <i />
            </button>

            <div className="user-chip">
              <div className="avatar">{initials}</div>

              <div className="user-chip-text">
                <b>{name}</b>

                <span>
                  {user?.role === "SUPER_ADMIN"
                    ? "Super Admin"
                    : "HR Admin"}
                </span>
              </div>

              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} VorldX</span>
          <span>Employee operations, made clearer.</span>
        </footer>
      </main>
    </div>
  );
}