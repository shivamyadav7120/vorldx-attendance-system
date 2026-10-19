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
  Modal,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function DashboardScreen({ onNavigate }) {
  const { user, employee, logout } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkingInWfh, setCheckingInWfh] = useState(false);

  function handleQuickLogout() {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to sign out?")) {
        logout();
      } else if (typeof window === "undefined") {
        logout();
      }
      return;
    }

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  }

  // QR Camera Modal
  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  async function loadTodayStatus() {
    try {
      const res = await api.getTodayAttendance();
      setTodayData(res);
    } catch (e) {
      console.error("Failed to load today's status:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTodayStatus();
  }, []);

  async function openScanner() {
    if (!permission) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please grant camera access to scan office QR codes for attendance."
        );
        return;
      }
    } else if (!permission.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        Alert.alert(
          "Camera Permission Denied",
          "Camera permission is required to scan the office QR code."
        );
        return;
      }
    }

    setScanning(false);
    setScannerOpen(true);
  }

  async function handleBarCodeScanned({ data }) {
    if (scanning) return;
    setScanning(true);

    try {
      // Data might be raw token string or JSON string { token: "..." }
      let token = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.token) token = parsed.token;
      } catch {}

      const res = await api.checkInOffice(token);
      setScannerOpen(false);
      Alert.alert("Success", res.message || "Office check-in recorded successfully!");
      loadTodayStatus();
    } catch (err) {
      Alert.alert(
        "Check-In Failed",
        err.message || "Invalid or expired QR code. Please scan again.",
        [
          {
            text: "Retry",
            onPress: () => setScanning(false),
          },
          {
            text: "Cancel",
            onPress: () => setScannerOpen(false),
            style: "cancel",
          },
        ]
      );
    }
  }

  async function handleWfhCheckIn() {
    Alert.alert(
      "Confirm WFH Check-In",
      "Are you working remotely today with an approved WFH request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Check In",
          onPress: async () => {
            setCheckingInWfh(true);
            try {
              const res = await api.checkInWfh();
              Alert.alert("Success", res.message || "WFH check-in recorded!");
              loadTodayStatus();
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

  async function handleCheckOut() {
    Alert.alert("Confirm Check-Out", "Are you ready to record your check-out for today?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Check Out",
        onPress: async () => {
          setCheckingOut(true);
          try {
            await api.checkOut();
            Alert.alert("Success", "Check-out recorded successfully!");
            loadTodayStatus();
          } catch (err) {
            Alert.alert("Check-Out Error", err.message);
          } finally {
            setCheckingOut(false);
          }
        },
      },
    ]);
  }

  const att = todayData?.attendance;
  const isCheckedIn = Boolean(att?.checkIn);
  const isCheckedOut = Boolean(att?.checkOut);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadTodayStatus();
          }}
          tintColor="#23c8f5"
        />
      }
    >
      {/* HEADER GREETING */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.greetingEyebrow}>VORLDX EMPLOYEE</Text>
          <Text style={styles.userName} numberOfLines={1}>{employee?.name || user?.name || "Employee"}</Text>
          <Text style={styles.userMeta} numberOfLines={1}>
            ID: {employee?.employeeId || "—"} · {employee?.department || "Department"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => onNavigate("profile")}
            accessibilityLabel="Manage Profile"
          >
            <Text style={styles.profileLetter}>
              {String(employee?.name || user?.name || "E")[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLogoutBtn}
            onPress={handleQuickLogout}
            accessibilityLabel="Sign Out"
          >
            <Text style={styles.quickLogoutText}>⎋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TODAY'S ATTENDANCE STATUS CARD */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusCardTitle}>Today's Attendance</Text>
          <Text style={styles.statusDate}>
            {new Date().toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#23c8f5" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statusBody}>
            <View style={styles.statusBadgeRow}>
              <View
                style={[
                  styles.statusPill,
                  isCheckedIn
                    ? att?.status === "LATE"
                      ? styles.pillLate
                      : styles.pillPresent
                    : styles.pillNone,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isCheckedIn
                      ? att?.status === "LATE"
                        ? styles.pillLateText
                        : styles.pillPresentText
                      : styles.pillNoneText,
                  ]}
                >
                  {isCheckedIn ? att?.status || "PRESENT" : "NOT CHECKED IN"}
                </Text>
              </View>

              {att?.mode && (
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>Mode: {att.mode}</Text>
                </View>
              )}
            </View>

            {/* CHECK-IN & CHECK-OUT TIME SUMMARY */}
            <View style={styles.timeRow}>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Check-in</Text>
                <Text style={styles.timeValue}>
                  {att?.checkIn
                    ? new Date(att.checkIn).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—:—"}
                </Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Check-out</Text>
                <Text style={styles.timeValue}>
                  {att?.checkOut
                    ? new Date(att.checkOut).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—:—"}
                </Text>
              </View>
            </View>

            {/* ACTION BUTTONS */}
            {!isCheckedIn ? (
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
                  <Text style={styles.scanBtnText}>📷 Scan Office QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.wfhBtn, checkingInWfh && styles.btnDisabled]}
                  onPress={handleWfhCheckIn}
                  disabled={checkingInWfh}
                >
                  {checkingInWfh ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.wfhBtnText}>🏠 Check In (WFH)</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : !isCheckedOut ? (
              <TouchableOpacity
                style={[styles.checkOutBtn, checkingOut && styles.btnDisabled]}
                onPress={handleCheckOut}
                disabled={checkingOut}
              >
                {checkingOut ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.checkOutBtnText}>Check Out For Today</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBox}>
                <Text style={styles.completedText}>✓ Day Completed. Check-out recorded.</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* QUICK WORKSPACE ACTIONS */}
      <Text style={styles.sectionTitle}>WORKSPACE SERVICES</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate("history")}>
          <Text style={styles.gridEmoji}>📅</Text>
          <Text style={styles.gridTitle}>Attendance</Text>
          <Text style={styles.gridSub}>View your log history</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate("wfh")}>
          <Text style={styles.gridEmoji}>🏠</Text>
          <Text style={styles.gridTitle}>Work From Home</Text>
          <Text style={styles.gridSub}>Apply & track WFH</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate("leave")}>
          <Text style={styles.gridEmoji}>📋</Text>
          <Text style={styles.gridTitle}>Leave Requests</Text>
          <Text style={styles.gridSub}>Casual, sick & earned</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => onNavigate("profile")}>
          <Text style={styles.gridEmoji}>👤</Text>
          <Text style={styles.gridTitle}>Profile & Setup</Text>
          <Text style={styles.gridSub}>Settings & logout</Text>
        </TouchableOpacity>
      </View>

      {/* CAMERA SCANNER MODAL */}
      <Modal visible={scannerOpen} animationType="slide">
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Office QR Code</Text>
            <TouchableOpacity onPress={() => setScannerOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.targetBox} />
              <Text style={styles.scannerHint}>
                Align the office screen QR code within the frame
              </Text>
              {scanning && (
                <ActivityIndicator size="large" color="#23c8f5" style={{ marginTop: 20 }} />
              )}
            </View>
          </CameraView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  greetingEyebrow: {
    color: "#38bdf8",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  userName: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 3,
  },
  userMeta: {
    color: "#94a3b8",
    fontSize: 12.5,
    marginTop: 2,
  },
  profileBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#111827",
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  profileLetter: {
    color: "#38bdf8",
    fontSize: 18,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickLogoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#29121a",
    borderWidth: 1.5,
    borderColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLogoutText: {
    color: "#f43f5e",
    fontSize: 20,
    fontWeight: "700",
  },
  statusCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statusCardTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  statusDate: {
    color: "#94a3b8",
    fontSize: 12,
  },
  statusBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillPresent: {
    backgroundColor: "#0d2b23",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  pillPresentText: {
    color: "#34d399",
    fontWeight: "800",
    fontSize: 11.5,
  },
  pillLate: {
    backgroundColor: "#332615",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  pillLateText: {
    color: "#fbbf24",
    fontWeight: "800",
    fontSize: 11.5,
  },
  pillNone: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  pillNoneText: {
    color: "#94a3b8",
    fontWeight: "800",
    fontSize: 11.5,
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#18233a",
    borderWidth: 1,
    borderColor: "#22334f",
  },
  modeBadgeText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b0f19",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  timeBox: {
    flex: 1,
    alignItems: "center",
  },
  timeDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#1e293b",
  },
  timeLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  timeValue: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  scanBtn: {
    flex: 1.2,
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanBtnText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "700",
  },
  wfhBtn: {
    flex: 1,
    backgroundColor: "#132136",
    borderWidth: 1,
    borderColor: "#253b5e",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  wfhBtnText: {
    color: "#38bdf8",
    fontSize: 13.5,
    fontWeight: "700",
  },
  checkOutBtn: {
    backgroundColor: "#e11d48",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#e11d48",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkOutBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  completedBox: {
    backgroundColor: "#0d2b23",
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  completedText: {
    color: "#34d399",
    fontWeight: "700",
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  gridEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  gridTitle: {
    color: "#f8fafc",
    fontSize: 14.5,
    fontWeight: "700",
  },
  gridSub: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 3,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#0b0f19",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  scannerTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: "#f43f5e",
    fontSize: 14,
    fontWeight: "700",
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  targetBox: {
    width: 250,
    height: 250,
    borderWidth: 2.5,
    borderColor: "#38bdf8",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  scannerHint: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 24,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
