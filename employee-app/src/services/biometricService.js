import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const BIOMETRIC_ENABLED_KEY = "vorldx_biometric_enabled";
export const BIOMETRIC_TOKEN_KEY = "vorldx_biometric_token";
export const BIOMETRIC_USER_EMAIL = "vorldx_biometric_email";
export const BIOMETRIC_USER_NAME = "vorldx_biometric_name";


async function setSecureItem(key, value) {
  try {
    if (Platform.OS !== "web" && (await SecureStore.isAvailableAsync())) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return;
    }
  } catch (e) {
    console.warn("SecureStore set fallback:", e.message);
  }
  await AsyncStorage.setItem(key, value);
}

async function getSecureItem(key) {
  try {
    if (Platform.OS !== "web" && (await SecureStore.isAvailableAsync())) {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    }
  } catch (e) {
    console.warn("SecureStore get fallback:", e.message);
  }
  return AsyncStorage.getItem(key);
}

async function removeSecureItem(key) {
  try {
    if (Platform.OS !== "web" && (await SecureStore.isAvailableAsync())) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    console.warn("SecureStore delete fallback:", e.message);
  }
  await AsyncStorage.removeItem(key);
}


export async function checkBiometricAvailability() {
  if (Platform.OS === "web") {
    return {
      available: false,
      enrolled: false,
      biometricType: "Biometrics (Web Preview)",
      supportedTypes: [],
    };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType = "Fingerprint / Face ID";
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = Platform.OS === "ios" ? "Face ID" : "Face Recognition";
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


export async function isBiometricEnabled() {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    const token = await getSecureItem(BIOMETRIC_TOKEN_KEY);
    return enabled === "true" && Boolean(token);
  } catch {
    return false;
  }
}


export async function getBiometricAccount() {
  try {
    const email = await AsyncStorage.getItem(BIOMETRIC_USER_EMAIL);
    const name = await AsyncStorage.getItem(BIOMETRIC_USER_NAME);
    return { email: email || "", name: name || "" };
  } catch {
    return { email: "", name: "" };
  }
}


export async function authenticateBiometric(promptMessage = "Verify your fingerprint or face") {
  try {
    if (Platform.OS === "web") {
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
        error:
          result.error === "user_cancel"
            ? "Authentication cancelled"
            : result.warning || "Biometric verification failed",
      };
    }
  } catch (error) {
    return { success: false, error: error.message || "Biometric sensor error" };
  }
}


export async function enableBiometric(token, userEmail, userName) {
  if (!token) {
    throw new Error("Active session token required to enable biometric login.");
  }

  const authResult = await authenticateBiometric("Confirm your biometric to enable instant login");
  if (!authResult.success) {
    throw new Error(authResult.error || "Biometric verification was cancelled.");
  }

  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  await setSecureItem(BIOMETRIC_TOKEN_KEY, token);
  if (userEmail) await AsyncStorage.setItem(BIOMETRIC_USER_EMAIL, userEmail);
  if (userName) await AsyncStorage.setItem(BIOMETRIC_USER_NAME, userName);

  return { success: true };
}


export async function disableBiometric() {
  await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  await removeSecureItem(BIOMETRIC_TOKEN_KEY);
  await AsyncStorage.removeItem(BIOMETRIC_USER_EMAIL);
  await AsyncStorage.removeItem(BIOMETRIC_USER_NAME);
  return { success: true };
}


export async function loginWithBiometrics() {
  const enabled = await isBiometricEnabled();
  if (!enabled) {
    throw new Error(
      "Biometric login is not set up on this device. Please sign in with password first and enable it in your profile."
    );
  }

  const { biometricType } = await checkBiometricAvailability();

  const authResult = await authenticateBiometric(`Sign in to VorldX using ${biometricType}`);
  if (!authResult.success) {
    throw new Error(authResult.error || "Biometric authentication was cancelled.");
  }

  const token = await getSecureItem(BIOMETRIC_TOKEN_KEY);
  const email = await AsyncStorage.getItem(BIOMETRIC_USER_EMAIL);
  const name = await AsyncStorage.getItem(BIOMETRIC_USER_NAME);

  if (!token) {
    throw new Error("No stored biometric credentials found. Please sign in with password.");
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
