import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import DarkButton from "../components/DarkButton";
import WateryCard from "../components/WateryCard";
import StatusBadge from "../components/StatusBadge";
import LiveShiftClock from "../components/LiveShiftClock";
import ScannerModal from "../components/ScannerModal";
import ConfirmationModal from "../components/ConfirmationModal";

export default function DashboardScreen({ onNavigate }) {
  const { user, employee, logout } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [historySummary, setHistorySummary] = useState({
    present: 0,
    late: 0,
    wfh: 0,
    halfDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkingInWfh, setCheckingInWfh] = useState(false);

  // Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  async function loadDashboardData() {
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.getTodayAttendance().catch(() => null),
        api.getMyAttendance().catch(() => null),
      ]);

      if (todayRes) {
        setTodayData(todayRes);
      }

      if (historyRes?.records) {
        const records = historyRes.records;
        const presentCount = records.filter(
          (r) => r.status === "PRESENT" || r.status === "LATE"
        ).length;
        const lateCount = records.filter((r) => r.status === "LATE").length;
        const wfhCount = records.filter((r) => r.mode === "WFH").length;
        const halfDayCount = records.filter((r) => r.status === "HALF_DAY").length;

        setHistorySummary({
          present: presentCount,
          late: lateCount,
          wfh: wfhCount,
          halfDay: halfDayCount,
        });
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleScanQr(tokenData) {
    if (scanning) return;
    setScanning(true);

    let token = tokenData;
    try {
      const parsed = JSON.parse(tokenData);
      if (parsed.token) token = parsed.token;
    } catch {}

    try {
      const res = await api.checkInOffice(token);
      setScannerOpen(false);
      Alert.alert("Check-In Successful", res.message || "Office check-in recorded successfully!");
      loadDashboardData();
    } catch (err) {
      Alert.alert(
        "Verification Failed",
        err.message || "Invalid or expired QR code. Please scan again.",
        [
          { text: "Retry", onPress: () => setScanning(false) },
          { text: "Close", onPress: () => setScannerOpen(false), style: "cancel" },
        ]
      );
    } finally {
      setScanning(false);
    }
  }

  async function handleWfhCheckIn() {
    Alert.alert(
      "Confirm Remote Check-In",
      "Do you have an approved Work From Home request for today?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Check In Remotely",
          onPress: async () => {
            setCheckingInWfh(true);
            try {
              const res = await api.checkInWfh();
              Alert.alert("Success", res.message || "WFH check-in recorded successfully!");
              loadDashboardData();
            } catch (err) {
              Alert.alert("WFH Check-In Error", err.message);
            } finally {
              setCheckingInWfh(false);
            }
          },
        },
      ]
    );
  }

  async function executeCheckOut() {
    setCheckingOut(true);
    try {
      await api.checkOut();
      setCheckOutModalOpen(false);
      Alert.alert("Success", "Check-out time recorded successfully. Have a great evening!");
      loadDashboardData();
    } catch (err) {
      Alert.alert("Check-Out Failed", err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  const att = todayData?.attendance;
  const isCheckedIn = Boolean(att?.checkIn);
  const isCheckedOut = Boolean(att?.checkOut);

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboardData();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Greeting */}
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <View style={styles.companyBadge}>
              <Text style={styles.companyBadgeText}>VORLDX INDUSTRIES</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {employee?.name || user?.name || "Employee"}
            </Text>
            <Text style={styles.userRole}>
              {employee?.employeeId ? `${employee.employeeId} · ` : ""}
              {employee?.designation || employee?.department || "Team Member"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => onNavigate("profile")}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle-outline" size={26} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => setLogoutModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live IST Shift Clock and Working Timer */}
        <LiveShiftClock todayAttendance={att} />

        {/* Main Attendance Card */}
        <WateryCard style={styles.attendanceCard} elevated>
          <View style={styles.attendanceHeader}>
            <View>
              <Text style={styles.sectionHeading}>Today's Attendance</Text>
              <Text style={styles.currentDate}>
                {new Date().toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>

            <StatusBadge
              status={
                isCheckedIn
                  ? att?.status || "PRESENT"
                  : "NOT CHECKED IN"
              }
            />
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.attendanceContent}>
              {/* Check-In & Check-Out Time Stamps */}
              <View style={styles.timeGrid}>
                <View style={styles.timeTile}>
                  <View style={styles.timeTileHeader}>
                    <Ionicons name="enter-outline" size={16} color={colors.primary} />
                    <Text style={styles.timeTileLabel}>CHECK-IN</Text>
                  </View>
                  <Text style={styles.timeTileValue}>
                    {att?.checkIn
                      ? new Date(att.checkIn).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })
                      : "—:—"}
                  </Text>
                  {att?.mode && (
                    <Text style={styles.timeTileSub}>Via {att.mode}</Text>
                  )}
                </View>

                <View style={styles.timeDivider} />

                <View style={styles.timeTile}>
                  <View style={styles.timeTileHeader}>
                    <Ionicons name="exit-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.timeTileLabel}>CHECK-OUT</Text>
                  </View>
                  <Text style={styles.timeTileValue}>
                    {att?.checkOut
                      ? new Date(att.checkOut).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })
                      : "—:—"}
                  </Text>
                  <Text style={styles.timeTileSub}>
                    {isCheckedOut ? "Completed" : isCheckedIn ? "Active Shift" : "Pending"}
                  </Text>
                </View>
              </View>

              {/* Action Buttons with High-Contrast Dark Buttons */}
              <View style={styles.actionContainer}>
                {!isCheckedIn ? (
                  <View style={styles.checkInButtonStack}>
                    {/* Primary Dark Button: Scan Office QR */}
                    <DarkButton
                      title="Scan Office QR to Check In"
                      onPress={() => setScannerOpen(true)}
                      icon={<Ionicons name="qr-code-outline" size={19} color="#FFFFFF" />}
                      style={styles.primaryActionButton}
                    />

                    {/* Secondary Watery Button: WFH Check-in */}
                    <DarkButton
                      title="Check In Remotely (WFH)"
                      variant="secondary"
                      onPress={handleWfhCheckIn}
                      loading={checkingInWfh}
                      icon={<Ionicons name="home-outline" size={18} color={colors.textPrimary} />}
                      style={{ marginTop: spacing.sm }}
                    />
                  </View>
                ) : !isCheckedOut ? (
                  <DarkButton
                    title="Check Out For Today"
                    onPress={() => setCheckOutModalOpen(true)}
                    loading={checkingOut}
                    icon={<Ionicons name="log-out-outline" size={19} color="#FFFFFF" />}
                    style={styles.primaryActionButton}
                  />
                ) : (
                  <View style={styles.completedBanner}>
                    <Ionicons name="checkmark-done-circle" size={20} color="#15803D" />
                    <Text style={styles.completedBannerText}>
                      Day Completed · Check-out recorded
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </WateryCard>

        {/* Monthly Summary Metric Strip */}
        <Text style={styles.sectionTitle}>THIS MONTH'S SUMMARY</Text>
        <View style={styles.metricGrid}>
          <WateryCard style={styles.metricTile}>
            <Text style={styles.metricValue}>{historySummary.present}</Text>
            <Text style={styles.metricLabel}>Days Present</Text>
          </WateryCard>

          <WateryCard style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: "#D97706" }]}>
              {historySummary.late}
            </Text>
            <Text style={styles.metricLabel}>Late Marks</Text>
          </WateryCard>

          <WateryCard style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>
              {historySummary.wfh}
            </Text>
            <Text style={styles.metricLabel}>Remote WFH</Text>
          </WateryCard>

          <WateryCard style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: colors.textSecondary }]}>
              {historySummary.halfDay}
            </Text>
            <Text style={styles.metricLabel}>Half Days</Text>
          </WateryCard>
        </View>

        {/* Quick Workspace Navigation Services */}
        <Text style={styles.sectionTitle}>WORKSPACE SERVICES</Text>
        <View style={styles.servicesGrid}>
          <TouchableOpacity
            style={styles.serviceItem}
            onPress={() => onNavigate("history")}
            activeOpacity={0.8}
          >
            <View style={styles.serviceIconCircle}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.serviceTitle}>Attendance</Text>
            <Text style={styles.serviceSub}>Monthly logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceItem}
            onPress={() => onNavigate("wfh")}
            activeOpacity={0.8}
          >
            <View style={styles.serviceIconCircle}>
              <Ionicons name="laptop-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.serviceTitle}>Work From Home</Text>
            <Text style={styles.serviceSub}>Apply & track</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceItem}
            onPress={() => onNavigate("leave")}
            activeOpacity={0.8}
          >
            <View style={styles.serviceIconCircle}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.serviceTitle}>Leave Requests</Text>
            <Text style={styles.serviceSub}>Apply for leave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceItem}
            onPress={() => onNavigate("profile")}
            activeOpacity={0.8}
          >
            <View style={styles.serviceIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.serviceTitle}>Security</Text>
            <Text style={styles.serviceSub}>Biometrics & info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Office QR Camera Scanner Modal */}
      <ScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanQr}
        scanning={scanning}
      />

      {/* Confirmation Modal for Check-Out */}
      <ConfirmationModal
        visible={checkOutModalOpen}
        title="Check Out For Today?"
        message="Your daily shift duration will be recorded. Make sure you have finished all tasks before checking out."
        confirmLabel="Confirm Check-Out"
        cancelLabel="Keep Working"
        loading={checkingOut}
        onConfirm={executeCheckOut}
        onCancel={() => setCheckOutModalOpen(false)}
        icon="time-outline"
      />

      {/* Confirmation Modal for Sign Out */}
      <ConfirmationModal
        visible={logoutModalOpen}
        title="Sign Out of VorldX?"
        message="You will need your password or biometric credentials to sign back in."
        confirmLabel="Sign Out"
        isDanger
        onConfirm={() => {
          setLogoutModalOpen(false);
          logout();
        }}
        onCancel={() => setLogoutModalOpen(false)}
        icon="log-out-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.bgWatery,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    marginTop: 6,
  },
  headerInfo: {
    flex: 1,
    paddingRight: 10,
  },
  companyBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.bgWateryDeep,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderWateryActive,
    marginBottom: 4,
  },
  companyBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  userRole: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  attendanceCard: {
    marginBottom: spacing.xl,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  currentDate: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  attendanceContent: {
    marginTop: 4,
  },
  timeGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWatery,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  timeTile: {
    flex: 1,
    alignItems: "center",
  },
  timeTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  timeTileLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  timeTileValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  timeTileSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  timeDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderWatery,
  },
  actionContainer: {
    marginTop: 4,
  },
  checkInButtonStack: {
    width: "100%",
  },
  primaryActionButton: {
    height: 52,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: radii.lg,
    paddingVertical: 14,
    gap: 8,
  },
  completedBannerText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#15803D",
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.textWatery,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  metricGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricTile: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    borderRadius: radii.lg,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 3,
    textAlign: "center",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  serviceItem: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: "flex-start",
    ...shadows.card,
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWateryActive,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  serviceSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
