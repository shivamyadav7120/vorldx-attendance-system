import express from "express";
import { Notification, Employee, User } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

router.post(
  "/notifications",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const {
        title,
        message,
        body,
        type = "BROADCAST",
        targetAudience = "ALL",
        targetDepartment = "",
        targetUser = null,
        priority = "NORMAL",
      } = req.body || {};

      const finalMessage = String(message || body || "").trim();
      const finalTitle = String(title || "").trim();

      if (!finalTitle || !finalMessage) {
        return res.status(400).json({
          success: false,
          message: "Notification title and message body are required",
        });
      }

      let recipientUser = null;
      if (targetUser) {
        recipientUser = await User.findById(targetUser);
      }

      const notification = await Notification.create({
        title: finalTitle,
        message: finalMessage,
        type: String(type).toUpperCase(),
        targetAudience: String(targetAudience).toUpperCase(),
        targetDepartment: targetDepartment.trim(),
        targetUser: recipientUser ? recipientUser._id : null,
        priority: String(priority).toUpperCase(),
        sender: req.user._id,
        senderName: req.user.name || "Administrator",
        senderRole: req.user.role,
        readBy: [
          {
            user: req.user._id,
            readAt: new Date(),
          },
        ],
      });

      await logAction({
        actor: req.user,
        action: "NOTIFICATION_BROADCAST",
        targetType: "Notification",
        targetId: notification._id,
        details: {
          title: finalTitle,
          targetAudience,
          priority,
        },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: "Notification broadcast sent successfully",
        notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/notifications", authenticate, async (req, res, next) => {
  try {
    let query = {};
    const userId = req.user._id;

    if (req.user.role === "EMPLOYEE") {
      const employee = await Employee.findOne({ user: userId });
      const dept = employee?.department || "";

      query = {
        $or: [
          { targetAudience: { $in: ["ALL", "EMPLOYEES"] } },
          { targetUser: userId },
          ...(dept ? [{ targetAudience: "DEPARTMENT", targetDepartment: dept }] : []),
        ],
      };
    } else if (req.user.role === "HR_ADMIN") {
      query = {
        $or: [
          { targetAudience: { $in: ["ALL", "HR", "EMPLOYEES"] } },
          { targetUser: userId },
          { sender: userId },
        ],
      };
    }

    const items = await Notification.find(query)
      .populate("sender", "name email role")
      .populate("targetUser", "name email role")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const notifications = items.map((item) => {
      const isRead = (item.readBy || []).some(
        (r) => r.user?.toString() === userId.toString()
      );
      return {
        ...item,
        isRead,
        readCount: (item.readBy || []).length,
      };
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id/read", authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const alreadyRead = notification.readBy.some(
      (r) => r.user?.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      notification.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      });
      await notification.save();
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/read-all", authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    let query = {};

    if (req.user.role === "EMPLOYEE") {
      const employee = await Employee.findOne({ user: userId });
      const dept = employee?.department || "";
      query = {
        $or: [
          { targetAudience: { $in: ["ALL", "EMPLOYEES"] } },
          { targetUser: userId },
          ...(dept ? [{ targetAudience: "DEPARTMENT", targetDepartment: dept }] : []),
        ],
      };
    } else if (req.user.role === "HR_ADMIN") {
      query = {
        $or: [
          { targetAudience: { $in: ["ALL", "HR", "EMPLOYEES"] } },
          { targetUser: userId },
        ],
      };
    }

    await Notification.updateMany(
      {
        ...query,
        "readBy.user": { $ne: userId },
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date(),
          },
        },
      }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/notifications/:id",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const deleted = await Notification.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
      return res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
