import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import WateryCard from "../components/WateryCard";
import StatusBadge from "../components/StatusBadge";
import { useTheme } from "../context/ThemeContext";

export default function HistoryScreen({ onBack }) {
  const { wallpaper } = useTheme();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadHistory() {
    try {
      const res = await api.getMyAttendance();
      const list = res.attendance || res.records || [];
      list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setRecords(list);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeFilter === "ALL") {
      setFilteredRecords(records);
    } else if (activeFilter === "PRESENT") {
      setFilteredRecords(records.filter((r) => r.status === "PRESENT"));
    } else if (activeFilter === "LATE") {
      setFilteredRecords(records.filter((r) => r.status === "LATE"));
    } else if (activeFilter === "WFH") {
      setFilteredRecords(records.filter((r) => r.mode === "WFH"));
    }
  }, [records, activeFilter]);

  const totalDays = records.length;
  const onTimeDays = records.filter((r) => r.status === "PRESENT").length;
  const lateDays = records.filter((r) => r.status === "LATE").length;

  function renderItem({ item }) {
    const itemDate = new Date(item.date);
    const dayStr = itemDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const weekdayStr = itemDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    });

    return (
      <WateryCard style={styles.recordCard} elevated>
        <View style={styles.recordHeader}>
          <View>
            <Text style={[styles.recordDate, wallpaper && { color: wallpaper.textPrimary }]}>{dayStr}</Text>
            <Text style={[styles.recordWeekday, wallpaper && { color: wallpaper.textSecondary }]}>{weekdayStr}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={[styles.timesRow, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder }]}>
          <View style={styles.timeColumn}>
            <Text style={[styles.timeLabel, wallpaper && { color: wallpaper.textSecondary }]}>CHECK-IN</Text>
            <Text style={[styles.timeValue, wallpaper && { color: wallpaper.textPrimary }]}>
              {item.checkIn
                ? new Date(item.checkIn).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })
                : "—:—"}
            </Text>
          </View>

          <View style={[styles.timeDivider, wallpaper && { backgroundColor: wallpaper.cardBorder }]} />

          <View style={styles.timeColumn}>
            <Text style={[styles.timeLabel, wallpaper && { color: wallpaper.textSecondary }]}>CHECK-OUT</Text>
            <Text style={[styles.timeValue, wallpaper && { color: wallpaper.textPrimary }]}>
              {item.checkOut
                ? new Date(item.checkOut).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })
                : "—:—"}
            </Text>
          </View>

          <View style={[styles.timeDivider, wallpaper && { backgroundColor: wallpaper.cardBorder }]} />

          <View style={styles.timeColumn}>
            <Text style={[styles.timeLabel, wallpaper && { color: wallpaper.textSecondary }]}>MODE</Text>
            <Text style={[styles.timeValue, wallpaper && { color: wallpaper.primary }]}>{item.mode || "OFFICE"}</Text>
          </View>
        </View>

        {item.notes ? (
          <View style={[styles.notesBox, wallpaper && { backgroundColor: wallpaper.surfaceWatery }]}>
            <Ionicons name="information-circle-outline" size={14} color={wallpaper?.primary || colors.primary} />
            <Text style={[styles.notesText, wallpaper && { color: wallpaper.textSecondary }]}>{item.notes}</Text>
          </View>
        ) : null}
      </WateryCard>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={[styles.backBtn, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={wallpaper?.textPrimary || colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, wallpaper && { color: wallpaper.textPrimary }]}>Attendance History</Text>
          <Text style={[styles.headerSubtitle, wallpaper && { color: wallpaper.textSecondary }]}>Verified check-in & check-out logs</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshIconBtn, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
          onPress={() => {
            setRefreshing(true);
            loadHistory();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={wallpaper?.primary || colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsStrip, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, wallpaper && { color: wallpaper.textPrimary }]}>{totalDays}</Text>
          <Text style={[styles.statLabel, wallpaper && { color: wallpaper.textSecondary }]}>Total Days</Text>
        </View>
        <View style={[styles.statDivider, wallpaper && { backgroundColor: wallpaper.cardBorder }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#34D399" }]}>{onTimeDays}</Text>
          <Text style={[styles.statLabel, wallpaper && { color: wallpaper.textSecondary }]}>On-Time</Text>
        </View>
        <View style={[styles.statDivider, wallpaper && { backgroundColor: wallpaper.cardBorder }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#F59E0B" }]}>{lateDays}</Text>
          <Text style={[styles.statLabel, wallpaper && { color: wallpaper.textSecondary }]}>Late Marks</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {["ALL", "PRESENT", "LATE", "WFH"].map((f) => {
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder },
                isActive && [
                  styles.filterChipActive,
                  wallpaper?.isDark
                    ? { backgroundColor: wallpaper.primary, borderColor: wallpaper.primary }
                    : { backgroundColor: colors.darkButton, borderColor: colors.darkButton },
                ],
              ]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  wallpaper && { color: wallpaper.textSecondary },
                  isActive && {
                    color: wallpaper?.isDark ? "#040915" : "#FFFFFF",
                    fontWeight: "900",
                  },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={wallpaper?.primary || colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadHistory();
              }}
              tintColor={wallpaper?.primary || colors.primary}
            />
          }
          ListEmptyComponent={
            <WateryCard style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={44} color={wallpaper?.primary || colors.primary} />
              <Text style={[styles.emptyTitle, wallpaper && { color: wallpaper.textPrimary }]}>No attendance records found</Text>
              <Text style={[styles.emptySub, wallpaper && { color: wallpaper.textSecondary }]}>
                {activeFilter === "ALL"
                  ? "Scan the office screen QR code during work hours to start your logs."
                  : `No records matching the filter: ${activeFilter}`}
              </Text>
            </WateryCard>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  statsStrip: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    paddingVertical: 12,
    alignItems: "center",
    ...shadows.card,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderWatery,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: 8,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
  },
  filterChipActive: {
    backgroundColor: colors.darkButton,
    borderColor: colors.darkButton,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  recordCard: {
    padding: spacing.md,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  recordDate: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  recordWeekday: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceWatery,
    borderRadius: radii.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  timeDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderWatery,
  },
  timeColumn: {
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgWateryDeep,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.md,
    gap: 6,
  },
  notesText: {
    fontSize: 11.5,
    color: colors.textWatery,
    fontWeight: "500",
    flex: 1,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
