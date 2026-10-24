import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WALLPAPER_STORAGE_KEY = "@vorldx_inside_wallpaper";

export const WALLPAPERS = [
  {
    id: "ocean-abyss",
    name: "Ocean Abyss",
    tagline: "Deep oceanic mirror with glowing cyan caustics",
    baseBg: "#040915",
    surface: "rgba(10, 24, 48, 0.92)",
    surfaceWatery: "rgba(14, 34, 68, 0.78)",
    cardBorder: "rgba(56, 189, 248, 0.28)",
    cardBorderActive: "#00F0FF",
    textPrimary: "#F0F9FF",
    textSecondary: "#93C5FD",
    textMuted: "#64748B",
    primary: "#00F0FF",
    primaryDark: "#0284C7",
    primaryGhost: "rgba(0, 240, 255, 0.15)",
    orb1Color: "rgba(0, 240, 255, 0.2)",
    orb2Color: "rgba(2, 132, 199, 0.26)",
    orb3Color: "rgba(14, 165, 233, 0.18)",
    statusBar: "light",
    isDark: true,
  },
  {
    id: "cyber-aqua",
    name: "Cyber Aqua Glass",
    tagline: "Electric neon reflections & high-tech navy",
    baseBg: "#061326",
    surface: "rgba(8, 28, 56, 0.92)",
    surfaceWatery: "rgba(12, 42, 82, 0.8)",
    cardBorder: "rgba(0, 240, 255, 0.35)",
    cardBorderActive: "#00F0FF",
    textPrimary: "#F8FAFC",
    textSecondary: "#A5F3FC",
    textMuted: "#64748B",
    primary: "#38BDF8",
    primaryDark: "#0284C7",
    primaryGhost: "rgba(56, 189, 248, 0.16)",
    orb1Color: "rgba(56, 189, 248, 0.22)",
    orb2Color: "rgba(0, 240, 255, 0.18)",
    orb3Color: "rgba(3, 105, 161, 0.25)",
    statusBar: "light",
    isDark: true,
  },
  {
    id: "midnight-sapphire",
    name: "Midnight Sapphire",
    tagline: "Royal deep sapphire with electric blue wave glow",
    baseBg: "#030B1C",
    surface: "rgba(13, 27, 62, 0.92)",
    surfaceWatery: "rgba(20, 39, 88, 0.78)",
    cardBorder: "rgba(96, 165, 250, 0.32)",
    cardBorderActive: "#60A5FA",
    textPrimary: "#F1F5F9",
    textSecondary: "#93C5FD",
    textMuted: "#64748B",
    primary: "#60A5FA",
    primaryDark: "#2563EB",
    primaryGhost: "rgba(96, 165, 250, 0.16)",
    orb1Color: "rgba(37, 99, 235, 0.24)",
    orb2Color: "rgba(147, 197, 253, 0.15)",
    orb3Color: "rgba(30, 64, 175, 0.28)",
    statusBar: "light",
    isDark: true,
  },
  {
    id: "aqua-mirror-light",
    name: "Aqua Mirror Light",
    tagline: "Crisp daylight reflection with crystal water sheen",
    baseBg: "#F0F7FD",
    surface: "#FFFFFF",
    surfaceWatery: "#EAF4FD",
    cardBorder: "#CFE4F5",
    cardBorderActive: "#7DD3FC",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    primary: "#0284C7",
    primaryDark: "#0369A1",
    primaryGhost: "rgba(2, 132, 199, 0.1)",
    orb1Color: "rgba(186, 230, 253, 0.5)",
    orb2Color: "rgba(224, 242, 254, 0.7)",
    orb3Color: "rgba(56, 189, 248, 0.25)",
    statusBar: "dark",
    isDark: false,
  },
  {
    id: "tropical-horizon",
    name: "Tropical Horizon",
    tagline: "Teal lagoon & turquoise sunset reflections",
    baseBg: "#041B26",
    surface: "rgba(6, 38, 54, 0.92)",
    surfaceWatery: "rgba(10, 54, 76, 0.8)",
    cardBorder: "rgba(45, 212, 191, 0.32)",
    cardBorderActive: "#2DD4BF",
    textPrimary: "#F0FDFA",
    textSecondary: "#99F6E4",
    textMuted: "#5EEAD4",
    primary: "#2DD4BF",
    primaryDark: "#0D9488",
    primaryGhost: "rgba(45, 212, 191, 0.16)",
    orb1Color: "rgba(45, 212, 191, 0.22)",
    orb2Color: "rgba(20, 184, 166, 0.24)",
    orb3Color: "rgba(13, 148, 136, 0.28)",
    statusBar: "light",
    isDark: true,
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [wallpaperId, setWallpaperId] = useState("ocean-abyss");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedWallpaper() {
      try {
        const saved = await AsyncStorage.getItem(WALLPAPER_STORAGE_KEY);
        if (saved && WALLPAPERS.some((w) => w.id === saved)) {
          setWallpaperId(saved);
        }
      } catch (err) {
        console.warn("Could not load wallpaper setting:", err);
      } finally {
        setLoaded(true);
      }
    }
    loadSavedWallpaper();
  }, []);

  async function changeWallpaper(id) {
    if (!WALLPAPERS.some((w) => w.id === id)) return;
    setWallpaperId(id);
    try {
      await AsyncStorage.setItem(WALLPAPER_STORAGE_KEY, id);
    } catch (err) {
      console.warn("Could not persist wallpaper setting:", err);
    }
  }

  const currentWallpaper =
    WALLPAPERS.find((w) => w.id === wallpaperId) || WALLPAPERS[0];

  return (
    <ThemeContext.Provider
      value={{
        wallpaper: currentWallpaper,
        wallpapers: WALLPAPERS,
        wallpaperId,
        changeWallpaper,
        loaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
