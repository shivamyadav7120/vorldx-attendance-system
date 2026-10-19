import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import biometricService from "../services/biometricService";

export default function ProfileScreen({ onBack }) {
  const {
    user,
    employee,
    logout,
    updateLocalProfile,
    refreshProfile,
    enableBiometric,
    disableBiometric,
  } = useAuth();

  // Active Tab: "details" | "security" | "server"
  const [activeTab, setActiveTab] = useState("details");

  // Profile Form States
  const [name, setName] = useState(employee?.name || user?.name || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [designation, setDesignation] = useState(employee?.designation || "");
  const [address, setAddress] = useState(employee?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(employee?.emergencyContact || "");
  const [bio, setBio] = useState(employee?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Biometric States
  const [biometricInfo, setBiometricInfo] = useState({
    available: false,
    enrolled: false,
    biometricType: "Fingerprint / Face ID",
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Server URL
  const [serverUrl, setServerUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    api.getBaseUrl().then(setServerUrl);
    loadBiometricStatus();
    if (employee || user) {
      setName(employee?.name || user?.name || "");
      setPhone(employee?.phone || "");
      setDesignation(employee?.designation || "");
      setAddress(employee?.address || "");
      setEmergencyContact(employee?.emergencyContact || "");
      setBio(employee?.bio || "");
    }
  }, [employee, user]);

  async function loadBiometricStatus() {
    try {
      const info = await biometricService.checkBiometricAvailability();
      setBiometricInfo(info);
      const isEnabled = await biometricService.isBiometricEnabled();
      setBiometricEnabled(isEnabled);
    } catch (e) {
      console.warn("Failed to load biometric status in profile:", e);
    }
  }

  async function handleToggleBiometric() {
    if (biometricEnabled) {
      Alert.alert(
        "Disable Biometric Login",
        "Are you sure you want to disable fingerprint and face recognition login on this device?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              setBiometricBusy(true);
              try {
                await disableBiometric();
                setBiometricEnabled(false);
                Alert.alert("Biometrics Disabled", "Biometric login has been deactivated on this device.");
              } catch (err) {
                Alert.alert("Error", err.message || "Failed to disable biometrics.");
              } finally {
                setBiometricBusy(false);
              }
            },
          },
        ]
      );
    } else {
      setBiometricBusy(true);
      try {
        await enableBiometric();
        setBiometricEnabled(true);
        Alert.alert(
          "Biometric Login Activated! 🎉",
          `You can now sign in to VorldX using ${biometricInfo.biometricType || "Fingerprint / Face ID"} with a single tap!`
        );
      } catch (err) {
        Alert.alert("Biometric Setup Failed", err.message || "Could not register biometric authentication.");
      } finally {
        setBiometricBusy(false);
      }
    }
  }

  async function handleSaveProfile() {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Full name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        designation: designation.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        bio: bio.trim(),
      });

      if (res.user || res.employee) {
        updateLocalProfile(res.user, res.employee);
      }
      Alert.alert("Success", res.message || "Profile details updated successfully!");
    } catch (err) {
      Alert.alert("Update Failed", err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert("Validation Error", "Please provide current and new password.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Weak Password", "New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirm password do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      Alert.alert("Security Update", res.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      Alert.alert("Password Error", err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSaveServer() {
    if (!serverUrl.trim()) return;
    setSavingUrl(true);
    try {
      await api.setBaseUrl(serverUrl.trim());
      Alert.alert("Server Config Saved", `Active API endpoint set to: ${serverUrl}`);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingUrl(false);
    }
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to sign out of this device?")) {
        logout();
      } else if (typeof window === "undefined") {
        logout();
      }
      return;
    }

    Alert.alert("Sign Out", "Are you sure you want to sign out of this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* AVATAR HERO CARD */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {String(name || employee?.name || user?.name || "E")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{name || employee?.name || user?.name || "Employee"}</Text>
        <Text style={styles.profileEmail}>{employee?.email || user?.email || ""}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>ID: {employee?.employeeId || "VX-EMP"}</Text>
          </View>
          <View style={styles.deptBadge}>
            <Text style={styles.deptBadgeText}>{employee?.department || "Department"}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>● Active</Text>
          </View>
        </View>
      </View>

      {/* SEGMENTED TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "details" && styles.tabItemActive]}
          onPress={() => setActiveTab("details")}
        >
          <Text style={[styles.tabText, activeTab === "details" && styles.tabTextActive]}>
            👤 Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "security" && styles.tabItemActive]}
          onPress={() => setActiveTab("security")}
        >
          <Text style={[styles.tabText, activeTab === "security" && styles.tabTextActive]}>
            🔒 Security
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "server" && styles.tabItemActive]}
          onPress={() => setActiveTab("server")}
        >
          <Text style={[styles.tabText, activeTab === "server" && styles.tabTextActive]}>
            ⚙️ Setup
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: EDIT PERSONAL DETAILS */}
      {activeTab === "details" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Text style={styles.cardDesc}>
            Keep your official contact and emergency information up to date.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>DESIGNATION / ROLE</Text>
            <TextInput
              style={styles.input}
              value={designation}
              onChangeText={setDesignation}
              placeholder="e.g. Software Engineer Intern"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>EMERGENCY CONTACT</Text>
            <TextInput
              style={styles.input}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Parent / Guardian Name & Number"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>RESIDENTIAL ADDRESS</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Current local or permanent address"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>SHORT BIO / ABOUT</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="A brief note about your specialization or role"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={2}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, savingProfile && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>✓ Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <Text style={styles.cardDesc}>
            Update your account password. Choose a strong password with at least 8 characters.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>NEW PASSWORD (MIN 8 CHARACTERS)</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, savingPassword && styles.btnDisabled]}
            onPress={handleSavePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>🔒 Update Password</Text>
            )}
          </TouchableOpacity>

          {/* BIOMETRIC AUTHENTICATION CARD */}
          <View style={styles.biometricCard}>
            <View style={styles.biometricHeader}>
              <View style={styles.biometricIconBadge}>
                <Text style={{ fontSize: 24 }}>👆</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Biometric Authentication</Text>
                <Text style={styles.cardDesc}>
                  Sign in instantly with your {biometricInfo.biometricType || "Fingerprint / Face ID"}.
                </Text>
              </View>
            </View>

            <View style={styles.biometricStatusRow}>
              <Text style={styles.biometricStatusLabel}>Biometric Login Status:</Text>
              <View
                style={[
                  styles.statusBadge,
                  biometricEnabled ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    biometricEnabled ? styles.badgeTextActive : styles.badgeTextInactive,
                  ]}
                >
                  {biometricEnabled ? "● Active on this device" : "○ Not Enrolled"}
                </Text>
              </View>
            </View>

            {biometricEnabled ? (
              <View style={styles.biometricActiveBox}>
                <Text style={styles.biometricActiveText}>
                  ✓ Biometric login is registered for <Text style={{ color: "#38bdf8", fontWeight: "700" }}>{user?.email}</Text>. You can now sign in with your fingerprint or face.
                </Text>
                <TouchableOpacity
                  style={[styles.disableBiometricBtn, biometricBusy && styles.btnDisabled]}
                  onPress={handleToggleBiometric}
                  disabled={biometricBusy}
                >
                  {biometricBusy ? (
                    <ActivityIndicator color="#f43f5e" />
                  ) : (
                    <Text style={styles.disableBiometricText}>✕ Disable Biometric Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.enableBiometricBtn, biometricBusy && styles.btnDisabled]}
                  onPress={handleToggleBiometric}
                  disabled={biometricBusy}
                >
                  {biometricBusy ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      👆 Setup & Enable {biometricInfo.biometricType || "Biometrics"}
                    </Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.biometricFootnote}>
                  Scans your device fingerprint sensor or facial recognition to securely link your account.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* TAB 3: SERVER & APP SETUP */}
      {activeTab === "server" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend Server Connection</Text>
          <Text style={styles.cardDesc}>
            Point this app to your local Wi-Fi or cloud backend server API.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>API ENDPOINT</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.1.83:5000/api"
              placeholderTextColor="#475569"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, savingUrl && styles.btnDisabled]}
            onPress={handleSaveServer}
            disabled={savingUrl}
          >
            {savingUrl ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>Save Connection URL</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoVal}>v2.0.0 (Modern Edition)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoVal}>{user?.role || "EMPLOYEE"}</Text>
          </View>
        </View>
      )}

      {/* LOGOUT BUTTON */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out of Device</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>VorldX Attendance Suite · Employee Portal</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2c44",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#131b2e",
  },
  backBtnText: {
    color: "#38bdf8",
    fontSize: 15,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  avatarCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#111827",
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLetter: {
    color: "#38bdf8",
    fontSize: 28,
    fontWeight: "800",
  },
  profileName: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800",
  },
  profileEmail: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  idBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#18233a",
    borderWidth: 1,
    borderColor: "#22334f",
  },
  idBadgeText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
  },
  deptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#18233a",
    borderWidth: 1,
    borderColor: "#22334f",
  },
  deptBadgeText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#0d2b23",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  statusBadgeText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111827",
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 9,
  },
  tabItemActive: {
    backgroundColor: "#1e293b",
  },
  tabText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#38bdf8",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  cardDesc: {
    color: "#94a3b8",
    fontSize: 11.5,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#22324a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f8fafc",
    fontSize: 13,
  },
  textArea: {
    minHeight: 58,
    textAlignVertical: "top",
  },
  primaryBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 12,
  },
  infoVal: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutBtn: {
    marginHorizontal: 18,
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e11d48",
    backgroundColor: "#29121a",
    alignItems: "center",
  },
  logoutBtnText: {
    color: "#f43f5e",
    fontSize: 13,
    fontWeight: "700",
  },
  versionText: {
    textAlign: "center",
    color: "#475569",
    fontSize: 11,
    marginTop: 22,
  },
  biometricCard: {
    backgroundColor: "#0d1527",
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#1e3355",
  },
  biometricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  biometricIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#16233b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#264168",
  },
  biometricStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#1e2e4a",
    marginBottom: 12,
  },
  biometricStatusLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  badgeActive: {
    backgroundColor: "#0d2b23",
    borderColor: "#10b981",
    borderWidth: 1,
  },
  badgeInactive: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    borderWidth: 1,
  },
  badgeTextActive: {
    color: "#34d399",
    fontWeight: "700",
  },
  badgeTextInactive: {
    color: "#94a3b8",
    fontWeight: "600",
  },
  biometricActiveBox: {
    backgroundColor: "#08101e",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e3557",
  },
  biometricActiveText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  disableBiometricBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e11d48",
    backgroundColor: "#29121a",
    alignItems: "center",
  },
  disableBiometricText: {
    color: "#f43f5e",
    fontSize: 12,
    fontWeight: "700",
  },
  enableBiometricBtn: {
    backgroundColor: "#2563eb",
    marginTop: 4,
  },
  biometricFootnote: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 15,
  },
});
