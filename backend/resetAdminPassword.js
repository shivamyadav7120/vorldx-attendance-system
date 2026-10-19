
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models.js";
import { createInterface } from "node:readline/promises";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!process.env.MONGODB_URI || !email) {
    throw new Error("MONGODB_URI or ADMIN_EMAIL is missing");
  }

  const password = await rl.question("Enter new admin password: ");

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await User.findOne({
    email,
    role: "HR_ADMIN",
  });

  if (!admin) {
    throw new Error("Existing HR/Admin account not found");
  }

  admin.passwordHash = await bcrypt.hash(password, 12);
  admin.active = true;

  await admin.save();

  console.log("Admin password updated successfully.");
} catch (error) {
  console.error("Reset failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
