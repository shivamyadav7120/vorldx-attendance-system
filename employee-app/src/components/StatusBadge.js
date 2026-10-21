import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radii } from "../theme/tokens";

export default function StatusBadge({ status, label, style, size = "md" }) {
  const norm = String(status || "").toUpperCase();
  let conf = colors.status.pending;

  if (norm.includes("PRESENT") || norm === "APPROVED") {
    conf = colors.status.present;
  } else if (norm.includes("LATE")) {
    conf = colors.status.late;
  } else if (norm.includes("HALF")) {
    conf = colors.status.halfDay;
  } else if (norm.includes("WFH")) {
    conf = colors.status.wfh;
  } else if (norm.includes("ABSENT") || norm === "REJECTED") {
    conf = colors.status.absent;
  } else if (norm.includes("PENDING")) {
    conf = colors.status.pending;
  }

  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: conf.bg,
          borderColor: conf.border,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 8 : 10,
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: conf.dot }]} />
      <Text
        style={[
          styles.text,
          {
            color: conf.text,
            fontSize: isSmall ? 10.5 : 12,
          },
        ]}
      >
        {label || norm || conf.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
