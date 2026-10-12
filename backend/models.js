import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"],
      required: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true, maxlength: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export const Employee = mongoose.model("Employee", employeeSchema);