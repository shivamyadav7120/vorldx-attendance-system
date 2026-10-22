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
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "../components/StatCard";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import api, { errorMessage } from "../services/api";

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
      [];

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingApprovals: 0,
  });
  const [trend, setTrend] = useState([]);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");

  async function load() {
    setBusy(true);
    setNotice("");

    const [analyticsRes, empRes, wfhRes, leaveRes] = await Promise.allSettled([
      api.get("/reports/analytics"),
      api.get("/employees"),
      api.get("/wfh"),
      api.get("/leave"),
    ]);

    let empList = [];
    if (empRes.status === "fulfilled") {
      empList = pickArray(empRes.value.data);
      setEmployees(empList);
    }

    if (analyticsRes.status === "fulfilled") {
      const data = analyticsRes.value.data;
      const summary = data?.summary || {};
      setStats({
        totalEmployees: summary.totalEmployees ?? empList.length,
        presentToday: (summary.presentToday ?? 0) + (summary.lateToday ?? 0),
        absentToday: summary.absentToday ?? 0,
        pendingApprovals: summary.pendingApprovals ?? 0,
      });

      if (Array.isArray(data?.weeklyTrend) && data.weeklyTrend.length > 0) {
        setTrend(data.weeklyTrend);
      }
    } else {
      let pendingWfh = 0;
      let pendingLeave = 0;
      if (wfhRes.status === "fulfilled") {
        pendingWfh = pickArray(wfhRes.value.data).filter(
          (r) => String(r.status || "PENDING").toUpperCase() === "PENDING"
        ).length;
      }
      if (leaveRes.status === "fulfilled") {
        pendingLeave = pickArray(leaveRes.value.data).filter(
          (r) => String(r.status || "PENDING").toUpperCase() === "PENDING"
        ).length;
      }

      setStats({
        totalEmployees: empList.length,
        presentToday: 0,
        absentToday: 0,
        pendingApprovals: pendingWfh + pendingLeave,
      });

      const today = istDate();
      const fallbackTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        return {
          day: d.toLocaleDateString("en-IN", { weekday: "short" }),
          date: istDate(d),
          present: 0,
          absent: 0,
        };
      });
      setTrend(fallbackTrend);

      if (
        empRes.status === "rejected" &&
        wfhRes.status === "rejected" &&
        leaveRes.status === "rejected"
      ) {
        setNotice(errorMessage(analyticsRes.reason || empRes.reason));
      }
    }

    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE AT A GLANCE</div>
          <h1>
            Good to see you <span className="heading-wave">✦</span>
          </h1>
          <p>Here’s what’s happening across your organization today.</p>
        </div>
        <button
          className="button button-secondary"
          onClick={load}
          disabled={busy}
        >
          <RefreshCw size={16} className={busy ? "spin" : ""} /> Refresh
        </button>
      </div>

      {notice && (
        <div className="notice-banner">
          <Activity size={17} />
          <span>{notice}</span>
        </div>
      )}

      <div className="dashboard-date">
        <CalendarDays size={16} />
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        <span className="live-dot" /> <span>Live workspace</span>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total employees"
          value={busy ? "—" : stats.totalEmployees}
          note="People in your workspace"
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Present today"
          value={busy ? "—" : stats.presentToday}
          note="Office and remote check-ins"
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Absent today"
          value={busy ? "—" : stats.absentToday}
          note="Unrecorded presence"
          icon={UserX}
          tone="purple"
        />
        <StatCard
          label="Pending approvals"
          value={busy ? "—" : stats.pendingApprovals}
          note="WFH & leave requests awaiting review"
          icon={ClipboardCheck}
          tone="orange"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel attendance-panel">
          <div className="panel-heading">
            <div>
              <h2>Attendance overview</h2>
              <p>Last 7 days · presence and absenteeism</p>
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
                  <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#23c8f5" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#23c8f5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#20344b"
                  strokeDasharray="4 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7f9bb7", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7f9bb7", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a213a",
                    border: "1px solid #214565",
                    borderRadius: 12,
                    color: "#eaf5ff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#20c5f4"
                  strokeWidth={2.5}
                  fill="url(#presentFill)"
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  stroke="#9c8cff"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-footnote">
            Counts reflect presence and check-ins recorded over the last 7 days.
          </p>
        </section>

        <section className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>Quick actions</h2>
              <p>Common administrative tasks</p>
            </div>
            <span className="panel-icon">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <div className="quick-actions">
            <Link to="/employees" className="quick-action">
              <span className="quick-icon qi-blue">
                <Plus size={18} />
              </span>
              <span>
                <b>Add employee</b>
                <small>Create an employee profile</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/attendance" className="quick-action">
              <span className="quick-icon qi-cyan">
                <CalendarCheck size={18} />
              </span>
              <span>
                <b>Review attendance</b>
                <small>Check daily check-in logs</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/approvals" className="quick-action">
              <span className="quick-icon qi-purple">
                <ClipboardCheck size={18} />
              </span>
              <span>
                <b>Review requests</b>
                <small>
                  {stats.pendingApprovals > 0
                    ? `${stats.pendingApprovals} pending requests`
                    : "WFH and leave decisions"}
                </small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/reports" className="quick-action">
              <span className="quick-icon qi-orange">
                <Clock3 size={18} />
              </span>
              <span>
                <b>Open reports</b>
                <small>Workforce analytics and trends</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recently added employees</h2>
            <p>Latest people in your organization</p>
          </div>
          <Link className="text-link" to="/employees">
            View all <ArrowUpRight size={15} />
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.map((e, i) => (
                  <tr key={e._id || e.id || i}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar avatar-small">
                          {String(e.name || e.fullName || "?")
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <b>{e.name || e.fullName || "Employee"}</b>
                          <small>{e.email || "—"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {e.employeeId || e.empId || e._id?.slice(-6) || "—"}
                    </td>
                    <td>{e.department || "—"}</td>
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
            title={busy ? "Loading employees…" : "No employee records found"}
            message="Connect your backend or add employees to see them here."
          />
        )}
      </section>
    </div>
  );
}
