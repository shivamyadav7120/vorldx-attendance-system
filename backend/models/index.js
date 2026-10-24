import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"],
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Employee email is required"],
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


const correctionEntrySchema = new mongoose.Schema(
  {
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    correctedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: [true, "Correction reason is required"],
      trim: true,
      maxlength: 500,
    },
    previousStatus: String,
    newStatus: String,
    previousCheckIn: Date,
    newCheckIn: Date,
    previousCheckOut: Date,
    newCheckOut: Date,
    previousMode: String,
    newMode: String,
  },
  { _id: true }
);


const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    date: {
      type: String,
      required: [true, "Attendance date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"],
    },
    mode: {
      type: String,
      enum: ["OFFICE", "WFH"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "LATE", "ABSENT", "HALF_DAY"],
      default: "ABSENT",
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    checkInMethod: {
      type: String,
      enum: ["QR", "HR_MANUAL", "SUPER_ADMIN_MANUAL", "WFH"],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
    correctionHistory: [correctionEntrySchema],
  },
  { timestamps: true }
);


attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });


const wfhSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    wfhType: {
      type: String,
      enum: ["STANDARD", "URGENT"],
      default: "STANDARD",
    },
    startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    urgencyReason: { type: String, trim: true, maxlength: 500, default: "" },
    documentUrl: { type: String, trim: true, default: "" },
    documentName: { type: String, trim: true, default: "" },
    documentType: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "HR_APPROVED", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
    decisionComment: { type: String, trim: true, maxlength: 500, default: "" },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
    hrApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hrApprovedAt: { type: Date, default: null },
    hrComment: { type: String, trim: true, maxlength: 500, default: "" },
    adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminApprovedAt: { type: Date, default: null },
    adminComment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

wfhSchema.index({ employee: 1, status: 1 });
wfhSchema.index({ startDate: 1, endDate: 1, status: 1 });


const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveType: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "Casual",
    },
    startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "HR_APPROVED", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
    decisionComment: { type: String, trim: true, maxlength: 500, default: "" },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
    hrApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hrApprovedAt: { type: Date, default: null },
    hrComment: { type: String, trim: true, maxlength: 500, default: "" },
    adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminApprovedAt: { type: Date, default: null },
    adminComment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1, status: 1 });


const qrSessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    officeLocation: { type: String, default: "Main Office" },
    used: { type: Boolean, default: false },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);


qrSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 });


const attendancePolicySchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    officeStartTime: { type: String, default: "09:00" },
    checkInCutoffTime: { type: String, default: "09:30" },
    officeEndTime: { type: String, default: "18:00" },
    lateArrivalPolicy: {
      type: String,
      enum: ["MARK_LATE", "MARK_ABSENT", "MARK_HALF_DAY"],
      default: "MARK_LATE",
    },
    maxWfhPerDay: { type: Number, default: 5, min: 1, max: 100 },
    qrExpirySeconds: { type: Number, default: 18, min: 5, max: 120 },
    timezone: { type: String, default: "Asia/Kolkata" },
    allowHrAdminAssignId: { type: Boolean, default: true },
  },
  { timestamps: true }
);


const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorEmail: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });


const organizationSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    name: { type: String, trim: true, maxlength: 150, default: "VorldX" },
    email: { type: String, trim: true, maxlength: 254, default: "" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    address: { type: String, trim: true, maxlength: 300, default: "" },
    timezone: { type: String, trim: true, maxlength: 60, default: "Asia/Kolkata" },
    officeStart: { type: String, default: "09:00" },
    officeEnd: { type: String, default: "18:30" },
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ["BROADCAST", "DIRECT_MESSAGE", "ANNOUNCEMENT", "ALERT", "SYSTEM"],
      default: "BROADCAST",
    },
    targetAudience: {
      type: String,
      enum: ["ALL", "EMPLOYEES", "HR", "DEPARTMENT", "USER"],
      default: "ALL",
    },
    targetDepartment: {
      type: String,
      trim: true,
      default: "",
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    priority: {
      type: String,
      enum: ["NORMAL", "HIGH", "URGENT"],
      default: "NORMAL",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      default: "Administrator",
    },
    senderRole: {
      type: String,
      default: "SUPER_ADMIN",
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const otpVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
export const WfhRequest = mongoose.models.WfhRequest || mongoose.model("WfhRequest", wfhSchema);
export const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model("LeaveRequest", leaveSchema);
export const QrSession = mongoose.models.QrSession || mongoose.model("QrSession", qrSessionSchema);
export const AttendancePolicy = mongoose.models.AttendancePolicy || mongoose.model("AttendancePolicy", attendancePolicySchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
export const Organization = mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export const OtpVerification = mongoose.models.OtpVerification || mongoose.model("OtpVerification", otpVerificationSchema);
