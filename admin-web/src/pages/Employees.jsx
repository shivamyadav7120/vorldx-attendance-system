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
} from "lucide-react";
import api, { errorMessage } from "../services/api";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";

const arr = (d) =>
  Array.isArray(d) ? d : d?.employees || d?.data || d?.items || [];

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
                        <div className="person-cell">
                          <div className="avatar avatar-small">
                            {String(x.name || x.fullName || "?")
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <b>{x.name || x.fullName || "—"}</b>
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
    </div>
  );
}
