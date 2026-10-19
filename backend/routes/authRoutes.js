import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { User, Employee } from "../models/index.js";
import { authenticate } from "../middleware/auth.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

// Helper to create an account with User + Employee profile
export const createAccount = async ({
  name,
  email,
  password,
  role,
  employeeId,
  department,
  designation = "",
  phone = "",
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  if (await User.exists({ email: normalizedEmail })) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }

  if (await Employee.exists({ employeeId: normalizedEmployeeId })) {
    const error = new Error("Employee ID already exists");
    error.status = 409;
    throw error;
  }

  if (await Employee.exists({ email: normalizedEmail })) {
    const error = new Error("Employee email already exists");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      active: true,
    });

    await Employee.create({
      user: user._id,
      employeeId: normalizedEmployeeId,
      name: name.trim(),
      email: normalizedEmail,
      department: department.trim(),
      designation: typeof designation === "string" ? designation.trim().slice(0, 100) : "",
      phone: typeof phone === "string" ? phone.trim().slice(0, 30) : "",
      active: true,
    });

    return user;
  } catch (error) {
    if (user) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
    }
    throw error;
  }
};

// ==========================================
// FIRST SUPER ADMIN SETUP
// ==========================================
router.post("/setup/first-admin", authLimiter, async (req, res, next) => {
  try {
    const setupKey = req.headers["x-setup-key"];

    if (
      !process.env.SUPER_ADMIN_SETUP_KEY ||
      typeof setupKey !== "string" ||
      setupKey !== process.env.SUPER_ADMIN_SETUP_KEY
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid setup credentials",
      });
    }

    if (await User.exists({ role: "SUPER_ADMIN" })) {
      return res.status(409).json({
        success: false,
        message: "Super Admin has already been created",
      });
    }

    const { name, email, password, employeeId, department } = req.body || {};

    if (
      !name || !email || !password || password.length < 8 ||
      !employeeId || !department
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid name, email, password (at least 8 chars), employeeId and department",
      });
    }

    const user = await createAccount({
      name,
      email,
      password,
      role: "SUPER_ADMIN",
      employeeId,
      department,
      designation: req.body.designation || "Super Administrator",
      phone: req.body.phone || "",
    });

    await logAction({
      actor: user,
      action: "SUPER_ADMIN_SETUP",
      targetType: "User",
      targetId: user._id,
      details: { email: user.email },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "First Super Admin created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// LOGIN
// ==========================================
router.post("/auth/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (
      !user ||
      !user.active ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        issuer: "vorldx-api",
      }
    );

    const employee = await Employee.findOne({ user: user._id }).lean();

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        employeeId: employee?.employeeId || null,
        department: employee?.department || null,
      },
      employee: employee
        ? {
            id: employee._id,
            employeeId: employee.employeeId,
            department: employee.department,
            designation: employee.designation,
            active: employee.active,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CURRENT USER PROFILE
// ==========================================
router.get("/auth/me", authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({
      user: req.user._id,
    }).lean();

    return res.json({
      success: true,
      user: {
        id: req.user._id,
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        active: req.user.active,
        employeeId: employee?.employeeId || null,
        department: employee?.department || null,
      },
      employee: employee
        ? {
            id: employee._id,
            _id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            designation: employee.designation,
            phone: employee.phone,
            address: employee.address || "",
            emergencyContact: employee.emergencyContact || "",
            bio: employee.bio || "",
            avatar: employee.avatar || "",
            active: employee.active,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// MANAGE PROFILE (EMPLOYEE / USER)
// ==========================================
router.patch("/auth/profile", authenticate, async (req, res, next) => {
  try {
    const {
      name,
      phone,
      designation,
      address,
      emergencyContact,
      bio,
      avatar,
    } = req.body || {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let employee = await Employee.findOne({ user: user._id });

    // Update User name if provided
    if (typeof name === "string" && name.trim()) {
      user.name = name.trim().slice(0, 100);
      await user.save();
    }

    if (employee) {
      if (typeof name === "string" && name.trim()) employee.name = name.trim().slice(0, 100);
      if (typeof phone === "string") employee.phone = phone.trim().slice(0, 30);
      if (typeof designation === "string" && designation.trim()) employee.designation = designation.trim().slice(0, 100);
      if (typeof address === "string") employee.address = address.trim().slice(0, 300);
      if (typeof emergencyContact === "string") employee.emergencyContact = emergencyContact.trim().slice(0, 100);
      if (typeof bio === "string") employee.bio = bio.trim().slice(0, 500);
      if (typeof avatar === "string") employee.avatar = avatar.trim();
      await employee.save();
    }

    await logAction({
      actor: user,
      action: "PROFILE_UPDATED",
      targetType: "User",
      targetId: user._id,
      details: { name: user.name, phone: employee?.phone },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        employeeId: employee?.employeeId || null,
        department: employee?.department || null,
      },
      employee: employee
        ? {
            id: employee._id,
            _id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            designation: employee.designation,
            phone: employee.phone,
            address: employee.address || "",
            emergencyContact: employee.emergencyContact || "",
            bio: employee.bio || "",
            avatar: employee.avatar || "",
            active: employee.active,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CHANGE PASSWORD
// ==========================================
router.patch("/auth/change-password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    await logAction({
      actor: user,
      action: "PASSWORD_CHANGED",
      targetType: "User",
      targetId: user._id,
      details: { email: user.email },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: "Password changed successfully! Keep it secure.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
