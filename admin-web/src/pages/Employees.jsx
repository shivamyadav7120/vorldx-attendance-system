import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Download,
  Pencil,
  UserRound,
  UserX,
  UserCheck,
  Filter,
  Eye,
  Camera,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Shield,
  FileText,
} from "lucide-react";
import api, { errorMessage } from "../services/api";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";

const arr = (d) =>
  Array.isArray(d) ? d : d?.employees || d?.data || d?.items || [];

const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const host = base.replace(/\/api\/?$/, "");
  return `${host}${url.startsWith("/") ? url : `/${url}`}`;
};

const initial = {
  name: "",
  email: "",
  employeeId: "",
  department: "",
  designation: "",
  phone: "",
  password: "",
  role: "EMPLOYEE",
};

export default function Employees() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState(
    new URLSearchParams(window.location.search).get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [viewEmployeeModal, setViewEmployeeModal] = useState(null);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get("/employees");
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

  const departments = useMemo(() => {
    const set = new Set();
    items.forEach((x) => {
      if (x.department) set.add(x.department);
    });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((x) => {
        const matchesSearch = [
          x.name,
          x.fullName,
          x.email,
          x.employeeId,
          x.department,
          x.designation,
          x.phone,
        ].some((v) =>
          String(v || "").toLowerCase().includes(search.toLowerCase())
        );

        const currentStatus = String(x.status || "Active").toLowerCase();
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && currentStatus === "active") ||
          (statusFilter === "INACTIVE" && currentStatus === "inactive");

        const matchesDepartment =
          departmentFilter === "ALL" || x.department === departmentFilter;

        return matchesSearch && matchesStatus && matchesDepartment;
      }),
    [items, search, statusFilter, departmentFilter]
  );

  function openCreate() {
    setEditing(null);
    setForm(initial);
    setModal(true);
  }

  function openEdit(x) {
    setEditing(x);
    setForm({
      ...initial,
      ...x,
      password: "",
      name: x.name || x.fullName || "",
      designation: x.designation || "",
      phone: x.phone || "",
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
        await api.patch(`/employees/${editing._id || editing.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department.trim(),
          designation: form.designation.trim(),
          phone: form.phone.trim(),
        });
        setNotice(`Employee ${form.name} updated successfully.`);
      } else {
        await api.post("/employees", {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          employeeId: form.employeeId.trim(),
          department: form.department.trim(),
          designation: form.designation.trim(),
          phone: form.phone.trim(),
        });
        setNotice(`Employee ${form.name} created successfully.`);
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
    if (!confirm(`Deactivate ${x.name || x.fullName || "this employee"}?`)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.patch(`/employees/${x._id || x.id}/deactivate`);
      setNotice(
        `Employee ${x.name || "account"} has been deactivated.`
      );
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function activate(x) {
    if (!confirm(`Reactivate ${x.name || x.fullName || "this employee"}?`)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.patch(`/employees/${x._id || x.id}/activate`);
      setNotice(
        `Employee ${x.name || "account"} has been reactivated.`
      );
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function exportCsv() {
    const cols = [
      "employeeId",
      "name",
      "email",
      "department",
      "designation",
      "phone",
      "status",
    ];
    const rows = filtered.map((x) =>
      cols
        .map((c) => `"${String(x[c] ?? "").replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[cols.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vorldx-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PEOPLE DIRECTORY</div>
          <h1>Employees</h1>
          <p>Manage employee profiles, departments, credentials and access status.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={exportCsv}>
            <Download size={16} /> Export CSV
          </button>
          <button className="button button-primary" onClick={openCreate}>
            <Plus size={17} /> Add employee
          </button>
        </div>
      </div>

      {notice && <div className="notice-banner notice-success">{notice}</div>}
      {error && <div className="notice-banner notice-error">{error}</div>}

      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, email or department…"
            />
          </div>

          <label className="date-field" style={{ minWidth: 140 }}>
            <Filter size={15} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#eaf5ff",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL" style={{ background: "#0a213a" }}>
                All Status
              </option>
              <option value="ACTIVE" style={{ background: "#0a213a" }}>
                Active only
              </option>
              <option value="INACTIVE" style={{ background: "#0a213a" }}>
                Inactive only
              </option>
            </select>
          </label>

          {departments.length > 0 && (
            <label className="date-field" style={{ minWidth: 150 }}>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#eaf5ff",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL" style={{ background: "#0a213a" }}>
                  All Departments
                </option>
                {departments.map((dept) => (
                  <option
                    key={dept}
                    value={dept}
                    style={{ background: "#0a213a" }}
                  >
                    {dept}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            className="button button-secondary"
            onClick={load}
            disabled={busy}
          >
            <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
          </button>
          <span className="record-count">{filtered.length} records</span>
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
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => {
                  const isActive =
                    String(x.status || "Active").toLowerCase() === "active";
                  return (
                    <tr key={x._id || x.id || i}>
                      <td>
                        <div
                          className="person-cell"
                          style={{ cursor: "pointer" }}
                          onClick={() => setViewEmployeeModal(x)}
                          title="Click to view full employee profile and photo"
                        >
                          <div
                            className="avatar avatar-small"
                            style={{
                              overflow: "hidden",
                              boxShadow: x.avatar ? "0 0 10px rgba(0, 240, 255, 0.3)" : "none",
                              border: x.avatar ? "1.5px solid #00f0ff" : "none",
                            }}
                          >
                            {x.avatar ? (
                              <img
                                src={getMediaUrl(x.avatar)}
                                alt={x.name || "Employee"}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              String(x.name || x.fullName || "?")
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            )}
                          </div>
                          <div>
                            <b style={{ color: "#f8fafc" }}>{x.name || x.fullName || "—"}</b>
                            <small>{x.email || "—"}</small>
                          </div>
                        </div>
                      </td>
                      <td>{x.employeeId || x.empId || "—"}</td>
                      <td>{x.department || "—"}</td>
                      <td>{x.designation || "—"}</td>
                      <td>{x.phone || "—"}</td>
                      <td>
                        <StatusPill status={x.status || "Active"} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            title="View employee profile & photo"
                            onClick={() => setViewEmployeeModal(x)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="icon-button"
                            title="Edit employee"
                            onClick={() => openEdit(x)}
                          >
                            <Pencil size={16} />
                          </button>
                          {isActive ? (
                            <button
                              className="icon-button danger-icon"
                              title="Deactivate employee"
                              onClick={() => deactivate(x)}
                            >
                              <UserX size={16} />
                            </button>
                          ) : (
                            <button
                              className="icon-button"
                              style={{ color: "#34d399" }}
                              title="Reactivate employee"
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
            title="No employees found"
            message={
              search || statusFilter !== "ALL" || departmentFilter !== "ALL"
                ? "Try adjusting your filters or search term."
                : "Add your first employee to populate the directory."
            }
          />
        )}
      </section>

      {modal && (
        <Modal
          title={editing ? "Edit employee" : "Add employee"}
          subtitle="Enter the employee's details below."
          onClose={() => setModal(false)}
        >
          <form className="modal-form" onSubmit={save}>
            {editing && editing.avatar && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#0a1222",
                  border: "1px solid rgba(0, 240, 255, 0.25)",
                  marginBottom: 12,
                }}
              >
                <img
                  src={getMediaUrl(editing.avatar)}
                  alt={editing.name || "Employee"}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    objectFit: "cover",
                    border: "1.5px solid #00f0ff",
                  }}
                />
                <div>
                  <b style={{ color: "#f8fafc", fontSize: 13 }}>Current Profile Photo</b>
                  <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>
                    Uploaded by employee via mobile app
                  </p>
                </div>
              </div>
            )}
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  value={form.name || ""}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Aanya Sharma"
                />
              </label>
              <label>
                Work email
                <input
                  required
                  type="email"
                  value={form.email || ""}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="name@company.com"
                />
              </label>
              <label>
                Employee ID
                <input
                  required={!editing}
                  disabled={!!editing}
                  value={form.employeeId || ""}
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
                  placeholder="VX-1001 (auto if empty)"
                />
              </label>
              <label>
                Department
                <input
                  required
                  value={form.department || ""}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  placeholder="Engineering"
                />
              </label>
              <label>
                Designation
                <input
                  value={form.designation || ""}
                  onChange={(e) =>
                    setForm({ ...form, designation: e.target.value })
                  }
                  placeholder="Software Engineer"
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone || ""}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                />
              </label>
              {!editing && (
                <label className="form-span">
                  Temporary password
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={form.password || ""}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="At least 8 characters"
                  />
                </label>
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
                  : "Create employee"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {viewEmployeeModal && (
        <Modal
          title="Employee Profile & Verification"
          subtitle={`Detailed records for ${viewEmployeeModal.name || "Employee"}`}
          onClose={() => setViewEmployeeModal(null)}
          className="modal-wide"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "18px 22px",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(4, 9, 21, 0.7) 100%)",
                border: "1px solid rgba(0, 240, 255, 0.3)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  background: "#081326",
                  border: "2.5px solid #00f0ff",
                  boxShadow: "0 0 20px rgba(0, 240, 255, 0.35)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {viewEmployeeModal.avatar ? (
                  <img
                    src={getMediaUrl(viewEmployeeModal.avatar)}
                    alt={viewEmployeeModal.name || "Employee"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#ffffff" }}>
                    {String(viewEmployeeModal.name || "?")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                    {viewEmployeeModal.name || "Employee"}
                  </h2>
                  <StatusPill status={viewEmployeeModal.status || "Active"} />
                </div>
                <p style={{ color: "#38bdf8", fontSize: 13, fontWeight: 600, margin: "4px 0" }}>
                  {viewEmployeeModal.designation || "Team Member"} · {viewEmployeeModal.department || "Operations"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid #1e3357",
                      padding: "3px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      color: "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    ID: {viewEmployeeModal.employeeId || "—"}
                  </span>
                  {viewEmployeeModal.avatar && (
                    <a
                      href={getMediaUrl(viewEmployeeModal.avatar)}
                      target="_blank"
                      rel="noreferrer"
                      className="button button-secondary"
                      style={{ fontSize: 11, padding: "4px 10px", height: "auto" }}
                    >
                      <ExternalLink size={12} /> View Full Photo
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <div style={{ padding: 14, borderRadius: 10, background: "#0a1222", border: "1px solid #1a2942" }}>
                <small style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Work Email
                </small>
                <p style={{ color: "#f8fafc", fontSize: 13, margin: "4px 0 0", wordBreak: "break-all" }}>
                  {viewEmployeeModal.email || "—"}
                </p>
              </div>

              <div style={{ padding: 14, borderRadius: 10, background: "#0a1222", border: "1px solid #1a2942" }}>
                <small style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Contact Phone
                </small>
                <p style={{ color: "#f8fafc", fontSize: 13, margin: "4px 0 0" }}>
                  {viewEmployeeModal.phone || "—"}
                </p>
              </div>

              <div style={{ padding: 14, borderRadius: 10, background: "#0a1222", border: "1px solid #1a2942" }}>
                <small style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Department
                </small>
                <p style={{ color: "#f8fafc", fontSize: 13, margin: "4px 0 0" }}>
                  {viewEmployeeModal.department || "—"}
                </p>
              </div>

              <div style={{ padding: 14, borderRadius: 10, background: "#0a1222", border: "1px solid #1a2942" }}>
                <small style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Emergency Contact
                </small>
                <p style={{ color: "#f8fafc", fontSize: 13, margin: "4px 0 0" }}>
                  {viewEmployeeModal.emergencyContact || "—"}
                </p>
              </div>
            </div>

            {viewEmployeeModal.address && (
              <div style={{ padding: 14, borderRadius: 10, background: "#0a1222", border: "1px solid #1a2942" }}>
                <small style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Residential Address
                </small>
                <p style={{ color: "#f8fafc", fontSize: 13, margin: "4px 0 0" }}>
                  {viewEmployeeModal.address}
                </p>
              </div>
            )}

            {viewEmployeeModal.bio && (
              <div style={{ padding: 14, borderRadius: 10, background: "#0a1222", border: "1px solid #1a2942" }}>
                <small style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Professional Bio
                </small>
                <p style={{ color: "#cbd5e1", fontSize: 12.5, margin: "4px 0 0", fontStyle: "italic" }}>
                  "{viewEmployeeModal.bio}"
                </p>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setViewEmployeeModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  const emp = viewEmployeeModal;
                  setViewEmployeeModal(null);
                  openEdit(emp);
                }}
              >
                <Pencil size={14} /> Edit Employee
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
