import crypto from "node:crypto";
import { QrSession } from "../models/index.js";
import { getPolicy } from "./policyService.js";

/**
 * Creates a short-lived QR session (expires in 18 seconds by default).
 */
export async function createQrSession(userId, officeLocation = "Main Office") {
  const policy = await getPolicy();
  const validitySeconds = policy.qrExpirySeconds || 18;

  // Cryptographically secure random token (48 hex chars)
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + validitySeconds * 1000);

  const session = await QrSession.create({
    token,
    createdBy: userId,
    officeLocation,
    expiresAt,
    used: false,
  });

  return {
    id: session._id,
    token: session.token,
    officeLocation: session.officeLocation,
    expiresAt: session.expiresAt,
    validitySeconds,
  };
}

/**
 * Validates a QR token and marks it consumed atomically to prevent replay attacks.
 */
export async function consumeQrToken(token, user) {
  if (!token || typeof token !== "string") {
    const error = new Error("QR token is required");
    error.status = 400;
    throw error;
  }

  const now = new Date();

  // Atomically find an unexpired, unused token and mark it used
  const session = await QrSession.findOneAndUpdate(
    {
      token,
      used: false,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        used: true,
        usedBy: user._id,
        usedAt: now,
      },
    },
    { returnDocument: 'after' }
  );

  if (!session) {
    // Check if it was already used or expired to provide accurate feedback
    const existing = await QrSession.findOne({ token });
    if (!existing) {
      const error = new Error("Invalid office QR code");
      error.status = 400;
      throw error;
    }
    if (existing.used) {
      const error = new Error("This QR code has already been scanned and used");
      error.status = 400;
      throw error;
    }
    if (existing.expiresAt <= now) {
      const error = new Error("Office QR code has expired. Please scan the current code on the screen");
      error.status = 400;
      throw error;
    }

    const error = new Error("Invalid or expired office QR code");
    error.status = 400;
    throw error;
  }

  return session;
}
