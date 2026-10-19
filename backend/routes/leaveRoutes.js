import express from "express";
import { LeaveRequest, WfhRequest, Employee, User } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

const isValidDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value));

// ==========================================
// EMPLOYEE — SUBMIT LEAVE REQUEST
// ==========================================
router.post(
  "/leave",
  authenticate,
  allowRoles("EMPLOYEE", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const {
        leaveType = "Casual",
        startDate,
        endDate,
        reason = "",
      } = req.body || {};

      if (!isValidDate(startDate) || !isValidDate(endDate) || endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: "Provide valid start and end dates (YYYY-MM-DD)",
        });
      }

      const employee = await Employee.findOne({
        user: req.user._id,
        active: true,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Active employee record not found",
        });
      }

      // Check overlapping Leave (PENDING or APPROVED)
      const existingLeave = await LeaveRequest.findOne({
        employee: employee._id,
        status: { $in: ["PENDING", "APPROVED"] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      });

      if (existingLeave) {
        return res.status(409).json({
          success: false,
          message: "You already have a pending or approved leave request for this date range",
        });
      }

      // Check overlapping WFH (APPROVED)
      const existingWfh = await WfhRequest.findOne({
        employee: employee._id,
        status: "APPROVED",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      });

      if (existingWfh) {
        return res.status(409).json({
          success: false,
          message: "You already have an approved Work From Home request on one or more of these dates",
        });
      }

      const request = await LeaveRequest.create({
        employee: employee._id,
        leaveType: (leaveType || "Casual").trim().slice(0, 50),
        startDate,
        endDate,
        reason: (reason || "").trim().slice(0, 500),
        status: "PENDING",
      });

      return res.status(201).json({
        success: true,
        message: "Leave request submitted successfully",
        request,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE — MY LEAVE REQUESTS
// ==========================================
router.get(
  "/leave/my",
  authenticate,
  async (req, res, next) => {
    try {
      const employee = await Employee.findOne({ user: req.user._id });
      const requests = employee
        ? await LeaveRequest.find({ employee: employee._id })
            .populate("decidedBy", "name email role")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean()
        : [];

      return res.json({ success: true, requests });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ADMIN — LIST ALL LEAVE REQUESTS
// ==========================================
router.get(
  "/leave",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status.toUpperCase();
      }

      const requests = await LeaveRequest.find(filter)
        .populate("employee", "employeeId name email department designation user")
        .populate("decidedBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      // HR Admin role restriction
      let filtered = requests;
      if (req.user.role === "HR_ADMIN") {
        const userIds = requests.map((r) => r.employee?.user).filter(Boolean);
        const users = await User.find({ _id: { $in: userIds } }, "role").lean();
        const roleMap = new Map(users.map((u) => [u._id.toString(), u.role]));

        filtered = requests.filter((r) => {
          const uId = r.employee?.user?.toString();
          return !uId || roleMap.get(uId) === "EMPLOYEE";
        });
      }

      return res.json({ success: true, requests: filtered });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ADMIN — APPROVE OR REJECT LEAVE REQUEST
// ==========================================
router.patch(
  "/leave/:id/status",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const status = String(req.body?.status || "").toUpperCase();
      const decisionComment = typeof req.body?.decisionComment === "string" ? req.body.decisionComment.trim() : "";

      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be APPROVED or REJECTED",
        });
      }

      const request = await LeaveRequest.findById(req.params.id).populate("employee");

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      if (request.status !== "PENDING") {
        return res.status(409).json({
          success: false,
          message: `This request has already been ${request.status.toLowerCase()}`,
        });
      }

      // HR Admin role restriction
      if (req.user.role === "HR_ADMIN" && request.employee?.user) {
        const targetUser = await User.findById(request.employee.user);
        if (targetUser && targetUser.role !== "EMPLOYEE") {
          return res.status(403).json({
            success: false,
            message: "HR can decide employee requests only",
          });
        }
      }

      request.status = status;
      request.decisionComment = decisionComment;
      request.decidedBy = req.user._id;
      request.decidedAt = new Date();
      await request.save();

      await logAction({
        actor: req.user,
        action: `LEAVE_${status}`,
        targetType: "LeaveRequest",
        targetId: request._id,
        details: {
          employeeId: request.employee?.employeeId,
          leaveType: request.leaveType,
          startDate: request.startDate,
          endDate: request.endDate,
          decisionComment,
        },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: `Leave request ${status.toLowerCase()} successfully`,
        request,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE — CANCEL OWN PENDING LEAVE REQUEST
// ==========================================
router.patch(
  "/leave/:id/cancel",
  authenticate,
  async (req, res, next) => {
    try {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found",
        });
      }

      const request = await LeaveRequest.findOne({
        _id: req.params.id,
        employee: employee._id,
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      if (request.status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: "Only pending requests can be cancelled",
        });
      }

      request.status = "CANCELLED";
      await request.save();

      return res.json({
        success: true,
        message: "Leave request cancelled successfully",
        request,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
