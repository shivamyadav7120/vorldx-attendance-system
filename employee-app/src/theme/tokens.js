/**
 * VorldX Enterprise Design Tokens
 * Watery Blue Palette with High-Contrast Dark Buttons
 */

export const colors = {
  // Watery Blue Palette (Base & Surfaces)
  bgWatery: "#F0F7FD",        // Crisp slight watery blue background
  bgWateryLight: "#F8FBFE",   // Ultra-light watery surface
  bgWateryDeep: "#E0F2FE",    // Light aqua tint for highlights
  bgWateryGlow: "#BAE6FD",    // Watery glow and focus borders
  
  // Card & Surface Fills
  surface: "#FFFFFF",
  surfaceFrosted: "rgba(255, 255, 255, 0.94)",
  surfaceWatery: "#F4F9FD",
  
  // Borders
  borderLight: "#E1EEF8",
  borderWatery: "#CFE4F5",
  borderWateryActive: "#7DD3FC",

  // High-Contrast Dark Buttons & Action Bars
  darkButton: "#0F172A",       // Slate 900 midnight obsidian
  darkButtonHover: "#1E293B",  // Slate 800
  darkButtonText: "#FFFFFF",   // Pure white typography
  darkButtonSecondary: "#1E293B",
  darkButtonSecondaryBorder: "#334155",

  // Primary Brand / Water Accents
  primary: "#0284C7",          // Deep azure sky
  primaryLight: "#38BDF8",     // Bright watery cyan
  primaryDark: "#0369A1",
  primaryGhost: "#E0F2FE",

  // Typography Colors
  textPrimary: "#0F172A",      // Midnight slate
  textSecondary: "#475569",    // Slate 600
  textMuted: "#94A3B8",        // Slate 400
  textWatery: "#0369A1",       // Ocean blue label

  // Status & Feedback Badges
  status: {
    present: {
      bg: "#DCFCE7",
      border: "#86EFAC",
      text: "#15803D",
      dot: "#22C55E",
      label: "PRESENT",
    },
    late: {
      bg: "#FEF3C7",
      border: "#FDE68A",
      text: "#B45309",
      dot: "#F59E0B",
      label: "LATE",
    },
    halfDay: {
      bg: "#E0F2FE",
      border: "#7DD3FC",
      text: "#0369A1",
      dot: "#0284C7",
      label: "HALF DAY",
    },
    wfh: {
      bg: "#F0FDF4",
      border: "#BBF7D0",
      text: "#166534",
      dot: "#10B981",
      label: "WFH",
    },
    absent: {
      bg: "#FEE2E2",
      border: "#FCA5A5",
      text: "#B91C1C",
      dot: "#EF4444",
      label: "ABSENT",
    },
    pending: {
      bg: "#FFFBEB",
      border: "#FDE68A",
      text: "#B45309",
      dot: "#F59E0B",
      label: "PENDING",
    },
    approved: {
      bg: "#DCFCE7",
      border: "#86EFAC",
      text: "#15803D",
      dot: "#22C55E",
      label: "APPROVED",
    },
    rejected: {
      bg: "#FEE2E2",
      border: "#FCA5A5",
      text: "#B91C1C",
      dot: "#EF4444",
      label: "REJECTED",
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  darkButton: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBar: {
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
};

export default {
  colors,
  spacing,
  radii,
  shadows,
};
