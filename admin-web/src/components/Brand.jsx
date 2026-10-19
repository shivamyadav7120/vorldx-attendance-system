import React from "react";
import { ShieldCheck } from "lucide-react";

export function VLogo({ size = 40, id = "vlogo" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="v-logo"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2fd8ff" />
          <stop offset="1" stopColor="#1668ff" />
        </linearGradient>
      </defs>
      <path d="M3 8h17l12 31L44 8h17L40 58H24z" fill={`url(#${id})`} />
    </svg>
  );
}

export default function Brand() {
  return (
    <div className="brand">
      <VLogo size={38} id="vlogo-side" />

      <div className="brand-copy">
        <div className="brand-name">
          Vorld<span>X</span>
        </div>
        <div className="brand-tagline">EMPLOYEE MANAGEMENT</div>
      </div>
    </div>
  );
}

export function SecureNote() {
  return (
    <div className="secure-note">
      <ShieldCheck size={17} />
      <span>Secure access for authorized administrators</span>
    </div>
  );
}
