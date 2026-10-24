import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { TOKEN_KEY, USER_KEY } from "../services/api";
import biometricService from "../services/biometricService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
          
          api.getMe().then((res) => {
            if (res.user) {
              setUser(res.user);
              setEmployee(res.employee);
              AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
            }
          }).catch(() => {});
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    const token = data.token;
    const currentUser = data.user;
    const currentEmployee = data.employee;

    if (!token) throw new Error("No token returned by server");

    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));

    setUser(currentUser);
    setEmployee(currentEmployee);
    return data;
  }

  async function loginWithOtp(phone, otp) {
    const data = await api.loginWithOtp(phone, otp);
    const token = data.token;
    const currentUser = data.user;
    const currentEmployee = data.employee;

    if (!token) throw new Error("No token returned by server");

    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));

    setUser(currentUser);
    setEmployee(currentEmployee);
    return data;
  }

  async function registerAndLogin(payload) {
    const data = await api.completeRegistration(payload);
    const token = data.token;
    const currentUser = data.user;
    const currentEmployee = data.employee;

    if (!token) throw new Error("No token returned by server");

    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));

    setUser(currentUser);
    setEmployee(currentEmployee);
    return data;
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
    setEmployee(null);
  }

  async function refreshProfile() {
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
        setEmployee(res.employee);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
    } catch (e) {
      console.error("Refresh profile error:", e);
    }
  }

  function updateLocalProfile(updatedUser, updatedEmployee) {
    if (updatedUser) {
      setUser(updatedUser);
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser)).catch(() => {});
    }
    if (updatedEmployee) {
      setEmployee(updatedEmployee);
    }
  }

  async function loginWithBiometrics() {
    const { token } = await biometricService.loginWithBiometrics();
    await AsyncStorage.setItem(TOKEN_KEY, token);

    
    const res = await api.getMe();
    if (!res?.user) {
      throw new Error("Failed to verify user profile. Please log in with password.");
    }

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    setEmployee(res.employee);
    return res;
  }

  async function enableBiometric() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("No active session found. Please log in first.");
    }
    return biometricService.enableBiometric(
      token,
      user?.email,
      user?.name || employee?.name || "Employee"
    );
  }

  async function disableBiometric() {
    return biometricService.disableBiometric();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        loading,
        login,
        loginWithOtp,
        registerAndLogin,
        loginWithBiometrics,
        enableBiometric,
        disableBiometric,
        logout,
        refreshProfile,
        updateLocalProfile,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
