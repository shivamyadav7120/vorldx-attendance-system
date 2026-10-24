import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import WateryCard from "../components/WateryCard";
import DarkButton from "../components/DarkButton";
import StatusBadge from "../components/StatusBadge";
import ConfirmationModal from "../components/ConfirmationModal";
import { useTheme } from "../context/ThemeContext";

const LEAVE_TYPES = [
  { id: "Casual", label: "Casual Leave", icon: "sunny-outline" },
  { id: "Sick", label: "Sick Leave", icon: "medkit-outline" },
  { id: "Earned", label: "Earned / Annual", icon: "briefcase-outline" },
  { id: "Emergency", label: "Emergency", icon: "alert-circle-outline" },
  { id: "Unpaid", label: "Unpaid Leave", icon: "calendar-outline" },
];

export default function LeaveScreen({ onBack }) {
  const { wallpaper } = useTheme();
  const [activeTab, setActiveTab] = useState("MY_LEAVES");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  async function loadRequests() {
    try {
      const res = await api.getMyLeaveRequests();
      setRequests(res.requests || []);
    } catch (e) {
      console.error("Failed to load leave requests:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function countDays(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }

  const selectedDays = countDays(startDate, endDate);

  async function handleApply() {
    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please provide start and end dates (YYYY-MM-DD).");
      return;
    }

    setSubmitting(true);
    try {
      await api.submitLeaveRequest(leaveType, startDate, endDate, reason.trim());
      Alert.alert("Success", `${leaveType} leave application submitted successfully!`);
      setActiveTab("MY_LEAVES");
      setReason("");
      loadRequests();
    } catch (err) {
      Alert.alert("Submission Failed", err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function executeCancel() {
    if (!cancelTargetId) return;
    setCancelling(true);
    try {
      await api.cancelLeave(cancelTargetId);
      setCancelTargetId(null);
      Alert.alert("Success", "Leave request cancelled.");
      loadRequests();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setCancelling(false);
    }
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
          <Text style={[styles.headerTitle, wallpaper && { color: wallpaper.textPrimary }]}>Leave Applications</Text>
          <Text style={[styles.headerSubtitle, wallpaper && { color: wallpaper.textSecondary }]}>Planned time off & entitlements</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshIconBtn, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
          onPress={() => {
            setRefreshing(true);
            loadRequests();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={wallpaper?.primary || colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "MY_LEAVES" && (wallpaper?.isDark
              ? { backgroundColor: wallpaper.primary }
              : styles.tabButtonActive),
          ]}
          onPress={() => setActiveTab("MY_LEAVES")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={activeTab === "MY_LEAVES" ? (wallpaper?.isDark ? "#040915" : "#FFFFFF") : (wallpaper?.textSecondary || colors.textSecondary)}
          />
          <Text
            style={[
              styles.tabText,
              wallpaper && { color: wallpaper.textSecondary },
              activeTab === "MY_LEAVES" && {
                color: wallpaper?.isDark ? "#040915" : "#FFFFFF",
                fontWeight: "900",
              },
            ]}
          >
            My Leaves ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "APPLY" && (wallpaper?.isDark
              ? { backgroundColor: wallpaper.primary }
              : styles.tabButtonActive),
          ]}
          onPress={() => setActiveTab("APPLY")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={activeTab === "APPLY" ? (wallpaper?.isDark ? "#040915" : "#FFFFFF") : (wallpaper?.textSecondary || colors.textSecondary)}
          />
          <Text
            style={[
              styles.tabText,
              wallpaper && { color: wallpaper.textSecondary },
              activeTab === "APPLY" && {
                color: wallpaper?.isDark ? "#040915" : "#FFFFFF",
                fontWeight: "900",
              },
            ]}
          >
            Apply for Leave
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "MY_LEAVES" ? (
        loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator color={wallpaper?.primary || colors.primary} size="large" />
            <Text style={[styles.loadingText, wallpaper && { color: wallpaper.textSecondary }]}>Loading leave applications...</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadRequests();
                }}
                tintColor={wallpaper?.primary || colors.primary}
              />
            }
            ListEmptyComponent={
              <WateryCard style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={44} color={wallpaper?.primary || colors.primary} />
                <Text style={[styles.emptyTitle, wallpaper && { color: wallpaper.textPrimary }]}>No Leave Applications</Text>
                <Text style={[styles.emptySub, wallpaper && { color: wallpaper.textSecondary }]}>
                  You haven't submitted any leave requests yet.
                </Text>
              </WateryCard>
            }
            renderItem={({ item }) => {
              const startFormatted = new Date(item.startDate).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const endFormatted = new Date(item.endDate).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const isPending = item.status === "PENDING" || item.status === "HR_APPROVED";

              return (
                <WateryCard style={styles.requestCard} elevated>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateBlock}>
                      <View style={[styles.typeBadge, wallpaper?.isDark && { backgroundColor: "rgba(3, 105, 161, 0.3)" }]}>
                        <Text style={[styles.typeBadgeText, wallpaper?.isDark && { color: wallpaper.primary }]}>{item.leaveType || item.type || "Casual"} Leave</Text>
                      </View>
                      <Text style={[styles.dateRange, wallpaper && { color: wallpaper.textPrimary }]}>
                        {startFormatted === endFormatted ? startFormatted : `${startFormatted} → ${endFormatted}`}
                      </Text>
                      <Text style={[styles.daysCount, wallpaper && { color: wallpaper.textSecondary }]}>
                        {item.daysRequested || 1} day{(item.daysRequested || 1) > 1 ? "s" : ""}
                      </Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>

                  {item.reason ? (
                    <Text style={[styles.reasonText, wallpaper && { color: wallpaper.textSecondary }]}>{item.reason}</Text>
                  ) : null}

                  {isPending && (
                    <TouchableOpacity
                      style={styles.cancelAction}
                      onPress={() => setCancelTargetId(item._id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.cancelActionText}>Cancel Application</Text>
                    </TouchableOpacity>
                  )}
                </WateryCard>
              );
            }}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <WateryCard style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Ionicons name="information-circle" size={18} color={wallpaper?.primary || colors.primary} />
              <Text style={[styles.policyTitle, wallpaper && { color: wallpaper.primary }]}>Leave Application Policy</Text>
            </View>
            <Text style={[styles.policyItem, wallpaper && { color: wallpaper.textSecondary }]}>
              • Requests are reviewed by HR Operations and subject to team coverage.
            </Text>
            <Text style={[styles.policyItem, wallpaper && { color: wallpaper.textSecondary }]}>
              • For Sick Leave lasting more than 2 consecutive days, medical fitness certificate may be requested.
            </Text>
            <Text style={[styles.policyItem, wallpaper && { color: wallpaper.textSecondary }]}>
              • Cancelled requests before approval restore your entitlement balance.
            </Text>
          </WateryCard>

          <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>SELECT LEAVE TYPE</Text>
          <View style={styles.chipsContainer}>
            {LEAVE_TYPES.map((lt) => {
              const isSelected = leaveType === lt.id;
              return (
                <TouchableOpacity
                  key={lt.id}
                  style={[
                    styles.chip,
                    wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder },
                    isSelected && [
                      styles.chipActive,
                      wallpaper?.isDark && { backgroundColor: wallpaper.primary, borderColor: wallpaper.primary },
                    ],
                  ]}
                  onPress={() => setLeaveType(lt.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={lt.icon}
                    size={15}
                    color={isSelected ? (wallpaper?.isDark ? "#040915" : "#FFFFFF") : (wallpaper?.textSecondary || colors.textSecondary)}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      wallpaper && { color: wallpaper.textSecondary },
                      isSelected && {
                        color: wallpaper?.isDark ? "#040915" : "#FFFFFF",
                        fontWeight: "900",
                      },
                    ]}
                  >
                    {lt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dateInputsRow}>
            <View style={styles.dateCol}>
              <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>START DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  wallpaper?.isDark && { backgroundColor: "rgba(5, 17, 36, 0.85)", borderColor: wallpaper.cardBorder, color: wallpaper.textPrimary },
                ]}
                placeholder="2026-10-25"
                placeholderTextColor={wallpaper?.isDark ? "#64748B" : colors.textMuted}
                value={startDate}
                onChangeText={setStartDate}
                maxLength={10}
              />
            </View>

            <View style={styles.dateCol}>
              <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>END DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  wallpaper?.isDark && { backgroundColor: "rgba(5, 17, 36, 0.85)", borderColor: wallpaper.cardBorder, color: wallpaper.textPrimary },
                ]}
                placeholder="2026-10-27"
                placeholderTextColor={wallpaper?.isDark ? "#64748B" : colors.textMuted}
                value={endDate}
                onChangeText={setEndDate}
                maxLength={10}
              />
            </View>
          </View>

          {selectedDays > 0 && (
            <View style={[styles.durationBadgeRow, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder }]}>
              <Ionicons name="time-outline" size={16} color={wallpaper?.primary || colors.primary} />
              <Text style={[styles.durationBadgeText, wallpaper && { color: wallpaper.textSecondary }]}>
                Duration: <Text style={{ fontWeight: "700", color: wallpaper?.textPrimary || colors.textPrimary }}>{selectedDays} calendar day{selectedDays > 1 ? "s" : ""}</Text>
              </Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, wallpaper && { color: wallpaper.textSecondary }]}>REASON FOR LEAVE</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                wallpaper?.isDark && { backgroundColor: "rgba(5, 17, 36, 0.85)", borderColor: wallpaper.cardBorder, color: wallpaper.textPrimary },
              ]}
              placeholder="State the reason or handover details during your absence"
              placeholderTextColor={wallpaper?.isDark ? "#64748B" : colors.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </View>

          <DarkButton
            title="Submit Leave Application"
            onPress={handleApply}
            loading={submitting}
            style={{ marginTop: spacing.md }}
            icon={<Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />}
          />
        </ScrollView>
      )}

      <ConfirmationModal
        visible={Boolean(cancelTargetId)}
        title="Cancel Leave Application"
        message="Are you sure you want to cancel this leave application? This action cannot be undone."
        confirmText="Yes, Cancel Leave"
        cancelText="Keep Leave"
        danger
        loading={cancelling}
        onConfirm={executeCancel}
        onCancel={() => setCancelTargetId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceWatery,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radii.md,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.darkButton,
    ...shadows.sm,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
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
  requestCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  dateBlock: {
    flex: 1,
  },
  typeBadge: {
    backgroundColor: colors.bgWateryDeep,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  dateRange: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  daysCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  cancelAction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 5,
    alignSelf: "flex-start",
  },
  cancelActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
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
  },
  formScroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  policyCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  policyItem: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.darkButton,
    borderColor: colors.darkButton,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateCol: {
    flex: 1,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  durationBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWatery,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    gap: 6,
  },
  durationBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
});
