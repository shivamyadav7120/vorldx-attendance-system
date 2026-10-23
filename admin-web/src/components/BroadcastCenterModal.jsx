import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  X,
  Radio,
  Users,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  Inbox,
  Search,
  Filter,
} from "lucide-react";
import api from "../services/api";

const INITIAL_MESSAGES = [
  {
    id: "msg-1",
    sender: "Aarav Sharma",
    avatar: "AS",
    dept: "Engineering",
    role: "Senior Full Stack Dev",
    subject: "WFH Request Confirmation for Next Tuesday",
    body: "Hi Admin team, I submitted a WFH request for sprint deployment next Tuesday. Kindly review when free.",
    time: "15 min ago",
    unread: true,
    tag: "WFH Query",
  },
  {
    id: "msg-2",
    sender: "Priya Patel",
    avatar: "PP",
    dept: "Human Resources",
    role: "HR Operations Lead",
    subject: "Biometric & Dynamic QR Rotation Verified",
    body: "The 18-second dynamic QR code rotation was verified on floor 3 and working seamlessly on Expo 58 app.",
    time: "1 hour ago",
    unread: false,
    tag: "System Status",
  },
  {
    id: "msg-3",
    sender: "Kavita Reddy",
    avatar: "KR",
    dept: "Design & Product",
    role: "UI/UX Designer",
    subject: "Leave adjustment query for Diwali holiday",
    body: "Hello! My casual leave balance shows 3 days left. Could you please confirm if the optional holiday applies?",
    time: "3 hours ago",
    unread: false,
    tag: "Leave Policy",
  },
];

const INITIAL_BROADCASTS = [
  {
    id: "bc-1",
    title: "Quarterly Town Hall & System Update",
    audience: "All Employees (All Departments)",
    priority: "NORMAL",
    body: "All employees please note our Q4 Town Hall will take place this Friday at 4:00 PM IST via Google Meet.",
    timestamp: "Today, 10:30 AM",
    sentBy: "Super Administrator",
    readCount: "114 / 128 Read",
  },
  {
    id: "bc-2",
    title: "Updated Office Geofence & QR Check-in Protocol",
    audience: "Tech & Operations",
    priority: "HIGH",
    body: "Please make sure your VorldX Mobile App is updated to the latest build (Expo 58) for instantaneous biometric scan.",
    timestamp: "Yesterday, 02:15 PM",
    sentBy: "HR Admin",
    readCount: "82 / 85 Read",
  },
];

const STORAGE_KEY_BROADCASTS = "vorldx_admin_broadcasts";
const STORAGE_KEY_MESSAGES = "vorldx_admin_inbox_messages";

export default function BroadcastCenterModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("broadcast");
  const [broadcasts, setBroadcasts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BROADCASTS);
      return stored ? JSON.parse(stored) : INITIAL_BROADCASTS;
    } catch {
      return INITIAL_BROADCASTS;
    }
  });

  const [inboxMessages, setInboxMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return stored ? JSON.parse(stored) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [form, setForm] = useState({
    title: "",
    audience: "All Employees (All Departments)",
    priority: "NORMAL",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySentNotice, setReplySentNotice] = useState("");

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      api.get("/notifications")
        .then((res) => {
          if (res.data?.notifications?.length) {
            const fetched = res.data.notifications.map((n) => ({
              id: n._id,
              title: n.title,
              audience: n.targetAudience === "ALL"
                ? "All Employees & HR"
                : n.targetAudience === "HR"
                ? "HR Team Only"
                : n.targetDepartment
                ? `${n.targetDepartment} Dept`
                : "Specific Recipient",
              priority: n.priority || "NORMAL",
              body: n.message,
              timestamp: new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
              sentBy: n.senderName || "Administrator",
              readCount: `${n.readCount || 0} Read`,
            }));
            setBroadcasts(fetched);
          }
        })
        .catch(() => {});
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSendBroadcast(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setErrorNotice("Please fill in both the subject and broadcast message.");
      return;
    }

    setSending(true);
    setErrorNotice("");

    try {
      let targetAudience = "ALL";
      let targetDepartment = "";
      if (form.audience.toLowerCase().includes("hr")) {
        targetAudience = "HR";
      } else if (form.audience.toLowerCase().includes("tech") || form.audience.toLowerCase().includes("operations")) {
        targetAudience = "DEPARTMENT";
        targetDepartment = "Tech & Operations";
      } else if (form.audience.toLowerCase().includes("field")) {
        targetAudience = "DEPARTMENT";
        targetDepartment = "Field & Sales";
      }

      const res = await api.post("/notifications", {
        title: form.title.trim(),
        message: form.message.trim(),
        targetAudience,
        targetDepartment,
        priority: form.priority,
        type: "BROADCAST",
      });

      const newBroadcast = {
        id: res.data?.notification?._id || `bc-${Date.now()}`,
        title: form.title.trim(),
        audience: form.audience,
        priority: form.priority,
        body: form.message.trim(),
        timestamp: "Just now",
        sentBy: "Administrator",
        readCount: "Delivered to Employee & HR Mobile App",
      };

      setBroadcasts((prev) => [newBroadcast, ...prev]);

      setSuccessNotice(
        `Broadcast "${form.title.trim()}" dispatched successfully to ${form.audience} and delivered to mobile app notification section!`
      );
      setForm({
        title: "",
        audience: "All Employees (All Departments)",
        priority: "NORMAL",
        message: "",
      });

      setTimeout(() => setSuccessNotice(""), 4500);
    } catch (err) {
      setErrorNotice(err.response?.data?.message || err.message || "Failed to dispatch broadcast");
    } finally {
      setSending(false);
    }
  }

  function handleMarkAsRead(id) {
    const updated = inboxMessages.map((m) =>
      m.id === id ? { ...m, unread: false } : m
    );
    setInboxMessages(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
    } catch (e) {}
  }

  async function handleSendReply(messageId) {
    if (!replyText.trim()) return;
    try {
      await api.post("/notifications", {
        title: `Reply: ${selectedMessage?.subject || "Admin Response"}`,
        message: replyText.trim(),
        type: "DIRECT_MESSAGE",
        targetAudience: "ALL",
        priority: "NORMAL",
      });
      setReplySentNotice(`Reply dispatched to ${selectedMessage?.sender || "employee"} on mobile app.`);
      setReplyText("");
      handleMarkAsRead(messageId);
      setTimeout(() => setReplySentNotice(""), 3500);
    } catch (err) {
      setErrorNotice("Failed to send reply");
    }
  }

  const unreadCount = inboxMessages.filter((m) => m.unread).length;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="broadcast-modal-panel" role="dialog" aria-modal="true">
        <div className="broadcast-mirror-accent" />

        <div className="broadcast-modal-header">
          <div className="broadcast-header-title">
            <div className="broadcast-icon-box">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2>Enterprise Communications & Broadcast Center</h2>
              <p>Instant announcements, departmental alerts, and employee messages</p>
            </div>
          </div>
          <button
            className="icon-button modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="broadcast-tabs">
          <button
            type="button"
            className={`broadcast-tab-btn ${activeTab === "broadcast" ? "active" : ""}`}
            onClick={() => setActiveTab("broadcast")}
          >
            <Radio size={15} />
            <span>New Broadcast</span>
          </button>

          <button
            type="button"
            className={`broadcast-tab-btn ${activeTab === "inbox" ? "active" : ""}`}
            onClick={() => setActiveTab("inbox")}
          >
            <Inbox size={15} />
            <span>Messages & Queries</span>
            {unreadCount > 0 && (
              <span className="broadcast-unread-pill">{unreadCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`broadcast-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <Clock size={15} />
            <span>Broadcast History ({broadcasts.length})</span>
          </button>
        </div>

        <div className="broadcast-modal-body">
          {activeTab === "broadcast" && (
            <form onSubmit={handleSendBroadcast} className="broadcast-form">
              {successNotice && (
                <div className="alert-banner alert-success">
                  <CheckCircle2 size={17} />
                  <span>{successNotice}</span>
                </div>
              )}

              {errorNotice && (
                <div className="alert-banner alert-danger">
                  <AlertTriangle size={17} />
                  <span>{errorNotice}</span>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Target Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value })
                    }
                    className="water-input"
                  >
                    <option value="All Employees (All Departments)">
                      🏢 All Employees (All Departments - 128)
                    </option>
                    <option value="Tech & Engineering">
                      💻 Tech & Engineering Department
                    </option>
                    <option value="Operations & Logistics">
                      📦 Operations & Logistics
                    </option>
                    <option value="Human Resources & Admin">
                      👥 Human Resources & Administration
                    </option>
                    <option value="Sales & Business Development">
                      📈 Sales & Business Development
                    </option>
                    <option value="Executive Management">
                      👑 Executive Management
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Priority Level</label>
                  <div className="priority-selector">
                    {[
                      { key: "NORMAL", label: "Normal Notice", color: "cyan" },
                      { key: "HIGH", label: "High / Important", color: "amber" },
                      { key: "URGENT", label: "Critical / Urgent", color: "rose" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setForm({ ...form, priority: p.key })}
                        className={`priority-pill ${
                          form.priority === p.key ? `active priority-${p.color}` : ""
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label>Broadcast Title / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow's Office Schedule & Safety Protocol Update"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="water-input"
                />
              </div>

              <div className="form-field">
                <label>Message Content</label>
                <textarea
                  rows={5}
                  placeholder="Type the message to be displayed on employee mobile app (Expo 58) and notification center..."
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="water-input water-textarea"
                />
              </div>

              <div className="broadcast-form-footer">
                <div className="broadcast-hint">
                  <Sparkles size={14} />
                  <span>
                    Will be dispatched as an in-app popup and push alert across all linked mobile devices.
                  </span>
                </div>

                <div className="broadcast-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setForm({
                        title: "",
                        audience: "All Employees (All Departments)",
                        priority: "NORMAL",
                        message: "",
                      });
                      setErrorNotice("");
                    }}
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    className="button button-primary water-mirror-btn"
                    disabled={sending}
                  >
                    <Send size={15} />
                    <span>{sending ? "Transmitting..." : "Send Broadcast Now"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "inbox" && (
            <div className="inbox-layout">
              <div className="inbox-list">
                {inboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      handleMarkAsRead(msg.id);
                    }}
                    className={`inbox-item ${
                      selectedMessage?.id === msg.id ? "selected" : ""
                    } ${msg.unread ? "unread" : ""}`}
                  >
                    <div className="inbox-avatar">{msg.avatar}</div>
                    <div className="inbox-content">
                      <div className="inbox-sender-row">
                        <strong>{msg.sender}</strong>
                        <span className="inbox-time">{msg.time}</span>
                      </div>
                      <div className="inbox-role-tag">
                        <span>{msg.dept}</span> · <small>{msg.tag}</small>
                      </div>
                      <p className="inbox-subject">{msg.subject}</p>
                    </div>
                    {msg.unread && <span className="inbox-unread-dot" />}
                  </div>
                ))}
              </div>

              <div className="inbox-detail">
                {selectedMessage ? (
                  <div className="message-detail-card">
                    <div className="message-detail-header">
                      <div>
                        <h3>{selectedMessage.subject}</h3>
                        <p className="message-sender-meta">
                          From: <b>{selectedMessage.sender}</b> ({selectedMessage.dept} · {selectedMessage.role})
                        </p>
                      </div>
                      <span className="status-pill info">
                        {selectedMessage.tag}
                      </span>
                    </div>

                    <div className="message-detail-body">
                      <p>{selectedMessage.body}</p>
                    </div>

                    {replySentNotice && (
                      <div className="alert-banner alert-success" style={{ margin: "14px 0" }}>
                        <CheckCircle2 size={15} />
                        <span>{replySentNotice}</span>
                      </div>
                    )}

                    <div className="message-reply-box">
                      <label>Direct Reply to Employee</label>
                      <textarea
                        rows={3}
                        placeholder={`Reply directly to ${selectedMessage.sender}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="water-input"
                      />
                      <div className="reply-btn-row">
                        <button
                          type="button"
                          className="button button-primary water-mirror-btn"
                          onClick={() => handleSendReply(selectedMessage.id)}
                        >
                          <Send size={14} />
                          <span>Send Quick Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="inbox-empty-prompt">
                    <Inbox size={32} />
                    <h4>Select a message to view</h4>
                    <p>Click on any message from the list to review the thread or send a reply.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="broadcast-history-list">
              {broadcasts.map((bc) => (
                <div key={bc.id} className="broadcast-history-card">
                  <div className="bc-history-top">
                    <div className="bc-history-title-group">
                      <span
                        className={`bc-priority-tag priority-${
                          bc.priority === "URGENT"
                            ? "rose"
                            : bc.priority === "HIGH"
                            ? "amber"
                            : "cyan"
                        }`}
                      >
                        {bc.priority}
                      </span>
                      <h4>{bc.title}</h4>
                    </div>
                    <span className="bc-history-time">{bc.timestamp}</span>
                  </div>

                  <p className="bc-history-body">{bc.body}</p>

                  <div className="bc-history-footer">
                    <div className="bc-meta-item">
                      <Users size={13} />
                      <span>{bc.audience}</span>
                    </div>
                    <div className="bc-meta-item">
                      <CheckCircle2 size={13} />
                      <span>{bc.readCount}</span>
                    </div>
                    <div className="bc-meta-item">
                      <span>Sent by: {bc.sentBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
