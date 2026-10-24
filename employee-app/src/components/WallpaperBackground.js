import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WallpaperBackground({ children, style }) {
  const { wallpaper } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: wallpaper.baseBg }, style]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View
          style={[
            styles.causticOrb,
            styles.orb1,
            {
              backgroundColor: wallpaper.orb1Color,
              shadowColor: wallpaper.primary,
            },
          ]}
        />
        <View
          style={[
            styles.causticOrb,
            styles.orb2,
            {
              backgroundColor: wallpaper.orb2Color,
              shadowColor: wallpaper.primaryDark,
            },
          ]}
        />
        <View
          style={[
            styles.causticOrb,
            styles.orb3,
            {
              backgroundColor: wallpaper.orb3Color,
              shadowColor: wallpaper.cardBorderActive,
            },
          ]}
        />

        <View
          style={[
            styles.waterWaveBand,
            styles.waveTop,
            {
              borderColor: wallpaper.cardBorder,
            },
          ]}
        />
        <View
          style={[
            styles.waterWaveBand,
            styles.waveBottom,
            {
              borderColor: wallpaper.cardBorder,
            },
          ]}
        />

        <View
          style={[
            styles.sheenOverlay,
            {
              backgroundColor: wallpaper.isDark
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(255, 255, 255, 0.4)",
            },
          ]}
        />
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  causticOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  orb1: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_WIDTH * 0.95,
    top: -SCREEN_WIDTH * 0.25,
    right: -SCREEN_WIDTH * 0.2,
  },
  orb2: {
    width: SCREEN_WIDTH * 1.1,
    height: SCREEN_WIDTH * 1.1,
    bottom: -SCREEN_WIDTH * 0.35,
    left: -SCREEN_WIDTH * 0.3,
  },
  orb3: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    top: SCREEN_HEIGHT * 0.4,
    right: -SCREEN_WIDTH * 0.25,
  },
  waterWaveBand: {
    position: "absolute",
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.4,
    borderWidth: 1.5,
    borderRadius: 999,
    opacity: 0.25,
  },
  waveTop: {
    top: SCREEN_HEIGHT * 0.18,
    height: 140,
    transform: [{ rotate: "-12deg" }],
  },
  waveBottom: {
    bottom: SCREEN_HEIGHT * 0.22,
    height: 180,
    transform: [{ rotate: "14deg" }],
  },
  sheenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
});
