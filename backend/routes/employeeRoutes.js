import express from "express";
import { Employee, User } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { createAccount } from "./authRoutes.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

// LIST EMPLOYEES
router.get(
  "/employees",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const employees = await Employee.find()
        .select("employeeId name email department designation phone active user createdAt")
        .sort({ name: 1 })
        .lean();

      const userIds = employees
        .map((employee) => employee.user)
        .filter(Boolean);

      const users = await User.find({
        _id: { $in: userIds },
      })
        .select("role active")
        .lean();

      const userMap = new Map(
        users.map((user) => [user._id.toString(), user])
      );

      const result = employees.map((employee) => {
        const linkedUserId = employee.user
          ? employee.user.toString()
          : null;

        const linkedUser = linkedUserId
          ? userMap.get(linkedUserId)
          : null;

        const { user, ...employeeData } = employee;

        return {
          ...employeeData,
          _id: employee._id,
          id: employee._id,
          status: employee.active && (linkedUser?.active ?? true) ? "Active" : "Inactive",
          role: linkedUser?.role ?? "EMPLOYEE",
          accountActive: linkedUser?.active ?? false,
        };
      });

      return res.json({
        success: true,
        employees: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// CREATE EMPLOYEE
router.post(
  "/employees",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const {
        name,
        email,
        password,
        employeeId,
        department,
        designation = "",
        phone = "",
      } = req.body || {};

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== "string" ||
        password.length < 8 ||
        typeof department !== "string" ||
        !department.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid name, email, password (min 8 chars), and department",
        });
      }

      // Generate employeeId if omitted
      let assignedId = employeeId;
      if (!assignedId || typeof assignedId !== "string" || !assignedId.trim()) {
        const count = await Employee.countDocuments();
        assignedId = `VX-${1000 + count + 1}`;
      }

      const user = await createAccount({
        name,
        email,
        password,
        role: "EMPLOYEE",
        employeeId: assignedId,
        department,
        designation,
        phone,
      });

      const employee = await Employee.findOne({ user: user._id });

      await logAction({
        actor: req.user,
        action: "EMPLOYEE_CREATED",
        targetType: "Employee",
        targetId: employee._id,
        details: {
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          department: employee.department,
        },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        employee: {
          _id: employee._id,
          id: employee._id,
          name: employee.name,
          email: employee.email,
          employeeId: employee.employeeId,
          department: employee.department,
          designation: employee.designation,
          phone: employee.phone,
          status: "Active",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// EDIT EMPLOYEE
router.patch(
  "/employees/:id",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const employee = await Employee.findById(req.params.id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const linkedUser = employee.user
        ? await User.findById(employee.user)
        : null;

      // HR Admin cannot modify Super Admin or HR Admin accounts
      if (
        req.user.role === "HR_ADMIN" &&
        linkedUser &&
        linkedUser.role !== "EMPLOYEE"
      ) {
        return res.status(403).json({
          success: false,
          message: "HR can edit employee records only",
        });
      }

      const allowedFields = ["name", "email", "department", "designation", "phone"];
      const updates = {};

      for (const field of allowedFields) {
        if (req.body?.[field] !== undefined) {
          const value = req.body[field];

          if (
            typeof value !== "string" ||
            (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          ) {
            return res.status(400).json({
              success: false,
              message: `Invalid value for ${field}`,
            });
          }

          updates[field] = field === "email" ? value.trim().toLowerCase() : value.trim();
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields provided",
        });
      }

      if (updates.email && updates.email !== employee.email) {
        const duplicateEmployee = await Employee.findOne({
          email: updates.email,
          _id: { $ne: employee._id },
        });

        const duplicateUser = linkedUser
          ? await User.findOne({
              email: updates.email,
              _id: { $ne: linkedUser._id },
            })
          : await User.findOne({ email: updates.email });

        if (duplicateEmployee || duplicateUser) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
          });
        }
      }

      const previousData = {
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
      };

      Object.assign(employee, updates);
      await employee.save();

      if (linkedUser) {
        if (updates.name) linkedUser.name = updates.name;
        if (updates.email) linkedUser.email = updates.email;
        await linkedUser.save();
      }

      await logAction({
        actor: req.user,
        action: "EMPLOYEE_UPDATED",
        targetType: "Employee",
        targetId: employee._id,
        details: { previous: previousData, updated: updates },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "Employee updated successfully",
        employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DEACTIVATE EMPLOYEE
router.patch(
  "/employees/:id/deactivate",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const employee = await Employee.findById(req.params.id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const linkedUser = employee.user
        ? await User.findById(employee.user)
        : null;

      if (!linkedUser) {
        return res.status(404).json({
          success: false,
          message: "Linked user account not found",
        });
      }

      // HR Admin cannot deactivate Super Admin or HR Admin
      if (
        req.user.role === "HR_ADMIN" &&
        linkedUser.role !== "EMPLOYEE"
      ) {
        return res.status(403).json({
          success: false,
          message: "HR can deactivate employees only",
        });
      }

      // Prevent deactivating own account
      if (req.user._id.toString() === linkedUser._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own account",
        });
      }

      employee.active = false;
      linkedUser.active = false;

      await employee.save();
      await linkedUser.save();

      await logAction({
        actor: req.user,
        action: "EMPLOYEE_DEACTIVATED",
        targetType: "Employee",
        targetId: employee._id,
        details: {
          employeeId: employee.employeeId,
          email: employee.email,
        },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "Employee account deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/employees/:id/activate",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const employee = await Employee.findById(req.params.id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const linkedUser = employee.user
        ? await User.findById(employee.user)
        : null;

      if (!linkedUser) {
        return res.status(404).json({
          success: false,
          message: "Linked user account not found",
        });
      }

      if (
        req.user.role === "HR_ADMIN" &&
        linkedUser.role !== "EMPLOYEE"
      ) {
        return res.status(403).json({
          success: false,
          message: "HR can activate employees only",
        });
      }

      employee.active = true;
      linkedUser.active = true;

      await employee.save();
      await linkedUser.save();

      await logAction({
        actor: req.user,
        action: "EMPLOYEE_ACTIVATED",
        targetType: "Employee",
        targetId: employee._id,
        details: {
          employeeId: employee.employeeId,
          email: employee.email,
        },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "Employee account activated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
