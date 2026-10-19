import express from "express";
import { Organization } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

router.get(
  "/organization",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const organization =
        (await Organization.findOne({ key: "default" }).lean()) ||
        (await Organization.create({ key: "default" })).toObject();

      return res.json({ success: true, organization });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/organization",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const limits = {
        name: 150,
        email: 254,
        phone: 30,
        address: 300,
        timezone: 60,
      };

      const updates = {};
      for (const [field, max] of Object.entries(limits)) {
        const value = req.body?.[field];
        if (value === undefined) continue;

        if (typeof value !== "string" || value.trim().length > max) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field}`,
          });
        }
        updates[field] = value.trim();
      }

      if (updates.name === "") {
        return res.status(400).json({
          success: false,
          message: "Organization name is required",
        });
      }

      if (
        updates.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }

      for (const field of ["officeStart", "officeEnd"]) {
        const value = req.body?.[field];
        if (value === undefined) continue;

        if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field}; use HH:MM`,
          });
        }
        updates[field] = value;
      }

      const organization = await Organization.findOneAndUpdate(
        { key: "default" },
        { $set: updates },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      ).lean();

      await logAction({
        actor: req.user,
        action: "ORGANIZATION_UPDATED",
        targetType: "Organization",
        targetId: organization._id,
        details: updates,
        ipAddress: req.ip,
      });

      return res.json({ success: true, organization });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
