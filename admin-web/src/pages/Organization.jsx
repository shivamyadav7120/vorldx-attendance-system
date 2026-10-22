import { useEffect, useState } from "react";
import {
  Building2,
  Save,
  RefreshCw,
  MapPin,
  Clock3,
  Mail,
  Phone,
  ShieldAlert,
} from "lucide-react";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Organization() {
  const { isSuperAdmin } = useAuth();
  const [form, setForm] = useState({
    name: "VorldX",
    email: "",
    phone: "",
    address: "",
    timezone: "Asia/Kolkata",
    officeStart: "09:30",
    officeEnd: "18:30",
  });
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get("/organization");
      const org = data.organization || data.data || data;
      if (org) {
        setForm({
          name: org.name || "VorldX",
          email: org.email || "",
          phone: org.phone || "",
          address: org.address || "",
          timezone: org.timezone || "Asia/Kolkata",
          officeStart: org.officeStart || "09:30",
          officeEnd: org.officeEnd || "18:30",
        });
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    if (!isSuperAdmin) {
      setError("Only Super Administrators can update organization settings.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        timezone: form.timezone.trim(),
        officeStart: form.officeStart,
        officeEnd: form.officeEnd,
      };

      await api.put("/organization", payload);
      setMessage("Organization details and schedule updated successfully.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">COMPANY PROFILE</div>
          <h1>Organization</h1>
          <p>Configure company profile details, contact information, and standard office hours.</p>
        </div>
        <button
          className="button button-secondary"
          onClick={load}
          disabled={busy}
        >
          <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="notice-banner notice-error">{error}</div>}
      {message && <div className="notice-banner notice-success">{message}</div>}

      <form onSubmit={save} className="settings-layout">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Organization details</h2>
              <p>These details describe your workspace across communications.</p>
            </div>
            <span className="panel-icon">
              <Building2 size={18} />
            </span>
          </div>

          {busy ? (
            <div className="panel-loading">
              <span className="loader-ring" />
            </div>
          ) : (
            <div className="settings-fields">
              <label>
                Organization name
                <input
                  value={form.name || ""}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  maxLength={150}
                  required
                  disabled={!isSuperAdmin}
                  placeholder="e.g. VorldX Technologies"
                />
              </label>

              <label>
                Official contact email
                <span className="input-icon-wrap">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    maxLength={254}
                    disabled={!isSuperAdmin}
                    placeholder="contact@company.com"
                  />
                </span>
              </label>

              <label>
                Contact phone number
                <span className="input-icon-wrap">
                  <Phone size={16} />
                  <input
                    value={form.phone || ""}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    maxLength={30}
                    disabled={!isSuperAdmin}
                    placeholder="+91 9876543210"
                  />
                </span>
              </label>

              <label>
                Headquarters office address
                <span className="input-icon-wrap">
                  <MapPin size={16} />
                  <input
                    value={form.address || ""}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    maxLength={300}
                    disabled={!isSuperAdmin}
                    placeholder="Tower A, Cyber City, Gurugram, India"
                  />
                </span>
              </label>
            </div>
          )}
        </section>

        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Office schedule & timezone</h2>
              <p>Default operational hours for office check-ins.</p>
            </div>
            <span className="panel-icon">
              <Clock3 size={18} />
            </span>
          </div>

          <div className="settings-fields">
            <label>
              Timezone
              <select
                value={form.timezone || "Asia/Kolkata"}
                onChange={(e) =>
                  setForm({ ...form, timezone: e.target.value })
                }
                disabled={!isSuperAdmin}
              >
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">US Eastern Time (EST/EDT)</option>
                <option value="Europe/London">UK Time (GMT/BST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
              </select>
            </label>

            <div className="form-grid">
              <label>
                Standard office start
                <input
                  type="time"
                  value={form.officeStart || "09:30"}
                  onChange={(e) =>
                    setForm({ ...form, officeStart: e.target.value })
                  }
                  required
                  disabled={!isSuperAdmin}
                />
              </label>

              <label>
                Standard office end
                <input
                  type="time"
                  value={form.officeEnd || "18:30"}
                  onChange={(e) =>
                    setForm({ ...form, officeEnd: e.target.value })
                  }
                  required
                  disabled={!isSuperAdmin}
                />
              </label>
            </div>

            {isSuperAdmin ? (
              <button
                className="button button-primary"
                disabled={saving || busy}
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save organization profile"}
              </button>
            ) : (
              <div className="notice-banner">
                <ShieldAlert size={16} />
                <span>
                  Super Admin role is required to modify organization settings.
                </span>
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
