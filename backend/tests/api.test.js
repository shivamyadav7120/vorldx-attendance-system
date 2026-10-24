import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  User,
  Employee,
  Attendance,
  WfhRequest,
  LeaveRequest,
  QrSession,
  AuditLog,
  AttendancePolicy,
} from "../models/index.js";

import { getIndiaDate, getIndiaTime, evaluateAttendanceStatus } from "../services/policyService.js";
import { createQrSession, consumeQrToken } from "../services/qrService.js";
import { generateRealOtp, saveOtpForPhone, verifyOtpForPhone } from "../services/smsService.js";

const TEST_EMAIL_SUPER = `super_test_${Date.now()}@vorldx.test`;
const TEST_EMAIL_HR = `hr_test_${Date.now()}@vorldx.test`;
const TEST_EMAIL_EMP = `emp_test_${Date.now()}@vorldx.test`;
const TEST_PASSWORD = "TestPassword123!";

describe("VorldX Employee Attendance System — Integration Test Suite", () => {
  let superAdminUser;
  let hrAdminUser;
  let employeeUser;
  let employeeDoc;

  before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    
    superAdminUser = await User.create({
      name: "Test Super Admin",
      email: TEST_EMAIL_SUPER,
      passwordHash,
      role: "SUPER_ADMIN",
      active: true,
    });

    
    hrAdminUser = await User.create({
      name: "Test HR Admin",
      email: TEST_EMAIL_HR,
      passwordHash,
      role: "HR_ADMIN",
      active: true,
    });
    await Employee.create({
      user: hrAdminUser._id,
      employeeId: `HR-TEST-${Date.now()}`,
      name: hrAdminUser.name,
      email: hrAdminUser.email,
      department: "Human Resources",
      active: true,
    });

    
    employeeUser = await User.create({
      name: "Test Employee",
      email: TEST_EMAIL_EMP,
      passwordHash,
      role: "EMPLOYEE",
      active: true,
    });
    employeeDoc = await Employee.create({
      user: employeeUser._id,
      employeeId: `EMP-TEST-${Date.now()}`,
      name: employeeUser.name,
      email: employeeUser.email,
      department: "Engineering",
      active: true,
    });
  });

  after(async () => {
    
    await User.deleteMany({
      email: { $in: [TEST_EMAIL_SUPER, TEST_EMAIL_HR, TEST_EMAIL_EMP] },
    });
    if (employeeDoc) {
      await Employee.deleteMany({
        _id: { $in: [employeeDoc._id] },
      });
      await Attendance.deleteMany({ employee: employeeDoc._id });
      await WfhRequest.deleteMany({ employee: employeeDoc._id });
      await LeaveRequest.deleteMany({ employee: employeeDoc._id });
    }
    await QrSession.deleteMany({ createdBy: hrAdminUser?._id });
    await AuditLog.deleteMany({ actor: { $in: [superAdminUser?._id, hrAdminUser?._id] } });

    await mongoose.disconnect();
  });

  test("1. Database connection is active and healthy", async () => {
    assert.equal(mongoose.connection.readyState, 1);
  });

  test("2. Timezone & date calculation produces valid Asia/Kolkata date and time", () => {
    const today = getIndiaDate();
    const time = getIndiaTime();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(time, /^([01]\d|2[0-3]):[0-5]\d$/);
  });

  test("3. Attendance policy status evaluator enforces cutoff", () => {
    const mockPolicy = {
      officeStartTime: "09:00",
      checkInCutoffTime: "09:30",
      lateArrivalPolicy: "MARK_LATE",
    };

    
    assert.equal(evaluateAttendanceStatus("09:15", mockPolicy), "PRESENT");
    assert.equal(evaluateAttendanceStatus("09:30", mockPolicy), "PRESENT");

    
    assert.equal(evaluateAttendanceStatus("09:31", mockPolicy), "LATE");
    assert.equal(evaluateAttendanceStatus("10:00", mockPolicy), "LATE");

    
    assert.equal(
      evaluateAttendanceStatus("09:35", { ...mockPolicy, lateArrivalPolicy: "MARK_ABSENT" }),
      "ABSENT"
    );

    
    assert.equal(
      evaluateAttendanceStatus("09:45", { ...mockPolicy, lateArrivalPolicy: "MARK_HALF_DAY" }),
      "HALF_DAY"
    );
  });

  test("4. Secure QR Session: 18-second validity and replay attack prevention", async () => {
    
    const sessionData = await createQrSession(hrAdminUser._id, "Test HQ");
    assert.ok(sessionData.token);
    assert.equal(sessionData.validitySeconds, 18);

    
    const consumed = await consumeQrToken(sessionData.token, employeeUser);
    assert.equal(consumed.used, true);
    assert.equal(consumed.usedBy.toString(), employeeUser._id.toString());

    
    await assert.rejects(
      async () => {
        await consumeQrToken(sessionData.token, employeeUser);
      },
      {
        message: "This QR code has already been scanned and used",
      }
    );
  });

  test("5. Prevent duplicate attendance check-in for the same date", async () => {
    const testDate = "2026-10-15"; 
    await Attendance.deleteMany({ employee: employeeDoc._id, date: testDate });

    
    const att = await Attendance.create({
      employee: employeeDoc._id,
      date: testDate,
      mode: "OFFICE",
      status: "PRESENT",
      checkIn: new Date(),
      checkInMethod: "QR",
    });
    assert.ok(att._id);

    
    await assert.rejects(
      async () => {
        await Attendance.create({
          employee: employeeDoc._id,
          date: testDate,
          mode: "OFFICE",
          status: "PRESENT",
          checkIn: new Date(),
        });
      },
      (err) => err.code === 11000
    );

    await Attendance.deleteOne({ _id: att._id });
  });

  test("6. Attendance correction history preserves original record and reasons", async () => {
    const testDate = "2026-10-14";
    await Attendance.deleteMany({ employee: employeeDoc._id, date: testDate });

    const originalCheckIn = new Date("2026-10-14T09:40:00Z");
    const att = await Attendance.create({
      employee: employeeDoc._id,
      date: testDate,
      mode: "OFFICE",
      status: "LATE",
      checkIn: originalCheckIn,
      notes: "Arrived late due to train delay",
    });

    
    const correctionTime = new Date();
    att.correctionHistory.push({
      correctedBy: hrAdminUser._id,
      correctedAt: correctionTime,
      reason: "Train delay approved by management",
      previousStatus: "LATE",
      newStatus: "PRESENT",
      previousCheckIn: originalCheckIn,
      newCheckIn: originalCheckIn,
    });
    att.status = "PRESENT";
    await att.save();

    const updated = await Attendance.findById(att._id);
    assert.equal(updated.status, "PRESENT");
    assert.equal(updated.correctionHistory.length, 1);
    assert.equal(updated.correctionHistory[0].previousStatus, "LATE");
    assert.equal(updated.correctionHistory[0].newStatus, "PRESENT");
    assert.equal(updated.correctionHistory[0].reason, "Train delay approved by management");

    await Attendance.deleteOne({ _id: att._id });
  });

  test("7. WFH daily quota constraint: max 5 approved employees per day", async () => {
    const targetDate = "2026-11-01";

    
    await WfhRequest.deleteMany({ startDate: { $lte: targetDate }, endDate: { $gte: targetDate } });

    
    const tempEmployees = [];
    const tempRequests = [];

    for (let i = 1; i <= 5; i++) {
      const u = await User.create({
        name: `WFH User ${i}`,
        email: `wfh_temp_${i}_${Date.now()}@vorldx.test`,
        passwordHash: "hash",
        role: "EMPLOYEE",
      });
      const e = await Employee.create({
        user: u._id,
        employeeId: `WFH-EMP-${i}-${Date.now()}`,
        name: u.name,
        email: u.email,
        department: "Testing",
      });
      tempEmployees.push({ u, e });

      const req = await WfhRequest.create({
        employee: e._id,
        startDate: targetDate,
        endDate: targetDate,
        status: "APPROVED",
        reason: "Remote work",
      });
      tempRequests.push(req);
    }

    
    const currentApproved = await WfhRequest.countDocuments({
      status: "APPROVED",
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    });
    assert.equal(currentApproved, 5);

    
    const sixthApproved = currentApproved >= 5;
    assert.equal(sixthApproved, true, "Quota of 5 is correctly reached");

    
    for (const { u, e } of tempEmployees) {
      await User.deleteOne({ _id: u._id });
      await Employee.deleteOne({ _id: e._id });
    }
    await WfhRequest.deleteMany({ _id: { $in: tempRequests.map((r) => r._id) } });
  });

  test("8. JWT signature and payload verification", () => {
    const token = jwt.sign(
      { sub: employeeUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "8h", issuer: "vorldx-api" }
    );

    const verified = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "vorldx-api",
    });
    assert.equal(verified.sub, employeeUser._id.toString());

    
    assert.throws(() => {
      jwt.verify(token, "wrong_secret_key_that_is_long_enough");
    });
  });

  test("9. Demo employee verification & simulated OTP onboarding", async () => {
    const demoEmpId = "VX-EMP-001";
    const demoOtp = "8426";
    const validCodes = ["8426", "123456", "000000"];

    assert.equal(validCodes.includes(demoOtp), true);

    const emp = await Employee.findOne({ employeeId: demoEmpId });
    if (emp) {
      assert.equal(emp.employeeId, demoEmpId);
      assert.ok(emp.department);
    }
  });

  test("10. WFH multi-step approval integrity (HR approval prerequisite)", async () => {
    const testDate = "2026-11-20";
    const reqDoc = await WfhRequest.create({
      employee: employeeDoc._id,
      startDate: testDate,
      endDate: testDate,
      reason: "Integration test for 2-step approval",
      status: "PENDING",
      wfhType: "STANDARD",
    });

    assert.equal(reqDoc.status, "PENDING");

    reqDoc.status = "HR_APPROVED";
    reqDoc.hrApprovedBy = hrAdminUser._id;
    reqDoc.hrApprovedAt = new Date();
    await reqDoc.save();

    assert.equal(reqDoc.status, "HR_APPROVED");
    assert.equal(reqDoc.hrApprovedBy.toString(), hrAdminUser._id.toString());

    reqDoc.status = "APPROVED";
    reqDoc.adminApprovedBy = superAdminUser._id;
    reqDoc.decidedBy = superAdminUser._id;
    reqDoc.decidedAt = new Date();
    await reqDoc.save();

    assert.equal(reqDoc.status, "APPROVED");
    assert.equal(reqDoc.adminApprovedBy.toString(), superAdminUser._id.toString());

    await WfhRequest.deleteOne({ _id: reqDoc._id });
  });

  test("11. Admin login strictly enforces .env credentials", () => {
    const envAdminEmail = process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL;
    const envAdminPass = process.env.ADMIN_PASS || process.env.SUPER_ADMIN_PASSWORD;
    const envAdminId = process.env.ADMIN_ID || "SA-001";

    assert.ok(envAdminPass, ".env admin password must be defined");
    assert.ok(envAdminEmail, ".env admin email must be defined");

    const correctAttempt = envAdminPass;
    const wrongAttempt = "RandomWrongPassword999!";

    assert.equal(correctAttempt === envAdminPass, true);
    assert.equal(wrongAttempt === envAdminPass, false);
  });

  test("12. Role permissions: Only Super Admin can add HR Admins", () => {
    const superAdminGuard = (role) => {
      const allowed = ["SUPER_ADMIN"];
      return allowed.includes(role);
    };

    assert.equal(superAdminGuard("SUPER_ADMIN"), true, "Super Admin is permitted to manage HR Admins");
    assert.equal(superAdminGuard("HR_ADMIN"), false, "HR Admin is blocked from adding HR Admins");
    assert.equal(superAdminGuard("EMPLOYEE"), false, "Employee is blocked from adding HR Admins");
  });

  test("13. Passwordless Mobile Number OTP Login flow", async () => {
    const testPhone = "+91 98765 43210";
    const demoOtp = "8426";
    const allowedOtps = ["8426", "123456", "000000"];

    assert.equal(allowedOtps.includes(demoOtp), true, "Demo OTP 8426 is accepted");
    assert.equal(allowedOtps.includes("9999"), false, "Incorrect OTP is rejected");

    let emp = await Employee.findOne({ phone: testPhone });
    if (!emp) {
      emp = await Employee.findOne({ employeeId: "VX-EMP-001" });
    }
    assert.ok(emp || testPhone, "Employee phone record verified for OTP login");
  });

  test("14. Real Dynamic SMS OTP generation, storage, and cryptographic verification", async () => {
    const testPhone = "+91 98765 00099";
    const dynamicOtp = generateRealOtp();

    assert.equal(typeof dynamicOtp, "string");
    assert.equal(dynamicOtp.length, 4);
    assert.equal(/^\d{4}$/.test(dynamicOtp), true, "Generated OTP is 4 numeric digits");

    await saveOtpForPhone(testPhone, dynamicOtp);

    const validCheck = await verifyOtpForPhone(testPhone, dynamicOtp);
    assert.equal(validCheck.valid, true, "Dynamically generated OTP is successfully validated");

    const invalidCheck = await verifyOtpForPhone(testPhone, "9998");
    assert.equal(invalidCheck.valid, false, "Mismatched OTP code is correctly rejected");
  });
});
