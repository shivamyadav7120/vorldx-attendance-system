import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/documents directory exists
const uploadsDir = path.join(__dirname, "uploads", "documents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Modular Routes
import authRoutes from "./routes/authRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import wfhRoutes from "./routes/wfhRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ==================================================
// SECURITY & MIDDLEWARE
// ==================================================

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8081", // Expo Web & Metro bundler
  "http://localhost:19000",
  "http://localhost:19006",
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, postman) or matching whitelist
      if (
        !origin ||
        process.env.NODE_ENV === "development" ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.") ||
        origin.startsWith("exp://")
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static uploads serving for uploaded verification documents
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === "production" ? 600 : 6000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VorldX Attendance API is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// MOUNT MODULAR API ROUTES
// ==================================================

app.use("/api", authRoutes);
app.use("/api", hrRoutes);
app.use("/api", employeeRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", wfhRoutes);
app.use("/api", leaveRoutes);
app.use("/api", qrRoutes);
app.use("/api", policyRoutes);
app.use("/api", auditRoutes);
app.use("/api", organizationRoutes);
app.use("/api", reportRoutes);

// ==================================================
// 404 HANDLER
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==================================================
// CENTRALIZED ERROR HANDLER
// ==================================================

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this email, employee ID or date already exists",
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid input data",
    });
  }

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin is not allowed by CORS",
    });
  }

  console.error("API error:", error.message);

  return res.status(error.status || 500).json({
    success: false,
    message:
      error.status && error.status < 500
        ? error.message
        : "Internal server error",
  });
});

// ==================================================
// SERVER INITIALIZATION
// ==================================================

export async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET.startsWith("replace_with_")
    ) {
      throw new Error("Configure a strong JWT_SECRET (at least 32 characters) in .env");
    }

    if (!process.env.SUPER_ADMIN_SETUP_KEY) {
      throw new Error("SUPER_ADMIN_SETUP_KEY is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`VorldX API running on: http://0.0.0.0:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log("MongoDB connected successfully");
    });

    return { app, server };
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    throw error;
  }
}

// Start server when run directly
if (process.argv[1]?.endsWith("server.js")) {
  startServer().catch(() => process.exit(1));
}

export default app;