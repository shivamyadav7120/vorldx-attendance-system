import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/index.js";

const NEW_PASSWORD = "Admin@12345";

await mongoose.connect(process.env.MONGODB_URI);

const admins = await User.find({ role: "SUPER_ADMIN" });

if (admins.length === 0) {
  console.log("No SUPER_ADMIN found.");
} else {
  for (const admin of admins) {
    admin.passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);
    admin.active = true;
    await admin.save();
    console.log(`✅ Password reset for: ${admin.email}`);
  }
}

await mongoose.disconnect();
