
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api, {
  TOKEN_KEY,
  USER_KEY,
  clearSession,
  getToken,
} from "../services/api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem(USER_KEY) ||
        sessionStorage.getItem(USER_KEY) ||
        "null"
    );
  } catch {
    return null;
  }
}

function getUserFromResponse(data) {
  if (!data || typeof data !== "object") return null;

  const directUser =
    data.user || data.admin || data.employee || data.account;

  if (directUser) return directUser;

  if (data.data && typeof data.data === "object") {
    return getUserFromResponse(data.data);
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(
    () => Boolean(getToken())
  );

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = getToken();

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const data = response.data;
        const currentUser = getUserFromResponse(data) || data;

        if (!currentUser?.role) {
          throw new Error("User role missing from /auth/me response.");
        }

        if (active) {
          setUser(currentUser);
          const store = localStorage.getItem(TOKEN_KEY)
            ? localStorage
            : sessionStorage;

          store.setItem(USER_KEY, JSON.stringify(currentUser));
        }
      } catch {
        if (active) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  async function login(email, password, remember = true) {
    const response = await api.post("/auth/login", {
      email: email.trim(),
      password,
    });

    const data = response.data || {};
    const payload = data.data || data;

    const token =
      payload.token || payload.accessToken || payload.jwt;

    if (!token) {
      throw new Error(
        "Login response mein token nahi mila. Backend /auth/login check karo."
      );
    }

    clearSession();

    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, token);

    let nextUser = getUserFromResponse(payload);

    if (!nextUser) {
      try {
        const meResponse = await api.get("/auth/me");
        nextUser =
          getUserFromResponse(meResponse.data) || meResponse.data;
      } catch (error) {
        clearSession();
        setUser(null);
        throw error;
      }
    }

    if (!nextUser?.role) {
      clearSession();
      setUser(null);

      throw new Error(
        "Backend response mein user role nahi mila."
      );
    }

    store.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);

    return payload;
  }

  function updateUser(partial) {
    if (!partial || typeof partial !== "object") return;
    setUser((prev) => {
      const next = { ...(prev || {}), ...partial };
      try {
        const store = localStorage.getItem(TOKEN_KEY)
          ? localStorage
          : sessionStorage;
        store.setItem(USER_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to store updated user:", e);
      }
      return next;
    });
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isHRAdmin: user?.role === "HR_ADMIN",
    isEmployee: user?.role === "EMPLOYEE",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
