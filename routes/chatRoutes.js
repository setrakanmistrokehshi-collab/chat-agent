import express from "express";
import { protect } from "../middleware/auth.js";
import upload from "../config/storage.js";
import { sendMessage } from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);

// Accepts multipart/form-data: fields `content` (text) and optional `file`
router.post("/:id/messages", upload.single("file"), sendMessage);

export default router;
