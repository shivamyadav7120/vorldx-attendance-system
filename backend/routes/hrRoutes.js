import express from "express";
import { User, Employee } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { createAccount } from "./authRoutes.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

const hrAdminView = (user, employee) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  status: user.active ? "Active" : "Inactive",
  employeeId: employee?.employeeId ?? null,
  department: employee?.department ?? "Human Resources",
  designation: employee?.designation ?? "HR Admin",
});

// List HR Admins (Super Admin only)
router.get(
  "/hr-admins",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const users = await User.find({ role: "HR_ADMIN" })
        .sort({ name: 1 })
        .lean();

      const employees = await Employee.find({
        user: { $in: users.map((user) => user._id) },
      })
        .select("user employeeId department designation")
        .lean();

      const employeeMap = new Map(
        employees.map((employee) => [employee.user.toString(), employee])
      );

      return res.json({
        success: true,
        admins: users.map((user) =>
          hrAdminView(user, employeeMap.get(user._id.toString()))
        ),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create HR Admin (Super Admin only)
router.post(
  "/hr-admins",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const { name, email, password, employeeId, department = "Human Resources" } = req.body || {};

      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100 ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid name, email and password (8-128 characters)",
        });
      }

      const assignedEmployeeId =
        typeof employeeId === "string" && employeeId.trim()
          ? employeeId.trim().toUpperCase()
          : `HR-${Date.now().toString(36).toUpperCase()}`;

      const user = await createAccount({
        name,
        email,
        password,
        role: "HR_ADMIN",
        employeeId: assignedEmployeeId,
        department,
        designation: "HR Administrator",
      });

      await logAction({
        actor: req.user,
        action: "HR_ADMIN_CREATED",
        targetType: "User",
        targetId: user._id,
        details: { email: user.email, name: user.name, employeeId: assignedEmployeeId },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: "HR admin created successfully",
        admin: hrAdminView(user),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update HR Admin (Super Admin only)
router.put(
  "/hr-admins/:id",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const { name, email } = req.body || {};

      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100 ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid name and email",
        });
      }

      const user = await User.findOne({
        _id: req.params.id,
        role: "HR_ADMIN",
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "HR admin not found",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const duplicate =
        (await User.exists({
          email: normalizedEmail,
          _id: { $ne: user._id },
        })) ||
        (await Employee.exists({
          email: normalizedEmail,
          user: { $ne: user._id },
        }));

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      const previousEmail = user.email;
      user.name = name.trim();
      user.email = normalizedEmail;
      await user.save();

      const employee = await Employee.findOne({ user: user._id });
      if (employee) {
        employee.name = user.name;
        employee.email = user.email;
        await employee.save();
      }

      await logAction({
        actor: req.user,
        action: "HR_ADMIN_UPDATED",
        targetType: "User",
        targetId: user._id,
        details: { previousEmail, newEmail: user.email, name: user.name },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "HR admin updated successfully",
        admin: hrAdminView(user, employee),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Deactivate HR Admin (Super Admin only)
router.patch(
  "/hr-admins/:id/deactivate",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const user = await User.findOne({
        _id: req.params.id,
        role: "HR_ADMIN",
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "HR admin not found",
        });
      }

      user.active = false;
      await user.save();

      await Employee.updateOne(
        { user: user._id },
        { $set: { active: false } }
      );

      await logAction({
        actor: req.user,
        action: "HR_ADMIN_DEACTIVATED",
        targetType: "User",
        targetId: user._id,
        details: { email: user.email },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "HR admin deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/hr-admins/:id/activate",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const user = await User.findOne({
        _id: req.params.id,
        role: "HR_ADMIN",
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "HR admin not found",
        });
      }

      user.active = true;
      await user.save();

      await Employee.updateOne(
        { user: user._id },
        { $set: { active: true } }
      );

      await logAction({
        actor: req.user,
        action: "HR_ADMIN_ACTIVATED",
        targetType: "User",
        targetId: user._id,
        details: { email: user.email },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: "HR admin activated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
