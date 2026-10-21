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

export default function HistoryScreen({ onBack }) {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadHistory() {
    try {
      const res = await api.getMyAttendance();
      const list = res.attendance || res.records || [];
      // Sort newest date first
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

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Attendance History</Text>
          <Text style={styles.headerSubtitle}>Verified check-in & check-out logs</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={() => {
            setRefreshing(true);
            loadHistory();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalDays}</Text>
          <Text style={styles.statLabel}>Total Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#15803D" }]}>{onTimeDays}</Text>
          <Text style={styles.statLabel}>On-Time</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#B45309" }]}>{lateDays}</Text>
          <Text style={styles.statLabel}>Late Marks</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {["ALL", "PRESENT", "LATE", "WFH"].map((f) => {
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading attendance logs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item, index) => item._id || item.date || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadHistory();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <WateryCard style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptySub}>
                {activeFilter === "ALL"
                  ? "You haven't recorded any attendance logs yet."
                  : `No attendance records match the filter '${activeFilter}'.`}
              </Text>
            </WateryCard>
          }
          renderItem={({ item }) => {
            const checkInFormatted = item.checkIn
              ? new Date(item.checkIn).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                })
              : "—:—";

            const checkOutFormatted = item.checkOut
              ? new Date(item.checkOut).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                })
              : "—:—";

            const isOffice = item.mode === "OFFICE";

            return (
              <WateryCard style={styles.recordCard} elevated>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardDate}>{item.date}</Text>
                    <View style={styles.modeRow}>
                      <Ionicons
                        name={isOffice ? "business-outline" : "laptop-outline"}
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.cardModeText}>
                        {isOffice ? "Office QR Verification" : "Remote WFH"}
                      </Text>
                    </View>
                  </View>

                  <StatusBadge status={item.status} size="sm" />
                </View>

                {/* In / Out Time Row */}
                <View style={styles.timeRow}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>CHECK-IN</Text>
                    <Text style={styles.timeValue}>{checkInFormatted}</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={16} color={colors.borderWateryActive} />

                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>CHECK-OUT</Text>
                    <Text style={styles.timeValue}>{checkOutFormatted}</Text>
                  </View>
                </View>

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Ionicons name="information-circle" size={14} color={colors.primary} />
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}
              </WateryCard>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgWatery,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBox: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWatery,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWatery,
    paddingVertical: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
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
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
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
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 32,
  },
  recordCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  cardModeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceWatery,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
