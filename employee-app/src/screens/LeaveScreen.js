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

const LEAVE_TYPES = [
  { id: "Casual", label: "Casual Leave", icon: "sunny-outline" },
  { id: "Sick", label: "Sick Leave", icon: "medkit-outline" },
  { id: "Earned", label: "Earned / Annual", icon: "briefcase-outline" },
  { id: "Emergency", label: "Emergency", icon: "alert-circle-outline" },
  { id: "Unpaid", label: "Unpaid Leave", icon: "calendar-outline" },
];

export default function LeaveScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("MY_LEAVES"); // "MY_LEAVES" | "APPLY"
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cancel modal
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
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
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
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Leave Applications</Text>
          <Text style={styles.headerSubtitle}>Planned time off & entitlements</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={() => {
            setRefreshing(true);
            loadRequests();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Segmented Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "MY_LEAVES" && styles.tabButtonActive]}
          onPress={() => setActiveTab("MY_LEAVES")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={activeTab === "MY_LEAVES" ? "#FFFFFF" : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === "MY_LEAVES" && styles.tabTextActive]}
          >
            My Leaves ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "APPLY" && styles.tabButtonActive]}
          onPress={() => setActiveTab("APPLY")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={activeTab === "APPLY" ? "#FFFFFF" : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "APPLY" && styles.tabTextActive]}>
            Apply for Leave
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "MY_LEAVES" ? (
        loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading leave applications...</Text>
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
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <WateryCard style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Leave Applications</Text>
                <Text style={styles.emptySub}>
                  You haven't submitted any leave requests yet.
                </Text>
              </WateryCard>
            }
            renderItem={({ item }) => {
              const isPending = item.status === "PENDING";
              const days = countDays(item.startDate, item.endDate);

              return (
                <WateryCard style={styles.requestCard} elevated>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateBlock}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {item.leaveType || "LEAVE"}
                        </Text>
                      </View>
                      <Text style={styles.dateRange}>
                        {item.startDate} → {item.endDate}
                      </Text>
                      <Text style={styles.daysCount}>
                        Duration: {days} day{days === 1 ? "" : "s"}
                      </Text>
                    </View>

                    <StatusBadge status={item.status} size="sm" />
                  </View>

                  <Text style={styles.reasonText}>
                    <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                      Reason:{" "}
                    </Text>
                    {item.reason || "No reason specified."}
                  </Text>

                  {isPending && (
                    <TouchableOpacity
                      style={styles.cancelAction}
                      onPress={() => setCancelTargetId(item._id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.cancelActionText}>Cancel Pending Request</Text>
                    </TouchableOpacity>
                  )}
                </WateryCard>
              );
            }}
          />
        )
      ) : (
        /* APPLY FOR LEAVE FORM */
        <ScrollView contentContainerStyle={styles.formScroll}>
          {/* Entitlement Guideline Card */}
          <WateryCard style={styles.policyCard} tint>
            <View style={styles.policyHeader}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.policyTitle}>Leave Entitlement Guidelines</Text>
            </View>
            <Text style={styles.policyItem}>
              • Requests should be submitted in advance where possible.
            </Text>
            <Text style={styles.policyItem}>
              • Emergency or sick leaves require prompt notification to management.
            </Text>
          </WateryCard>

          {/* Leave Type Chips */}
          <Text style={styles.fieldLabel}>SELECT LEAVE CATEGORY</Text>
          <View style={styles.chipsContainer}>
            {LEAVE_TYPES.map((lt) => {
              const isSelected = leaveType === lt.id;
              return (
                <TouchableOpacity
                  key={lt.id}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setLeaveType(lt.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={lt.icon}
                    size={15}
                    color={isSelected ? "#FFFFFF" : colors.textSecondary}
                  />
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {lt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dates Row */}
          <View style={styles.dateInputsRow}>
            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>START DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-10-21"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.dateCol}>
              <Text style={styles.fieldLabel}>END DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="2026-10-21"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Duration Badge */}
          <View style={styles.durationBadgeRow}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={styles.durationBadgeText}>
              Total Leave Requested:{" "}
              <Text style={{ fontWeight: "800", color: colors.primaryDark }}>
                {selectedDays} Day(s)
              </Text>
            </Text>
          </View>

          {/* Reason Input */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>REASON FOR LEAVE</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Provide context or explanation for your leave request..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Dark Submit Button */}
          <DarkButton
            title={`Submit ${leaveType} Leave Request`}
            onPress={handleApply}
            loading={submitting}
            icon={<Ionicons name="send" size={17} color="#FFFFFF" />}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      )}

      {/* Confirmation Modal for Request Cancellation */}
      <ConfirmationModal
        visible={Boolean(cancelTargetId)}
        title="Cancel Leave Request?"
        message="Are you sure you want to cancel this pending leave application?"
        confirmLabel="Yes, Cancel"
        isDanger
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
  tabContainer: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surfaceWatery,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWatery,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.darkButton,
    borderColor: colors.darkButton,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabTextActive: {
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
