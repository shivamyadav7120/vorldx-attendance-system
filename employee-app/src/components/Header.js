import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export default function Header({ user, onProfilePress, rightAction = null }) {
  const initials = (user?.name || "VX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onProfilePress}
          style={styles.avatarButton}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.textColumn}>
          <Text style={styles.greeting}>VORLDX INDUSTRIES</Text>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name || "Employee Portal"}
          </Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {rightAction || (
          <View style={styles.statusPill}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusPillText}>Active</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgWatery,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarButton: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.darkButton,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.borderWateryActive,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  textColumn: {
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
});
