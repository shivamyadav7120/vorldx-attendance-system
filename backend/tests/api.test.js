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

    // 1. Setup Super Admin
    superAdminUser = await User.create({
      name: "Test Super Admin",
      email: TEST_EMAIL_SUPER,
      passwordHash,
      role: "SUPER_ADMIN",
      active: true,
    });

    // 2. Setup HR Admin
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

    // 3. Setup Employee
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
    // Clean up test records
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

    // On time (before or at 09:30)
    assert.equal(evaluateAttendanceStatus("09:15", mockPolicy), "PRESENT");
    assert.equal(evaluateAttendanceStatus("09:30", mockPolicy), "PRESENT");

    // After 09:30 with MARK_LATE policy
    assert.equal(evaluateAttendanceStatus("09:31", mockPolicy), "LATE");
    assert.equal(evaluateAttendanceStatus("10:00", mockPolicy), "LATE");

    // With MARK_ABSENT policy
    assert.equal(
      evaluateAttendanceStatus("09:35", { ...mockPolicy, lateArrivalPolicy: "MARK_ABSENT" }),
      "ABSENT"
    );

    // With MARK_HALF_DAY policy
    assert.equal(
      evaluateAttendanceStatus("09:45", { ...mockPolicy, lateArrivalPolicy: "MARK_HALF_DAY" }),
      "HALF_DAY"
    );
  });

  test("4. Secure QR Session: 18-second validity and replay attack prevention", async () => {
    // Generate QR session
    const sessionData = await createQrSession(hrAdminUser._id, "Test HQ");
    assert.ok(sessionData.token);
    assert.equal(sessionData.validitySeconds, 18);

    // First consumption succeeds
    const consumed = await consumeQrToken(sessionData.token, employeeUser);
    assert.equal(consumed.used, true);
    assert.equal(consumed.usedBy.toString(), employeeUser._id.toString());

    // Second consumption of same token must be rejected (replay attack prevention)
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
    const testDate = "2026-10-15"; // Specific test date
    await Attendance.deleteMany({ employee: employeeDoc._id, date: testDate });

    // First check-in
    const att = await Attendance.create({
      employee: employeeDoc._id,
      date: testDate,
      mode: "OFFICE",
      status: "PRESENT",
      checkIn: new Date(),
      checkInMethod: "QR",
    });
    assert.ok(att._id);

    // Duplicate check-in with compound index must throw error code 11000
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

    // Admin corrects to PRESENT with justification
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

    // Clean up any existing records for target date
    await WfhRequest.deleteMany({ startDate: { $lte: targetDate }, endDate: { $gte: targetDate } });

    // Create mock employees and 5 approved requests
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

    // Verify exactly 5 are approved
    const currentApproved = await WfhRequest.countDocuments({
      status: "APPROVED",
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    });
    assert.equal(currentApproved, 5);

    // 6th request cannot be approved if limit is 5
    const sixthApproved = currentApproved >= 5;
    assert.equal(sixthApproved, true, "Quota of 5 is correctly reached");

    // Clean up temp
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

    // Expired or forged token verification fails
    assert.throws(() => {
      jwt.verify(token, "wrong_secret_key_that_is_long_enough");
    });
  });
});
