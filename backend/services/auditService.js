import { AuditLog } from "../models/index.js";


export async function logAction({
  actor,
  action,
  targetType = "",
  targetId = "",
  details = {},
  ipAddress = "",
}) {
  try {
    if (!actor || !actor._id) return null;

    const log = await AuditLog.create({
      actor: actor._id,
      actorEmail: actor.email || "",
      actorRole: actor.role || "",
      action,
      targetType,
      targetId: String(targetId || ""),
      details,
      ipAddress,
    });

    return log;
  } catch (error) {
    console.error("Audit log error:", error.message);
    return null;
  }
}
