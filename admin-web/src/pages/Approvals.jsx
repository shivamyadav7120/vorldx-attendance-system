import { useEffect, useMemo, useState } from "react";
import {
  Check,
  X,
  RefreshCw,
  Search,
  ClipboardCheck,
  CalendarDays,
  Home,
  MessageSquare,
  Users,
  FileText,
  AlertTriangle,
  ExternalLink,
  Download,
  Eye,
  ShieldAlert,
} from "lucide-react";
import api, { errorMessage } from "../services/api";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

const arr = (d) => (Array.isArray(d) ? d : d?.requests || d?.data || []);

export default function Approvals() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [wfhAvailability, setWfhAvailability] = useState(null);

  const [decisionModal, setDecisionModal] = useState(null);
  const [comment, setComment] = useState("");
  const [deciding, setDeciding] = useState(false);

  const [viewDocModal, setViewDocModal] = useState(null);

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  async function load() {
    setBusy(true);
    setError("");
    try {
      const [wfhRes, leaveRes, availRes] = await Promise.allSettled([
        api.get("/wfh"),
        api.get("/leave"),
        api.get(`/wfh/availability?date=${todayStr}`),
      ]);

      const all = [];
      if (wfhRes.status === "fulfilled") {
        all.push(
          ...arr(wfhRes.value.data).map((x) => ({
            ...x,
            category: "WFH",
            isUrgent: x.wfhType === "URGENT",
            requestType:
              x.wfhType === "URGENT"
                ? "Urgent WFH (Emergency)"
                : "Standard WFH (Max 5d)",
          }))
        );
      }
      if (leaveRes.status === "fulfilled") {
        all.push(
          ...arr(leaveRes.value.data).map((x) => ({
            ...x,
            category: "LEAVE",
            isUrgent: false,
            requestType: x.leaveType ? `${x.leaveType} Leave` : "Leave",
          }))
        );
      }

      if (availRes.status === "fulfilled") {
        setWfhAvailability(availRes.value.data);
      }

      setItems(all);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function promptDecision(item, status) {
    setDecisionModal({ item, status });
    setComment("");
  }

  async function submitDecision(e) {
    e.preventDefault();
    if (!decisionModal) return;

    setDeciding(true);
    setError("");
    setNotice("");

    const { item, status } = decisionModal;
    const isLeave = item.category === "LEAVE";
    const endpoint = isLeave ? `/leave/${item._id}/status` : `/wfh/${item._id}/status`;

    try {
      await api.patch(endpoint, {
        status,
        decisionComment: comment,
      });

      setNotice(
        `${item.requestType} for ${item.employee?.name || "employee"} has been ${status.toLowerCase()}.`
      );
      setDecisionModal(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeciding(false);
    }
  }

  const filtered = useMemo(
    () =>
      items.filter(
        (x) =>
          (filter === "ALL" ||
            (filter === "URGENT"
              ? x.isUrgent
              : String(x.status || "PENDING").toUpperCase() === filter)) &&
          [
            x.employee?.name,
            x.employeeName,
            x.name,
            x.reason,
            x.urgencyReason,
            x.requestType,
            x.category,
            x.wfhType,
          ].some((v) => String(v || "").toLowerCase().includes(search.toLowerCase()))
      ),
    [items, filter, search]
  );

  const getDocumentFullUrl = (docPath) => {
    if (!docPath) return "";
    if (docPath.startsWith("http://") || docPath.startsWith("https://")) return docPath;
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const host = base.replace(/\/api\/?$/, "");
    return `${host}${docPath.startsWith("/") ? docPath : `/${docPath}`}`;
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">REQUESTS & VERIFICATION</div>
          <h1>WFH & Leave Approvals</h1>
          <p>
            Review 2 types of WFH (Standard max 5-day quota vs Urgent with verified document proof) & employee leaves.
          </p>
        </div>
        <button className="button button-secondary" onClick={load} disabled={busy}>
          <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
        </button>
      </div>

      {notice && <div className="notice-banner notice-success">{notice}</div>}
      {error && <div className="notice-banner notice-error">{error}</div>}

      {wfhAvailability && (
        <div
          className="wfh-quota-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            background: "linear-gradient(145deg, #131d32 0%, #0f1728 100%)",
            border: "1px solid #22344f",
            borderRadius: 14,
            marginBottom: 20,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "#182844",
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #29436d",
              }}
            >
              <Home size={20} />
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <b style={{ color: "#f8fafc", fontSize: 14.5 }}>Standard WFH Daily Capacity Quota</b>
                <span
                  style={{
                    background: "#162b47",
                    color: "#38bdf8",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Policy Rule: Max 5 Per Day
                </span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>
                Maximum {wfhAvailability.limit} standard employees per day. Urgent WFH with verified documentation can be prioritized.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                background: wfhAvailability.isFull ? "#38141f" : "#0e3328",
                color: wfhAvailability.isFull ? "#f43f5e" : "#34d399",
                border: `1px solid ${wfhAvailability.isFull ? "#e11d48" : "#10b981"}`,
              }}
            >
              {wfhAvailability.booked} / {wfhAvailability.limit} Booked Today
            </span>
            {wfhAvailability.isFull && (
              <small style={{ color: "#f43f5e", fontSize: 11, fontWeight: 600 }}>Limit Reached</small>
            )}
          </div>
        </div>
      )}

      <div className="filter-tabs">
        {[
          ["PENDING", "Pending"],
          ["URGENT", "🚨 Urgent Requests"],
          ["APPROVED", "Approved"],
          ["REJECTED", "Rejected"],
          ["ALL", "All Requests"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={filter === v ? "selected" : ""}
          >
            {l}
            <span>
              {v === "ALL"
                ? items.length
                : v === "URGENT"
                ? items.filter((x) => x.isUrgent).length
                : items.filter((x) => String(x.status || "PENDING").toUpperCase() === v).length}
            </span>
          </button>
        ))}
      </div>

      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, WFH type (Standard/Urgent), or reason…"
            />
          </div>
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
                  <th>WFH Type / Category</th>
                  <th>Dates</th>
                  <th>Reason & Details</th>
                  <th>Verified Document</th>
                  <th>Status</th>
                  <th>Decision Comment</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={x._id || x.id || i}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar avatar-small">
                          {String(x.employee?.name || x.name || "?")
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <b>{x.employee?.name || x.name || "Employee"}</b>
                          <small>{x.employee?.email || "—"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span className="type-tag">
                          {x.category === "WFH" ? <Home size={13} /> : <ClipboardCheck size={13} />}
                          {x.requestType}
                        </span>
                        {x.isUrgent ? (
                          <span className="urgent-priority-badge">
                            🚨 URGENT EMERGENCY
                          </span>
                        ) : x.category === "WFH" ? (
                          <span style={{ fontSize: 9.5, color: "#64748b" }}>Max 5 Days Limit</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="date-range">
                        <CalendarDays size={14} />
                        {x.startDate} {x.endDate && x.endDate !== x.startDate ? `➔ ${x.endDate}` : ""}
                      </span>
                    </td>
                    <td className="reason-cell">
                      <div>
                        <span>{x.reason || "—"}</span>
                        {x.urgencyReason && (
                          <div style={{ marginTop: 4, color: "#fca5a5", fontSize: 10 }}>
                            <b>Urgency:</b> {x.urgencyReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {x.documentUrl ? (
                        <button
                          type="button"
                          className="doc-pill-btn"
                          onClick={() => setViewDocModal(x)}
                          title="Click to inspect real uploaded document proof"
                        >
                          <FileText size={13} /> View Real Proof
                        </button>
                      ) : x.isUrgent ? (
                        <span style={{ color: "#fb7185", fontSize: 10, fontWeight: 600 }}>
                          Missing Document
                        </span>
                      ) : (
                        <span className="muted-small">Not required (Standard)</span>
                      )}
                    </td>
                    <td>
                      <StatusPill status={x.status || "PENDING"} />
                    </td>
                    <td>
                      {x.decisionComment ? (
                        <small style={{ color: "#94a3b8", fontStyle: "italic" }}>
                          "{x.decisionComment}"
                        </small>
                      ) : (
                        <span className="muted-small">—</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {String(x.status || "PENDING").toUpperCase() === "PENDING" ? (
                          <>
                            <button
                              className="decision-button approve"
                              onClick={() => promptDecision(x, "APPROVED")}
                              title="Approve request"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              className="decision-button reject"
                              onClick={() => promptDecision(x, "REJECTED")}
                              title="Reject request"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="muted-small">
                            {x.decidedBy?.name ? `By ${x.decidedBy.name}` : "Reviewed"}
                          </span>
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
            title="No matching requests found"
            message="Submitted Standard and Urgent WFH requests will appear here for review."
          />
        )}
      </section>

      {viewDocModal && (
        <Modal
          title="Document Verification Proof"
          subtitle={`Attached for ${viewDocModal.employee?.name || "Employee"}'s Urgent WFH Request`}
          onClose={() => setViewDocModal(null)}
          className="modal-wide"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: "#281219",
                border: "1px solid #e11d48",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <ShieldAlert size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <b style={{ color: "#fecdd3", fontSize: 13 }}>
                  Emergency / Medical Justification
                </b>
                <p style={{ color: "#fda4af", fontSize: 11.5, margin: "3px 0 0" }}>
                  {viewDocModal.urgencyReason || viewDocModal.reason || "Urgent remote work requirement."}
                </p>
                <div style={{ marginTop: 6, fontSize: 10.5, color: "#cbd5e1" }}>
                  Requested Dates: <b>{viewDocModal.startDate}</b> to <b>{viewDocModal.endDate}</b>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "#0f1626",
                border: "1px solid #22324a",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileText size={22} color="#38bdf8" />
                <div>
                  <b style={{ color: "#f8fafc", fontSize: 13 }}>
                    {viewDocModal.documentName || "Uploaded_Document_Proof.pdf"}
                  </b>
                  <p style={{ color: "#64748b", fontSize: 10.5, margin: 0 }}>
                    Type: {viewDocModal.documentType || "Verification Document"}
                  </p>
                </div>
              </div>
              <a
                href={getDocumentFullUrl(viewDocModal.documentUrl)}
                target="_blank"
                rel="noreferrer"
                className="button button-secondary"
                style={{ fontSize: 11, padding: "7px 12px" }}
              >
                <ExternalLink size={14} /> Open Full / Download
              </a>
            </div>

            <div
              style={{
                minHeight: 280,
                maxHeight: 460,
                overflowY: "auto",
                background: "#090d15",
                borderRadius: 12,
                border: "1px solid #1e2c44",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
              }}
            >
              {viewDocModal.documentType?.includes("image") ||
              /\.(png|jpe?g|webp|gif)$/i.test(viewDocModal.documentUrl) ? (
                <img
                  src={getDocumentFullUrl(viewDocModal.documentUrl)}
                  alt="Document Proof Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 420,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 30 }}>
                  <FileText size={48} color="#38bdf8" style={{ margin: "0 auto 12px" }} />
                  <b style={{ color: "#f1f5f9", display: "block", fontSize: 14 }}>
                    PDF / Binary Document Attached
                  </b>
                  <p style={{ color: "#94a3b8", fontSize: 12, maxWidth: 360, margin: "6px auto 16px" }}>
                    Official document verified on system storage. Click below to view in full tab or download.
                  </p>
                  <a
                    href={getDocumentFullUrl(viewDocModal.documentUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-primary"
                  >
                    <Download size={15} /> View / Download Document
                  </a>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setViewDocModal(null)}
              >
                Close Preview
              </button>
              {String(viewDocModal.status || "PENDING").toUpperCase() === "PENDING" && (
                <>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ color: "#fb7185", borderColor: "#5c2033" }}
                    onClick={() => {
                      const item = viewDocModal;
                      setViewDocModal(null);
                      promptDecision(item, "REJECTED");
                    }}
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => {
                      const item = viewDocModal;
                      setViewDocModal(null);
                      promptDecision(item, "APPROVED");
                    }}
                  >
                    <Check size={14} /> Approve Request
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {decisionModal && (
        <Modal
          title={`${decisionModal.status === "APPROVED" ? "Approve" : "Reject"} Request`}
          subtitle={`Reviewing ${decisionModal.item.requestType} for ${
            decisionModal.item.employee?.name || "Employee"
          }`}
          onClose={() => setDecisionModal(null)}
        >
          <form className="modal-form" onSubmit={submitDecision}>
            {decisionModal.item.isUrgent && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#351421",
                  border: "1px solid #e11d48",
                  color: "#fecdd3",
                  fontSize: 11.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>🚨 <b>Urgent Emergency Request</b> with Document Proof</span>
                {decisionModal.item.documentUrl && (
                  <button
                    type="button"
                    className="doc-pill-btn"
                    onClick={() => setViewDocModal(decisionModal.item)}
                  >
                    <Eye size={12} /> Inspect Proof
                  </button>
                )}
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <p style={{ color: "#e2e8f0", fontSize: 13, margin: "0 0 6px" }}>
                Date(s): <b>{decisionModal.item.startDate}</b> to{" "}
                <b>{decisionModal.item.endDate}</b>
              </p>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
                Reason: <em>"{decisionModal.item.reason || "None specified"}"</em>
              </p>
            </div>

            <label>
              Decision Comment / Note for Employee
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  decisionModal.status === "APPROVED"
                    ? "e.g. Approved. Medical document verified by coordinator."
                    : "e.g. Quota full or insufficient documentation provided."
                }
              />
            </label>

            {error && (
              <div
                className="notice-banner notice-error"
                style={{ marginBottom: 12 }}
              >
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setDecisionModal(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`button ${
                  decisionModal.status === "APPROVED"
                    ? "button-primary"
                    : "button-secondary"
                }`}
                style={
                  decisionModal.status === "REJECTED"
                    ? { color: "#fb7185", borderColor: "#5c2033" }
                    : {}
                }
                disabled={deciding}
              >
                {deciding
                  ? "Processing..."
                  : `Confirm ${
                      decisionModal.status === "APPROVED"
                        ? "Approval"
                        : "Rejection"
                    }`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
