import { useEffect, useState } from "react";
import {
  ShieldCheck,
  UserRound,
  KeyRound,
  LogOut,
  Save,
  Sliders,
  Clock,
  Home,
  QrCode,
  CheckCircle,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage, USER_KEY, TOKEN_KEY } from "../services/api";

export default function Settings() {
  const { user, logout, isSuperAdmin } = useAuth();

  const [policy, setPolicy] = useState({
    officeStartTime: "09:00",
    checkInCutoffTime: "09:30",
    officeEndTime: "18:00",
    lateArrivalPolicy: "MARK_LATE",
    maxWfhPerDay: 5,
    qrExpirySeconds: 18,
    timezone: "Asia/Kolkata",
  });
  const [busyPolicy, setBusyPolicy] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyNotice, setPolicyNotice] = useState("");
  const [policyError, setPolicyError] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    designation: user?.designation || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const { data } = await api.get("/policies/attendance");
        if (data.policy) {
          setPolicy(data.policy);
        }
      } catch (e) {
        console.error("Failed to fetch policy:", e);
      } finally {
        setBusyPolicy(false);
      }
    }
    fetchPolicy();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        designation: user.designation || "",
      });
    }
  }, [user]);

  async function handleSavePolicy(e) {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setSavingPolicy(true);
    setPolicyNotice("");
    setPolicyError("");

    try {
      await api.put("/policies/attendance", policy);
      setPolicyNotice("Attendance policy updated successfully.");
    } catch (err) {
      setPolicyError(errorMessage(err));
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice("");
    setProfileError("");

    try {
      const { data } = await api.patch("/auth/profile", {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        designation: profileForm.designation.trim(),
      });

      if (data.user) {
        const updatedUser = { ...user, ...data.user };
        const store = localStorage.getItem(TOKEN_KEY)
          ? localStorage
          : sessionStorage;
        store.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      setProfileNotice("Profile updated successfully.");
    } catch (err) {
      setProfileError(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordNotice("");
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);

    try {
      await api.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordNotice("Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PREFERENCES & POLICIES</div>
          <h1>Settings</h1>
          <p>
            Manage workspace attendance rules, daily capacity limits, and administrator profile.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Attendance & Cutoff Rules</h2>
              <p>Configure office check-in window and late arrival rules.</p>
            </div>
            <span className="panel-icon">
              <Sliders size={18} />
            </span>
          </div>

          {policyNotice && (
            <div className="notice-banner notice-success">{policyNotice}</div>
          )}
          {policyError && (
            <div className="notice-banner notice-error">{policyError}</div>
          )}

          <form onSubmit={handleSavePolicy} className="settings-fields">
            <div className="form-grid">
              <label>
                Office Check-in Start (HH:MM)
                <input
                  type="time"
                  disabled={!isSuperAdmin || busyPolicy}
                  value={policy.officeStartTime || "09:00"}
                  onChange={(e) =>
                    setPolicy({ ...policy, officeStartTime: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Check-in Cutoff Time (HH:MM)
                <input
                  type="time"
                  disabled={!isSuperAdmin || busyPolicy}
                  value={policy.checkInCutoffTime || "09:30"}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      checkInCutoffTime: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Office Closing / Last Hour (HH:MM)
                <input
                  type="time"
                  disabled={!isSuperAdmin || busyPolicy}
                  value={policy.officeEndTime || "18:00"}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      officeEndTime: e.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>

            <label>
              Policy for Arrivals After Cutoff Time
              <select
                disabled={!isSuperAdmin || busyPolicy}
                value={policy.lateArrivalPolicy || "MARK_LATE"}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    lateArrivalPolicy: e.target.value,
                  })
                }
              >
                <option value="MARK_LATE">Mark as LATE (Grace arrival)</option>
                <option value="MARK_ABSENT">Mark as ABSENT</option>
                <option value="MARK_HALF_DAY">Mark as HALF DAY</option>
              </select>
            </label>

            <div className="form-grid">
              <label>
                Max Approved WFH Employees Per Day
                <input
                  type="number"
                  min="1"
                  max="50"
                  disabled={!isSuperAdmin || busyPolicy}
                  value={policy.maxWfhPerDay ?? 5}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      maxWfhPerDay: parseInt(e.target.value, 10) || 5,
                    })
                  }
                  required
                />
              </label>

              <label>
                QR Code Token Validity (seconds)
                <input
                  type="number"
                  min="5"
                  max="120"
                  disabled={!isSuperAdmin || busyPolicy}
                  value={policy.qrExpirySeconds ?? 18}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      qrExpirySeconds: parseInt(e.target.value, 10) || 18,
                    })
                  }
                  required
                />
              </label>
            </div>

            <label>
              System Timezone
              <input
                disabled
                value={policy.timezone || "Asia/Kolkata"}
                readOnly
              />
            </label>

            {isSuperAdmin ? (
              <button
                className="button button-primary"
                disabled={savingPolicy || busyPolicy}
              >
                <Save size={16} />{" "}
                {savingPolicy ? "Saving…" : "Save attendance policy"}
              </button>
            ) : (
              <div className="notice-banner">
                Only Super Administrators have permission to modify attendance policies.
              </div>
            )}
          </form>
        </section>

        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Administrator Profile</h2>
              <p>Your current session and credentials.</p>
            </div>
            <span className="panel-icon">
              <UserRound size={18} />
            </span>
          </div>

          <div className="profile-card">
            <div className="avatar avatar-large">
              {String(user?.name || user?.email || "V")
                .split(/[ @._-]/)
                .filter(Boolean)
                .slice(0, 2)
                .map((x) => x[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <h3>{user?.name || "Administrator"}</h3>
              <p>{user?.email || "—"}</p>
              <span className="role-tag">{user?.role || "ADMIN"}</span>
            </div>
          </div>

          {profileNotice && (
            <div className="notice-banner notice-success">{profileNotice}</div>
          )}
          {profileError && (
            <div className="notice-banner notice-error">{profileError}</div>
          )}

          <form onSubmit={handleUpdateProfile} className="settings-fields" style={{ marginTop: 18 }}>
            <label>
              Display Name
              <input
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                required
                placeholder="Full Name"
              />
            </label>

            <div className="form-grid">
              <label>
                Contact Phone
                <input
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                />
              </label>
              <label>
                Designation
                <input
                  value={profileForm.designation}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, designation: e.target.value })
                  }
                  placeholder="HR Lead / Operations Admin"
                />
              </label>
            </div>

            <button className="button button-secondary" disabled={savingProfile}>
              <Save size={15} /> {savingProfile ? "Updating…" : "Update Profile"}
            </button>
          </form>

          <div style={{ marginTop: 24, borderTop: "1px solid #1a3c61", paddingTop: 18 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={16} color="#38bdf8" /> Change Password
            </h3>

            {passwordNotice && (
              <div className="notice-banner notice-success">{passwordNotice}</div>
            )}
            {passwordError && (
              <div className="notice-banner notice-error">{passwordError}</div>
            )}

            <form onSubmit={handleChangePassword} className="settings-fields">
              <label>
                Current Password
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                />
              </label>

              <div className="form-grid">
                <label>
                  New Password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Min 8 characters"
                  />
                </label>

                <label>
                  Confirm New Password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Re-enter new password"
                  />
                </label>
              </div>

              <button className="button button-secondary" disabled={savingPassword}>
                <KeyRound size={15} /> {savingPassword ? "Changing…" : "Change Password"}
              </button>
            </form>
          </div>

          <button
            className="button button-secondary"
            style={{ marginTop: 24 }}
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            <LogOut size={16} /> Sign out of this session
          </button>
        </section>
      </div>
    </div>
  );
}
