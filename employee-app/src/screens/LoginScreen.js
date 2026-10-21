import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import biometricService from "../services/biometricService";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import DarkButton from "../components/DarkButton";
import WateryCard from "../components/WateryCard";

export default function LoginScreen() {
  const { login, loginWithBiometrics } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometrics");
  const [biometricAccount, setBiometricAccount] = useState({ email: "", name: "" });
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    api.getBaseUrl().then(setServerUrl);
    checkBiometrics();
  }, []);

  async function checkBiometrics() {
    try {
      const bioInfo = await biometricService.checkBiometricAvailability();
      setBiometricAvailable(bioInfo.available);
      setBiometricType(bioInfo.biometricType || "Fingerprint / Face ID");

      const isEnabled = await biometricService.isBiometricEnabled();
      setBiometricEnabled(isEnabled);

      if (isEnabled) {
        const acc = await biometricService.getBiometricAccount();
        setBiometricAccount(acc);
        if (acc.email && !email) {
          setEmail(acc.email);
        }
      }
    } catch (e) {
      console.warn("Error checking biometric status:", e);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      if (serverUrl) {
        await api.setBaseUrl(serverUrl);
      }
      await login(email, password);
    } catch (err) {
      setError(err.message || "Failed to sign in. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBiometricLogin() {
    setError("");
    setBiometricLoading(true);
    try {
      if (serverUrl) {
        await api.setBaseUrl(serverUrl);
      }
      await loginWithBiometrics();
    } catch (err) {
      setError(err.message || "Biometric authentication failed. Please use your password.");
    } finally {
      setBiometricLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.logoMark}>
            <Ionicons name="finger-print" size={32} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>
            Vorld<Text style={styles.brandHighlight}>X</Text>
          </Text>
          <Text style={styles.brandSubtitle}>ENTERPRISE ATTENDANCE & HRMS</Text>
        </View>

        {/* Main Watery Form Card */}
        <WateryCard style={styles.card} elevated>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your employee account</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* 1-Tap Biometric Hero Card */}
          {biometricEnabled && (
            <View style={styles.biometricSection}>
              <TouchableOpacity
                style={[styles.biometricCard, biometricLoading && styles.disabled]}
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
                activeOpacity={0.82}
              >
                <View style={styles.biometricIconBadge}>
                  <Ionicons
                    name={
                      biometricType.toLowerCase().includes("face")
                        ? "scan-outline"
                        : "finger-print-outline"
                    }
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.biometricInfo}>
                  <Text style={styles.biometricTitle}>Unlock with {biometricType}</Text>
                  <Text style={styles.biometricSubtitle} numberOfLines={1}>
                    {biometricAccount.email
                      ? `Fast sign-in for ${biometricAccount.email}`
                      : "Tap to verify sensor"}
                  </Text>
                </View>

                {biometricLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN IN WITH PASSWORD</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          )}

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>WORK EMAIL</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. employee@vorldx.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Signature Dark Button */}
          <DarkButton
            title="Sign In with Password"
            onPress={handleLogin}
            loading={submitting}
            style={{ marginTop: 8 }}
            icon={<Ionicons name="log-in-outline" size={18} color="#FFFFFF" />}
          />

          {/* Biometric Enrollment Hint if available but not enabled */}
          {!biometricEnabled && biometricAvailable && (
            <View style={styles.biometricHintBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.biometricHintText}>
                <Text style={{ fontWeight: "700", color: colors.primaryDark }}>Biometrics available: </Text>
                Sign in with password, then toggle {biometricType} in your profile for fast unlock.
              </Text>
            </View>
          )}

          {/* Server Config Collapsible */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowServerConfig((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showServerConfig ? "chevron-up" : "settings-outline"}
              size={15}
              color={colors.primary}
            />
            <Text style={styles.configToggleText}>
              {showServerConfig ? "Hide Server Settings" : "Configure Backend Server IP"}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>BACKEND API BASE URL</Text>
              <TextInput
                style={styles.configInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://10.34.107.125:5000/api"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.configHelp}>
                Point to your development IP or company network URL.
              </Text>
            </View>
          )}
        </WateryCard>

        {/* Corporate Trust Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerNote}>
            VorldX Industries Private Limited · Secure Attendance Infrastructure
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgWatery,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  brandBox: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderWateryActive,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.card,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandHighlight: {
    color: colors.primary,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textWatery,
    marginTop: 4,
    letterSpacing: 1.5,
  },
  card: {
    padding: spacing.xl,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12.5,
    fontWeight: "600",
    flex: 1,
  },
  biometricSection: {
    marginBottom: spacing.lg,
  },
  biometricCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1.5,
    borderColor: colors.borderWateryActive,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 12,
  },
  biometricIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgWateryDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  biometricInfo: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  biometricSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderWatery,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    marginHorizontal: 10,
    letterSpacing: 0.8,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWatery,
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: colors.textPrimary,
  },
  biometricHintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgWateryDeep,
    borderWidth: 1,
    borderColor: colors.bgWateryGlow,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 8,
  },
  biometricHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  configToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: 6,
    paddingVertical: 4,
  },
  configToggleText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primary,
  },
  configBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceWatery,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderWatery,
  },
  configLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  configInput: {
    height: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.borderWatery,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
  },
  configHelp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    gap: 6,
  },
  footerNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});
