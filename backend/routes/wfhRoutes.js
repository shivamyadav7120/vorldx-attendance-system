import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { WfhRequest, LeaveRequest, Employee, User } from "../models/index.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { getPolicy } from "../services/policyService.js";
import { logAction } from "../services/auditService.js";

const router = express.Router();

const isValidDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value));

// Helper to generate array of dates between start and end (inclusive)
function getDatesInRange(startStr, endStr) {
  const dates = [];
  const curr = new Date(startStr);
  const end = new Date(endStr);
  while (curr <= end) {
    dates.push(curr.toISOString().slice(0, 10));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

// Helper to save base64 document to uploads/documents
function saveDocumentBase64(documentData, originalName = "proof.pdf") {
  if (!documentData || typeof documentData !== "string") return null;

  try {
    const matches = documentData.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    let buffer;
    let ext = "pdf";
    let mime = "application/pdf";

    if (matches && matches.length === 3) {
      mime = matches[1];
      buffer = Buffer.from(matches[2], "base64");
      if (mime.includes("png")) ext = "png";
      else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("pdf")) ext = "pdf";
      else ext = mime.split("/")[1] || "bin";
    } else {
      buffer = Buffer.from(documentData, "base64");
      const dotIdx = originalName.lastIndexOf(".");
      if (dotIdx !== -1) ext = originalName.slice(dotIdx + 1).toLowerCase();
    }

    const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "pdf";
    const uniqueId = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
    const fileName = `proof_${Date.now()}_${uniqueId}.${safeExt}`;
    const targetDir = path.join(process.cwd(), "uploads", "documents");

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return {
      documentUrl: `/uploads/documents/${fileName}`,
      documentName: originalName || fileName,
      documentType: mime,
    };
  } catch (err) {
    console.error("Failed to save uploaded document:", err);
    return null;
  }
}

// ==========================================
// UPLOAD DOCUMENT ENDPOINT (STANDALONE)
// ==========================================
router.post(
  "/wfh/upload-document",
  authenticate,
  allowRoles("EMPLOYEE", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const { documentData, documentName } = req.body || {};
      if (!documentData) {
        return res.status(400).json({
          success: false,
          message: "No document data provided. Please select a valid document or image.",
        });
      }

      const saved = saveDocumentBase64(documentData, documentName);
      if (!saved) {
        return res.status(500).json({
          success: false,
          message: "Failed to process and store document proof",
        });
      }

      return res.json({
        success: true,
        message: "Document uploaded successfully",
        ...saved,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE — SUBMIT WFH REQUEST
// ==========================================
router.post(
  "/wfh",
  authenticate,
  allowRoles("EMPLOYEE", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const {
        startDate,
        endDate,
        reason = "",
        wfhType = "STANDARD",
        urgencyReason = "",
        documentUrl = "",
        documentName = "",
        documentType = "",
        documentData = null,
      } = req.body || {};

      const normalizedType = String(wfhType).toUpperCase() === "URGENT" ? "URGENT" : "STANDARD";

      if (!isValidDate(startDate) || !isValidDate(endDate) || endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: "Provide valid start and end dates (YYYY-MM-DD)",
        });
      }

      const dates = getDatesInRange(startDate, endDate);

      // TYPE 1: STANDARD WFH - MAX 5 DAYS RULE
      if (normalizedType === "STANDARD" && dates.length > 5) {
        return res.status(400).json({
          success: false,
          message: `Standard WFH is limited to a maximum of 5 days per request (you requested ${dates.length} days). For longer emergency requirements, please select Urgent WFH and provide valid proof.`,
        });
      }

      let finalDocUrl = documentUrl;
      let finalDocName = documentName;
      let finalDocType = documentType;

      // Process base64 file data if attached
      if (documentData) {
        const saved = saveDocumentBase64(documentData, documentName || "wfh_proof.pdf");
        if (saved) {
          finalDocUrl = saved.documentUrl;
          finalDocName = saved.documentName;
          finalDocType = saved.documentType;
        }
      }

      // TYPE 2: URGENT WFH - MANDATORY DOCUMENT PROOF RULE
      if (normalizedType === "URGENT" && !finalDocUrl) {
        return res.status(400).json({
          success: false,
          message: "Real document proof (medical certificate, doctor note, or emergency document) is strictly mandatory for Urgent WFH requests.",
        });
      }

      const employee = await Employee.findOne({
        user: req.user._id,
        active: true,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Active employee record not found",
        });
      }

      // Check overlapping WFH requests (PENDING or APPROVED)
      const existingWfh = await WfhRequest.findOne({
        employee: employee._id,
        status: { $in: ["PENDING", "APPROVED"] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      });

      if (existingWfh) {
        return res.status(409).json({
          success: false,
          message: "You already have a pending or approved WFH request for this date range",
        });
      }

      // Check overlapping Leave requests (APPROVED)
      const existingLeave = await LeaveRequest.findOne({
        employee: employee._id,
        status: "APPROVED",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      });

      if (existingLeave) {
        return res.status(409).json({
          success: false,
          message: "You have an approved Leave on one or more of these dates",
        });
      }

      const request = await WfhRequest.create({
        employee: employee._id,
        wfhType: normalizedType,
        startDate,
        endDate,
        reason: (reason || "").trim().slice(0, 500),
        urgencyReason: (urgencyReason || "").trim().slice(0, 500),
        documentUrl: finalDocUrl || "",
        documentName: finalDocName || "",
        documentType: finalDocType || "",
        status: "PENDING",
      });

      await logAction({
        actor: req.user,
        action: "WFH_REQUEST_SUBMITTED",
        targetType: "WfhRequest",
        targetId: request._id,
        details: {
          wfhType: normalizedType,
          startDate,
          endDate,
          hasDocument: Boolean(finalDocUrl),
        },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: normalizedType === "URGENT"
          ? "🚨 Urgent WFH request submitted with document proof for priority review"
          : "Work from home request submitted successfully (Standard quota: Max 5 days)",
        request,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE — MY WFH REQUESTS
// ==========================================
router.get(
  "/wfh/my",
  authenticate,
  async (req, res, next) => {
    try {
      const employee = await Employee.findOne({ user: req.user._id });
      const requests = employee
        ? await WfhRequest.find({ employee: employee._id })
            .populate("decidedBy", "name email role")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean()
        : [];

      return res.json({ success: true, requests });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// WFH AVAILABILITY CHECK FOR A GIVEN DATE
// ==========================================
router.get(
  "/wfh/availability",
  authenticate,
  async (req, res, next) => {
    try {
      const { date } = req.query;
      if (!isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: "Valid date query parameter (YYYY-MM-DD) is required",
        });
      }

      const policy = await getPolicy();
      const maxLimit = policy.maxWfhPerDay || 5;

      const approvedCount = await WfhRequest.countDocuments({
        status: "APPROVED",
        startDate: { $lte: date },
        endDate: { $gte: date },
      });

      return res.json({
        success: true,
        date,
        limit: maxLimit,
        booked: approvedCount,
        available: Math.max(0, maxLimit - approvedCount),
        isFull: approvedCount >= maxLimit,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ADMIN — LIST ALL WFH REQUESTS
// ==========================================
router.get(
  "/wfh",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status.toUpperCase();
      }

      const requests = await WfhRequest.find(filter)
        .populate("employee", "employeeId name email department designation user")
        .populate("decidedBy", "name email role")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      // Permission check: HR Admin can only view Employee requests
      let filtered = requests;
      if (req.user.role === "HR_ADMIN") {
        const userIds = requests.map((r) => r.employee?.user).filter(Boolean);
        const users = await User.find({ _id: { $in: userIds } }, "role").lean();
        const roleMap = new Map(users.map((u) => [u._id.toString(), u.role]));

        filtered = requests.filter((r) => {
          const uId = r.employee?.user?.toString();
          return !uId || roleMap.get(uId) === "EMPLOYEE";
        });
      }

      return res.json({ success: true, requests: filtered });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ADMIN — APPROVE OR REJECT WFH REQUEST
// ==========================================
router.patch(
  "/wfh/:id/status",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const status = String(req.body?.status || "").toUpperCase();
      const decisionComment = typeof req.body?.decisionComment === "string" ? req.body.decisionComment.trim() : "";

      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be APPROVED or REJECTED",
        });
      }

      const request = await WfhRequest.findById(req.params.id).populate("employee");

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "WFH request not found",
        });
      }

      if (request.status !== "PENDING") {
        return res.status(409).json({
          success: false,
          message: `This request has already been ${request.status.toLowerCase()}`,
        });
      }

      // HR Admin role restriction
      if (req.user.role === "HR_ADMIN" && request.employee?.user) {
        const targetUser = await User.findById(request.employee.user);
        if (targetUser && targetUser.role !== "EMPLOYEE") {
          return res.status(403).json({
            success: false,
            message: "HR can decide employee requests only",
          });
        }
      }

      // CONCURRENCY-SAFE DAILY LIMIT VALIDATION FOR "APPROVED"
      if (status === "APPROVED") {
        const policy = await getPolicy();
        const maxLimit = policy.maxWfhPerDay || 5;
        const dates = getDatesInRange(request.startDate, request.endDate);

        for (const date of dates) {
          const approvedCount = await WfhRequest.countDocuments({
            _id: { $ne: request._id },
            status: "APPROVED",
            startDate: { $lte: date },
            endDate: { $gte: date },
          });

          if (approvedCount >= maxLimit) {
            return res.status(409).json({
              success: false,
              message: `Cannot approve request: daily WFH limit of ${maxLimit} employees has already been reached for ${date}`,
            });
          }
        }
      }

      request.status = status;
      request.decisionComment = decisionComment;
      request.decidedBy = req.user._id;
      request.decidedAt = new Date();
      await request.save();

      await logAction({
        actor: req.user,
        action: `WFH_${status}`,
        targetType: "WfhRequest",
        targetId: request._id,
        details: {
          employeeId: request.employee?.employeeId,
          startDate: request.startDate,
          endDate: request.endDate,
          wfhType: request.wfhType,
          documentUrl: request.documentUrl || null,
          decisionComment,
        },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: `WFH request ${status.toLowerCase()} successfully`,
        request,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// EMPLOYEE — CANCEL OWN PENDING WFH REQUEST
// ==========================================
router.patch(
  "/wfh/:id/cancel",
  authenticate,
  async (req, res, next) => {
    try {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found",
        });
      }

      const request = await WfhRequest.findOne({
        _id: req.params.id,
        employee: employee._id,
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "WFH request not found",
        });
      }

      if (request.status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: "Only pending requests can be cancelled",
        });
      }

      request.status = "CANCELLED";
      await request.save();

      return res.json({
        success: true,
        message: "WFH request cancelled successfully",
        request,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
