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
  Image,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api, { getFullMediaUrl } from "../services/api";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import DarkButton from "../components/DarkButton";
import WateryCard from "../components/WateryCard";
import StatusBadge from "../components/StatusBadge";
import LiveShiftClock from "../components/LiveShiftClock";
import ScannerModal from "../components/ScannerModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { useTheme } from "../context/ThemeContext";
import WallpaperSelectorModal from "../components/WallpaperSelectorModal";

export default function DashboardScreen({ onNavigate }) {
  const { user, employee, logout } = useAuth();
  const { wallpaper } = useTheme();
  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false);
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


  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState("checkin");
  const [scanning, setScanning] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  async function handleMarkAllNotificationsRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {}
  }

  async function handleNotificationClick(item) {
    if (!item.isRead) {
      try {
        await api.markNotificationRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      } catch (e) {}
    }
  }

  async function loadDashboardData() {
    try {
      const [todayRes, historyRes, notifRes] = await Promise.all([
        api.getTodayAttendance().catch(() => null),
        api.getMyAttendance().catch(() => null),
        api.getNotifications().catch(() => null),
      ]);

      if (todayRes) {
        setTodayData(todayRes);
      }

      if (notifRes?.notifications) {
        setNotifications(notifRes.notifications);
        setUnreadNotifCount(notifRes.unreadCount || 0);
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
      if (scannerMode === "checkout") {
        const res = await api.checkOut({ qrToken: token });
        setScannerOpen(false);
        setScanning(false);
        Alert.alert(
          "Check-Out Successful",
          res.message || "Office check-out verified via screen QR scan successfully! Have a great evening."
        );
        loadDashboardData();
      } else {
        const res = await api.checkInOffice(token);
        setScannerOpen(false);
        setScanning(false);
        Alert.alert("Check-In Successful", res.message || "Office check-in recorded successfully!");
        loadDashboardData();
      }
    } catch (err) {
      const isNetwork =
        err.isNetworkError ||
        err.message?.toLowerCase().includes("network") ||
        err.message?.toLowerCase().includes("unable to reach") ||
        err.message?.toLowerCase().includes("unable to connect") ||
        err.message?.toLowerCase().includes("timed out") ||
        err.message?.toLowerCase().includes("failed to fetch");

      if (isNetwork) {
        Alert.alert(
          "Network Disconnected",
          "Your internet or office Wi-Fi connection was lost while verifying the QR code. Please check your Wi-Fi or mobile data and scan again.",
          [
            {
              text: "Retry Now",
              onPress: () => {
                setScanning(false);
                handleScanQr(token);
              },
            },
            {
              text: "Scan Fresh QR",
              onPress: () => setScanning(false),
            },
            {
              text: "Cancel",
              onPress: () => {
                setScanning(false);
                setScannerOpen(false);
              },
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert(
          "Verification Failed",
          err.message || "Invalid or expired QR code. Please scan again.",
          [
            { text: "Scan Again", onPress: () => setScanning(false) },
            {
              text: "Close",
              onPress: () => {
                setScanning(false);
                setScannerOpen(false);
              },
              style: "cancel",
            },
          ]
        );
      }
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
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerInfo}
            onPress={() => onNavigate("profile")}
            activeOpacity={0.8}
          >
            <View style={[styles.companyBadge, wallpaper?.isDark && { backgroundColor: "rgba(3, 105, 161, 0.25)", borderColor: wallpaper.primary }]}>
              <Text style={[styles.companyBadgeText, wallpaper?.isDark && { color: wallpaper.primary }]}>VORLDX INDUSTRIES</Text>
            </View>
            <Text
              style={[styles.userName, wallpaper && { color: wallpaper.textPrimary }]}
              numberOfLines={1}
            >
              {employee?.name || user?.name || "Employee"}
            </Text>
            <Text style={[styles.userRole, wallpaper && { color: wallpaper.textSecondary }]}>
              {employee?.employeeId ? `${employee.employeeId} · ` : ""}
              {employee?.designation || employee?.department || "Team Member"}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.iconCircleBtn,
                wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder },
              ]}
              onPress={() => setWallpaperModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="color-palette-outline" size={20} color={wallpaper.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconCircleBtn,
                wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder },
              ]}
              onPress={() => setNotificationsModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={21} color={wallpaper?.textPrimary || colors.textPrimary} />
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconCircleBtn,
                wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder },
                Boolean(employee?.avatar || user?.avatar) && { padding: 0, overflow: "hidden", borderColor: "#00f0ff" },
              ]}
              onPress={() => onNavigate("profile")}
              activeOpacity={0.8}
            >
              {employee?.avatar || user?.avatar ? (
                <Image
                  source={{ uri: getFullMediaUrl(employee?.avatar || user?.avatar) }}
                  style={{ width: "100%", height: "100%", borderRadius: 19 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person-circle-outline" size={26} color={wallpaper?.textPrimary || colors.textPrimary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconCircleBtn,
                wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder },
              ]}
              onPress={() => setLogoutModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.notifBannerCard}
            onPress={() => setNotificationsModalOpen(true)}
            activeOpacity={0.85}
          >
            <View style={styles.notifBannerIconBox}>
              <Ionicons
                name={notifications[0].priority === "URGENT" ? "alert-circle" : "megaphone"}
                size={20}
                color="#00f0ff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.notifBannerTag}>
                  {notifications[0].priority === "URGENT" ? "🚨 URGENT NOTICE" : "📢 MANAGEMENT BROADCAST"}
                </Text>
                {!notifications[0].isRead && (
                  <View style={styles.newNotifDot} />
                )}
              </View>
              <Text style={styles.notifBannerTitle} numberOfLines={1}>
                {notifications[0].title}
              </Text>
              <Text style={styles.notifBannerBody} numberOfLines={2}>
                {notifications[0].message}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#38bdf8" />
          </TouchableOpacity>
        )}

        {}
        <LiveShiftClock todayAttendance={att} />

        <WateryCard style={styles.attendanceCard} elevated>
          <View style={styles.attendanceHeader}>
            <View>
              <Text style={[styles.sectionHeading, wallpaper && { color: wallpaper.textPrimary }]}>Today's Attendance</Text>
              <Text style={[styles.currentDate, wallpaper && { color: wallpaper.textSecondary }]}>
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
            <ActivityIndicator color={wallpaper?.primary || colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.attendanceContent}>
              <View style={[styles.timeGrid, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.cardBorder }]}>
                <View style={styles.timeTile}>
                  <View style={styles.timeTileHeader}>
                    <Ionicons name="enter-outline" size={16} color={wallpaper?.primary || colors.primary} />
                    <Text style={[styles.timeTileLabel, wallpaper && { color: wallpaper.textSecondary }]}>CHECK-IN</Text>
                  </View>
                  <Text style={[styles.timeTileValue, wallpaper && { color: wallpaper.textPrimary }]}>
                    {att?.checkIn
                      ? new Date(att.checkIn).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })
                      : "—:—"}
                  </Text>
                  {att?.mode && (
                    <Text style={[styles.timeTileSub, wallpaper && { color: wallpaper.textMuted }]}>Via {att.mode}</Text>
                  )}
                </View>

                <View style={[styles.timeDivider, wallpaper && { backgroundColor: wallpaper.cardBorder }]} />

                <View style={styles.timeTile}>
                  <View style={styles.timeTileHeader}>
                    <Ionicons name="exit-outline" size={16} color={wallpaper?.textSecondary || colors.textSecondary} />
                    <Text style={[styles.timeTileLabel, wallpaper && { color: wallpaper.textSecondary }]}>CHECK-OUT</Text>
                  </View>
                  <Text style={[styles.timeTileValue, wallpaper && { color: wallpaper.textPrimary }]}>
                    {att?.checkOut
                      ? new Date(att.checkOut).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })
                      : "—:—"}
                  </Text>
                  <Text style={[styles.timeTileSub, wallpaper && { color: wallpaper.textMuted }]}>
                    {isCheckedOut ? "Completed" : isCheckedIn ? "Active Shift" : "Pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.actionContainer}>
                {!isCheckedIn ? (
                  <View style={styles.checkInButtonStack}>
                    <DarkButton
                      title="Scan Office QR to Check In"
                      onPress={() => {
                        setScannerMode("checkin");
                        setScannerOpen(true);
                      }}
                      icon={<Ionicons name="qr-code-outline" size={19} color="#FFFFFF" />}
                      style={styles.primaryActionButton}
                    />

                    <DarkButton
                      title="Check In Remotely (WFH)"
                      variant="secondary"
                      onPress={handleWfhCheckIn}
                      loading={checkingInWfh}
                      icon={<Ionicons name="home-outline" size={18} color={wallpaper?.textPrimary || colors.textPrimary} />}
                      style={{ marginTop: spacing.sm }}
                    />
                  </View>
                ) : !isCheckedOut ? (
                  <DarkButton
                    title="Scan Screen QR to Check Out"
                    onPress={() => {
                      setScannerMode("checkout");
                      setScannerOpen(true);
                    }}
                    icon={<Ionicons name="qr-code-outline" size={19} color="#FFFFFF" />}
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

        <Text style={[styles.sectionTitle, wallpaper && { color: wallpaper.primary }]}>THIS MONTH'S SUMMARY</Text>
        <View style={styles.metricGrid}>
          <WateryCard style={styles.metricTile}>
            <Text style={[styles.metricValue, wallpaper && { color: wallpaper.textPrimary }]}>{historySummary.present}</Text>
            <Text style={[styles.metricLabel, wallpaper && { color: wallpaper.textSecondary }]}>Days Present</Text>
          </WateryCard>

          <WateryCard style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: "#F59E0B" }]}>
              {historySummary.late}
            </Text>
            <Text style={[styles.metricLabel, wallpaper && { color: wallpaper.textSecondary }]}>Late Marks</Text>
          </WateryCard>

          <WateryCard style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: wallpaper?.primary || colors.primary }]}>
              {historySummary.wfh}
            </Text>
            <Text style={[styles.metricLabel, wallpaper && { color: wallpaper.textSecondary }]}>Remote WFH</Text>
          </WateryCard>

          <WateryCard style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: wallpaper?.textSecondary || colors.textSecondary }]}>
              {historySummary.halfDay}
            </Text>
            <Text style={[styles.metricLabel, wallpaper && { color: wallpaper.textSecondary }]}>Half Days</Text>
          </WateryCard>
        </View>

        <Text style={[styles.sectionTitle, wallpaper && { color: wallpaper.primary }]}>WORKSPACE SERVICES</Text>
        <View style={styles.servicesGrid}>
          <TouchableOpacity
            style={[styles.serviceItem, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
            onPress={() => onNavigate("history")}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconCircle, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.primary }]}>
              <Ionicons name="calendar-outline" size={22} color={wallpaper?.primary || colors.primary} />
            </View>
            <Text style={[styles.serviceTitle, wallpaper && { color: wallpaper.textPrimary }]}>Attendance</Text>
            <Text style={[styles.serviceSub, wallpaper && { color: wallpaper.textSecondary }]}>Monthly logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.serviceItem, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
            onPress={() => onNavigate("wfh")}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconCircle, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.primary }]}>
              <Ionicons name="laptop-outline" size={22} color={wallpaper?.primary || colors.primary} />
            </View>
            <Text style={[styles.serviceTitle, wallpaper && { color: wallpaper.textPrimary }]}>Work From Home</Text>
            <Text style={[styles.serviceSub, wallpaper && { color: wallpaper.textSecondary }]}>Apply & track</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.serviceItem, wallpaper && { backgroundColor: wallpaper.surface, borderColor: wallpaper.cardBorder }]}
            onPress={() => onNavigate("leave")}
            activeOpacity={0.8}
          >
            <View style={[styles.serviceIconCircle, wallpaper && { backgroundColor: wallpaper.surfaceWatery, borderColor: wallpaper.primary }]}>
              <Ionicons name="document-text-outline" size={22} color={wallpaper?.primary || colors.primary} />
            </View>
            <Text style={[styles.serviceTitle, wallpaper && { color: wallpaper.textPrimary }]}>Leave Requests</Text>
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

      <ScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanQr}
        scanning={scanning}
        title={scannerMode === "checkout" ? "Check-Out QR Scanner" : "Office QR Scanner"}
        subtitle={
          scannerMode === "checkout"
            ? "Scan the live screen QR code to verify check-out"
            : "Hold steady to verify check-in"
        }
      />

      {}
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

      <Modal
        visible={notificationsModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNotificationsModalOpen(false)}>
          <View style={styles.notifModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.notifModalDialog}>
                <View style={styles.notifModalHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={styles.notifIconCircle}>
                      <Ionicons name="notifications" size={20} color="#00f0ff" />
                    </View>
                    <View>
                      <Text style={styles.notifModalTitle}>Notifications & Alerts</Text>
                      <Text style={styles.notifModalSub}>Management & HR Broadcasts</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {unreadNotifCount > 0 && (
                      <TouchableOpacity
                        onPress={handleMarkAllNotificationsRead}
                        style={styles.markAllReadBtn}
                      >
                        <Text style={styles.markAllReadText}>Mark all read</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => setNotificationsModalOpen(false)}
                      style={styles.closeNotifBtn}
                    >
                      <Ionicons name="close" size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView style={styles.notifListScroll} contentContainerStyle={{ paddingBottom: 16 }}>
                  {notifications.length === 0 ? (
                    <View style={styles.emptyNotifBox}>
                      <Ionicons name="mail-open-outline" size={44} color="#475569" />
                      <Text style={styles.emptyNotifTitle}>No Notifications</Text>
                      <Text style={styles.emptyNotifDesc}>
                        Announcements and messages from management will appear here.
                      </Text>
                    </View>
                  ) : (
                    notifications.map((item) => (
                      <TouchableOpacity
                        key={item._id || item.id}
                        style={[
                          styles.notifCard,
                          !item.isRead && styles.notifCardUnread,
                          item.priority === "URGENT" && styles.notifCardUrgent,
                        ]}
                        onPress={() => handleNotificationClick(item)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                          <View
                            style={[
                              styles.notifCardIcon,
                              item.priority === "URGENT"
                                ? { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "#ef4444" }
                                : { backgroundColor: "rgba(2, 132, 199, 0.15)", borderColor: "#0284c7" },
                            ]}
                          >
                            <Ionicons
                              name={
                                item.priority === "URGENT"
                                  ? "alert-circle"
                                  : item.type === "DIRECT_MESSAGE"
                                  ? "chatbubble-ellipses"
                                  : "megaphone"
                              }
                              size={18}
                              color={item.priority === "URGENT" ? "#f43f5e" : "#00f0ff"}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                              <Text style={styles.notifSenderText}>
                                {item.senderName || (item.senderRole === "SUPER_ADMIN" ? "Super Admin" : "HR Admin")}
                              </Text>
                              <Text style={styles.notifTimeText}>
                                {new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} · {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </Text>
                            </View>

                            <Text style={styles.notifItemTitle}>{item.title}</Text>
                            <Text style={styles.notifItemBody}>{item.message}</Text>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                              {item.priority === "URGENT" && (
                                <View style={styles.urgentPriorityTag}>
                                  <Text style={styles.urgentPriorityTagText}>URGENT</Text>
                                </View>
                              )}
                              <View style={styles.audienceTag}>
                                <Text style={styles.audienceTagText}>
                                  {item.targetAudience === "ALL" ? "All Staff" : item.targetAudience === "HR" ? "HR Staff" : item.targetDepartment || "Notice"}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {!item.isRead && <View style={styles.unreadDot} />}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <WallpaperSelectorModal
        visible={wallpaperModalOpen}
        onClose={() => setWallpaperModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: "transparent",
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
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#040915",
  },
  notifBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  notifBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    marginBottom: spacing.md,
  },
  notifBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 240, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBannerTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00f0ff",
    letterSpacing: 0.5,
  },
  newNotifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f43f5e",
  },
  notifBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 2,
  },
  notifBannerBody: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  notifModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 9, 21, 0.8)",
    justifyContent: "flex-end",
  },
  notifModalDialog: {
    maxHeight: "85%",
    backgroundColor: "#081326",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.25)",
  },
  notifModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#1e3357",
  },
  notifIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 240, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
  },
  notifModalSub: {
    fontSize: 11,
    color: "#94a3b8",
  },
  markAllReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#0d1b33",
    borderWidth: 1,
    borderColor: "#1e3357",
  },
  markAllReadText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#38bdf8",
  },
  closeNotifBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0d1b33",
    alignItems: "center",
    justifyContent: "center",
  },
  notifListScroll: {
    maxHeight: 460,
  },
  emptyNotifBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyNotifTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#cbd5e1",
    marginTop: 10,
  },
  emptyNotifDesc: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 240,
    marginTop: 4,
  },
  notifCard: {
    padding: 12,
    backgroundColor: "#0d1b33",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e3357",
    marginBottom: 10,
  },
  notifCardUnread: {
    borderColor: "rgba(0, 240, 255, 0.4)",
    backgroundColor: "rgba(2, 132, 199, 0.1)",
  },
  notifCardUrgent: {
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  notifCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notifSenderText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#38bdf8",
  },
  notifTimeText: {
    fontSize: 10,
    color: "#64748b",
  },
  notifItemTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 3,
  },
  notifItemBody: {
    fontSize: 11.5,
    color: "#cbd5e1",
    marginTop: 3,
    lineHeight: 16,
  },
  urgentPriorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  urgentPriorityTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#f87171",
  },
  audienceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#162544",
  },
  audienceTagText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94a3b8",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00f0ff",
    marginTop: 4,
  },
});
