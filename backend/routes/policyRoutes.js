import express from "express";
import { AttendancePolicy } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { getPolicy, clearPolicyCache } from "../services/policyService.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

// GET CURRENT POLICY
router.get(
  "/policies/attendance",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const policy = await getPolicy();
      return res.json({ success: true, policy });
    } catch (error) {
      next(error);
    }
  }
);

// UPDATE POLICY (SUPER ADMIN ONLY)
router.put(
  "/policies/attendance",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const {
        officeStartTime,
        checkInCutoffTime,
        lateArrivalPolicy,
        maxWfhPerDay,
        qrExpirySeconds,
        timezone,
        allowHrAdminAssignId,
      } = req.body || {};

      const updates = {};

      if (officeStartTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(officeStartTime)) {
        updates.officeStartTime = officeStartTime;
      }
      if (checkInCutoffTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(checkInCutoffTime)) {
        updates.checkInCutoffTime = checkInCutoffTime;
      }
      if (["MARK_LATE", "MARK_ABSENT", "MARK_HALF_DAY"].includes(lateArrivalPolicy)) {
        updates.lateArrivalPolicy = lateArrivalPolicy;
      }
      if (typeof maxWfhPerDay === "number" && maxWfhPerDay >= 1 && maxWfhPerDay <= 100) {
        updates.maxWfhPerDay = maxWfhPerDay;
      }
      if (typeof qrExpirySeconds === "number" && qrExpirySeconds >= 5 && qrExpirySeconds <= 300) {
        updates.qrExpirySeconds = qrExpirySeconds;
      }
      if (typeof timezone === "string" && timezone.trim()) {
        updates.timezone = timezone.trim();
      }
      if (typeof allowHrAdminAssignId === "boolean") {
        updates.allowHrAdminAssignId = allowHrAdminAssignId;
      }

      const policy = await AttendancePolicy.findOneAndUpdate(
        { key: "default" },
        { $set: updates },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      ).lean();

      clearPolicyCache();

      await logAction({
        actor: req.user,
        action: "POLICY_UPDATED",
        targetType: "AttendancePolicy",
        targetId: policy._id,
        details: updates,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "Attendance policy updated successfully",
        policy,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
