import express from "express";
import { AuditLog } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/audit-logs",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 50));
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.action) {
        filter.action = req.query.action;
      }
      if (req.query.actorRole) {
        filter.actorRole = req.query.actorRole.toUpperCase();
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate("actor", "name email role")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
