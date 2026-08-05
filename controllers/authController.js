import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const user = await User.create({ name, email, password });
    const token = await signToken(user._id.toString());

    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = await signToken(user._id.toString());
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

// Logout is handled client-side by discarding the token (JWTs are stateless).
// This endpoint exists mainly for a consistent API shape / future blacklist support.
export const logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
