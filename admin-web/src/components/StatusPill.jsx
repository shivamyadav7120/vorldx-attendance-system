import React from "react";
export default function StatusPill({ status = "Pending" }) {
  const key = String(status).toLowerCase().replaceAll("_", " ");
  const cls = ["present","approved","resolved","active","accepted","on time"].includes(key) ? "success"
    : ["absent","rejected","inactive","late","failed"].includes(key) ? "danger"
    : ["pending","wfh pending","leave pending","rescue on way"].includes(key) ? "warning" : "neutral";
  return <span className={`status-pill ${cls}`}><i/>{key.replace(/\b\w/g, c => c.toUpperCase())}</span>;
}
