import { useEffect, useState, useRef } from "react";
import {
  QrCode,
  RefreshCw,
  ShieldCheck,
  Clock3,
  Monitor,
  Copy,
  Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api, { errorMessage } from "../services/api";

export default function OfficeQR() {
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const autoRefreshRef = useRef(autoRefresh);
  autoRefreshRef.current = autoRefresh;

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
        validitySeconds: s.validitySeconds || 18,
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

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">OFFICE CHECK-IN</div>
          <h1>Dynamic Office QR</h1>
          <p>
            Secure, 18-second rolling QR tokens for employee office attendance.
          </p>
        </div>
        <div className="heading-actions">
          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (18s)</span>
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
              cryptographically signed 18-second rolling tokens.
            </p>
            <ul>
              <li>18-second rolling validity</li>
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
