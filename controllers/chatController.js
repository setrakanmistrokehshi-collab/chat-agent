import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getChatCompletion } from "../services/aiService.js";
import { extractTextFromFile, readFileBuffer } from "../services/fileParser.js";
import { getFileUrl, getFileKey } from "../config/storage.js";

const MAX_HISTORY_MESSAGES = 20; // keep AI context window reasonable

export const sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const { content } = req.body;
    if (!content && !req.file) {
      return res.status(400).json({ message: "Message content or a file attachment is required" });
    }

    // Handle optional file attachment
    let attachments = [];
    let attachmentContext = "";

    if (req.file) {
      const buffer = await readFileBuffer(req.file);

      try {
        attachmentContext = await extractTextFromFile(buffer, req.file.originalname);
      } catch (parseErr) {
        console.warn("File parse warning:", parseErr.message);
      }

      attachments.push({
        originalName: req.file.originalname,
        url: getFileUrl(req.file),
        key: getFileKey(req.file),
        mimeType: req.file.mimetype,
        size: req.file.size,
        extractedTextPreview: attachmentContext ? attachmentContext.slice(0, 300) : "",
      });
    }

    // Save the user's message
    const userMessage = await Message.create({
      conversation: conversation._id,
      user: req.user._id,
      role: "user",
      content: content || `[Uploaded file: ${req.file?.originalname}]`,
      attachments,
    });

    // Build recent history for context
    const recentMessages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .limit(MAX_HISTORY_MESSAGES);
    const history = recentMessages.reverse().map((m) => ({ role: m.role, content: m.content }));

    // Get AI reply
    const replyText = await getChatCompletion(history, attachmentContext);

    const assistantMessage = await Message.create({
      conversation: conversation._id,
      user: req.user._id,
      role: "assistant",
      content: replyText,
    });

    // Auto-title new conversations from the first message
    if (conversation.title === "New Conversation") {
      conversation.title = (content || req.file?.originalname || "New chat").slice(0, 50);
    }
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({ userMessage, assistantMessage, conversation });
  } catch (err) {
    next(err);
  }
};
