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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";

export default function Settings() {
  const { user, logout, isSuperAdmin } = useAuth();
  const [policy, setPolicy] = useState({
    officeStartTime: "09:00",
    checkInCutoffTime: "09:30",
    lateArrivalPolicy: "MARK_LATE",
    maxWfhPerDay: 5,
    qrExpirySeconds: 18,
    timezone: "Asia/Kolkata",
  });
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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
        setBusy(false);
      }
    }
    fetchPolicy();
  }, []);

  async function handleSavePolicy(e) {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      await api.put("/policies/attendance", policy);
      setNotice("Attendance policy updated successfully.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PREFERENCES & POLICIES</div>
          <h1>Settings</h1>
          <p>Manage workspace attendance rules, daily capacity limits, and administrator profile.</p>
        </div>
      </div>

      {notice && <div className="notice-banner notice-success">{notice}</div>}
      {error && <div className="notice-banner notice-error">{error}</div>}

      <div className="settings-layout">
        {/* ATTENDANCE POLICY SECTION */}
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

          <form onSubmit={handleSavePolicy} className="settings-fields">
            <div className="form-grid">
              <label>
                Office Check-in Start (HH:MM)
                <input
                  type="time"
                  disabled={!isSuperAdmin || busy}
                  value={policy.officeStartTime || "09:00"}
                  onChange={(e) => setPolicy({ ...policy, officeStartTime: e.target.value })}
                  required
                />
              </label>

              <label>
                Check-in Cutoff Time (HH:MM)
                <input
                  type="time"
                  disabled={!isSuperAdmin || busy}
                  value={policy.checkInCutoffTime || "09:30"}
                  onChange={(e) => setPolicy({ ...policy, checkInCutoffTime: e.target.value })}
                  required
                />
              </label>
            </div>

            <label>
              Policy for Arrivals After 9:30 AM Cutoff
              <select
                disabled={!isSuperAdmin || busy}
                value={policy.lateArrivalPolicy || "MARK_LATE"}
                onChange={(e) => setPolicy({ ...policy, lateArrivalPolicy: e.target.value })}
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
                  disabled={!isSuperAdmin || busy}
                  value={policy.maxWfhPerDay ?? 5}
                  onChange={(e) =>
                    setPolicy({ ...policy, maxWfhPerDay: parseInt(e.target.value, 10) || 5 })
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
                  disabled={!isSuperAdmin || busy}
                  value={policy.qrExpirySeconds ?? 18}
                  onChange={(e) =>
                    setPolicy({ ...policy, qrExpirySeconds: parseInt(e.target.value, 10) || 18 })
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
              <button className="button button-primary" disabled={saving || busy}>
                <Save size={16} /> {saving ? "Saving…" : "Save attendance policy"}
              </button>
            ) : (
              <div className="notice-banner">
                Only Super Administrators have permission to modify attendance policies.
              </div>
            )}
          </form>
        </section>

        {/* PROFILE & SESSION SECTION */}
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

          <div className="security-list" style={{ marginTop: 20 }}>
            <div>
              <span className="security-icon">
                <KeyRound size={18} />
              </span>
              <div>
                <b>Authenticated Session</b>
                <p>JWT token cryptographically signed by backend.</p>
              </div>
              <span className="status-pill success">
                <i /> Active
              </span>
            </div>

            <div>
              <span className="security-icon">
                <ShieldCheck size={18} />
              </span>
              <div>
                <b>Role Authorization</b>
                <p>Backend enforces permission boundaries on all APIs.</p>
              </div>
              <span className="status-pill success">
                <i /> Enforced
              </span>
            </div>
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
