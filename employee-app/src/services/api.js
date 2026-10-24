
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const TOKEN_KEY = "vorldx_emp_token";
export const USER_KEY = "vorldx_emp_user";
export const API_URL_KEY = "vorldx_api_base_url";


export const CURRENT_HOST_IP = "192.168.1.61";

const DEFAULT_API_URL =
  Platform.OS === "web"
    ? "http://localhost:5000/api"
    : `http://${CURRENT_HOST_IP}:5000/api`;

let currentBaseUrl = DEFAULT_API_URL;

export async function getBaseUrl() {
  if (Platform.OS === "web") {
    const webHost = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
    const saved = await AsyncStorage.getItem(API_URL_KEY);
    if (saved && saved.startsWith("http")) {
      currentBaseUrl = saved.trim().replace(/\/+$/, "");
    } else {
      currentBaseUrl = `http://${webHost}:5000/api`;
    }
    return currentBaseUrl;
  }

  const saved = await AsyncStorage.getItem(API_URL_KEY);

  if (saved) {
    const cleaned = saved.trim().replace(/\/+$/, "");

    if (cleaned.includes("192.168.1.83") || cleaned.includes("10.34.107.125")) {
      currentBaseUrl = DEFAULT_API_URL;
      await AsyncStorage.setItem(API_URL_KEY, currentBaseUrl);
    } else {
      currentBaseUrl = cleaned;
    }
  } else {
    currentBaseUrl = DEFAULT_API_URL;
  }

  return currentBaseUrl;
}

export async function setBaseUrl(url) {
  currentBaseUrl = url.trim().replace(/\/+$/, "");
  await AsyncStorage.setItem(API_URL_KEY, currentBaseUrl);
  return currentBaseUrl;
}

export function getFullMediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  const host = currentBaseUrl.replace(/\/api\/?$/, "");
  return `${host}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function request(path, options = {}) {
  const baseUrl = await getBaseUrl();
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutMs = options.timeout || 20000;
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch (e) {}
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;

      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      const err = new Error("Network request timed out or was cancelled. Please check your connection.");
      err.isNetworkError = true;
      throw err;
    }

    if (
      error.message === "Network request failed" ||
      error.message === "Failed to fetch" ||
      error.message?.includes("Network") ||
      error.code === "ECONNABORTED"
    ) {
      const err = new Error(
        `Unable to reach backend at ${baseUrl}. Ensure backend server is running on port 5000.`
      );
      err.isNetworkError = true;
      throw err;
    }

    throw error;
  }
}

export default {
  getBaseUrl,
  setBaseUrl,
  request,

  async login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });
  },

  async sendLoginOtp(phone) {
    return request("/auth/send-login-otp", {
      method: "POST",
      body: JSON.stringify({
        phone: String(phone).trim(),
      }),
    });
  },

  async loginWithOtp(phone, otp) {
    return request("/auth/login-with-otp", {
      method: "POST",
      body: JSON.stringify({
        phone: String(phone).trim(),
        otp: String(otp).trim(),
      }),
    });
  },

  async verifyEmployeeId(employeeId) {
    return request("/auth/verify-employee-id", {
      method: "POST",
      body: JSON.stringify({ employeeId: employeeId.trim() }),
    });
  },

  async verifyDemoOtp(employeeId, otp) {
    return request("/auth/verify-demo-otp", {
      method: "POST",
      body: JSON.stringify({ employeeId: employeeId.trim(), otp: String(otp).trim() }),
    });
  },

  async completeRegistration(payload) {
    return request("/auth/register-complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getMe() {
    return request("/auth/me");
  },

  async getTodayAttendance() {
    return request("/attendance/today");
  },

  async getMyAttendance() {
    return request("/attendance/my");
  },

  async checkInOffice(qrToken) {
    return request("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({ mode: "OFFICE", qrToken }),
    });
  },

  async checkInWfh() {
    return request("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({ mode: "WFH" }),
    });
  },

  async checkOut(payload = {}) {
    return request("/attendance/check-out", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getMyWfhRequests() {
    return request("/wfh/my");
  },

  async submitWfhRequest(payload) {

    let body;
    if (typeof payload === "string") {
      body = {
        startDate: arguments[0],
        endDate: arguments[1],
        reason: arguments[2],
        wfhType: "STANDARD",
      };
    } else {
      body = payload;
    }

    return request("/wfh", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async uploadWfhDocument(documentData, documentName) {
    return request("/wfh/upload-document", {
      method: "POST",
      body: JSON.stringify({ documentData, documentName }),
    });
  },

  async cancelWfh(id) {
    return request(`/wfh/${id}/cancel`, {
      method: "PATCH",
    });
  },

  async updateProfile(profileData) {
    return request("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    });
  },

  async uploadAvatar(avatarData) {
    return request("/auth/avatar", {
      method: "POST",
      body: JSON.stringify({ avatarData }),
    });
  },

  getFullMediaUrl,

  async changePassword(currentPassword, newPassword) {
    return request("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async getMyLeaveRequests() {
    return request("/leave/my");
  },

  async submitLeaveRequest(leaveType, startDate, endDate, reason) {
    return request("/leave", {
      method: "POST",
      body: JSON.stringify({ leaveType, startDate, endDate, reason }),
    });
  },

  async cancelLeave(id) {
    return request(`/leave/${id}/cancel`, {
      method: "PATCH",
    });
  },

  async getNotifications() {
    return request("/notifications");
  },

  async markNotificationRead(id) {
    return request(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  async markAllNotificationsRead() {
    return request("/notifications/read-all", {
      method: "PATCH",
    });
  },
};
