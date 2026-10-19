import React, { useEffect, useState } from "react";
import { ArrowUpRight, Users, UserCheck, UserX, CalendarCheck, ClipboardCheck, Clock3, Plus, RefreshCw, CalendarDays, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatCard from "../components/StatCard";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import api, { errorMessage } from "../services/api";

const istDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
const pickArray = d => Array.isArray(d) ? d : d?.employees || d?.attendance || d?.requests || d?.data || d?.records || d?.items || [];
export default function Dashboard() {
  const [employees,setEmployees] = useState([]);
  const [attendance,setAttendance] = useState([]);
  const [approvals,setApprovals] = useState([]);
  const [busy,setBusy] = useState(true);
  const [notice,setNotice] = useState("");
  async function load() {
    setBusy(true); setNotice("");
    const results = await Promise.allSettled([api.get("/employees"),api.get("/attendance"),api.get("/wfh")]);
    if(results[0].status==="fulfilled") setEmployees(pickArray(results[0].value.data));
    if(results[1].status==="fulfilled") setAttendance(pickArray(results[1].value.data));
    if(results[2].status==="fulfilled") setApprovals(pickArray(results[2].value.data));
    if(results.every(r=>r.status==="rejected")) setNotice(errorMessage(results[0].reason));
    setBusy(false);
  }
  useEffect(()=>{load();},[]);
  const today = istDate();
  const todayRecords = attendance.filter(a=>a.date===today);
  const present = todayRecords.filter(a=>String(a.status).toUpperCase()==="PRESENT").length;
  const absent = todayRecords.filter(a=>String(a.status).toUpperCase()==="ABSENT").length;
  const pending = approvals.filter(a=>String(a.status||"PENDING").toUpperCase()==="PENDING").length;
  const trend = Array.from({length:7},(_,i)=>{
    const date = istDate(new Date(Date.now()-(6-i)*86400000));
    const rows = attendance.filter(a=>a.date===date);
    return {
      day: new Date(date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short"}),
      present: rows.filter(a=>String(a.status).toUpperCase()==="PRESENT").length,
      absent: rows.filter(a=>String(a.status).toUpperCase()==="ABSENT").length,
    };
  });
  const recentEmployees = [...employees].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);
  return <div className="dashboard-page">
    <div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE AT A GLANCE</div><h1>Good to see you <span className="heading-wave">✦</span></h1><p>Here’s what’s happening across your organization today.</p></div><button className="button button-secondary" onClick={load} disabled={busy}><RefreshCw size={16} className={busy?"spin":""}/> Refresh</button></div>
    {notice && <div className="notice-banner"><Activity size={17}/><span>{notice} Dashboard is showing available data only.</span></div>}
    <div className="dashboard-date"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}<span className="live-dot"/> <span>Live workspace</span></div>
    <div className="stats-grid">
      <StatCard label="Total employees" value={busy?"—":employees.length} note="People in your workspace" icon={Users} tone="blue"/>
      <StatCard label="Present today" value={busy?"—":present} note="Based on attendance records" icon={UserCheck} tone="green"/>
      <StatCard label="Absent today" value={busy?"—":absent} note="Based on attendance records" icon={UserX} tone="purple"/>
      <StatCard label="Pending approvals" value={busy?"—":pending} note="Requests awaiting review" icon={ClipboardCheck} tone="orange"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel attendance-panel"><div className="panel-heading"><div><h2>Attendance overview</h2><p>Last 7 days · from attendance records</p></div><span className="panel-icon"><CalendarCheck size={18}/></span></div><div className="chart-legend"><span><i className="legend-present"/> Present</span><span><i className="legend-absent"/> Absent</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:12,right:8,left:-20,bottom:0}}><defs><linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#23c8f5" stopOpacity={0.28}/><stop offset="95%" stopColor="#23c8f5" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#20344b" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"#7f9bb7",fontSize:12}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:"#7f9bb7",fontSize:12}}/><Tooltip contentStyle={{background:"#0a213a",border:"1px solid #214565",borderRadius:12,color:"#eaf5ff"}}/><Area type="monotone" dataKey="present" stroke="#20c5f4" strokeWidth={2.5} fill="url(#presentFill)"/><Area type="monotone" dataKey="absent" stroke="#9c8cff" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div><p className="chart-footnote">Counts come from check-ins recorded in the last 7 days.</p></section>
      <section className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Get common tasks done faster</p></div><span className="panel-icon"><ArrowUpRight size={18}/></span></div><div className="quick-actions">
        <Link to="/employees" className="quick-action"><span className="quick-icon qi-blue"><Plus size={18}/></span><span><b>Add employee</b><small>Create an employee profile</small></span><ArrowUpRight size={16}/></Link>
        <Link to="/attendance" className="quick-action"><span className="quick-icon qi-cyan"><CalendarCheck size={18}/></span><span><b>Review attendance</b><small>Check attendance records</small></span><ArrowUpRight size={16}/></Link>
        <Link to="/approvals" className="quick-action"><span className="quick-icon qi-purple"><ClipboardCheck size={18}/></span><span><b>Review requests</b><small>WFH and leave decisions</small></span><ArrowUpRight size={16}/></Link>
        <Link to="/reports" className="quick-action"><span className="quick-icon qi-orange"><Clock3 size={18}/></span><span><b>Open reports</b><small>Explore workforce data</small></span><ArrowUpRight size={16}/></Link>
      </div></section>
    </div>
    <section className="panel recent-panel"><div className="panel-heading"><div><h2>Recently added employees</h2><p>Latest people in your organization</p></div><Link className="text-link" to="/employees">View all <ArrowUpRight size={15}/></Link></div>
      {employees.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Employee</th><th>Employee ID</th><th>Department</th><th>Status</th></tr></thead><tbody>{recentEmployees.map((e,i)=><tr key={e._id||e.id||i}><td><div className="person-cell"><div className="avatar avatar-small">{String(e.name||e.fullName||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</div><div><b>{e.name||e.fullName||"Employee"}</b><small>{e.email||"—"}</small></div></div></td><td>{e.employeeId||e.empId||e._id?.slice(-6)||"—"}</td><td>{e.department||"—"}</td><td><StatusPill status={e.status||"Active"}/></td></tr>)}</tbody></table></div>:<EmptyState title={busy?"Loading employees…":"No employee records found"} message="Connect your backend or add employees to see them here."/>}
    </section>
  </div>;
}