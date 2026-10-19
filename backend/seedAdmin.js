
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models.js";

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI, JWT_SECRET } =
    process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("Set a JWT_SECRET of at least 32 characters in .env");
  }

  if (
    !ADMIN_NAME ||
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 12
  ) {
    throw new Error(
      "Set ADMIN_NAME, ADMIN_EMAIL and a password of at least 12 characters in .env"
    );
  }

  await mongoose.connect(MONGODB_URI);

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    throw new Error(
      `An account already exists for ${email}; no account was changed`
    );
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    passwordHash,
    role: "HR_ADMIN",
    active: true,
  });

  console.log(`HR/Admin account created successfully: ${email}`);
}

try {
  await seedAdmin();
} catch (error) {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
