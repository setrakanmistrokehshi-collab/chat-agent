import dns from "dns";

const dnsServers = ["8.8.8.8", "8.8.4.4"];
dns.setServers(dnsServers);

import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import upload, { getUploadDir, STORAGE_TYPE } from "./config/storage.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

await connectDB();

const app = express();

// ── CORS (single, correct configuration) ───────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS;

if (!rawOrigins && process.env.NODE_ENV === "production") {
  throw new Error("ALLOWED_ORIGINS must be set in production");
}

const allowedOrigins = (rawOrigins || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // remove trailing slash
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    // Important: use callback(null, false) — do NOT pass an Error
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Request-ID",
    "X-Requested-With",
  ],
  exposedHeaders: ["X-Request-ID"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Explicitly handle preflight for all routes
app.options("*", cors(corsOptions));

// ── Body parsers ───────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

if (STORAGE_TYPE !== "s3") {
  const dir = getUploadDir();
  if (dir) {
    app.use("/uploads", express.static(dir));
  }
}

// ── Health check ───────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", provider: process.env.AI_PROVIDER }),
);

// ── Routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", fileRoutes);

// ── Error handlers ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT} | AI provider: ${process.env.AI_PROVIDER}`,
  );
  
});