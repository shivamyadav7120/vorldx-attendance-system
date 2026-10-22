import React from "react";

export default function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "indigo",
  badge,
}) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        {Icon && (
          <span className="stat-icon">
            <Icon size={19} />
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="stat-note">{note}</span>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--cyan)", background: "rgba(34, 211, 238, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
            {badge}
          </span>
        )}
      </div>
    </article>
  );
}
