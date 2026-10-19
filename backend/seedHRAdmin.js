import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Employee } from "./models/index.js";

const HR_NAME = process.env.HR_ADMIN_NAME || "HR Administrator";
const HR_EMAIL = process.env.HR_ADMIN_EMAIL || "hr@vorldx.com";
const HR_PASSWORD = process.env.HR_ADMIN_PASSWORD || "Hr@12345";

await mongoose.connect(process.env.MONGODB_URI);

const existing = await User.findOne({ email: HR_EMAIL.toLowerCase() });
if (existing) {
  existing.passwordHash = await bcrypt.hash(HR_PASSWORD, 12);
  existing.active = true;
  existing.role = "HR_ADMIN";
  await existing.save();
  console.log(`✅ HR Admin password reset: ${HR_EMAIL}`);
} else {
  const passwordHash = await bcrypt.hash(HR_PASSWORD, 12);
  const user = await User.create({
    name: HR_NAME,
    email: HR_EMAIL.toLowerCase(),
    passwordHash,
    role: "HR_ADMIN",
    active: true,
  });

  await Employee.create({
    user: user._id,
    employeeId: "HR-001",
    name: HR_NAME,
    email: HR_EMAIL.toLowerCase(),
    department: "Human Resources",
    designation: "HR Administrator",
    active: true,
  });

  console.log(`✅ HR Admin created: ${HR_EMAIL}`);
}

console.log(`\nLogin credentials:`);
console.log(`  Email:    ${HR_EMAIL}`);
console.log(`  Password: ${HR_PASSWORD}`);

await mongoose.disconnect();
