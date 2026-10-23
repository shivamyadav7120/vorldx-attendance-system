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
  Image,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuth } from "../context/AuthContext";
import api, { getFullMediaUrl } from "../services/api";
import biometricService from "../services/biometricService";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import WateryCard from "../components/WateryCard";
import DarkButton from "../components/DarkButton";
import ConfirmationModal from "../components/ConfirmationModal";

export default function ProfileScreen({ onBack }) {
  const {
    user,
    employee,
    logout,
    updateLocalProfile,
    enableBiometric,
    disableBiometric,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("details");

  const [name, setName] = useState(employee?.name || user?.name || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [designation, setDesignation] = useState(employee?.designation || "");
  const [address, setAddress] = useState(employee?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(employee?.emergencyContact || "");
  const [bio, setBio] = useState(employee?.bio || "");
  const [avatar, setAvatar] = useState(employee?.avatar || user?.avatar || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);


  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);


  const [biometricInfo, setBiometricInfo] = useState({
    available: false,
    enrolled: false,
    biometricType: "Fingerprint / Face ID",
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);


  const [serverUrl, setServerUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);


  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

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
      setAvatar(employee?.avatar || user?.avatar || "");
    }
  }, [employee, user]);

  async function getAssetBase64(asset) {
    if (asset.base64) {
      return asset.base64.startsWith("data:")
        ? asset.base64
        : `data:image/jpeg;base64,${asset.base64}`;
    }
    if (asset.uri && asset.uri.startsWith("data:")) {
      return asset.uri;
    }
    if (asset.uri && Platform.OS !== "web") {
      try {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      } catch (e) {
        console.warn("Failed reading asset as base64 with FileSystem:", e);
      }
    }
    return asset.uri;
  }

  async function processAndUploadImage(asset) {
    setUploadingAvatar(true);
    try {
      const base64Data = await getAssetBase64(asset);
      const res = await api.uploadAvatar(base64Data);
      if (res?.avatarUrl) {
        setAvatar(res.avatarUrl);
        if (updateLocalProfile) {
          updateLocalProfile(
            res.user || { ...(user || {}), avatar: res.avatarUrl },
            res.employee || { ...(employee || {}), avatar: res.avatarUrl }
          );
        }
        Alert.alert("Photo Updated", "Your profile photo has been successfully updated!");
      }
    } catch (err) {
      Alert.alert("Upload Failed", err.message || "Could not upload profile photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleChooseFromLibrary() {
    setPhotoModalOpen(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processAndUploadImage(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Picker Error", err.message || "Failed to open photo library.");
    }
  }

  async function handleTakePhoto() {
    setPhotoModalOpen(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to capture a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processAndUploadImage(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Camera Error", err.message || "Failed to open camera.");
    }
  }

  async function handleRemovePhoto() {
    setPhotoModalOpen(false);
    setUploadingAvatar(true);
    try {
      const res = await api.updateProfile({ avatar: "" });
      setAvatar("");
      if (updateLocalProfile) {
        updateLocalProfile(
          res.user || { ...(user || {}), avatar: "" },
          res.employee || { ...(employee || {}), avatar: "" }
        );
      }
      Alert.alert("Photo Removed", "Your profile photo has been removed.");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to remove photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

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
        "Disable Biometric Unlock",
        "Are you sure you want to disable biometric login on this device?",
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
                Alert.alert("Deactivated", "Biometric session credentials removed from device.");
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
          "Biometric Login Enabled",
          `You can now sign in with your ${biometricInfo.biometricType || "biometric sensor"}!`
        );
      } catch (err) {
        Alert.alert("Setup Incomplete", err.message || "Could not register biometric authentication.");
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
      Alert.alert("Profile Updated", res.message || "Your profile details have been saved.");
    } catch (err) {
      Alert.alert("Update Failed", err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing Fields", "Please provide current and new password.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Weak Password", "New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      Alert.alert("Password Changed", res.message || "Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      Alert.alert("Change Failed", err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSaveServer() {
    if (!serverUrl.trim()) return;
    setSavingUrl(true);
    try {
      await api.setBaseUrl(serverUrl.trim());
      Alert.alert("Server Config Saved", `Active API base URL set to: ${serverUrl}`);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSavingUrl(false);
    }
  }

  const initials = (name || user?.name || "VX")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Profile & Security</Text>
          <Text style={styles.headerSubtitle}>Personal data and credentials</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutTopBtn}
          onPress={() => setLogoutModalOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WateryCard style={styles.identityCard} elevated>
          <View style={styles.avatarRow}>
            <TouchableOpacity
              style={styles.avatarCircleContainer}
              onPress={() => setPhotoModalOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.avatarCircle}>
                {avatar ? (
                  <Image
                    source={{ uri: getFullMediaUrl(avatar) }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
                {uploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#00f0ff" />
                  </View>
                )}
              </View>

              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={13} color="#040915" />
              </View>
            </TouchableOpacity>

            <View style={styles.identityDetails}>
              <View style={styles.corpBadge}>
                <Text style={styles.corpBadgeText}>VORLDX INDUSTRIES</Text>
              </View>
              <Text style={styles.identityName} numberOfLines={1}>
                {name || "Employee"}
              </Text>
              <Text style={styles.identityRole}>
                {employee?.employeeId ? `${employee.employeeId} · ` : ""}
                {employee?.department || "Operations"}
              </Text>
              <Text style={styles.identityEmail} numberOfLines={1}>
                {user?.email || "employee@vorldx.com"}
              </Text>

              <TouchableOpacity
                style={styles.changePhotoPill}
                onPress={() => setPhotoModalOpen(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={12} color="#00f0ff" />
                <Text style={styles.changePhotoPillText}>
                  {avatar ? "Change Photo" : "Upload Photo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </WateryCard>

        {}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "details" && styles.tabBtnActive]}
            onPress={() => setActiveTab("details")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person-outline"
              size={15}
              color={activeTab === "details" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === "details" && styles.tabBtnTextActive]}>
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "security" && styles.tabBtnActive]}
            onPress={() => setActiveTab("security")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={activeTab === "security" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === "security" && styles.tabBtnTextActive]}>
              Security
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "server" && styles.tabBtnActive]}
            onPress={() => setActiveTab("server")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="server-outline"
              size={15}
              color={activeTab === "server" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === "server" && styles.tabBtnTextActive]}>
              Server
            </Text>
          </TouchableOpacity>
        </View>

        {}
        {activeTab === "details" && (
          <WateryCard style={styles.tabContentCard} elevated>
            <Text style={styles.sectionHeader}>EMPLOYEE INFORMATION</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full Legal Name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>CONTACT PHONE</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>DESIGNATION</Text>
              <TextInput
                style={styles.input}
                value={designation}
                onChangeText={setDesignation}
                placeholder="Software Engineer, Operations..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>OFFICIAL RESIDENTIAL ADDRESS</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="City, State, Country"
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>EMERGENCY CONTACT PERSON & NUMBER</Text>
              <TextInput
                style={styles.input}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="Name & Contact Number"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>PROFESSIONAL BIO</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Brief summary..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <DarkButton
              title="Save Profile Changes"
              onPress={handleSaveProfile}
              loading={savingProfile}
              icon={<Ionicons name="save-outline" size={17} color="#FFFFFF" />}
              style={{ marginTop: spacing.md }}
            />
          </WateryCard>
        )}

        {}
        {activeTab === "security" && (
          <View style={styles.securityStack}>
            {}
            <WateryCard style={styles.tabContentCard} elevated>
              <View style={styles.bioCardHeader}>
                <View style={styles.bioIconBox}>
                  <Ionicons
                    name={
                      biometricInfo.biometricType.toLowerCase().includes("face")
                        ? "scan"
                        : "finger-print"
                    }
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bioTitle}>{biometricInfo.biometricType}</Text>
                  <Text style={styles.bioSub}>
                    {biometricInfo.available
                      ? "Hardware-backed biometric authentication"
                      : "Biometric sensor unavailable on this device"}
                  </Text>
                </View>
              </View>

              <View style={styles.bioStatusPillRow}>
                <View
                  style={[
                    styles.bioPill,
                    biometricEnabled ? styles.bioPillActive : styles.bioPillInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.bioPillDot,
                      { backgroundColor: biometricEnabled ? "#16A34A" : "#94A3B8" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.bioPillText,
                      { color: biometricEnabled ? "#15803D" : colors.textSecondary },
                    ]}
                  >
                    {biometricEnabled ? "BIOMETRICS ACTIVE" : "BIOMETRICS DISABLED"}
                  </Text>
                </View>
              </View>

              <Text style={styles.bioDescription}>
                When activated, your authorized session token is protected in hardware keychain
                (iOS Keychain / Android KeyStore) for 1-tap biometric unlock.
              </Text>

              <DarkButton
                title={
                  biometricBusy
                    ? "Updating Security..."
                    : biometricEnabled
                    ? `Disable ${biometricInfo.biometricType}`
                    : `Enable ${biometricInfo.biometricType}`
                }
                variant={biometricEnabled ? "secondary" : "primary"}
                onPress={handleToggleBiometric}
                loading={biometricBusy}
                icon={
                  <Ionicons
                    name={biometricEnabled ? "close-circle-outline" : "shield-checkmark-outline"}
                    size={17}
                    color={biometricEnabled ? colors.darkButton : "#FFFFFF"}
                  />
                }
                style={{ marginTop: spacing.md }}
              />
            </WateryCard>

            {}
            <WateryCard style={styles.tabContentCard} elevated>
              <Text style={styles.sectionHeader}>CHANGE ACCOUNT PASSWORD</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CURRENT PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter existing password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>NEW PASSWORD (MIN 8 CHARS)</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter strong password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>

              <DarkButton
                title="Update Password"
                onPress={handleSavePassword}
                loading={savingPassword}
                icon={<Ionicons name="key-outline" size={17} color="#FFFFFF" />}
                style={{ marginTop: spacing.md }}
              />
            </WateryCard>
          </View>
        )}

        {}
        {activeTab === "server" && (
          <WateryCard style={styles.tabContentCard} elevated>
            <Text style={styles.sectionHeader}>BACKEND SERVER ENDPOINT</Text>
            <Text style={styles.serverDescription}>
              Configure the network IP address or domain hosting the VorldX HRMS Express backend API.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>API BASE URL</Text>
              <TextInput
                style={styles.input}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://10.34.107.125:5000/api"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>

            <DarkButton
              title="Save Server Configuration"
              onPress={handleSaveServer}
              loading={savingUrl}
              icon={<Ionicons name="save-outline" size={17} color="#FFFFFF" />}
              style={{ marginTop: spacing.md }}
            />
          </WateryCard>
        )}

        {}
        <WateryCard style={styles.logoutCard}>
          <Text style={styles.logoutTitle}>Session Termination</Text>
          <Text style={styles.logoutDesc}>
            Sign out of this device. Your cached session and auth tokens will be cleared.
          </Text>

          <DarkButton
            title="Sign Out of VorldX"
            variant="danger"
            onPress={() => setLogoutModalOpen(true)}
            icon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
            style={{ marginTop: spacing.md }}
          />
        </WateryCard>
      </ScrollView>

      {}
      <ConfirmationModal
        visible={logoutModalOpen}
        title="Sign Out of VorldX?"
        message="You will need to re-authenticate with your work email and password or biometrics to sign back in."
        confirmLabel="Sign Out"
        isDanger
        onConfirm={() => {
          setLogoutModalOpen(false);
          logout();
        }}
        onCancel={() => setLogoutModalOpen(false)}
        icon="log-out-outline"
      />

      {}
      <Modal
        visible={photoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPhotoModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.photoModalDialog}>
                <View style={styles.photoModalHeader}>
                  <View style={styles.photoModalIconBox}>
                    <Ionicons name="camera" size={24} color="#00f0ff" />
                  </View>
                  <Text style={styles.photoModalTitle}>Profile Photo</Text>
                  <Text style={styles.photoModalSubtitle}>
                    Upload or take a photo to represent your employee profile
                  </Text>
                </View>

                <View style={styles.photoModalActions}>
                  <TouchableOpacity
                    style={styles.photoOptionBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.photoOptionIcon, { backgroundColor: "rgba(2, 132, 199, 0.2)" }]}>
                      <Ionicons name="camera" size={20} color="#38bdf8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.photoOptionTitle}>Take New Photo</Text>
                      <Text style={styles.photoOptionDesc}>Open camera and take a selfie</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#64748b" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoOptionBtn}
                    onPress={handleChooseFromLibrary}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.photoOptionIcon, { backgroundColor: "rgba(0, 240, 255, 0.15)" }]}>
                      <Ionicons name="images" size={20} color="#00f0ff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.photoOptionTitle}>Choose from Gallery</Text>
                      <Text style={styles.photoOptionDesc}>Select from device photos</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#64748b" />
                  </TouchableOpacity>

                  {Boolean(avatar) && (
                    <TouchableOpacity
                      style={[styles.photoOptionBtn, styles.photoOptionBtnRemove]}
                      onPress={handleRemovePhoto}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.photoOptionIcon, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.photoOptionTitle, { color: "#ef4444" }]}>Remove Current Photo</Text>
                        <Text style={styles.photoOptionDesc}>Revert to name initials</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.photoModalCancelBtn}
                  onPress={() => setPhotoModalOpen(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  logoutTopBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  identityCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarCircleContainer: {
    position: "relative",
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.darkButton,
    borderWidth: 2.5,
    borderColor: "#00f0ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...shadows.darkButton,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 9, 21, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00f0ff",
    borderWidth: 2,
    borderColor: "#040915",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  changePhotoPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
  },
  changePhotoPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#00f0ff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 9, 21, 0.8)",
    justifyContent: "flex-end",
    padding: spacing.md,
  },
  photoModalDialog: {
    backgroundColor: "#081326",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.25)",
    elevation: 10,
  },
  photoModalHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  photoModalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
  },
  photoModalSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 3,
    paddingHorizontal: 16,
  },
  photoModalActions: {
    gap: 10,
    marginBottom: 12,
  },
  photoOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#0d1b33",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e3357",
  },
  photoOptionBtnRemove: {
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  photoOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  photoOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
  },
  photoOptionDesc: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  photoModalCancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#0d1b33",
    borderWidth: 1,
    borderColor: "#1e3357",
    marginTop: 4,
  },
  photoModalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  identityDetails: {
    flex: 1,
  },
  corpBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.bgWateryDeep,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderWateryActive,
    marginBottom: 3,
  },
  corpBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.8,
  },
  identityName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  identityRole: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  identityEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.lg,
    padding: 4,
    gap: 4,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radii.md,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: colors.darkButton,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },
  tabContentCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textWatery,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
  },
  securityStack: {
    gap: spacing.md,
  },
  bioCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bioIconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.bgWateryDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  bioSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bioStatusPillRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  bioPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    gap: 6,
  },
  bioPillActive: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  bioPillInactive: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  bioPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bioPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bioDescription: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  serverDescription: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  logoutCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF5F5",
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#B91C1C",
  },
  logoutDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
