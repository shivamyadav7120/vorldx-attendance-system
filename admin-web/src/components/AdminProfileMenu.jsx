import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Building2,
  QrCode,
  LogOut,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  KeyRound,
} from "lucide-react";

export default function AdminProfileMenu({
  isOpen,
  onClose,
  user,
  isSuperAdmin,
  onOpenQuickEdit,
  onSignOut,
}) {
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const email = user?.email || "admin@vorldx.enterprise";
  const roleName = isSuperAdmin ? "Super Administrator" : "HR Operations Admin";
  const designation = user?.designation || (isSuperAdmin ? "System Master Admin" : "HR Administrator");

  function handleNavigate(path) {
    onClose();
    navigate(path);
  }

  return (
    <div className="profile-dropdown-wrapper" ref={menuRef}>
      <div className="water-mirror-glow-accent" />
      <div className="profile-dropdown-container">
        <div className="profile-dropdown-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-ring">
              <div className="avatar avatar-large profile-avatar-inner" style={{ overflow: "hidden" }}>
                {user?.avatar ? (
                  <img
                    src={user.avatar.startsWith("http") ? user.avatar : `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`}`}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initials
                )}
              </div>
            </div>
            <span className="profile-status-dot" title="Active Session" />
          </div>

          <div className="profile-header-meta">
            <div className="profile-name-row">
              <h3 className="profile-user-name">{name}</h3>
              <span className="profile-verified-badge" title="Authenticated Token">
                <CheckCircle2 size={13} />
              </span>
            </div>
            <p className="profile-user-email">{email}</p>
            <div className="profile-badge-row">
              <span
                className={`profile-role-badge ${
                  isSuperAdmin ? "role-super-admin" : "role-hr-admin"
                }`}
              >
                <Sparkles size={11} />
                {roleName}
              </span>
              <span className="profile-id-badge">
                ID: {user?.id ? String(user.id).slice(-6).toUpperCase() : "VX-900"}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-security-strip">
          <div className="security-strip-item">
            <span className="security-strip-label">Role Level</span>
            <span className="security-strip-val">
              {isSuperAdmin ? "Tier-1 Root" : "Tier-2 HR"}
            </span>
          </div>
          <div className="security-strip-divider" />
          <div className="security-strip-item">
            <span className="security-strip-label">Encryption</span>
            <span className="security-strip-val security-secure">TLS / 256-Bit</span>
          </div>
          <div className="security-strip-divider" />
          <div className="security-strip-item">
            <span className="security-strip-label">Designation</span>
            <span className="security-strip-val" title={designation}>
              {designation.length > 12 ? designation.slice(0, 10) + "…" : designation}
            </span>
          </div>
        </div>

        <div className="profile-dropdown-nav">
          <div className="profile-nav-section-title">ADMIN MANAGEMENT</div>

          <button
            className="profile-nav-btn"
            onClick={() => {
              onClose();
              if (onOpenQuickEdit) onOpenQuickEdit();
            }}
          >
            <span className="profile-nav-icon">
              <Edit3 size={16} />
            </span>
            <div className="profile-nav-text">
              <strong>Quick Edit Profile</strong>
              <small>Update display name, phone & designation</small>
            </div>
          </button>

          <button
            className="profile-nav-btn"
            onClick={() => handleNavigate("/settings")}
          >
            <span className="profile-nav-icon">
              <Settings size={16} />
            </span>
            <div className="profile-nav-text">
              <strong>Account & Profile Settings</strong>
              <small>Password, security & attendance policies</small>
            </div>
          </button>

          {isSuperAdmin && (
            <>
              <button
                className="profile-nav-btn"
                onClick={() => handleNavigate("/audit-logs")}
              >
                <span className="profile-nav-icon">
                  <ShieldAlert size={16} />
                </span>
                <div className="profile-nav-text">
                  <strong>Security & Audit Logs</strong>
                  <small>Review system access, events & IP activity</small>
                </div>
              </button>

              <button
                className="profile-nav-btn"
                onClick={() => handleNavigate("/organization")}
              >
                <span className="profile-nav-icon">
                  <Building2 size={16} />
                </span>
                <div className="profile-nav-text">
                  <strong>Organization Settings</strong>
                  <small>Departments, branches, shifts & policies</small>
                </div>
              </button>

              <button
                className="profile-nav-btn"
                onClick={() => handleNavigate("/office-qr")}
              >
                <span className="profile-nav-icon">
                  <QrCode size={16} />
                </span>
                <div className="profile-nav-text">
                  <strong>Office QR & Geofence</strong>
                  <small>Manage office check-in dynamic codes</small>
                </div>
              </button>
            </>
          )}
        </div>

        <div className="profile-dropdown-footer">
          <button
            className="profile-signout-btn"
            onClick={() => {
              onClose();
              onSignOut();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
