import React from "react";
export default function StatCard({ label, value, note, icon: Icon, tone = "blue" }) {
  return <article className={`stat-card stat-${tone}`}>
    <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={19}/></span></div>
    <div className="stat-value">{value}</div><div className="stat-note">{note}</div>
  </article>;
}
