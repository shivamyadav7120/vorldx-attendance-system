import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Employee } from "./models.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "20kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub);

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive or unavailable",
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action",
    });
  }

  next();
};

const createAccount = async ({
  name,
  email,
  password,
  role,
  employeeId,
  department,
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    const error = new Error("Email already exists");
    error.status = 409;
    throw error;
  }

  if (await Employee.exists({ employeeId: employeeId.trim().toUpperCase() })) {
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
    });

    await Employee.create({
      user: user._id,
      employeeId,
      name: name.trim(),
      email: normalizedEmail,
      department: department.trim(),
    });

    return user;
  } catch (error) {
    if (user) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
    }

    throw error;
  }
};

const validateAccountInput = (req, res, next) => {
  const { name, email, password, employeeId, department } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 100 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128 ||
    typeof employeeId !== "string" ||
    !employeeId.trim() ||
    employeeId.trim().length > 50 ||
    typeof department !== "string" ||
    !department.trim() ||
    department.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Provide a valid name, email, password (12-128 characters), employee ID and department",
    });
  }

  next();
};

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VorldX Attendance API is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.post(
  "/api/setup/first-admin",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  validateAccountInput,
  async (req, res, next) => {
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

      const user = await createAccount({
        ...req.body,
        role: "SUPER_ADMIN",
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
  }
);

app.post(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
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
        { expiresIn: "8h", issuer: "vorldx-api" }
      );

      return res.json({
        success: true,
        token,
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
  }
);

app.get("/api/auth/me", authenticate, async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });

  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      active: req.user.active,
    },
    employee: employee
      ? {
          id: employee._id,
          employeeId: employee.employeeId,
          department: employee.department,
          active: employee.active,
        }
      : null,
  });
});

app.post(
  "/api/hr",
  authenticate,
  allowRoles("SUPER_ADMIN"),
  validateAccountInput,
  async (req, res, next) => {
    try {
      const user = await createAccount({
        ...req.body,
        role: "HR_ADMIN",
      });

      res.status(201).json({
        success: true,
        message: "HR account created successfully",
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
  }
);

app.post(
  "/api/employees",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  validateAccountInput,
  async (req, res, next) => {
    try {
      const user = await createAccount({
        ...req.body,
        role: "EMPLOYEE",
      });

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
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
  }
);

app.get(
  "/api/employees",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const employees = await Employee.find()
        .select("employeeId name email department active user")
        .sort({ name: 1 })
        .lean();

      const userIds = employees.map((employee) => employee.user);

      const users = await User.find({ _id: { $in: userIds } })
        .select("role active")
        .lean();

      const userMap = new Map(
        users.map((user) => [user._id.toString(), user])
      );

      const result = employees.map((employee) => ({
        ...employee,
        user: undefined,
        role: userMap.get(employee.user.toString())?.role ?? null,
        accountActive:
          userMap.get(employee.user.toString())?.active ?? false,
      }));

      res.json({ success: true, employees: result });
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/employees/:id",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const allowedFields = ["name", "email", "department"];
      const updates = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (
            typeof req.body[field] !== "string" ||
            !req.body[field].trim()
          ) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${field}`,
            });
          }

          updates[field] =
            field === "email"
              ? req.body[field].trim().toLowerCase()
              : req.body[field].trim();
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields provided",
        });
      }

      const employee = await Employee.findById(req.params.id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const user = await User.findById(employee.user);

      if (!user || user.role !== "EMPLOYEE") {
        if (req.user.role !== "SUPER_ADMIN") {
          return res.status(403).json({
            success: false,
            message: "HR can edit employee records only",
          });
        }
      }

      if (updates.email) {
        const duplicate = await Employee.findOne({
          email: updates.email,
          _id: { $ne: employee._id },
        });

        const duplicateUser = await User.findOne({
          email: updates.email,
          _id: { $ne: employee.user },
        });

        if (duplicate || duplicateUser) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
          });
        }
      }

      Object.assign(employee, updates);
      await employee.save();

      if (user) {
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email;
        await user.save();
      }

      res.json({
        success: true,
        message: "Employee updated successfully",
        employee,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/employees/:id/deactivate",
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

      const user = await User.findById(employee.user);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Linked account not found",
        });
      }

      if (
        req.user.role === "HR_ADMIN" &&
        user.role !== "EMPLOYEE"
      ) {
        return res.status(403).json({
          success: false,
          message: "HR can deactivate employees only",
        });
      }

      employee.active = false;
      user.active = false;

      await employee.save();
      await user.save();

      res.json({
        success: true,
        message: "Account deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this email or employee ID already exists",
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
    });
  }

  console.error("API error:", error.message);

  res.status(error.status || 500).json({
    success: false,
    message:
      error.status && error.status < 500
        ? error.message
        : "Internal server error",
  });
});

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET.startsWith("replace_with_")
    ) {
      throw new Error("Configure a strong JWT_SECRET in .env");
    }

    if (!process.env.SUPER_ADMIN_SETUP_KEY) {
      throw new Error("SUPER_ADMIN_SETUP_KEY is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`VorldX API: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log("MongoDB connected successfully");
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
