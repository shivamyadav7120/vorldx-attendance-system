import React from "react";
import { SearchX } from "lucide-react";
export default function EmptyState({ title = "Nothing here yet", message = "When data is available, it will appear here." }) {
  return <div className="empty-state"><span><SearchX size={24}/></span><h3>{title}</h3><p>{message}</p></div>;
}
