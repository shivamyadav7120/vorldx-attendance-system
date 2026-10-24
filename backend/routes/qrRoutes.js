import express from "express";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { createQrSession } from "../services/qrService.js";

const router = express.Router();


router.post(
  "/qr/session",
  authenticate,
  allowRoles("SUPER_ADMIN", "HR_ADMIN"),
  async (req, res, next) => {
    try {
      const officeLocation = req.body?.officeLocation || "Main Office";
      const session = await createQrSession(req.user._id, officeLocation);

      return res.status(201).json({
        success: true,
        session,
      });
    } catch (error) {
      next(error);
    }
  }
);



router.get("/qr/kiosk", async (req, res, next) => {
  try {
    const session = await createQrSession(null, "Reception Kiosk");
    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
