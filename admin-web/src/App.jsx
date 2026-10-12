
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  QrCode,
  House,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CircleCheck,
  CircleX,
  Clock3,
  UserPlus,
  ClipboardCheck,
  Download,
  ChevronRight,
  Building2,
  ShieldCheck,
  CalendarDays,
  Activity,
  LogOut,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import "./App.css";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Employees", icon: Users },
  { label: "Attendance", icon: CalendarCheck },
  { label: "QR Check-in", icon: QrCode },
  { label: "Work From Home", icon: House },
  { label: "Reports", icon: ChartNoAxesCombined },
  { label: "Settings", icon: Settings },
];

const weeklyData = [
  { day: "Mon", present: 38, absent: 5 },
  { day: "Tue", present: 41, absent: 3 },
  { day: "Wed", present: 39, absent: 4 },
  { day: "Thu", present: 44, absent: 2 },
  { day: "Fri", present: 42, absent: 5 },
  { day: "Sat", present: 30, absent: 3 },
  { day: "Sun", present: 0, absent: 0 },
];

const employees = [
  {
    id: "VX001",
    name: "Aarav Sharma",
    department: "Engineering",
    checkIn: "09:04 AM",
    status: "Present",
  },
  {
    id: "VX002",
    name: "Priya Verma",
    department: "Human Resources",
    checkIn: "09:12 AM",
    status: "Present",
  },
  {
    id: "VX003",
    name: "Rahul Singh",
    department: "Design",
    checkIn: "—",
    status: "Absent",
  },
  {
    id: "VX004",
    name: "Ananya Gupta",
    department: "Marketing",
    checkIn: "09:24 AM",
    status: "Present",
  },
  {
    id: "VX005",
    name: "Rohan Mehta",
    department: "Engineering",
    checkIn: "WFH",
    status: "WFH",
  },
];

const stats = [
  {
    label: "Total Employees",
    value: "50",
    note: "Active employee records",
    icon: Users,
    trend: "Overview",
    trendIcon: ArrowUpRight,
    iconClass: "navy",
  },
  {
    label: "Present Today",
    value: "42",
    note: "84% of total employees",
    icon: CircleCheck,
    trend: "On track",
    trendIcon: ArrowUpRight,
    iconClass: "teal",
  },
  {
    label: "Absent Today",
    value: "5",
    note: "Requires attention",
    icon: CircleX,
    trend: "Review",
    trendIcon: ArrowDownRight,
    iconClass: "slate",
  },
  {
    label: "Working Remotely",
    value: "3",
    note: "Approved WFH requests",
    icon: House,
    trend: "WFH",
    trendIcon: ArrowUpRight,
    iconClass: "gray",
  },
];

function StatusBadge({ status }) {
  const statusConfig = {
    Present: { icon: CircleCheck, className: "present" },
    Absent: { icon: CircleX, className: "absent" },
    WFH: { icon: House, className: "wfh" },
    Pending: { icon: Clock3, className: "pending" },
  };

  const config = statusConfig[status] || statusConfig.Pending;
  const Icon = config.icon;

  return (
    <span className={`status-badge ${config.className}`}>
      <Icon size={15} strokeWidth={2.2} />
      {status}
    </span>
  );
}

function SectionHeading({ title, description, action, onAction }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function Sidebar({ activePage, setActivePage, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-symbol">
            <span>V</span>
          </div>

          <div className="brand-copy">
            <strong>VorldX</strong>
            <span>EMPLOYEE PORTAL</span>
          </div>

          <button
            className="mobile-close"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => {
                setActivePage(label);
                setMobileOpen(false);
              }}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
              {label === "Work From Home" && (
                <span className="nav-count">2</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              <ShieldCheck size={20} />
            </div>
            <strong>Secure workspace</strong>
            <p>Manage attendance and employee records in one place.</p>
          </div>

          <div className="sidebar-profile">
            <div className="avatar avatar-admin">A</div>
            <div className="profile-copy">
              <strong>Administrator</strong>
              <span>HR & Admin</span>
            </div>
            <button
              className="icon-button sidebar-logout"
              title="Demo sign out"
              onClick={() =>
                window.alert("Authentication will be connected to the backend.")
              }
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ setMobileOpen, search, setSearch, activePage }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={21} />
        </button>

        <div className="breadcrumb">
          <span>Workspace</span>
          <ChevronRight size={15} />
          <strong>{activePage}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees..."
            aria-label="Search employees"
          />
          <kbd>⌘ K</kbd>
        </label>

        <div className="notification-wrap">
          <button
            className="icon-button notification-button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell size={19} />
            <span className="notification-dot" />
          </button>

          {notificationsOpen && (
            <div className="notification-popover">
              <strong>Notifications</strong>
              <p>Demo notifications will appear here when connected.</p>
            </div>
          )}
        </div>

        <div className="topbar-divider" />

        <div className="topbar-user">
          <div className="avatar avatar-admin">A</div>
          <div className="topbar-user-copy">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ stat }) {
  const Icon = stat.icon;
  const TrendIcon = stat.trendIcon;

  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${stat.iconClass}`}>
          <Icon size={21} strokeWidth={1.9} />
        </div>

        <span className="stat-trend">
          <TrendIcon size={14} />
          {stat.trend}
        </span>
      </div>

      <p className="stat-label">{stat.label}</p>
      <div className="stat-value">{stat.value}</div>
      <p className="stat-note">{stat.note}</p>
    </article>
  );
}

function AttendanceChart() {
  return (
    <section className="panel chart-panel">
      <SectionHeading
        title="Attendance overview"
        description="Daily attendance for the current week"
        action="Full report"
        onAction={() => window.dispatchEvent(new Event("open-reports"))}
      />

      <div className="chart-legend">
        <span>
          <i className="legend-square present-square" />
          Present
        </span>
        <span>
          <i className="legend-square absent-square" />
          Absent
        </span>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={weeklyData}
            margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#244c5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#244c5e" stopOpacity={0.01} />
              </linearGradient>

              <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8a7373" stopOpacity={0.13} />
                <stop offset="95%" stopColor="#8a7373" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#e8edf2"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#718092", fontSize: 12 }}
              dy={9}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#718092", fontSize: 12 }}
              allowDecimals={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #dce5ed",
                boxShadow: "0 8px 25px rgba(16,44,58,.09)",
                fontSize: 12,
              }}
            />

            <Area
              type="monotone"
              dataKey="present"
              name="Present"
              stroke="#244c5e"
              strokeWidth={2.5}
              fill="url(#presentGradient)"
              activeDot={{ r: 5, fill: "#244c5e" }}
            />

            <Area
              type="monotone"
              dataKey="absent"
              name="Absent"
              stroke="#8a7373"
              strokeWidth={2}
              fill="url(#absentGradient)"
              activeDot={{ r: 4, fill: "#8a7373" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <div>
          <span className="chart-footer-icon">
            <Activity size={17} />
          </span>
          <span>Weekly attendance activity</span>
        </div>
        <span className="chart-footer-note">Demo data</span>
      </div>
    </section>
  );
}

function QuickActions({ setActivePage }) {
  const actions = [
    {
      title: "Add employee",
      description: "Create an employee record",
      icon: UserPlus,
      page: "Employees",
    },
    {
      title: "View attendance",
      description: "Review daily attendance",
      icon: ClipboardCheck,
      page: "Attendance",
    },
    {
      title: "Office QR code",
      description: "Manage office check-in",
      icon: QrCode,
      page: "QR Check-in",
    },
    {
      title: "Export reports",
      description: "Review attendance reports",
      icon: Download,
      page: "Reports",
    },
  ];

  return (
    <section className="panel quick-actions-panel">
      <SectionHeading
        title="Quick actions"
        description="Common administrative tasks"
      />

      <div className="quick-actions-list">
        {actions.map(({ title, description, icon: Icon, page }) => (
          <button
            key={title}
            className="quick-action"
            onClick={() => setActivePage(page)}
          >
            <div className="quick-action-icon">
              <Icon size={19} strokeWidth={1.9} />
            </div>

            <span className="quick-action-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>

            <ChevronRight className="quick-action-arrow" size={17} />
          </button>
        ))}
      </div>
    </section>
  );
}

function RecentEmployees({ search, setActivePage }) {
  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        `${employee.name} ${employee.id} ${employee.department} ${employee.status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <section className="panel employees-panel">
      <SectionHeading
        title="Today's attendance"
        description="A quick look at employee check-in status"
        action="View attendance"
        onAction={() => setActivePage("Attendance")}
      />

      <div className="table-wrap">
        <table className="employee-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DEPARTMENT</th>
              <th>CHECK-IN</th>
              <th>STATUS</th>
              <th aria-label="Actions" />
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr key={employee.id}>
                <td>
                  <div className="employee-cell">
                    <div className={`avatar employee-avatar avatar-${index + 1}`}>
                      {employee.name.charAt(0)}
                    </div>

                    <div>
                      <strong>{employee.name}</strong>
                      <small>{employee.id}</small>
                    </div>
                  </div>
                </td>

                <td className="department-cell">{employee.department}</td>
                <td className="checkin-cell">{employee.checkIn}</td>

                <td>
                  <StatusBadge status={employee.status} />
                </td>

                <td>
                  <button
                    className="icon-button row-more"
                    aria-label={`More options for ${employee.name}`}
                    onClick={() => setActivePage("Employees")}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-table">
                  No matching employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Sample employee records · Demo only</span>
        <button
          className="text-button"
          onClick={() => setActivePage("Employees")}
        >
          All employees <ChevronRight size={15} />
        </button>
      </div>
    </section>
  );
}

function PolicyCard() {
  return (
    <section className="policy-card">
      <div className="policy-icon">
        <ShieldCheck size={21} />
      </div>

      <div className="policy-copy">
        <strong>Attendance policy</strong>
        <p>
          Office check-in opens at 9:00 AM. Check-ins before 9:30 AM qualify
          as Present; check-ins at or after 9:30 AM are marked Absent under
          the configured policy.
        </p>
      </div>

      <div className="policy-tag">
        <Clock3 size={14} />
        9:30 AM cutoff
      </div>
    </section>
  );
}

function Dashboard({ search, setActivePage }) {
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            <Sparkles size={15} />
            YOUR WORKSPACE
          </div>

          <h1>Good morning, Admin</h1>
          <p className="welcome-description">
            Here's what's happening with your team today.
          </p>
        </div>

        <div className="date-card">
          <div className="date-icon">
            <CalendarDays size={19} />
          </div>

          <div>
            <span>TODAY</span>
            <strong>{today}</strong>
          </div>
        </div>
      </div>

      <div className="demo-banner">
        <div className="demo-banner-icon">
          <Building2 size={18} />
        </div>
        <p>
          <strong>Demo dashboard</strong>
          <span>
            These figures and employee records are sample data, not live
            attendance records.
          </span>
        </p>
      </div>

      <section className="stats-grid" aria-label="Attendance statistics">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <div className="main-grid">
        <AttendanceChart />
        <QuickActions setActivePage={setActivePage} />
      </div>

      <RecentEmployees search={search} setActivePage={setActivePage} />

      <PolicyCard />
    </>
  );
}

function PlaceholderPage({ page, setActivePage }) {
  const pageConfig = {
    Employees: {
      icon: Users,
      title: "Employee management",
      description:
        "Create, search, edit, and manage employee records from one place.",
      action: "Back to dashboard",
    },
    Attendance: {
      icon: CalendarCheck,
      title: "Attendance management",
      description:
        "Review employee attendance, check-in times, check-outs, and authorized corrections.",
      action: "Back to dashboard",
    },
    "QR Check-in": {
      icon: QrCode,
      title: "Office QR check-in",
      description:
        "The live office QR session and secure employee scanning will be connected to the backend.",
      action: "Back to dashboard",
    },
    "Work From Home": {
      icon: House,
      title: "Work from home",
      description:
        "Review WFH requests, approve or reject requests, and manage daily capacity.",
      action: "Back to dashboard",
    },
    Reports: {
      icon: ChartNoAxesCombined,
      title: "Attendance reports",
      description:
        "Review attendance summaries and export reports when the backend is connected.",
      action: "Back to dashboard",
    },
    Settings: {
      icon: Settings,
      title: "Workspace settings",
      description:
        "Attendance policies, office settings, access controls, and audit settings will be managed here.",
      action: "Back to dashboard",
    },
  };

  const config = pageConfig[page] || pageConfig.Employees;
  const Icon = config.icon;

  return (
    <section className="placeholder-page panel">
      <div className="placeholder-icon">
        <Icon size={29} />
      </div>

      <span className="eyebrow">VORLDX WORKSPACE</span>
      <h1>{config.title}</h1>
      <p>{config.description}</p>

      <div className="placeholder-note">
        <Clock3 size={17} />
        <span>
          This section is currently a UI preview. Its real functionality
          requires backend integration.
        </span>
      </div>

      <button
        className="primary-button"
        onClick={() => setActivePage("Dashboard")}
      >
        <LayoutDashboard size={17} />
        {config.action}
      </button>
    </section>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-shell">
        <Header
          setMobileOpen={setMobileOpen}
          search={search}
          setSearch={setSearch}
          activePage={activePage}
        />

        <main className="page-content">
          {activePage === "Dashboard" ? (
            <Dashboard search={search} setActivePage={setActivePage} />
          ) : (
            <PlaceholderPage
              page={activePage}
              setActivePage={setActivePage}
            />
          )}

          <footer className="app-footer">
            <span>© {new Date().getFullYear()} VorldX</span>
            <span>Building Virtual World with Simplicity</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
