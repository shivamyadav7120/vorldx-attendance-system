import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Employee } from "./models/index.js";

async function seedSuperAdmin() {
  const {
    MONGODB_URI,
    SUPER_ADMIN_NAME = "Super Administrator",
    SUPER_ADMIN_EMAIL = "superadmin@vorldx.com",
    SUPER_ADMIN_PASSWORD = "SuperAdminPassword123!",
  } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(MONGODB_URI);

  const existingSuper = await User.findOne({ role: "SUPER_ADMIN" });
  if (existingSuper) {
    console.log(`Super Admin already exists: ${existingSuper.email} (${existingSuper.name})`);
    return;
  }

  const email = SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.role = "SUPER_ADMIN";
    await existingUser.save();
    console.log(`Promoted existing user ${email} to SUPER_ADMIN`);
    return;
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  const user = await User.create({
    name: SUPER_ADMIN_NAME.trim(),
    email,
    passwordHash,
    role: "SUPER_ADMIN",
    active: true,
  });

  await Employee.create({
    user: user._id,
    employeeId: "SA-001",
    name: user.name,
    email: user.email,
    department: "Executive Management",
    designation: "Chief Administrator",
    active: true,
  });

  console.log(`First Super Admin created successfully: ${email}`);
  console.log(`Default credentials: ${email} / (configured in .env or default)`);
}

try {
  await seedSuperAdmin();
} catch (error) {
  console.error("Super Admin seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
