import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import { useTheme } from "../context/ThemeContext";

export default function WateryCard({
  children,
  style,
  tint = false,
  elevated = true,
}) {
  let theme = null;
  try {
    theme = useTheme()?.wallpaper;
  } catch (e) {
    theme = null;
  }

  const cardBg = tint
    ? (theme?.surfaceWatery || colors.surfaceWatery)
    : (theme?.surface || colors.surface);

  const cardBorder = tint
    ? (theme?.cardBorderActive || colors.borderWateryActive)
    : (theme?.cardBorder || colors.borderWatery);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
        elevated && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.2,
  },
});
