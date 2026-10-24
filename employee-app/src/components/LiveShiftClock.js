import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../theme/tokens";
import { useTheme } from "../context/ThemeContext";

export default function LiveShiftClock({ todayAttendance }) {
  const [currentTime, setCurrentTime] = useState("");
  const [cutoffStatus, setCutoffStatus] = useState({ text: "", isLate: false });
  const [elapsedWorkingTime, setElapsedWorkingTime] = useState("");

  let theme = null;
  try {
    theme = useTheme()?.wallpaper;
  } catch (e) {
    theme = null;
  }

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(timeStr);

      
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      const minutes = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
      const totalMinutes = hours * 60 + minutes;

      const cutoffMinutes = 9 * 60 + 30; 
      if (totalMinutes < 9 * 60) {
        const diff = 9 * 60 - totalMinutes;
        setCutoffStatus({
          text: `Shift starts in ${diff}m`,
          isLate: false,
        });
      } else if (totalMinutes <= cutoffMinutes) {
        const remaining = cutoffMinutes - totalMinutes;
        setCutoffStatus({
          text: `On-Time Window: ${remaining}m remaining`,
          isLate: false,
        });
      } else {
        setCutoffStatus({
          text: "After 9:30 AM Cutoff (Late Window)",
          isLate: true,
        });
      }

      
      if (todayAttendance?.checkInTime) {
        try {
          const checkInParts = todayAttendance.checkInTime.split(":");
          if (checkInParts.length >= 2) {
            const checkInHours = parseInt(checkInParts[0], 10);
            const checkInMins = parseInt(checkInParts[1], 10);

            
            let endHours = hours;
            let endMins = minutes;

            if (todayAttendance.checkOutTime) {
              const outParts = todayAttendance.checkOutTime.split(":");
              endHours = parseInt(outParts[0], 10);
              endMins = parseInt(outParts[1], 10);
            }

            const diffMins = Math.max(0, endHours * 60 + endMins - (checkInHours * 60 + checkInMins));
            const h = Math.floor(diffMins / 60);
            const m = diffMins % 60;
            setElapsedWorkingTime(`${h}h ${m}m`);
          }
        } catch {
          setElapsedWorkingTime("");
        }
      } else {
        setElapsedWorkingTime("");
      }
    }

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [todayAttendance]);

  return (
    <View
      style={[
        styles.container,
        theme && {
          backgroundColor: theme.surfaceWatery,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.liveClockWrapper}>
          <View
            style={[
              styles.pulsingDot,
              theme && { backgroundColor: theme.primary },
            ]}
          />
          <Text
            style={[
              styles.clockText,
              theme && { color: theme.textPrimary },
            ]}
          >
            {currentTime || "--:--:--"}
          </Text>
          <Text
            style={[
              styles.timezoneLabel,
              theme && { color: theme.primary },
            ]}
          >
            IST
          </Text>
        </View>

        <View
          style={[
            styles.cutoffPill,
            cutoffStatus.isLate ? styles.latePill : styles.onTimePill,
          ]}
        >
          <Ionicons
            name={cutoffStatus.isLate ? "time-outline" : "checkmark-circle-outline"}
            size={13}
            color={cutoffStatus.isLate ? "#B45309" : "#15803D"}
          />
          <Text
            style={[
              styles.cutoffText,
              cutoffStatus.isLate ? styles.lateText : styles.onTimeText,
            ]}
          >
            {cutoffStatus.text}
          </Text>
        </View>
      </View>

      {Boolean(elapsedWorkingTime) && (
        <View style={styles.durationRow}>
          <View style={styles.durationLeft}>
            <Ionicons name="timer-outline" size={15} color={theme?.primary || colors.primary} />
            <Text style={[styles.durationLabel, theme && { color: theme.textSecondary }]}>
              {todayAttendance?.checkOutTime ? "Total Working Time:" : "Live Working Time:"}
            </Text>
          </View>
          <Text style={[styles.durationValue, theme && { color: theme.primary }]}>{elapsedWorkingTime}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceWatery,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  liveClockWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  clockText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  timezoneLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 6,
  },
  cutoffPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    gap: 4,
  },
  onTimePill: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  latePill: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  cutoffText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  onTimeText: {
    color: "#15803D",
  },
  lateText: {
    color: "#B45309",
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  durationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  durationLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  durationValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primaryDark,
  },
});
