import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export default function WateryCard({
  children,
  style,
  tint = false, // if true, uses subtle translucent watery blue tint
  elevated = true,
}) {
  return (
    <View
      style={[
        styles.card,
        tint ? styles.tinted : styles.plain,
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
    borderWidth: 1,
    borderColor: colors.borderWatery,
  },
  plain: {
    backgroundColor: colors.surface,
  },
  tinted: {
    backgroundColor: colors.surfaceWatery,
    borderColor: colors.borderWateryActive,
  },
});
