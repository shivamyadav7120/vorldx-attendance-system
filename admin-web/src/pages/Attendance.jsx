import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Download,
  Search,
  Plus,
  Pencil,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";
import api, { errorMessage } from "../services/api";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const arr = (d) =>
  Array.isArray(d) ? d : d?.attendance || d?.records || d?.data || [];

export default function Attendance() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [date, setDate] = useState(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
      new Date()
    )
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  const [markModal, setMarkModal] = useState(false);
  const [correctModal, setCorrectModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [markForm, setMarkForm] = useState({
    employeeId: "",
    date: date,
    status: "PRESENT",
    mode: "OFFICE",
    notes: "",
  });

  const [correctForm, setCorrectForm] = useState({
    status: "PRESENT",
    mode: "OFFICE",
    checkIn: "",
    checkOut: "",
    reason: "",
  });

  async function load() {
    setBusy(true);
    setError("");
    try {
      const [attRes, empRes] = await Promise.allSettled([
        api.get("/attendance", { params: { date } }),
        api.get("/employees"),
      ]);

      if (attRes.status === "fulfilled") {
        setItems(arr(attRes.value.data));
      } else {
        setError(errorMessage(attRes.reason));
      }

      if (empRes.status === "fulfilled") {
        setEmployees(arr(empRes.value.data));
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [date]);

  const filtered = useMemo(
    () =>
      items.filter((x) => {
        const matchesSearch = [
          x.employee?.name,
          x.name,
          x.employee?.employeeId,
          x.employeeId,
          x.status,
          x.mode,
        ].some((v) =>
          String(v || "").toLowerCase().includes(search.toLowerCase())
        );

        const currentStatus = String(x.status || "PRESENT").toUpperCase();
        const matchesStatus =
          statusFilter === "ALL" || currentStatus === statusFilter;

        const currentMode = String(x.mode || "OFFICE").toUpperCase();
        const matchesMode =
          modeFilter === "ALL" || currentMode === modeFilter;

        return matchesSearch && matchesStatus && matchesMode;
      }),
    [items, search, statusFilter, modeFilter]
  );

  function openMarkModal() {
    setMarkForm((prev) => ({
      ...prev,
      date: date,
    }));
    setMarkModal(true);
  }

  async function handleMarkAttendance(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/attendance/manual", markForm);
      setMarkModal(false);
      setNotice("Attendance marked successfully");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openCorrection(record) {
    setCorrectModal(record);
    setCorrectForm({
      status: record.status || "PRESENT",
      mode: record.mode || "OFFICE",
      checkIn: record.checkIn
        ? new Date(record.checkIn).toISOString().slice(11, 16)
        : "",
      checkOut: record.checkOut
        ? new Date(record.checkOut).toISOString().slice(11, 16)
        : "",
      reason: "",
    });
  }

  async function handleCorrectAttendance(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        status: correctForm.status,
        mode: correctForm.mode,
        reason: correctForm.reason.trim(),
      };

      if (correctForm.checkIn) {
        payload.checkIn = new Date(
          `${correctModal.date}T${correctForm.checkIn}:00+05:30`
        ).toISOString();
      }

      if (correctForm.checkOut) {
        payload.checkOut = new Date(
          `${correctModal.date}T${correctForm.checkOut}:00+05:30`
        ).toISOString();
      }

      await api.patch(`/attendance/${correctModal._id}/correct`, payload);

      setCorrectModal(null);
      setNotice("Attendance corrected and logged in audit history");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const cols = [
      "Employee ID",
      "Employee Name",
      "Date",
      "Check-in",
      "Check-out",
      "Mode",
      "Status",
      "Method",
    ];
    const rows = filtered.map((x) => [
      `"${x.employee?.employeeId || x.employeeId || ""}"`,
      `"${x.employee?.name || x.name || "Employee"}"`,
      `"${x.date}"`,
      `"${x.checkIn ? new Date(x.checkIn).toLocaleTimeString("en-IN") : ""}"`,
      `"${x.checkOut ? new Date(x.checkOut).toLocaleTimeString("en-IN") : ""}"`,
      `"${x.mode || "OFFICE"}"`,
      `"${x.status || "PRESENT"}"`,
      `"${x.checkInMethod || ""}"`,
    ]);

    const csvContent = [cols.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    );
    a.download = `vorldx-attendance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">TIME & PRESENCE</div>
          <h1>Attendance</h1>
          <p>
            Review real-time attendance, mark records, and apply authorized
            corrections.
          </p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={exportCsv}>
            <Download size={16} /> Export CSV
          </button>
          <button className="button button-primary" onClick={openMarkModal}>
            <Plus size={16} /> Mark attendance
          </button>
        </div>
      </div>

      {notice && <div className="notice-banner notice-success">{notice}</div>}
      {error && <div className="notice-banner notice-error">{error}</div>}

      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <label className="date-field">
            <CalendarDays size={16} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="date-field" style={{ minWidth: 130 }}>
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
              <option value="PRESENT" style={{ background: "#0a213a" }}>
                Present
              </option>
              <option value="LATE" style={{ background: "#0a213a" }}>
                Late
              </option>
              <option value="HALF_DAY" style={{ background: "#0a213a" }}>
                Half Day
              </option>
              <option value="ABSENT" style={{ background: "#0a213a" }}>
                Absent
              </option>
            </select>
          </label>

          <label className="date-field" style={{ minWidth: 120 }}>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
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
                All Modes
              </option>
              <option value="OFFICE" style={{ background: "#0a213a" }}>
                Office
              </option>
              <option value="WFH" style={{ background: "#0a213a" }}>
                WFH
              </option>
            </select>
          </label>

          <div className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, ID, or status…"
            />
          </div>

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
                  <th>Date</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Work mode</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={x._id || x.id || i}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar avatar-small" style={{ overflow: "hidden" }}>
                          {x.employee?.avatar ? (
                            <img
                              src={x.employee.avatar.startsWith("http") ? x.employee.avatar : `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${x.employee.avatar.startsWith("/") ? x.employee.avatar : `/${x.employee.avatar}`}`}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            String(x.employee?.name || x.name || "?")
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          )}
                        </div>
                        <div>
                          <b>{x.employee?.name || x.name || "Employee"}</b>
                          <small>
                            {x.employee?.employeeId || x.employeeId || "—"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{x.date}</td>
                    <td>
                      {x.checkIn
                        ? new Date(x.checkIn).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td>
                      {x.checkOut
                        ? new Date(x.checkOut).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td>{x.mode || "OFFICE"}</td>
                    <td>
                      <StatusPill status={x.status || "PRESENT"} />
                    </td>
                    <td>
                      <span className="type-tag">
                        {x.checkInMethod || "QR"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          title="Correct attendance"
                          onClick={() => openCorrection(x)}
                        >
                          <Pencil size={15} />
                        </button>
                        {x.correctionHistory &&
                          x.correctionHistory.length > 0 && (
                            <button
                              className="icon-button"
                              title="View correction history"
                              onClick={() => setHistoryModal(x)}
                            >
                              <History size={15} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No attendance records"
            message={`No records found for ${date}. Mark attendance manually or adjust your filter.`}
          />
        )}
      </section>

      {markModal && (
        <Modal
          title="Mark attendance manually"
          subtitle="Record attendance for an employee directly."
          onClose={() => setMarkModal(false)}
        >
          <form className="modal-form" onSubmit={handleMarkAttendance}>
            <div className="form-grid">
              <label className="form-span">
                Employee
                <select
                  required
                  value={markForm.employeeId}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, employeeId: e.target.value })
                  }
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId}) — {emp.department}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Attendance date
                <input
                  type="date"
                  required
                  value={markForm.date}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, date: e.target.value })
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={markForm.status}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, status: e.target.value })
                  }
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF DAY</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </label>

              <label>
                Work mode
                <select
                  value={markForm.mode}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, mode: e.target.value })
                  }
                >
                  <option value="OFFICE">Office</option>
                  <option value="WFH">Work From Home</option>
                </select>
              </label>

              <label className="form-span">
                Notes / Justification
                <input
                  value={markForm.notes}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, notes: e.target.value })
                  }
                  placeholder="e.g. Approved manual marking due to on-site client visit"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setMarkModal(false)}
              >
                Cancel
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving ? "Saving..." : "Mark attendance"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {correctModal && (
        <Modal
          title="Correct attendance record"
          subtitle={`Modifying record for ${
            correctModal.employee?.name || "Employee"
          } on ${correctModal.date}`}
          onClose={() => setCorrectModal(null)}
        >
          <form className="modal-form" onSubmit={handleCorrectAttendance}>
            <div className="form-grid">
              <label>
                New status
                <select
                  value={correctForm.status}
                  onChange={(e) =>
                    setCorrectForm({ ...correctForm, status: e.target.value })
                  }
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF DAY</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </label>

              <label>
                Work mode
                <select
                  value={correctForm.mode}
                  onChange={(e) =>
                    setCorrectForm({ ...correctForm, mode: e.target.value })
                  }
                >
                  <option value="OFFICE">Office</option>
                  <option value="WFH">Work From Home</option>
                </select>
              </label>

              <label>
                Check-in time (HH:MM)
                <input
                  type="time"
                  value={correctForm.checkIn}
                  onChange={(e) =>
                    setCorrectForm({ ...correctForm, checkIn: e.target.value })
                  }
                />
              </label>

              <label>
                Check-out time (HH:MM)
                <input
                  type="time"
                  value={correctForm.checkOut}
                  onChange={(e) =>
                    setCorrectForm({
                      ...correctForm,
                      checkOut: e.target.value,
                    })
                  }
                />
              </label>

              <label className="form-span">
                Mandatory justification reason
                <input
                  required
                  value={correctForm.reason}
                  onChange={(e) =>
                    setCorrectForm({ ...correctForm, reason: e.target.value })
                  }
                  placeholder="Explain why this correction is being made (required for audit)"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setCorrectModal(null)}
              >
                Cancel
              </button>
              <button className="button button-primary" disabled={saving}>
                {saving ? "Saving..." : "Save correction"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {historyModal && (
        <Modal
          title="Attendance correction history"
          subtitle={`Audit trail for ${historyModal.employee?.name} on ${historyModal.date}`}
          onClose={() => setHistoryModal(null)}
        >
          <div className="history-list">
            {historyModal.correctionHistory?.map((h, idx) => (
              <div key={idx} className="history-card">
                <div className="history-header">
                  <b>Correction #{idx + 1}</b>
                  <small>
                    {new Date(h.correctedAt).toLocaleString("en-IN")}
                  </small>
                </div>
                <div className="history-details">
                  <p>
                    Status change: <code>{h.previousStatus || "—"}</code> ➔{" "}
                    <b>{h.newStatus}</b>
                  </p>
                  <p>
                    Justification reason: <em>"{h.reason}"</em>
                  </p>
                  {h.correctedBy && (
                    <p>
                      Corrected by: {h.correctedBy.name} ({h.correctedBy.email})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setHistoryModal(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
