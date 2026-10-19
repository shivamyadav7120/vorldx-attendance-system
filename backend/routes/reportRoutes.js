import express from "express";
import { Attendance, Employee, LeaveRequest, WfhRequest, User } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { getIndiaDate } from "../services/policyService.js";

const router = express.Router();

router.get(
  "/reports/analytics",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const today = getIndiaDate();
      const startDate = req.query.startDate || today;
      const endDate = req.query.endDate || today;

      const [
        totalEmployees,
        activeEmployees,
        totalHrAdmins,
        todayAttendance,
        pendingWfh,
        pendingLeave,
        allEmployees,
      ] = await Promise.all([
        Employee.countDocuments(),
        Employee.countDocuments({ active: true }),
        User.countDocuments({ role: "HR_ADMIN", active: true }),
        Attendance.find({ date: today }).lean(),
        WfhRequest.countDocuments({ status: "PENDING" }),
        LeaveRequest.countDocuments({ status: "PENDING" }),
        Employee.find({ active: true }, "department").lean(),
      ]);

      const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;
      const lateToday = todayAttendance.filter((a) => a.status === "LATE").length;
      const absentToday = todayAttendance.filter((a) => a.status === "ABSENT").length;
      const halfDayToday = todayAttendance.filter((a) => a.status === "HALF_DAY").length;
      const wfhToday = todayAttendance.filter((a) => a.mode === "WFH").length;
      const officeToday = todayAttendance.filter((a) => a.mode === "OFFICE").length;

      // Department breakdown
      const deptMap = {};
      for (const emp of allEmployees) {
        const d = emp.department || "Other";
        deptMap[d] = (deptMap[d] || 0) + 1;
      }
      const departmentBreakdown = Object.entries(deptMap).map(([department, count]) => ({
        department,
        count,
      }));

      // Trend for the last 7 days
      const trend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = getIndiaDate(d);
        const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });
        trend.push({ date: dateStr, day: dayLabel });
      }

      const trendDates = trend.map((t) => t.date);
      const trendRecords = await Attendance.find({ date: { $in: trendDates } }).lean();

      const trendMap = {};
      for (const r of trendRecords) {
        if (!trendMap[r.date]) {
          trendMap[r.date] = { present: 0, late: 0, absent: 0 };
        }
        if (r.status === "PRESENT") trendMap[r.date].present++;
        else if (r.status === "LATE") trendMap[r.date].late++;
        else if (r.status === "ABSENT") trendMap[r.date].absent++;
      }

      const weeklyTrend = trend.map((t) => ({
        day: t.day,
        date: t.date,
        present: (trendMap[t.date]?.present || 0) + (trendMap[t.date]?.late || 0),
        absent: trendMap[t.date]?.absent || 0,
        late: trendMap[t.date]?.late || 0,
      }));

      return res.json({
        success: true,
        summary: {
          today,
          totalEmployees,
          activeEmployees,
          totalHrAdmins,
          presentToday,
          lateToday,
          absentToday,
          halfDayToday,
          wfhToday,
          officeToday,
          pendingApprovals: pendingWfh + pendingLeave,
          pendingWfh,
          pendingLeave,
        },
        weeklyTrend,
        departmentBreakdown,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
