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
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import biometricService from "../services/biometricService";

export default function LoginScreen() {
  const { login, loginWithBiometrics } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Biometric states
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
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* BRAND LOGO HEADER */}
        <View style={styles.brandBox}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.brandTitle}>
            Vorld<Text style={styles.brandHighlight}>X</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Employee Attendance System</Text>
        </View>

        {/* LOGIN FORM CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in with your employee credentials</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* 1-TAP BIOMETRIC LOGIN BUTTON (IF ENROLLED) */}
          {biometricEnabled && (
            <View style={styles.biometricSection}>
              <TouchableOpacity
                style={[styles.biometricBtn, biometricLoading && styles.btnDisabled]}
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
                activeOpacity={0.8}
              >
                <View style={styles.biometricIconBadge}>
                  <Text style={styles.biometricEmoji}>👆</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.biometricBtnTitle}>
                    Login with {biometricType}
                  </Text>
                  <Text style={styles.biometricBtnSub} numberOfLines={1}>
                    {biometricAccount.email
                      ? `Instant sign-in for ${biometricAccount.email}`
                      : "Tap to scan fingerprint or face"}
                  </Text>
                </View>
                {biometricLoading ? (
                  <ActivityIndicator color="#38bdf8" />
                ) : (
                  <Text style={styles.biometricArrow}>➔</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SIGN IN WITH PASSWORD</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          )}

          {/* EMAIL & PASSWORD FIELDS */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>WORK EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. anuraj@gmail.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, submitting && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In with Password</Text>
            )}
          </TouchableOpacity>

          {/* BIOMETRIC SETUP HINT IF NOT ENABLED YET */}
          {!biometricEnabled && biometricAvailable && (
            <View style={styles.biometricHintBox}>
              <Text style={styles.biometricHintIcon}>💡</Text>
              <Text style={styles.biometricHintText}>
                <Text style={{ fontWeight: "700", color: "#38bdf8" }}>Biometric Available:</Text> Sign in with your password, then enable {biometricType} in your Profile for instant 1-tap login!
              </Text>
            </View>
          )}

          {/* SERVER CONFIG TOGGLE */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Text style={styles.configToggleText}>
              {showServerConfig ? "▲ Hide Server Connection" : "⚙ Server Connection Settings"}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>BACKEND API BASE URL</Text>
              <TextInput
                style={styles.configInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.83:5000/api"
                placeholderTextColor="#475569"
                autoCapitalize="none"
              />
              <Text style={styles.configHelp}>
                Point to your Wi-Fi backend IP (e.g. 192.168.X.X:5000/api) or local server.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.footerNote}>Protected by VorldX Security & Governance</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
  },
  brandBox: {
    alignItems: "center",
    marginBottom: 26,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#172338",
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  logoLetter: {
    color: "#38bdf8",
    fontSize: 32,
    fontWeight: "bold",
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: 0.5,
  },
  brandHighlight: {
    color: "#38bdf8",
  },
  brandSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#f8fafc",
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: "#94a3b8",
    marginTop: 3,
    marginBottom: 18,
  },
  errorBox: {
    backgroundColor: "#29121a",
    borderWidth: 1,
    borderColor: "#f43f5e",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    lineHeight: 17,
  },

  /* BIOMETRIC LOGIN SECTION */
  biometricSection: {
    marginBottom: 16,
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "linear-gradient(135deg, #13243d, #1a3254)",
    backgroundColor: "#13243d",
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  biometricIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1e3557",
    alignItems: "center",
    justifyContent: "center",
  },
  biometricEmoji: {
    fontSize: 24,
  },
  biometricBtnTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  biometricBtnSub: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },
  biometricArrow: {
    color: "#38bdf8",
    fontSize: 18,
    fontWeight: "800",
    paddingRight: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1e293b",
  },
  dividerText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  biometricHintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#0d1a29",
    borderWidth: 1,
    borderColor: "#1e3957",
    borderRadius: 10,
    padding: 11,
    marginTop: 14,
  },
  biometricHintIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  biometricHintText: {
    flex: 1,
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16,
  },

  /* INPUTS & LOGIN */
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10.5,
    color: "#94a3b8",
    marginBottom: 6,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  input: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#1e2c44",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#f8fafc",
  },
  loginBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  configToggle: {
    alignItems: "center",
    marginTop: 18,
  },
  configToggleText: {
    color: "#64748b",
    fontSize: 12,
  },
  configBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#0b0f19",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e2c44",
  },
  configLabel: {
    color: "#94a3b8",
    fontSize: 10,
    marginBottom: 6,
    fontWeight: "700",
  },
  configInput: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#22324a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#38bdf8",
    fontSize: 12,
  },
  configHelp: {
    color: "#475569",
    fontSize: 10,
    marginTop: 6,
    lineHeight: 14,
  },
  footerNote: {
    textAlign: "center",
    color: "#475569",
    fontSize: 11,
    marginTop: 24,
  },
});
