import { AttendancePolicy } from "../models/index.js";

let cachedPolicy = null;
let lastFetch = 0;
const CACHE_TTL_MS = 60 * 1000; 

export const DEFAULT_POLICY = {
  key: "default",
  officeStartTime: "09:00",
  checkInCutoffTime: "09:30",
  officeEndTime: "18:00",
  lateArrivalPolicy: "MARK_LATE",
  maxWfhPerDay: 5,
  qrExpirySeconds: 18,
  timezone: "Asia/Kolkata",
  allowHrAdminAssignId: true,
};

export async function getPolicy() {
  const now = Date.now();
  if (cachedPolicy && now - lastFetch < CACHE_TTL_MS) {
    return cachedPolicy;
  }

  let policy = await AttendancePolicy.findOne({ key: "default" }).lean();
  if (!policy) {
    const created = await AttendancePolicy.create(DEFAULT_POLICY);
    policy = created.toObject();
  }

  cachedPolicy = policy;
  lastFetch = now;
  return policy;
}

export function clearPolicyCache() {
  cachedPolicy = null;
  lastFetch = 0;
}

export function getIndiaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getIndiaTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}


export function evaluateAttendanceStatus(timeStr, policy = DEFAULT_POLICY) {
  const cutoff = policy.checkInCutoffTime || "09:30";
  if (timeStr <= cutoff) {
    return "PRESENT";
  }

  switch (policy.lateArrivalPolicy) {
    case "MARK_ABSENT":
      return "ABSENT";
    case "MARK_HALF_DAY":
      return "HALF_DAY";
    case "MARK_LATE":
    default:
      return "LATE";
  }
}
