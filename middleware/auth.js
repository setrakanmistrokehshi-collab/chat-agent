import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * Protects routes by requiring a valid Bearer JWT.
 * Attaches `req.user` (the Mongo user document, minus password) on success.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const payload = await verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }
};
