import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  UserCog,
  UserX,
  UserCheck,
  Pencil,
  Search,
} from "lucide-react";
import api, { errorMessage } from "../services/api";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";

const arr = (d) =>
  Array.isArray(d) ? d : d?.admins || d?.users || d?.data || d?.items || [];

export default function HRAdmins() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    department: "Human Resources",
  });

  async function load() {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get("/hr-admins");
      setItems(arr(data));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((x) =>
        [x.name, x.email, x.department, x.employeeId, x.role].some((v) =>
          String(v || "").toLowerCase().includes(search.toLowerCase())
        )
      ),
    [items, search]
  );

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      department: "Human Resources",
    });
    setModal(true);
  }

  function openEdit(x) {
    setEditing(x);
    setForm({
      name: x.name || "",
      email: x.email || "",
      password: "",
      employeeId: x.employeeId || "",
      department: x.department || "Human Resources",
    });
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editing) {
        await api.put(`/hr-admins/${editing._id || editing.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
        });
        setNotice(`HR Admin ${form.name} updated successfully.`);
      } else {
        await api.post("/hr-admins", {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          employeeId: form.employeeId.trim(),
          department: form.department.trim(),
        });
        setNotice(`HR Admin ${form.name} created successfully.`);
      }
      setModal(false);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(x) {
    if (!confirm(`Deactivate access for HR Admin ${x.name || x.email}?`)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.patch(`/hr-admins/${x._id || x.id}/deactivate`);
      setNotice(`HR Admin ${x.name} deactivated.`);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function activate(x) {
    if (!confirm(`Reactivate access for HR Admin ${x.name || x.email}?`)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.patch(`/hr-admins/${x._id || x.id}/activate`);
      setNotice(`HR Admin ${x.name} reactivated.`);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACCESS MANAGEMENT</div>
          <h1>HR Admins</h1>
          <p>Create and manage HR administrator accounts. Super Admin access only.</p>
        </div>
        <button className="button button-primary" onClick={openCreate}>
          <Plus size={16} /> Add HR admin
        </button>
      </div>

      {notice && <div className="notice-banner notice-success">{notice}</div>}
      {error && <div className="notice-banner notice-error">{error}</div>}

      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search HR admin name or email…"
            />
          </div>

          <button
            className="button button-secondary"
            onClick={load}
            disabled={busy}
          >
            <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
          </button>

          <span className="record-count">{filtered.length} administrators</span>
        </div>

        {busy ? (
          <div className="panel-loading">
            <span className="loader-ring" />
          </div>
        ) : filtered.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Email</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => {
                  const isActive =
                    String(x.status || "Active").toLowerCase() === "active" &&
                    x.active !== false;

                  return (
                    <tr key={x._id || x.id || i}>
                      <td>
                        <div className="person-cell">
                          <div className="avatar avatar-small">
                            {String(x.name || "?")
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <b>{x.name || "HR Admin"}</b>
                        </div>
                      </td>
                      <td>{x.email || "—"}</td>
                      <td>{x.employeeId || "—"}</td>
                      <td>{x.department || "Human Resources"}</td>
                      <td>
                        <span className="type-tag">
                          <UserCog size={14} />
                          {x.role || "HR_ADMIN"}
                        </span>
                      </td>
                      <td>
                        <StatusPill status={isActive ? "Active" : "Inactive"} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            title="Edit HR admin"
                            onClick={() => openEdit(x)}
                          >
                            <Pencil size={16} />
                          </button>
                          {isActive ? (
                            <button
                              className="icon-button danger-icon"
                              title="Deactivate HR admin"
                              onClick={() => deactivate(x)}
                            >
                              <UserX size={16} />
                            </button>
                          ) : (
                            <button
                              className="icon-button"
                              style={{ color: "#34d399" }}
                              title="Reactivate HR admin"
                              onClick={() => activate(x)}
                            >
                              <UserCheck size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No HR admins found"
            message={
              search
                ? "Try a different search term."
                : "Create an HR administrator account to delegate employee operations."
            }
          />
        )}
      </section>

      {modal && (
        <Modal
          title={editing ? "Edit HR admin" : "Create HR admin"}
          subtitle="HR administrators have permissions to mark attendance, manage employees, and review requests."
          onClose={() => setModal(false)}
        >
          <form className="modal-form" onSubmit={save}>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Priyesh Patel"
                />
              </label>

              <label>
                Email address
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="hr@company.com"
                />
              </label>

              {!editing && (
                <>
                  <label>
                    Employee ID (optional)
                    <input
                      value={form.employeeId}
                      onChange={(e) =>
                        setForm({ ...form, employeeId: e.target.value })
                      }
                      placeholder="Auto-generated if blank"
                    />
                  </label>

                  <label>
                    Department
                    <input
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                      placeholder="Human Resources"
                    />
                  </label>

                  <label className="form-span">
                    Temporary password
                    <input
                      required
                      minLength={8}
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="At least 8 characters"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editing
                  ? "Save changes"
                  : "Create HR admin"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
