import express from "express";
import { protect } from "../middleware/auth.js";
import {
  listConversations,
  createConversation,
  getConversationMessages,
  renameConversation,
  deleteConversation,
} from "../controllers/conversationController.js";

const router = express.Router();

router.use(protect);

router.get("/", listConversations);
router.post("/", createConversation);
router.get("/:id", getConversationMessages);
router.patch("/:id", renameConversation);
router.delete("/:id", deleteConversation);

export default router;
