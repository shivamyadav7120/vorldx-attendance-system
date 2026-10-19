import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = header.slice(7);

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "vorldx-api",
    });

    const user = await User.findById(payload.sub);

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive or unavailable",
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action",
    });
  }

  next();
};
