import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Users,
  CalendarCheck,
  ClipboardCheck,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { errorMessage, getToken } from "../services/api";
import { VLogo, SecureNote } from "../components/Brand";
import "../styles/login.css";

const features = [
  { icon: Users, lines: ["Manage", "Employees"] },
  { icon: CalendarCheck, lines: ["Track", "Attendance"] },
  { icon: ClipboardCheck, lines: ["Handle", "Approvals"] },
  { icon: ChartNoAxesCombined, lines: ["Generate", "Reports"] },
];

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (loading) {
    return (
      <div className="full-loader">
        <span className="loader-ring" />
        <p>Preparing your workspace...</p>
      </div>
    );
  }

  if (user && getToken()) {
    const destination =
      user.role === "EMPLOYEE"
        ? "/unauthorized"
        : location.state?.from?.pathname || "/dashboard";

    return <Navigate to={destination} replace />;
  }

  async function submit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      await login(email, password, remember);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="login-glow glow-one" />
      <div className="login-glow glow-two" />
      <div className="login-water water-back" />
      <div className="login-water water-front" />
      <div className="login-dots dots-left" />
      <div className="login-dots dots-right" />

      <section className="login-intro">
        <div className="login-logo">
          <VLogo size={78} id="vlogo-login" />
          <span>
            Vorld<b>X</b>
          </span>
        </div>

        <h1>Employee Management System</h1>

        <p>
          Simplify attendance, streamline HR operations,
          <br />
          create a better workplace.
        </p>

        <div className="feature-grid">
          {features.map(({ icon: Icon, lines }) => (
            <div className="feature-item" key={lines.join(" ")}>
              <div className="feature-icon">
                <Icon size={24} />
              </div>
              <span>{lines[0]}</span>
              <span>{lines[1]}</span>
            </div>
          ))}
        </div>

        <div className="trust-line">
          <ShieldCheck size={18} />
          <span>Secure</span>
          <i />
          <span>Reliable</span>
          <i />
          <span>Trusted</span>
        </div>
      </section>

      <section className="login-card-wrap">
        <div className="login-card">
          <div className="login-card-mark">
            <VLogo size={30} id="vlogo-card" />
          </div>

          <h2>
            Welcome <span>Back</span>
          </h2>

          <p className="login-subtitle">
            Sign in to manage employees and HR operations.
          </p>

          <form onSubmit={submit} className="login-form">
            <div className="input-with-icon">
              <Mail size={20} />

              <div className="field-body">
                <label htmlFor="login-email">Email address</label>

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@company.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="input-with-icon">
              <LockKeyhole size={20} />

              <div className="field-body">
                <label htmlFor="login-password">Password</label>

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="login-options">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-link"
                onClick={() =>
                  setInfo(
                    "Password resets are handled by your Super Admin. Please contact them to reset your password."
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            {info && <div className="login-info">{info}</div>}

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="sign-in-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <b>OR</b>
            <span />
          </div>

          <SecureNote />
        </div>
      </section>
    </main>
  );
}
