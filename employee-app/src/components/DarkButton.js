import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { colors, radii, shadows } from "../theme/tokens";

export default function DarkButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon = null,
  variant = "primary",
  style,
  textStyle,
}) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isDanger = variant === "danger";

  let containerStyle = styles.primaryButton;
  let labelStyle = styles.primaryText;

  if (isSecondary) {
    containerStyle = styles.secondaryButton;
    labelStyle = styles.secondaryText;
  } else if (isDanger) {
    containerStyle = styles.dangerButton;
    labelStyle = styles.dangerText;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        containerStyle,
        isPrimary && shadows.darkButton,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isSecondary ? colors.darkButton : "#FFFFFF"}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={[styles.baseText, labelStyle, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    flexDirection: "row",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    marginRight: 8,
  },
  baseText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  primaryButton: {
    backgroundColor: colors.darkButton,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  primaryText: {
    color: colors.darkButtonText,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.borderWatery,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  dangerButton: {
    backgroundColor: "#DC2626",
    borderWidth: 1,
    borderColor: "#B91C1C",
  },
  dangerText: {
    color: "#FFFFFF",
  },
  disabled: {
    opacity: 0.5,
  },
});
