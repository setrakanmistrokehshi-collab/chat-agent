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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await connectDB();

const app = express();

app.use(cors()); // Allows all origins (for development)


// ── CORS ──────────────────────────────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS;
if (!rawOrigins && process.env.NODE_ENV === "production") {
  throw new Error("ALLOWED_ORIGINS must be set in production");
}
const allowedOrigins = (rawOrigins || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Serve locally stored uploads/generated files as static assets
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, process.env.LOCAL_UPLOAD_DIR || "uploads"),
  ),
);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", provider: process.env.AI_PROVIDER }),
);

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", fileRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT} | AI provider: ${process.env.AI_PROVIDER}`,
  );
});
