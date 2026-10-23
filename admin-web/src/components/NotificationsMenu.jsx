import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Clock,
  ClipboardList,
  CalendarCheck,
  ShieldAlert,
  QrCode,
  X,
  ExternalLink,
  Check,
} from "lucide-react";
import api from "../services/api";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Pending Leave Request",
    message: "Aarav Sharma requested 2 days of Casual Leave (Nov 2-3)",
    time: "10m ago",
    type: "leave",
    unread: true,
    actionPath: "/approvals",
    actionLabel: "Review Request",
  },
  {
    id: "notif-2",
    title: "New WFH Application",
    message: "Priya Patel requested Work From Home for today due to client call",
    time: "32m ago",
    type: "wfh",
    unread: true,
    actionPath: "/approvals",
    actionLabel: "Review WFH",
  },
  {
    id: "notif-3",
    title: "Late Attendance Alert",
    message: "3 employees checked in after 09:30 AM cutoff today",
    time: "1h ago",
    type: "attendance",
    unread: true,
    actionPath: "/attendance",
    actionLabel: "Inspect Logs",
  },
  {
    id: "notif-4",
    title: "Daily Office QR Generated",
    message: "Floor 2 & 3 dynamic check-in QR codes rotated successfully",
    time: "2h ago",
    type: "qr",
    unread: false,
    actionPath: "/office-qr",
    actionLabel: "View QR",
  },
  {
    id: "notif-5",
    title: "Enterprise Audit Synchronized",
    message: "Automated session log backup completed with TLS validation",
    time: "4h ago",
    type: "security",
    unread: false,
    actionPath: "/audit-logs",
    actionLabel: "Audit Logs",
  },
];

export default function NotificationsMenu({ isOpen, onClose }) {
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      api.get("/notifications")
        .then((res) => {
          if (res.data?.notifications?.length) {
            const mapped = res.data.notifications.map((n) => ({
              id: n._id,
              title: n.title,
              message: n.message,
              time: new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
              type: n.type?.toLowerCase() || "broadcast",
              unread: !n.isRead,
              actionPath: n.type === "LEAVE" || n.type === "WFH" ? "/approvals" : "/attendance",
              actionLabel: "View Details",
            }));
            setNotifications(mapped);
          }
        })
        .catch(() => {});
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    api.patch("/notifications/read-all").catch(() => {});
  }

  function dismissNotification(id, e) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    api.patch(`/notifications/${id}/read`).catch(() => {});
  }

  function handleAction(path, notifId) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, unread: false } : n))
    );
    api.patch(`/notifications/${notifId}/read`).catch(() => {});
    onClose();
    if (path) navigate(path);
  }

  const filtered = notifications.filter((n) =>
    filter === "unread" ? n.unread : true
  );
  const unreadCount = notifications.filter((n) => n.unread).length;

  function renderIcon(type) {
    switch (type) {
      case "leave":
      case "wfh":
        return <ClipboardList size={16} />;
      case "attendance":
        return <CalendarCheck size={16} />;
      case "qr":
        return <QrCode size={16} />;
      case "security":
      default:
        return <ShieldAlert size={16} />;
    }
  }

  return (
    <div className="notifications-dropdown-wrapper" ref={menuRef}>
      <div className="water-mirror-glow-accent" />
      <div className="notifications-dropdown-container">
        <div className="notifications-header">
          <div className="notifications-header-title">
            <div className="notif-header-icon">
              <Bell size={16} />
            </div>
            <div>
              <h4>Notifications</h4>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}`
                  : "All caught up"}
              </p>
            </div>
          </div>

          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-text-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <Check size={13} />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        <div className="notif-filter-bar">
          <button
            type="button"
            className={`notif-filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            className={`notif-filter-pill ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="notifications-list">
          {filtered.length === 0 ? (
            <div className="notifications-empty">
              <CheckCircle2 size={32} />
              <p>No notifications to display</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleAction(item.actionPath, item.id)}
                className={`notif-item notif-type-${item.type} ${
                  item.unread ? "unread" : ""
                }`}
              >
                <div className="notif-item-icon">{renderIcon(item.type)}</div>

                <div className="notif-item-content">
                  <div className="notif-item-title-row">
                    <strong>{item.title}</strong>
                    <span className="notif-item-time">{item.time}</span>
                  </div>
                  <p className="notif-item-msg">{item.message}</p>

                  <div className="notif-item-footer">
                    <button
                      type="button"
                      className="notif-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(item.actionPath, item.id);
                      }}
                    >
                      <span>{item.actionLabel}</span>
                      <ExternalLink size={11} />
                    </button>

                    <button
                      type="button"
                      className="notif-dismiss-btn"
                      onClick={(e) => dismissNotification(item.id, e)}
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {item.unread && <span className="notif-unread-dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
