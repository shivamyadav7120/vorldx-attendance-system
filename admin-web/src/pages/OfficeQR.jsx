import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  RefreshCw,
  ShieldCheck,
  Clock3,
  Monitor,
  Copy,
  Check,
  Sliders,
  CalendarCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api, { errorMessage } from "../services/api";
import Brand from "../components/Brand";

export default function OfficeQR() {
  const [session, setSession] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [kioskMode, setKioskMode] = useState(false);

  const autoRefreshRef = useRef(autoRefresh);
  autoRefreshRef.current = autoRefresh;

  async function fetchPolicy() {
    try {
      const { data } = await api.get("/policies/attendance");
      if (data?.policy) {
        setPolicy(data.policy);
      }
    } catch (e) {
      console.warn("Could not load policy details:", e);
    }
  }

  async function createSession(isAuto = false) {
    if (!isAuto) setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/qr/session", {
        officeLocation: "VorldX HQ Office",
      });
      const s = data.session || data;
      const token = s.token || s.qrToken || s.code;

      if (!token) {
        throw new Error("QR API response had no token.");
      }

      setSession({
        ...s,
        token,
        expiresAt: s.expiresAt,
        validitySeconds: s.validitySeconds || policy?.qrExpirySeconds || 18,
      });

      const initialSec = Math.max(
        0,
        Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSeconds(initialSec);
    } catch (e) {
      setError(errorMessage(e));
      setSession(null);
    } finally {
      if (!isAuto) setBusy(false);
    }
  }

  useEffect(() => {
    fetchPolicy();
    createSession(false);
  }, []);

  useEffect(() => {
    if (!session?.expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        if (autoRefreshRef.current) {
          createSession(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const payload = session ? session.token : "";
  const validityTotal = session?.validitySeconds || 18;
  const progressPercent = Math.min(100, Math.max(0, (seconds / validityTotal) * 100));

  function handleCopy() {
    if (!payload) return;
    navigator.clipboard?.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (kioskMode) {
    return (
      <div className="office-kiosk-fullscreen">
        <div className="kiosk-header">
          <Brand />
          <div className="kiosk-clock">
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <b>
              {new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </b>
          </div>
          <button
            className="button button-secondary"
            onClick={() => setKioskMode(false)}
          >
            Exit Kiosk Mode
          </button>
        </div>

        <div className="kiosk-body">
          <div className="kiosk-qr-card">
            <div className="qr-laser-line" />
            <QRCodeSVG
              value={payload}
              size={320}
              bgColor="#ffffff"
              fgColor="#08203a"
              level="H"
              includeMargin
            />
            <div className="kiosk-token-meta">
              <b>VORLDX RECEPTION CHECK-IN / CHECK-OUT</b>
              <span>
                Scan with VorldX Employee App · Token refreshes in {seconds}s
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">OFFICE CHECK-IN</div>
          <h1>Dynamic Office QR</h1>
          <p>
            Secure, {validityTotal}-second rolling QR tokens for employee office attendance.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button button-secondary"
            onClick={() => setKioskMode(true)}
            title="Open Dedicated Fullscreen Reception / Kiosk Screen"
          >
            <Monitor size={16} />
            <span>Kiosk Display</span>
          </button>
          <Link
            to="/settings"
            className="button button-secondary"
            title="Configure timings and QR expiry in Settings"
          >
            <Sliders size={16} />
            <span>Configure Policy</span>
          </Link>
          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh ({validityTotal}s)</span>
          </label>
          <button
            className="button button-primary"
            onClick={() => createSession(false)}
            disabled={busy}
          >
            <RefreshCw size={16} className={busy ? "spin" : ""} />
            {busy ? "Generating…" : "Refresh QR now"}
          </button>
        </div>
      </div>

      
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          marginBottom: "18px",
          backgroundColor: "#0d2238",
          borderRadius: "10px",
          border: "1px solid #1a3c61",
          color: "#b0c9e6",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CalendarCheck size={18} color="#23c8f5" />
          <span>
            <strong style={{ color: "#ffffff" }}>Office Shift:</strong>{" "}
            {policy?.officeStartTime || "09:00"} — {policy?.officeEndTime || "18:00"} IST
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock3 size={18} color="#f5a623" />
          <span>
            <strong style={{ color: "#ffffff" }}>Check-in Cutoff:</strong>{" "}
            {policy?.checkInCutoffTime || "09:30"} IST
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <QrCode size={18} color="#23c8f5" />
          <span>
            <strong style={{ color: "#ffffff" }}>QR Validity:</strong>{" "}
            {validityTotal}s Rolling
          </span>
        </div>
      </div>

      {error && (
        <div className="notice-banner notice-error">
          {error}
        </div>
      )}

      <div className="qr-layout">
        <section className="panel qr-main">
          <div className="qr-panel-head">
            <span className="qr-icon">
              <QrCode size={22} />
            </span>
            <div>
              <h2>Live Office Code</h2>
              <p>Display this screen at office entrance or reception.</p>
            </div>
            <span className={`live-badge ${seconds > 0 ? "live-active" : ""}`}>
              <i />
              {session && seconds > 0 ? "Session active" : "Expired"}
            </span>
          </div>

          <div className={`qr-display ${!session || seconds <= 0 ? "qr-empty" : ""}`}>
            {session && seconds > 0 ? (
              <div className="qr-code-box">
                <div className="qr-laser-line" />
                <QRCodeSVG
                  value={payload}
                  size={240}
                  bgColor="#ffffff"
                  fgColor="#08203a"
                  level="H"
                  includeMargin
                />
                <span>VORLDX OFFICE · DYNAMIC</span>
              </div>
            ) : error ? (
              <div className="qr-placeholder" style={{ borderColor: "#ff5c7c" }}>
                <div>
                  <QrCode size={48} color="#ff5c7c" />
                </div>
                <b style={{ color: "#ff5c7c" }}>QR Generation Failed</b>
                <p style={{ color: "#ff7b96", marginTop: 8 }}>{error}</p>
                <p style={{ color: "#7e9bb7", fontSize: 12, marginTop: 4 }}>
                  Make sure the backend is running and you are logged in as Admin or HR Admin.
                </p>
              </div>
            ) : (
              <div className="qr-placeholder">
                <div>
                  <QrCode size={48} />
                </div>
                <b>Generating new code…</b>
                <p>Connecting to secure QR service.</p>
              </div>
            )}
          </div>

          <div className="qr-timer">
            <div className="timer-icon">
              <Clock3 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span>TOKEN EXPIRY</span>
                <b>{seconds}s remaining</b>
              </div>
              <div
                style={{
                  height: 6,
                  background: "#162f4d",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                    background: seconds > 5 ? "#23c8f5" : "#ff5c7c",
                    transition: "width 1s linear",
                  }}
                />
              </div>
            </div>
          </div>

          {session && seconds > 0 && (
            <button
              className="button button-secondary qr-copy"
              onClick={handleCopy}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied token!" : "Copy active QR token"}
            </button>
          )}
        </section>

        <aside className="qr-side">
          <div className="panel qr-info">
            <div className="info-icon">
              <ShieldCheck size={22} />
            </div>
            <h3>Military-Grade Dynamic QR</h3>
            <p>
              Static QR codes allow cheating and photo sharing. VorldX generates
              cryptographically signed {validityTotal}-second rolling tokens.
            </p>
            <ul>
              <li>{validityTotal}-second rolling validity</li>
              <li>Single-use consumption prevents replay</li>
              <li>Location & device identity verified</li>
            </ul>
          </div>

          <div className="panel qr-info">
            <div className="info-icon">
              <Monitor size={22} />
            </div>
            <h3>How Check-in Works</h3>
            <ol>
              <li>Admin displays this live QR on the reception tablet/screen.</li>
              <li>Employee opens the VorldX mobile app.</li>
              <li>Employee scans the code with their camera.</li>
              <li>The server verifies freshness, location, and records check-in.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
