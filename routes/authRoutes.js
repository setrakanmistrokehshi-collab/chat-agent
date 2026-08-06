import express from "express";
import { signup, login, getMe, logout } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// HANDLE PREFLIGHT FIRST - Before any other middleware

router.options('/login', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  res.status(204).end();
});

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
