import express from "express";
import { Attendance, Employee, User, WfhRequest } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { getIndiaDate, getIndiaTime, getPolicy, evaluateAttendanceStatus } from "../services/policyService.js";
import { consumeQrToken } from "../services/qrService.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

// ==========================================
// EMPLOYEE — MY ATTENDANCE HISTORY
// ==========================================
router.get(
  "/attendance/my",
  authenticate,
  allowRoles("EMPLOYEE", "HR_ADMIN", "SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const employee = await Employee.findOne({
        user: req.user._id,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found",
        });
      }

      const attendance = await Attendance.find({
        employee: employee._id,
      })
        .sort({ date: -1 })
        .limit(90)
        .lean();

      return res.json({
        success: true,
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE — TODAY'S ATTENDANCE STATUS
// ==========================================
router.get(
  "/attendance/today",
  authenticate,
  async (req, res, next) => {
    try {
      const employee = await Employee.findOne({
        user: req.user._id,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found",
        });
      }

      const today = getIndiaDate();
      const attendance = await Attendance.findOne({
        employee: employee._id,
        date: today,
      }).lean();

      return res.json({
        success: true,
        date: today,
        attendance: attendance || null,
        checkedIn: Boolean(attendance?.checkIn),
        checkedOut: Boolean(attendance?.checkOut),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE CHECK-IN
// ==========================================
router.post(
  "/attendance/check-in",
  authenticate,
  allowRoles("EMPLOYEE", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const { mode, qrToken } = req.body || {};

      if (!["OFFICE", "WFH"].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: "Mode must be OFFICE or WFH",
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

      const date = getIndiaDate();

      const existingAttendance = await Attendance.findOne({
        employee: employee._id,
        date,
      });

      if (existingAttendance) {
        return res.status(409).json({
          success: false,
          message: "You have already checked in today",
        });
      }

      // 1. OFFICE MODE: Validate & consume 18-second QR code
      if (mode === "OFFICE") {
        if (!qrToken) {
          return res.status(400).json({
            success: false,
            message: "Office QR token is required for office check-in",
          });
        }

        // consumeQrToken atomically validates expiry and marks token used to prevent replay
        await consumeQrToken(qrToken, req.user);
      }

      // 2. WFH MODE: Validate approved WFH request for today
      if (mode === "WFH") {
        const approvedWfh = await WfhRequest.findOne({
          employee: employee._id,
          status: "APPROVED",
          startDate: { $lte: date },
          endDate: { $gte: date },
        });

        if (!approvedWfh) {
          return res.status(403).json({
            success: false,
            message: "No approved Work From Home request found for today",
          });
        }
      }

      const now = new Date();
      const indiaTime = getIndiaTime(now);
      const policy = await getPolicy();

      // Determine status according to policy (09:30 cutoff)
      const status = evaluateAttendanceStatus(indiaTime, policy);

      const attendance = await Attendance.create({
        employee: employee._id,
        date,
        mode,
        checkIn: now,
        checkInMethod: mode === "OFFICE" ? "QR" : "WFH",
        status,
      });

      let statusMsg = "Check-in recorded successfully";
      if (status === "LATE") {
        statusMsg = `Check-in recorded; marked LATE (arrived at ${indiaTime}, cutoff was ${policy.checkInCutoffTime})`;
      } else if (status === "ABSENT") {
        statusMsg = `Check-in recorded; marked ABSENT after cutoff time ${policy.checkInCutoffTime}`;
      } else if (status === "HALF_DAY") {
        statusMsg = `Check-in recorded; marked HALF DAY after cutoff time ${policy.checkInCutoffTime}`;
      }

      return res.status(201).json({
        success: true,
        message: statusMsg,
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE CHECK-OUT
// ==========================================
router.patch(
  "/attendance/check-out",
  authenticate,
  allowRoles("EMPLOYEE", "HR_ADMIN"),
  async (req, res, next) => {
    try {
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

      const attendance = await Attendance.findOne({
        employee: employee._id,
        date: getIndiaDate(),
      });

      if (!attendance || !attendance.checkIn) {
        return res.status(404).json({
          success: false,
          message: "Please check in before checking out",
        });
      }

      if (attendance.checkOut) {
        return res.status(409).json({
          success: false,
          message: "You have already checked out today",
        });
      }

      attendance.checkOut = new Date();
      await attendance.save();

      return res.json({
        success: true,
        message: "Check-out recorded successfully",
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ADMIN — LIST ATTENDANCE RECORDS (WITH FILTERS)
// ==========================================
router.get(
  "/attendance",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const filter = {};

      if (req.query.date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
          return res.status(400).json({
            success: false,
            message: "Date must use YYYY-MM-DD format",
          });
        }
        filter.date = req.query.date;
      } else if (req.query.startDate && req.query.endDate) {
        filter.date = { $gte: req.query.startDate, $lte: req.query.endDate };
      }

      if (req.query.status) {
        filter.status = req.query.status.toUpperCase();
      }

      if (req.query.mode) {
        filter.mode = req.query.mode.toUpperCase();
      }

      const attendance = await Attendance.find(filter)
        .populate("employee", "employeeId name email department designation user")
        .populate("correctionHistory.correctedBy", "name email role")
        .sort({ date: -1, checkIn: -1 })
        .limit(1000)
        .lean();

      // Permission check: HR Admin can view employees only, Super Admin can view all
      let filteredRecords = attendance;
      if (req.user.role === "HR_ADMIN") {
        const userIds = attendance.map((a) => a.employee?.user).filter(Boolean);
        const users = await User.find({ _id: { $in: userIds } }, "role").lean();
        const userRoleMap = new Map(users.map((u) => [u._id.toString(), u.role]));

        filteredRecords = attendance.filter((a) => {
          const uId = a.employee?.user?.toString();
          return !uId || userRoleMap.get(uId) === "EMPLOYEE";
        });
      }

      return res.json({
        success: true,
        attendance: filteredRecords,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ADMIN — MANUAL ATTENDANCE MARK
// ==========================================
router.post(
  "/attendance/manual",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const {
        employeeId,
        date,
        status = "PRESENT",
        mode = "OFFICE",
        notes = "Manually marked by administrator",
      } = req.body || {};

      if (!employeeId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Employee ID and a valid date (YYYY-MM-DD) are required",
        });
      }

      const validStatuses = ["PRESENT", "LATE", "ABSENT", "HALF_DAY"];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const employee = await Employee.findOne({
        $or: [{ _id: employeeId }, { employeeId: employeeId.toUpperCase() }],
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // HR Admin role check: cannot mark for HR Admin or Super Admin
      if (req.user.role === "HR_ADMIN" && employee.user) {
        const targetUser = await User.findById(employee.user);
        if (targetUser && targetUser.role !== "EMPLOYEE") {
          return res.status(403).json({
            success: false,
            message: "HR Admins can only mark attendance for employees",
          });
        }
      }

      let attendance = await Attendance.findOne({
        employee: employee._id,
        date,
      });

      const now = new Date();
      const method = req.user.role === "SUPER_ADMIN" ? "SUPER_ADMIN_MANUAL" : "HR_MANUAL";

      if (attendance) {
        // Record correction history
        const previousData = {
          previousStatus: attendance.status,
          newStatus: status.toUpperCase(),
          previousCheckIn: attendance.checkIn,
          newCheckIn: attendance.checkIn || now,
          previousCheckOut: attendance.checkOut,
          newCheckOut: attendance.checkOut,
          previousMode: attendance.mode,
          newMode: mode.toUpperCase(),
          correctedBy: req.user._id,
          correctedAt: now,
          reason: notes || "Manual mark update by admin",
        };

        attendance.status = status.toUpperCase();
        attendance.mode = mode.toUpperCase();
        if (!attendance.checkIn && status !== "ABSENT") {
          attendance.checkIn = now;
        }
        attendance.notes = notes;
        attendance.checkInMethod = method;
        attendance.correctionHistory.push(previousData);
        await attendance.save();
      } else {
        attendance = await Attendance.create({
          employee: employee._id,
          date,
          status: status.toUpperCase(),
          mode: mode.toUpperCase(),
          checkIn: status !== "ABSENT" ? now : null,
          checkInMethod: method,
          notes,
        });
      }

      await logAction({
        actor: req.user,
        action: "ATTENDANCE_MANUAL_MARK",
        targetType: "Attendance",
        targetId: attendance._id,
        details: {
          employeeId: employee.employeeId,
          date,
          status: attendance.status,
          mode: attendance.mode,
          notes,
        },
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: "Attendance marked successfully",
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ADMIN — ATTENDANCE CORRECTION WITH HISTORY
// ==========================================
router.patch(
  "/attendance/:id/correct",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const { status, mode, checkIn, checkOut, reason } = req.body || {};

      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "A justification reason is required for attendance correction",
        });
      }

      const attendance = await Attendance.findById(req.params.id).populate("employee");
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found",
        });
      }

      // HR Admin role restriction
      if (req.user.role === "HR_ADMIN" && attendance.employee?.user) {
        const targetUser = await User.findById(attendance.employee.user);
        if (targetUser && targetUser.role !== "EMPLOYEE") {
          return res.status(403).json({
            success: false,
            message: "HR can only correct employee attendance",
          });
        }
      }

      const now = new Date();
      const historyEntry = {
        correctedBy: req.user._id,
        correctedAt: now,
        reason: reason.trim(),
        previousStatus: attendance.status,
        newStatus: status ? status.toUpperCase() : attendance.status,
        previousCheckIn: attendance.checkIn,
        newCheckIn: checkIn !== undefined ? (checkIn ? new Date(checkIn) : null) : attendance.checkIn,
        previousCheckOut: attendance.checkOut,
        newCheckOut: checkOut !== undefined ? (checkOut ? new Date(checkOut) : null) : attendance.checkOut,
        previousMode: attendance.mode,
        newMode: mode ? mode.toUpperCase() : attendance.mode,
      };

      if (status) attendance.status = status.toUpperCase();
      if (mode) attendance.mode = mode.toUpperCase();
      if (checkIn !== undefined) attendance.checkIn = checkIn ? new Date(checkIn) : null;
      if (checkOut !== undefined) attendance.checkOut = checkOut ? new Date(checkOut) : null;
      attendance.correctionHistory.push(historyEntry);

      await attendance.save();

      await logAction({
        actor: req.user,
        action: "ATTENDANCE_CORRECTED",
        targetType: "Attendance",
        targetId: attendance._id,
        details: {
          employeeId: attendance.employee?.employeeId,
          date: attendance.date,
          history: historyEntry,
        },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "Attendance corrected successfully",
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
