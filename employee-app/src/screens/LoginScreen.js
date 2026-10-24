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
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import biometricService from "../services/biometricService";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import DarkButton from "../components/DarkButton";
import WateryCard from "../components/WateryCard";

export default function LoginScreen() {
  const { login, loginWithOtp, registerAndLogin, loginWithBiometrics } = useAuth();
  const themeContext = useTheme();
  const wallpaper = themeContext?.wallpaper;

  const [authMode, setAuthMode] = useState("mobile_otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtpStep, setLoginOtpStep] = useState(1);
  const [loginDemoOtp, setLoginDemoOtp] = useState("");
  const [loginEnteredOtp, setLoginEnteredOtp] = useState("");
  const [loginMaskedPhone, setLoginMaskedPhone] = useState("");
  const [loginEmployee, setLoginEmployee] = useState(null);

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometrics");
  const [biometricAccount, setBiometricAccount] = useState({ email: "", name: "" });
  const [biometricLoading, setBiometricLoading] = useState(false);

  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyEmpId, setVerifyEmpId] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  async function handlePasswordLogin() {
    if (!email.trim() || !password) {
      setError("Please enter your employee ID / registered mobile and password.");
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

  async function handleSendLoginOtp(presetPhone) {
    const phoneToUse = (presetPhone || loginPhone).trim();
    if (!phoneToUse) {
      setError("Please enter your registered mobile number or Employee ID.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      if (serverUrl) {
        await api.setBaseUrl(serverUrl);
      }
      const res = await api.sendLoginOtp(phoneToUse);
      if (res.success) {
        setLoginPhone(res.phone || phoneToUse);
        setLoginMaskedPhone(res.maskedPhone || phoneToUse);
        setLoginDemoOtp(res.demoOtp || "8426");
        setLoginEnteredOtp(res.demoOtp || "8426");
        setLoginEmployee(res.employee);
        setLoginOtpStep(2);
        setSuccessNotice(`Verification code sent to registered number: ${res.maskedPhone || phoneToUse}`);
      } else {
        setError(res.message || "Failed to send login OTP.");
      }
    } catch (err) {
      setError(err.message || "Failed to send login OTP. Check connection.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyLoginOtp() {
    if (!loginEnteredOtp.trim()) {
      setError("Please enter the 4-digit code sent to your registered number.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      if (serverUrl) {
        await api.setBaseUrl(serverUrl);
      }
      await loginWithOtp(loginPhone, loginEnteredOtp.trim());
    } catch (err) {
      setError(err.message || "Login failed. Invalid OTP code.");
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
      setError(err.message || "Biometric authentication failed. Please use your password or OTP.");
    } finally {
      setBiometricLoading(false);
    }
  }

  async function handleVerifyEmployeeId(presetId, presetPhone) {
    const idToVerify = (presetId || verifyEmpId).trim();
    const phoneToVerify = (presetPhone || verifyPhone).trim();

    if (!idToVerify && !phoneToVerify) {
      setError("Please enter your assigned Employee ID or registered mobile number.");
      return;
    }

    setError("");
    setVerifying(true);
    try {
      if (serverUrl) {
        await api.setBaseUrl(serverUrl);
      }
      const res = await api.verifyEmployeeId(idToVerify || phoneToVerify);
      if (res.success && res.verified) {
        setVerifiedEmployee(res.employee);
        setVerifyPhone(res.employee.phone || phoneToVerify);
        setSimulatedOtp(res.demoOtp || "8426");
        setEnteredOtp(res.demoOtp || "8426");
        setVerifyStep(2);
        setSuccessNotice(
          `Registered mobile verified: ${res.employee.maskedPhone || res.employee.phone || "+91 98765 43210"}. Verification OTP sent!`
        );
      } else {
        setError(res.message || "Could not verify employee record.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify Employee ID.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerifyRegisterOtp() {
    if (!enteredOtp.trim()) {
      setError("Please enter the 4-digit verification code sent to your registered number.");
      return;
    }

    setError("");
    setVerifying(true);
    try {
      const res = await api.verifyDemoOtp(verifiedEmployee.employeeId, enteredOtp);
      if (res.success && res.verified) {
        setVerifyStep(3);
        setSuccessNotice("Registered mobile verified! Set your account password to complete registration.");
      } else {
        setError(res.message || "Invalid OTP code. Use demo code 8426.");
      }
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleCompleteRegistration() {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setVerifying(true);
    try {
      await registerAndLogin({
        employeeId: verifiedEmployee.employeeId,
        otp: enteredOtp,
        password: newPassword,
        name: verifiedEmployee.name,
        department: verifiedEmployee.department,
        designation: verifiedEmployee.designation,
        phone: verifyPhone || verifiedEmployee.phone,
      });
    } catch (err) {
      setError(err.message || "Failed to complete account registration.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBox}>
          <View style={styles.logoMark}>
            <Ionicons name="finger-print" size={32} color="#00F0FF" />
          </View>
          <Text style={styles.brandTitle}>
            Vorld<Text style={styles.brandHighlight}>X</Text>
          </Text>
          <Text style={styles.brandSubtitle}>ENTERPRISE ATTENDANCE & HRMS</Text>
        </View>

        <View style={styles.authModeTabs}>
          <TouchableOpacity
            style={[styles.authTab, authMode === "mobile_otp" && styles.authTabActive]}
            onPress={() => {
              setAuthMode("mobile_otp");
              setError("");
              setSuccessNotice("");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={15}
              color={authMode === "mobile_otp" ? "#040915" : "#94A3B8"}
            />
            <Text
              style={[styles.authTabText, authMode === "mobile_otp" && styles.authTabTextActive]}
            >
              Mobile OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authTab, authMode === "password" && styles.authTabActive]}
            onPress={() => {
              setAuthMode("password");
              setError("");
              setSuccessNotice("");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="key-outline"
              size={15}
              color={authMode === "password" ? "#040915" : "#94A3B8"}
            />
            <Text
              style={[styles.authTabText, authMode === "password" && styles.authTabTextActive]}
            >
              Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authTab, authMode === "verify" && styles.authTabActive]}
            onPress={() => {
              setAuthMode("verify");
              setError("");
              setSuccessNotice("");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={authMode === "verify" ? "#040915" : "#94A3B8"}
            />
            <Text
              style={[styles.authTabText, authMode === "verify" && styles.authTabTextActive]}
            >
              First-Time Setup
            </Text>
          </TouchableOpacity>
        </View>

        <WateryCard style={styles.card} elevated>
          {authMode === "mobile_otp" ? (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Mobile OTP Login</Text>
                <Text style={styles.cardSubtitle}>
                  Fast passwordless sign in using your registered mobile number
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#F87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {successNotice ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                  <Text style={styles.successText}>{successNotice}</Text>
                </View>
              ) : null}

              {loginOtpStep === 1 ? (
                <View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>ENTER REGISTERED MOBILE NUMBER</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="call-outline"
                        size={18}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. +91 98765 43210 or 9876543210"
                        placeholderTextColor="#64748B"
                        value={loginPhone}
                        onChangeText={setLoginPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <DarkButton
                    title="Send Login OTP Code"
                    onPress={() => handleSendLoginOtp()}
                    loading={submitting}
                    icon={<Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />}
                  />
                </View>
              ) : (
                <View>
                  <View style={styles.verifiedProfileCard}>
                    <View style={styles.verifiedHeader}>
                      <Ionicons name="phone-portrait" size={18} color="#00F0FF" />
                      <Text style={styles.verifiedName}>Registered Mobile Verified</Text>
                    </View>
                    <Text style={styles.verifiedMeta}>
                      Code sent to: {loginMaskedPhone || loginPhone}
                    </Text>
                  </View>

                  <View style={styles.simulatedOtpBanner}>
                    <Ionicons name="key" size={22} color="#00F0FF" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simulatedOtpTitle}>Login OTP: {loginDemoOtp}</Text>
                      <Text style={styles.simulatedOtpSubtitle}>
                        Demo SMS delivered to {loginMaskedPhone || loginPhone}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.otpAutoFillBtn}
                      onPress={() => setLoginEnteredOtp(loginDemoOtp)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.otpAutoFillText}>Fill OTP</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>ENTER 4-DIGIT LOGIN OTP</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="chatbox-ellipses-outline"
                        size={18}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter 4-digit code (8426)"
                        placeholderTextColor="#64748B"
                        value={loginEnteredOtp}
                        onChangeText={setLoginEnteredOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <TouchableOpacity
                      style={styles.backStepButton}
                      onPress={() => setLoginOtpStep(1)}
                    >
                      <Ionicons name="arrow-back" size={18} color="#38BDF8" />
                      <Text style={styles.backStepText}>Change</Text>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <DarkButton
                        title="Verify & Sign In"
                        onPress={handleVerifyLoginOtp}
                        loading={submitting}
                        icon={<Ionicons name="log-in-outline" size={18} color="#FFFFFF" />}
                      />
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : authMode === "password" ? (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Welcome Back</Text>
                <Text style={styles.cardSubtitle}>
                  Sign in with assigned Employee ID, registered mobile, or email
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#F87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

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
                        color="#00F0FF"
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
                      <ActivityIndicator size="small" color="#00F0FF" />
                    ) : (
                      <Ionicons name="arrow-forward" size={18} color="#00F0FF" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR SIGN IN WITH PASSWORD</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMPLOYEE ID / REGISTERED MOBILE / WORK EMAIL</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#38BDF8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. VX-EMP-001 or +91 98765 43210"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#38BDF8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your account password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <DarkButton
                title="Sign In with Password"
                onPress={handlePasswordLogin}
                loading={submitting}
                style={{ marginTop: 8 }}
                icon={<Ionicons name="log-in-outline" size={18} color="#FFFFFF" />}
              />

              {!biometricEnabled && biometricAvailable && (
                <View style={styles.biometricHintBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#38BDF8" />
                  <Text style={styles.biometricHintText}>
                    <Text style={{ fontWeight: "700", color: "#38BDF8" }}>
                      Biometrics available:{" "}
                    </Text>
                    Enable fingerprint or face unlock inside Profile settings after login.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>First-Time Account Setup</Text>
                <Text style={styles.cardSubtitle}>
                  Verify your assigned Employee ID and set your password
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#F87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {successNotice ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                  <Text style={styles.successText}>{successNotice}</Text>
                </View>
              ) : null}

              {verifyStep === 1 && (
                <View>
                  <Text style={styles.stepIndicator}>STEP 1 OF 3: ENTER EMPLOYEE ID OR MOBILE</Text>
                  <Text style={styles.stepDesc}>
                    Provide your assigned Employee ID or registered mobile number to receive your onboarding code.
                  </Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>ASSIGNED EMPLOYEE ID</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="id-card-outline"
                        size={18}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. VX-EMP-001"
                        placeholderTextColor="#64748B"
                        value={verifyEmpId}
                        onChangeText={setVerifyEmpId}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>OR REGISTERED MOBILE NUMBER</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="call-outline"
                        size={18}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. +91 98765 43210"
                        placeholderTextColor="#64748B"
                        value={verifyPhone}
                        onChangeText={setVerifyPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  <DarkButton
                    title="Send Setup OTP"
                    onPress={() => handleVerifyEmployeeId()}
                    loading={verifying}
                    icon={<Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />}
                  />
                </View>
              )}

              {verifyStep === 2 && (
                <View>
                  <Text style={styles.stepIndicator}>STEP 2 OF 3: VERIFY OTP ON REGISTERED NUMBER</Text>

                  {verifiedEmployee && (
                    <View style={styles.verifiedProfileCard}>
                      <View style={styles.verifiedHeader}>
                        <Ionicons name="shield-checkmark" size={20} color="#00F0FF" />
                        <Text style={styles.verifiedName}>{verifiedEmployee.name}</Text>
                      </View>
                      <Text style={styles.verifiedMeta}>
                        ID: {verifiedEmployee.employeeId} · {verifiedEmployee.department} · {verifiedEmployee.designation}
                      </Text>
                      <View style={styles.registeredNumberBanner}>
                        <Ionicons name="phone-portrait" size={16} color="#38BDF8" />
                        <Text style={styles.registeredNumberLabel}>Registered Mobile:</Text>
                        <Text style={styles.registeredNumberValue}>
                          {verifiedEmployee.maskedPhone || verifiedEmployee.phone || "+91 98765 43210"}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.simulatedOtpBanner}>
                    <Ionicons name="key" size={22} color="#00F0FF" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simulatedOtpTitle}>Verification Code: {simulatedOtp}</Text>
                      <Text style={styles.simulatedOtpSubtitle}>
                        Sent to registered number: {verifiedEmployee?.maskedPhone || "+91 98765 43210"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.otpAutoFillBtn}
                      onPress={() => setEnteredOtp(simulatedOtp)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.otpAutoFillText}>Fill OTP</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>ENTER 4-DIGIT CODE RECEIVED ON REGISTERED NUMBER</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="chatbox-ellipses-outline"
                        size={18}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter 4-digit code (8426)"
                        placeholderTextColor="#64748B"
                        value={enteredOtp}
                        onChangeText={setEnteredOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <TouchableOpacity
                      style={styles.backStepButton}
                      onPress={() => setVerifyStep(1)}
                    >
                      <Ionicons name="arrow-back" size={18} color="#38BDF8" />
                      <Text style={styles.backStepText}>Change</Text>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <DarkButton
                        title="Verify OTP Code"
                        onPress={handleVerifyRegisterOtp}
                        loading={verifying}
                        icon={<Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />}
                      />
                    </View>
                  </View>
                </View>
              )}

              {verifyStep === 3 && (
                <View>
                  <Text style={styles.stepIndicator}>STEP 3 OF 3: CREATE ACCOUNT PASSWORD</Text>
                  <Text style={styles.stepDesc}>
                    Registered mobile verified! Create your account password to complete registration and log in.
                  </Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>CREATE PASSWORD</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="At least 6 characters"
                        placeholderTextColor="#64748B"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="checkmark-done-outline"
                        size={18}
                        color="#38BDF8"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Re-enter password"
                        placeholderTextColor="#64748B"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <TouchableOpacity
                      style={styles.backStepButton}
                      onPress={() => setVerifyStep(2)}
                    >
                      <Ionicons name="arrow-back" size={18} color="#38BDF8" />
                      <Text style={styles.backStepText}>Back</Text>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <DarkButton
                        title="Complete Registration"
                        onPress={handleCompleteRegistration}
                        loading={verifying}
                        icon={<Ionicons name="sparkles" size={18} color="#FFFFFF" />}
                      />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Ionicons
              name={showServerConfig ? "chevron-up" : "server-outline"}
              size={14}
              color="#38BDF8"
            />
            <Text style={styles.configToggleText}>
              {showServerConfig ? "Hide Server URL" : "Custom Backend Server URL"}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>BACKEND API URL</Text>
              <TextInput
                style={styles.configInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.X:5000/api"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.configHelp}>
                Point to your development machine IP for mobile testing.
              </Text>
            </View>
          )}
        </WateryCard>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color="#00F0FF" />
          <Text style={styles.footerNote}>
            VorldX Industries Private Limited · Enterprise Attendance System
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  brandBox: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoMark: {
    width: 62,
    height: 62,
    borderRadius: radii.xl,
    backgroundColor: "#061A38",
    borderWidth: 1.5,
    borderColor: "#00F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    shadowColor: "#00F0FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  brandHighlight: {
    color: "#00F0FF",
  },
  brandSubtitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#93C5FD",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  authModeTabs: {
    flexDirection: "row",
    backgroundColor: "#071733",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#1E3A8A",
    padding: 3,
    marginBottom: spacing.md,
    width: "100%",
    maxWidth: 420,
  },
  authTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radii.md,
    gap: 4,
  },
  authTabActive: {
    backgroundColor: "#00F0FF",
  },
  authTabText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#94A3B8",
  },
  authTabTextActive: {
    color: "#040915",
    fontWeight: "900",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: spacing.xl,
    backgroundColor: "rgba(6, 20, 44, 0.94)",
    borderColor: "rgba(56, 189, 248, 0.4)",
    borderWidth: 1.2,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#BAE6FD",
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(127, 29, 29, 0.55)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12.5,
    flex: 1,
    fontWeight: "700",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 78, 59, 0.55)",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  successText: {
    color: "#A7F3D0",
    fontSize: 12.5,
    flex: 1,
    fontWeight: "700",
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: "900",
    color: "#00F0FF",
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12.5,
    color: "#E0F2FE",
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  verifiedProfileCard: {
    backgroundColor: "#071D3E",
    borderWidth: 1,
    borderColor: "#38BDF8",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  verifiedName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  verifiedMeta: {
    fontSize: 12,
    color: "#BAE6FD",
    marginTop: 2,
  },
  registeredNumberBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#04152C",
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#1E3A8A",
  },
  registeredNumberLabel: {
    fontSize: 11,
    color: "#93C5FD",
    fontWeight: "600",
  },
  registeredNumberValue: {
    fontSize: 12,
    color: "#00F0FF",
    fontWeight: "900",
  },
  simulatedOtpBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#051A38",
    borderWidth: 1.5,
    borderColor: "#00F0FF",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 10,
  },
  simulatedOtpTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#00F0FF",
  },
  simulatedOtpSubtitle: {
    fontSize: 11.5,
    color: "#E0F2FE",
    marginTop: 2,
    lineHeight: 16,
  },
  otpAutoFillBtn: {
    backgroundColor: "#00F0FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  otpAutoFillText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#040915",
  },
  backStepButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#1E3A8A",
    backgroundColor: "#071D3E",
    gap: 4,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#38BDF8",
  },
  biometricSection: {
    marginBottom: spacing.lg,
  },
  biometricCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "#071D3E",
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  biometricIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: "#051630",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  biometricInfo: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  biometricSubtitle: {
    fontSize: 11.5,
    color: "#93C5FD",
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1E3A8A",
  },
  dividerText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
    marginHorizontal: spacing.sm,
    letterSpacing: 0.6,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38BDF8",
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#040D1D",
    borderWidth: 1.2,
    borderColor: "#1E3A8A",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  biometricHintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#061A3A",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 8,
  },
  biometricHintText: {
    fontSize: 12,
    color: "#BAE6FD",
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
    fontWeight: "800",
    color: "#38BDF8",
  },
  configBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: "#05152F",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#1E3A8A",
  },
  configLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  configInput: {
    height: 40,
    backgroundColor: "#040E20",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 13,
    color: "#FFFFFF",
  },
  configHelp: {
    fontSize: 11,
    color: "#94A3B8",
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
    color: "#94A3B8",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});
