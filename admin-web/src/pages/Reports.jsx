import { useEffect, useState } from "react";
import {
  Download,
  RefreshCw,
  Users,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  Home,
  Clock,
  Building,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import api, { errorMessage } from "../services/api";

export default function Reports() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const response = await api.get("/reports/analytics");
      setData(response.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function exportSummary() {
    if (!data?.summary) return;
    const s = data.summary;
    const rows = [
      ["Metric", "Value"],
      ["Date", s.today],
      ["Total Active Employees", s.activeEmployees],
      ["Present Today", s.presentToday],
      ["Late Arrivals Today", s.lateToday],
      ["Absent Today", s.absentToday],
      ["Half Day Today", s.halfDayToday],
      ["WFH Today", s.wfhToday],
      ["Office Today", s.officeToday],
      ["Pending Approvals", s.pendingApprovals],
      ["Generated At", new Date().toISOString()],
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    a.download = `vorldx-workforce-report-${s.today}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const s = data?.summary || {};
  const chartData = [
    { name: "Present", count: s.presentToday || 0, fill: "#20c5f4" },
    { name: "Late", count: s.lateToday || 0, fill: "#f5a623" },
    { name: "Absent", count: s.absentToday || 0, fill: "#9c8cff" },
    { name: "WFH", count: s.wfhToday || 0, fill: "#2ee6ca" },
  ];

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKFORCE INSIGHTS</div>
          <h1>Reports & Analytics</h1>
          <p>Real-time metrics, attendance trends, and department analytics.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={load} disabled={busy}>
            <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
          </button>
          <button className="button button-primary" onClick={exportSummary} disabled={!data}>
            <Download size={16} /> Export summary
          </button>
        </div>
      </div>

      {error && <div className="notice-banner notice-error">{error}</div>}

      {/* STATS TILES */}
      <div className="stats-grid report-stats">
        <div className="stat-card stat-blue">
          <div className="stat-top">
            <span>Employees</span>
            <span className="stat-icon">
              <Users size={19} />
            </span>
          </div>
          <div className="stat-value">{busy ? "—" : s.activeEmployees ?? 0}</div>
          <div className="stat-note">Active directory count</div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-top">
            <span>Present today</span>
            <span className="stat-icon">
              <CalendarCheck size={19} />
            </span>
          </div>
          <div className="stat-value">{busy ? "—" : s.presentToday ?? 0}</div>
          <div className="stat-note">On-time check-ins</div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-top">
            <span>Late arrivals</span>
            <span className="stat-icon">
              <Clock size={19} />
            </span>
          </div>
          <div className="stat-value">{busy ? "—" : s.lateToday ?? 0}</div>
          <div className="stat-note">Arrived after 9:30 cutoff</div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-top">
            <span>WFH today</span>
            <span className="stat-icon">
              <Home size={19} />
            </span>
          </div>
          <div className="stat-value">{busy ? "—" : s.wfhToday ?? 0}</div>
          <div className="stat-note">Approved remote workforce</div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <section className="panel report-chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Today's Attendance Breakdown</h2>
              <p>Presence, late arrivals, and remote status.</p>
            </div>
          </div>
          <div className="report-chart" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#20344b" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8ba5bf", fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#8ba5bf", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0a213a",
                    border: "1px solid #214565",
                    borderRadius: 12,
                    color: "#eaf5ff",
                  }}
                />
                <Bar dataKey="count" fill="#20c5f4" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel report-chart-panel">
          <div className="panel-heading">
            <div>
              <h2>7-Day Attendance Trend</h2>
              <p>Weekly trend of employee presence.</p>
            </div>
          </div>
          <div className="report-chart" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weeklyTrend || []} margin={{ top: 12, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#20344b" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8ba5bf", fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#8ba5bf", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0a213a",
                    border: "1px solid #214565",
                    borderRadius: 12,
                    color: "#eaf5ff",
                  }}
                />
                <Bar dataKey="present" fill="#20c5f4" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#9c8cff" name="Absent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* DEPARTMENT BREAKDOWN */}
      {data?.departmentBreakdown && data.departmentBreakdown.length > 0 && (
        <section className="panel" style={{ marginTop: 24, padding: "20px 24px" }}>
          <div className="panel-heading">
            <div>
              <h2>Department Distribution</h2>
              <p>Active workforce distribution across departments.</p>
            </div>
            <span className="panel-icon">
              <Building size={18} />
            </span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Percentage of total</th>
                </tr>
              </thead>
              <tbody>
                {data.departmentBreakdown.map((dept, idx) => (
                  <tr key={idx}>
                    <td>
                      <b>{dept.department}</b>
                    </td>
                    <td>{dept.count} members</td>
                    <td>
                      {s.activeEmployees
                        ? `${Math.round((dept.count / s.activeEmployees) * 100)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
