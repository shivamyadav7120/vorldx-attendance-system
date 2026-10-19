import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const BIOMETRIC_ENABLED_KEY = "vorldx_biometric_enabled";
export const BIOMETRIC_TOKEN_KEY = "vorldx_biometric_token";
export const BIOMETRIC_USER_EMAIL = "vorldx_biometric_email";
export const BIOMETRIC_USER_NAME = "vorldx_biometric_name";

/**
 * Check if the device has biometric hardware and enrolled biometrics
 */
export async function checkBiometricAvailability() {
  if (Platform.OS === "web") {
    return {
      available: false,
      enrolled: false,
      biometricType: "Fingerprint / Face ID",
      supportedTypes: [],
    };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType = "Fingerprint / Face ID";
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = Platform.OS === "ios" ? "Face ID" : "Facial Recognition";
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = Platform.OS === "ios" ? "Touch ID" : "Fingerprint Sensor";
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = "Iris Scanner";
    }

    return {
      available: Boolean(hasHardware),
      enrolled: Boolean(isEnrolled),
      biometricType,
      supportedTypes: supportedTypes || [],
    };
  } catch (error) {
    console.warn("Biometric check failed:", error);
    return {
      available: false,
      enrolled: false,
      biometricType: "Biometric Sensor",
      supportedTypes: [],
      error: error.message,
    };
  }
}

/**
 * Check if the user has enabled biometric login on this device
 */
export async function isBiometricEnabled() {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    const token = await AsyncStorage.getItem(BIOMETRIC_TOKEN_KEY);
    return enabled === "true" && Boolean(token);
  } catch {
    return false;
  }
}

/**
 * Get stored account details enrolled for biometrics
 */
export async function getBiometricAccount() {
  try {
    const email = await AsyncStorage.getItem(BIOMETRIC_USER_EMAIL);
    const name = await AsyncStorage.getItem(BIOMETRIC_USER_NAME);
    return { email: email || "", name: name || "" };
  } catch {
    return { email: "", name: "" };
  }
}

/**
 * Trigger biometric prompt to verify user identity
 */
export async function authenticateBiometric(promptMessage = "Verify your fingerprint or face") {
  try {
    if (Platform.OS === "web") {
      // In web browser preview, simulate browser credential or confirm prompt
      return { success: true };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use Password",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error === "user_cancel" ? "Authentication cancelled" : result.warning || "Biometric verification failed",
      };
    }
  } catch (error) {
    return { success: false, error: error.message || "Biometric sensor error" };
  }
}

/**
 * Enable biometric login for the current user session
 */
export async function enableBiometric(token, userEmail, userName) {
  if (!token) {
    throw new Error("Active session token required to enable biometric login.");
  }

  // Confirm user's biometrics before enabling
  const authResult = await authenticateBiometric("Confirm your biometric to enable instant login");
  if (!authResult.success) {
    throw new Error(authResult.error || "Biometric verification cancelled.");
  }

  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  await AsyncStorage.setItem(BIOMETRIC_TOKEN_KEY, token);
  if (userEmail) await AsyncStorage.setItem(BIOMETRIC_USER_EMAIL, userEmail);
  if (userName) await AsyncStorage.setItem(BIOMETRIC_USER_NAME, userName);

  return { success: true };
}

/**
 * Disable biometric login and remove stored biometric credentials
 */
export async function disableBiometric() {
  await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  await AsyncStorage.removeItem(BIOMETRIC_TOKEN_KEY);
  await AsyncStorage.removeItem(BIOMETRIC_USER_EMAIL);
  await AsyncStorage.removeItem(BIOMETRIC_USER_NAME);
  return { success: true };
}

/**
 * Perform login using stored biometric credentials
 */
export async function loginWithBiometrics() {
  const enabled = await isBiometricEnabled();
  if (!enabled) {
    throw new Error("Biometric login is not set up on this device. Please log in with password first and enable it in your profile.");
  }

  const { biometricType } = await checkBiometricAvailability();

  const authResult = await authenticateBiometric(`Sign in to VorldX using ${biometricType}`);
  if (!authResult.success) {
    throw new Error(authResult.error || "Biometric authentication was cancelled.");
  }

  const token = await AsyncStorage.getItem(BIOMETRIC_TOKEN_KEY);
  const email = await AsyncStorage.getItem(BIOMETRIC_USER_EMAIL);
  const name = await AsyncStorage.getItem(BIOMETRIC_USER_NAME);

  if (!token) {
    throw new Error("No stored biometric credentials found. Please log in with password.");
  }

  return {
    success: true,
    token,
    email,
    name,
  };
}

export default {
  checkBiometricAvailability,
  isBiometricEnabled,
  getBiometricAccount,
  authenticateBiometric,
  enableBiometric,
  disableBiometric,
  loginWithBiometrics,
};
