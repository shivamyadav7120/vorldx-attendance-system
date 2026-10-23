import React from "react";

export default function StatusPill({ status = "Pending", label }) {
  const key = String(status).toLowerCase().replaceAll("_", " ");
  const displayLabel =
    label ||
    (key === "hr approved"
      ? "HR Approved (Awaiting Admin)"
      : key.replace(/\b\w/g, (c) => c.toUpperCase()));

  const cls = [
    "present",
    "approved",
    "resolved",
    "active",
    "accepted",
    "on time",
  ].includes(key)
    ? "success"
    : [
        "absent",
        "rejected",
        "inactive",
        "deactivated",
        "failed",
      ].includes(key)
    ? "danger"
    : [
        "pending",
        "wfh pending",
        "leave pending",
        "late",
        "half day",
      ].includes(key)
    ? "warning"
    : ["office", "wfh", "qr", "hr approved"].includes(key)
    ? "info"
    : "neutral";

  return (
    <span className={`status-pill ${cls}`}>
      <i />
      {displayLabel}
    </span>
  );
}
