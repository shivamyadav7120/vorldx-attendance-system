
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models.js";

try {
  if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL) {
    throw new Error("MONGODB_URI or ADMIN_EMAIL is missing from .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

  const admin = await User.findOne({ email }).select("+passwordHash");

  if (!admin) {
    console.log("Admin account not found.");
  } else {
    console.log("Admin found:", admin.email);
    console.log("Role:", admin.role);
    console.log("Active:", admin.active);
    console.log("Password hash exists:", Boolean(admin.passwordHash));
    console.log(
      "Password hash format:",
      admin.passwordHash?.startsWith("$2")
    );

    if (!process.env.ADMIN_PASSWORD) {
      console.log("ADMIN_PASSWORD is missing from .env");
    } else {
      const matches = await bcrypt.compare(
        process.env.ADMIN_PASSWORD,
        admin.passwordHash
      );

      console.log("ENV password matches database:", matches);
    }
  }
} catch (error) {
  console.error("Verification failed:", error.message);
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
