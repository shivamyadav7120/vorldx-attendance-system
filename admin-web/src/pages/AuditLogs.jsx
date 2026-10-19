import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Search, Filter, History, User } from "lucide-react";
import api, { errorMessage } from "../services/api";
import EmptyState from "../components/EmptyState";
import StatusPill from "../components/StatusPill";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  async function load(currentPage = page, filter = actionFilter) {
    setBusy(true);
    setError("");
    try {
      const params = { page: currentPage, limit: 30 };
      if (filter) params.action = filter;

      const { data } = await api.get("/audit-logs", { params });
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load(page, actionFilter);
  }, [page, actionFilter]);

  const actionTypes = [
    { label: "All actions", value: "" },
    { label: "Attendance Corrected", value: "ATTENDANCE_CORRECTED" },
    { label: "Manual Attendance", value: "ATTENDANCE_MANUAL_MARK" },
    { label: "Employee Created", value: "EMPLOYEE_CREATED" },
    { label: "Employee Updated", value: "EMPLOYEE_UPDATED" },
    { label: "Employee Deactivated", value: "EMPLOYEE_DEACTIVATED" },
    { label: "HR Admin Created", value: "HR_ADMIN_CREATED" },
    { label: "WFH Approved", value: "WFH_APPROVED" },
    { label: "WFH Rejected", value: "WFH_REJECTED" },
    { label: "Leave Approved", value: "LEAVE_APPROVED" },
    { label: "Leave Rejected", value: "LEAVE_REJECTED" },
    { label: "Policy Updated", value: "POLICY_UPDATED" },
  ];

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SECURITY & GOVERNANCE</div>
          <h1>System Audit Logs</h1>
          <p>Traceable history of administrative decisions, manual attendance entries, and policy changes.</p>
        </div>
        <button
          className="button button-secondary"
          onClick={() => load(page, actionFilter)}
          disabled={busy}
        >
          <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="notice-banner notice-error">{error}</div>}

      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <label className="date-field">
            <Filter size={16} />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#eaf5ff",
                fontSize: 13,
                outline: "none",
              }}
            >
              {actionTypes.map((act) => (
                <option key={act.value} value={act.value} style={{ background: "#0a213a" }}>
                  {act.label}
                </option>
              ))}
            </select>
          </label>

          <span className="record-count">{pagination.total} audit events recorded</span>
        </div>

        {busy ? (
          <div className="panel-loading">
            <span className="loader-ring" />
          </div>
        ) : logs.length ? (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Target</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <small>{new Date(log.createdAt).toLocaleString("en-IN")}</small>
                      </td>
                      <td>
                        <span className="type-tag">
                          <b>{log.action}</b>
                        </span>
                      </td>
                      <td>
                        <div className="person-cell">
                          <div className="avatar avatar-small">
                            {String(log.actor?.name || log.actorEmail || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <b>{log.actor?.name || log.actorEmail || "System"}</b>
                            <small>{log.actorEmail}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusPill
                          status={log.actorRole === "SUPER_ADMIN" ? "Active" : "Neutral"}
                          label={log.actorRole || "ADMIN"}
                        />
                      </td>
                      <td>
                        <small>
                          {log.targetType} {log.targetId ? `(#${log.targetId.slice(-6)})` : ""}
                        </small>
                      </td>
                      <td>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 11,
                            maxHeight: 48,
                            overflow: "hidden",
                            color: "#8da9c4",
                            background: "rgba(0,0,0,0.15)",
                            padding: "4px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {JSON.stringify(log.details)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderTop: "1px solid #1a3c61",
                }}
              >
                <button
                  className="button button-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: "#8da9c4" }}>
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  className="button button-secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No audit logs found"
            message="Administrative activities such as manual corrections and status approvals will be tracked here."
          />
        )}
      </section>
    </div>
  );
}
