import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { generatePdfBuffer, generateDocxBuffer } from "../services/documentGenerator.js";
import { generateImage } from "../services/aiService.js";
import { saveGeneratedFile } from "../services/storageService.js";

const attachGeneratedFileToConversation = async ({ conversationId, userId, type, fileMeta, promptLabel }) => {
  const conversation = await Conversation.findOne({ _id: conversationId, user: userId });
  if (!conversation) return null;

  const message = await Message.create({
    conversation: conversationId,
    user: userId,
    role: "assistant",
    content: `Generated ${type.toUpperCase()} file: "${promptLabel}"`,
    generatedFiles: [
      { type, originalName: fileMeta.filename, url: fileMeta.url, key: fileMeta.key },
    ],
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();

  return message;
};

export const generatePdf = async (req, res, next) => {
  try {
    const { title = "Document", content, conversationId } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const buffer = await generatePdfBuffer(title, content);
    const filename = `${title.replace(/\s+/g, "_")}.pdf`;
    const fileMeta = await saveGeneratedFile(buffer, filename, "application/pdf");

    let message = null;
    if (conversationId) {
      message = await attachGeneratedFileToConversation({
        conversationId,
        userId: req.user._id,
        type: "pdf",
        fileMeta,
        promptLabel: title,
      });
    }

    res.status(201).json({ file: fileMeta, message });
  } catch (err) {
    next(err);
  }
};

export const generateDocx = async (req, res, next) => {
  try {
    const { title = "Document", content, conversationId } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const buffer = await generateDocxBuffer(title, content);
    const filename = `${title.replace(/\s+/g, "_")}.docx`;
    const fileMeta = await saveGeneratedFile(
      buffer,
      filename,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    let message = null;
    if (conversationId) {
      message = await attachGeneratedFileToConversation({
        conversationId,
        userId: req.user._id,
        type: "docx",
        fileMeta,
        promptLabel: title,
      });
    }

    res.status(201).json({ file: fileMeta, message });
  } catch (err) {
    next(err);
  }
};

export const generateImageFile = async (req, res, next) => {
  try {
    const { prompt, conversationId } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    const buffer = await generateImage(prompt);
    const filename = `${Date.now()}.png`;
    const fileMeta = await saveGeneratedFile(buffer, filename, "image/png");

    let message = null;
    if (conversationId) {
      message = await attachGeneratedFileToConversation({
        conversationId,
        userId: req.user._id,
        type: "image",
        fileMeta,
        promptLabel: prompt,
      });
    }

    res.status(201).json({ file: fileMeta, message });
  } catch (err) {
    next(err);
  }
};
