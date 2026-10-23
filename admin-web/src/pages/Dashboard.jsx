import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  Plus,
  RefreshCw,
  CalendarDays,
  Activity,
  UserCog,
  Home,
  ShieldCheck,
  QrCode,
  FileBarChart,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "../components/StatCard";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";

const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const host = base.replace(/\/api\/?$/, "");
  return `${host}${url.startsWith("/") ? url : `/${url}`}`;
};

const istDate = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

const pickArray = (d) =>
  Array.isArray(d)
    ? d
    : d?.employees ||
      d?.attendance ||
      d?.requests ||
      d?.data ||
      d?.records ||
      d?.items ||
      d?.logs ||
      [];

export default function Dashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [trend, setTrend] = useState([]);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");

  const today = istDate();

  async function load() {
    setBusy(true);
    setNotice("");

    const promises = [
      api.get("/reports/analytics"),
      api.get("/employees"),
      api.get("/wfh", { params: { status: "PENDING" } }),
      api.get("/leave", { params: { status: "PENDING" } }),
      api.get("/attendance", { params: { date: today } }),
    ];

    if (isSuperAdmin) {
      promises.push(api.get("/audit-logs", { params: { limit: 5 } }));
    }

    const results = await Promise.allSettled(promises);

    const [analyticsRes, empRes, wfhRes, leaveRes, attRes, auditRes] = results;

    let empList = [];
    if (empRes.status === "fulfilled") {
      empList = pickArray(empRes.value.data);
      setEmployees(empList);
    }

    if (attRes.status === "fulfilled") {
      setTodayAttendance(pickArray(attRes.value.data));
    }

    const pending = [];
    if (wfhRes.status === "fulfilled") {
      const wfhItems = pickArray(wfhRes.value.data).map((x) => ({
        ...x,
        category: "WFH",
        isUrgent: x.wfhType === "URGENT",
        title: x.wfhType === "URGENT" ? "Urgent WFH" : "Standard WFH",
      }));
      pending.push(...wfhItems);
    }
    if (leaveRes.status === "fulfilled") {
      const leaveItems = pickArray(leaveRes.value.data).map((x) => ({
        ...x,
        category: "LEAVE",
        isUrgent: false,
        title: `${x.leaveType || "Casual"} Leave`,
      }));
      pending.push(...leaveItems);
    }
    setPendingRequests(pending.slice(0, 6));

    if (auditRes && auditRes.status === "fulfilled") {
      setAuditLogs(pickArray(auditRes.value.data).slice(0, 5));
    }

    if (analyticsRes.status === "fulfilled") {
      const data = analyticsRes.value.data;
      setAnalytics(data);
      if (Array.isArray(data?.weeklyTrend) && data.weeklyTrend.length > 0) {
        setTrend(data.weeklyTrend);
      }
    } else {
      const fallbackTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        return {
          day: d.toLocaleDateString("en-IN", { weekday: "short" }),
          date: istDate(d),
          present: 0,
          absent: 0,
          late: 0,
        };
      });
      setTrend(fallbackTrend);
    }

    if (results.every((r) => r.status === "rejected")) {
      setNotice(errorMessage(results[0].reason));
    }

    setBusy(false);
  }

  useEffect(() => {
    load();
  }, [isSuperAdmin]);

  const s = analytics?.summary || {};
  const totalEmployeesCount = s.totalEmployees ?? employees.length;
  const activeEmployeesCount = s.activeEmployees ?? employees.filter((e) => e.active !== false).length;
  const presentCount = (s.presentToday ?? 0) + (s.lateToday ?? 0);
  const absentCount = s.absentToday ?? 0;
  const lateCount = s.lateToday ?? 0;
  const pendingWfhCount = s.pendingWfh ?? pendingRequests.filter((r) => r.category === "WFH").length;
  const pendingLeaveCount = s.pendingLeave ?? pendingRequests.filter((r) => r.category === "LEAVE").length;
  const hrAdminCount = s.totalHrAdmins ?? 1;

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  const distributionData = [
    { name: "Present", count: s.presentToday || 0, fill: "#00F0FF" },
    { name: "Late", count: s.lateToday || 0, fill: "#F59E0B" },
    { name: "WFH", count: s.wfhToday || 0, fill: "#0284C7" },
    { name: "Absent", count: s.absentToday || 0, fill: "#F43F5E" },
  ];

  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {isSuperAdmin
              ? "EXECUTIVE SYSTEM OVERVIEW"
              : "PEOPLE & OPERATIONS CONSOLE"}
          </div>
          <h1>
            {greeting}, {firstName}
          </h1>
          <p>
            {isSuperAdmin
              ? "Comprehensive workforce telemetry, administrative activity, and attendance governance."
              : "Daily employee presence monitoring, shift adherence, and pending request approvals."}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button button-secondary"
            onClick={load}
            disabled={busy}
          >
            <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="notice-banner notice-error">
          <Activity size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className="dashboard-date">
        <CalendarDays size={16} />
        <span>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <span className="live-dot" />
        <span style={{ color: "var(--success)", fontWeight: 600 }}>
          Live Synchronized
        </span>
      </div>

      {isSuperAdmin ? (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Employees"
              value={busy ? "—" : totalEmployeesCount}
              note="Registered workforce accounts"
              icon={Users}
              tone="indigo"
            />
            <StatCard
              label="Active Workforce"
              value={busy ? "—" : activeEmployeesCount}
              note="Active credentials in directory"
              icon={UserCheck}
              tone="cyan"
            />
            <StatCard
              label="Present Today"
              value={busy ? "—" : presentCount}
              note="Office & remote check-ins"
              icon={CalendarCheck}
              tone="green"
            />
            <StatCard
              label="Absent Today"
              value={busy ? "—" : absentCount}
              note="Unrecorded presence today"
              icon={UserX}
              tone="red"
            />
            <StatCard
              label="Late Arrivals"
              value={busy ? "—" : lateCount}
              note="Checked in past 9:30 AM cutoff"
              icon={Clock3}
              tone="orange"
            />
            <StatCard
              label="Pending WFH"
              value={busy ? "—" : pendingWfhCount}
              note="Standard & Urgent requests"
              icon={Home}
              tone="purple"
            />
            <StatCard
              label="Pending Leave"
              value={busy ? "—" : pendingLeaveCount}
              note="Time-off requests in review"
              icon={ClipboardCheck}
              tone="orange"
            />
            <StatCard
              label="HR Admins"
              value={busy ? "—" : hrAdminCount}
              note="Delegated admin accounts"
              icon={UserCog}
              tone="blue"
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel attendance-panel">
              <div className="panel-heading">
                <div>
                  <h2>7-Day Attendance Trend</h2>
                  <p>Daily employee presence and check-in volume</p>
                </div>
                <span className="panel-icon">
                  <CalendarCheck size={18} />
                </span>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend-present" /> Present
                </span>
                <span>
                  <i className="legend-absent" /> Absent
                </span>
                <span>
                  <i className="legend-late" /> Late
                </span>
              </div>

              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284C7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(56, 189, 248, 0.12)"
                      strokeDasharray="4 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10, 24, 48, 0.94)",
                        border: "1px solid rgba(56, 189, 248, 0.25)",
                        borderRadius: 12,
                        color: "#F0F9FF",
                        fontSize: 12,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="#00F0FF"
                      strokeWidth={2.5}
                      fill="url(#presentGrad)"
                      name="Present"
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stroke="#0284C7"
                      strokeWidth={2}
                      fill="url(#absentGrad)"
                      name="Absent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-footnote">
                Rolling weekly telemetry aggregates on-time, late, and remote check-ins.
              </p>
            </section>

            <section className="panel quick-panel">
              <div className="panel-heading">
                <div>
                  <h2>Executive Actions</h2>
                  <p>Frequently accessed governance workflows</p>
                </div>
                <span className="panel-icon">
                  <ArrowUpRight size={18} />
                </span>
              </div>

              <div className="quick-actions">
                <Link to="/employees" className="quick-action">
                  <span className="quick-icon qi-cyan">
                    <Plus size={18} />
                  </span>
                  <span>
                    <b>Add Employee</b>
                    <small>Provision new employee credentials</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>

                <Link to="/hr-admins" className="quick-action">
                  <span className="quick-icon qi-purple">
                    <UserCog size={18} />
                  </span>
                  <span>
                    <b>Manage HR Admins</b>
                    <small>Configure administrative permissions</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>

                <Link to="/approvals" className="quick-action">
                  <span className="quick-icon qi-orange">
                    <ClipboardCheck size={18} />
                  </span>
                  <span>
                    <b>Review Requests ({pendingRequests.length})</b>
                    <small>Decide WFH capacity & leave submissions</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>

                <Link to="/office-qr" className="quick-action">
                  <span className="quick-icon qi-blue">
                    <QrCode size={18} />
                  </span>
                  <span>
                    <b>Dynamic Office QR</b>
                    <small>Display 18-second rolling reception code</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>

                <Link to="/reports" className="quick-action">
                  <span className="quick-icon qi-green">
                    <FileBarChart size={18} />
                  </span>
                  <span>
                    <b>Analytics & Reports</b>
                    <small>Workforce analytics, trends & CSV export</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>
          </div>

          <div className="dashboard-grid">
            <section className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h2>Pending Requests Queue</h2>
                  <p>Submissions awaiting administrative review</p>
                </div>
                <Link className="text-link" to="/approvals">
                  View All ({pendingWfhCount + pendingLeaveCount}) <ArrowUpRight size={14} />
                </Link>
              </div>

              {pendingRequests.length ? (
                <div className="table-scroll" style={{ marginTop: 12 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Reason</th>
                        <th className="align-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((req) => (
                        <tr key={req._id}>
                          <td>
                            <div className="person-cell">
                              <div className="avatar avatar-small" style={{ overflow: "hidden" }}>
                                {req.employee?.avatar ? (
                                  <img
                                    src={getMediaUrl(req.employee.avatar)}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                ) : (
                                  String(req.employee?.name || "?")[0].toUpperCase()
                                )}
                              </div>
                              <div>
                                <b>{req.employee?.name || "Employee"}</b>
                                <small>{req.employee?.department || "—"}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span className="type-tag">{req.title}</span>
                              {req.isUrgent && (
                                <span className="urgent-priority-badge">
                                  🚨 Urgent
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <small>{req.startDate} {req.endDate && req.endDate !== req.startDate ? `➔ ${req.endDate}` : ""}</small>
                          </td>
                          <td>
                            <small style={{ color: "var(--text-muted)" }}>
                              {req.reason || req.urgencyReason || "—"}
                            </small>
                          </td>
                          <td className="align-right">
                            <Link to="/approvals" className="button button-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No pending requests"
                  message="All employee WFH and leave requests have been reviewed."
                />
              )}
            </section>

            <section className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent Audit Trail</h2>
                  <p>Traceable administrative activities</p>
                </div>
                <Link className="text-link" to="/audit-logs">
                  Full Log <ArrowUpRight size={14} />
                </Link>
              </div>

              {auditLogs.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {auditLogs.map((log) => (
                    <div
                      key={log._id}
                      style={{
                        padding: "10px 14px",
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <b style={{ fontSize: 12, color: "var(--text-primary)" }}>
                            {log.action}
                          </b>
                          <span className="status-pill neutral" style={{ fontSize: 9 }}>
                            {log.actorRole}
                          </span>
                        </div>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                          By {log.actor?.name || log.actorEmail || "System"} · {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <small style={{ color: "var(--cyan)", fontSize: 10.5 }}>
                        {log.targetType}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No audit events yet"
                  message="Administrative corrections and approvals will appear in this feed."
                />
              )}
            </section>
          </div>

          <section className="panel recent-panel" style={{ marginTop: 20 }}>
            <div className="panel-heading">
              <div>
                <h2>Recently Registered Employees</h2>
                <p>Latest additions to the organizational directory</p>
              </div>
              <Link className="text-link" to="/employees">
                View All Directory <ArrowUpRight size={14} />
              </Link>
            </div>
            {employees.length ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEmployees.map((e, i) => (
                      <tr key={e._id || e.id || i}>
                        <td>
                          <div className="person-cell">
                            <div className="avatar avatar-small" style={{ overflow: "hidden" }}>
                              {e.avatar ? (
                                <img
                                  src={getMediaUrl(e.avatar)}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                String(e.name || "?")[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <b>{e.name || "Employee"}</b>
                              <small>{e.email || "—"}</small>
                            </div>
                          </div>
                        </td>
                        <td>{e.employeeId || "—"}</td>
                        <td>{e.department || "—"}</td>
                        <td>{e.designation || "—"}</td>
                        <td>
                          <StatusPill status={e.status || "Active"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No employees recorded"
                message="Add your first employee profile to start tracking attendance."
              />
            )}
          </section>
        </>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              label="Managed Employees"
              value={busy ? "—" : totalEmployeesCount}
              note="Active personnel in directory"
              icon={Users}
              tone="indigo"
            />
            <StatCard
              label="Present Today"
              value={busy ? "—" : presentCount}
              note="Checked in for today's shift"
              icon={UserCheck}
              tone="green"
            />
            <StatCard
              label="Absent Today"
              value={busy ? "—" : absentCount}
              note="Unrecorded today"
              icon={UserX}
              tone="red"
            />
            <StatCard
              label="Late Arrivals"
              value={busy ? "—" : lateCount}
              note="Arrived after cutoff"
              icon={Clock3}
              tone="orange"
            />
            <StatCard
              label="Pending WFH"
              value={busy ? "—" : pendingWfhCount}
              note="Awaiting HR review"
              icon={Home}
              tone="cyan"
            />
            <StatCard
              label="Pending Leave"
              value={busy ? "—" : pendingLeaveCount}
              note="Awaiting HR review"
              icon={ClipboardCheck}
              tone="orange"
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel attendance-panel">
              <div className="panel-heading">
                <div>
                  <h2>Weekly Attendance Telemetry</h2>
                  <p>7-day employee presence & absence flow</p>
                </div>
                <span className="panel-icon">
                  <CalendarCheck size={18} />
                </span>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend-present" /> Present
                </span>
                <span>
                  <i className="legend-absent" /> Absent
                </span>
              </div>

              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="hrPresentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1E2A3F" strokeDasharray="4 5" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "rgba(10, 24, 48, 0.94)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: 12, color: "#F0F9FF" }} />
                    <Area type="monotone" dataKey="present" stroke="#00F0FF" strokeWidth={2.5} fill="url(#hrPresentGrad)" />
                    <Area type="monotone" dataKey="absent" stroke="#0284C7" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel quick-panel">
              <div className="panel-heading">
                <div>
                  <h2>HR Operations</h2>
                  <p>Quick access to routine workflows</p>
                </div>
                <span className="panel-icon">
                  <ArrowUpRight size={18} />
                </span>
              </div>

              <div className="quick-actions">
                <Link to="/employees" className="quick-action">
                  <span className="quick-icon qi-cyan">
                    <Plus size={18} />
                  </span>
                  <span>
                    <b>Add Employee</b>
                    <small>Enroll new team member</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>

                <Link to="/attendance" className="quick-action">
                  <span className="quick-icon qi-blue">
                    <CalendarCheck size={18} />
                  </span>
                  <span>
                    <b>Attendance Registry</b>
                    <small>Check daily check-in logs</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>

                <Link to="/approvals" className="quick-action">
                  <span className="quick-icon qi-orange">
                    <ClipboardCheck size={18} />
                  </span>
                  <span>
                    <b>Pending Requests ({pendingRequests.length})</b>
                    <small>Review WFH & leave applications</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>

                <Link to="/reports" className="quick-action">
                  <span className="quick-icon qi-green">
                    <FileBarChart size={18} />
                  </span>
                  <span>
                    <b>Workforce Reports</b>
                    <small>View reports & export CSVs</small>
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>
          </div>

          <section className="panel recent-panel">
            <div className="panel-heading">
              <div>
                <h2>Today's Attendance Feed</h2>
                <p>Real-time employee check-in activity for {today}</p>
              </div>
              <Link className="text-link" to="/attendance">
                Full Log ({todayAttendance.length}) <ArrowUpRight size={14} />
              </Link>
            </div>

            {todayAttendance.length ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Work Mode</th>
                      <th>Status</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAttendance.slice(0, 6).map((att, idx) => (
                      <tr key={att._id || idx}>
                        <td>
                          <div className="person-cell">
                            <div className="avatar avatar-small" style={{ overflow: "hidden" }}>
                              {att.employee?.avatar ? (
                                <img
                                  src={getMediaUrl(att.employee.avatar)}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                String(att.employee?.name || att.name || "?")[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <b>{att.employee?.name || att.name || "Employee"}</b>
                              <small>{att.employee?.employeeId || att.employeeId || "—"}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {att.checkIn
                            ? new Date(att.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                        <td>
                          {att.checkOut
                            ? new Date(att.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                        <td>{att.mode || "OFFICE"}</td>
                        <td>
                          <StatusPill status={att.status || "PRESENT"} />
                        </td>
                        <td>
                          <span className="type-tag">{att.checkInMethod || "QR"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No check-ins yet today"
                message="Attendance records will populate here as employees check in via mobile app or manual marking."
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
