import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id }).sort({
      lastMessageAt: -1,
    });
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.create({
      user: req.user._id,
      title: req.body.title || "New Conversation",
    });
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const messages = await Message.find({ conversation: conversation._id }).sort({
      createdAt: 1,
    });

    res.json({ conversation, messages });
  } catch (err) {
    next(err);
  }
};

export const renameConversation = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: title.trim() },
      { returnDocument: "after" }
    );

    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    const messages = await Message.find({ conversation: conversation._id }).sort({
      createdAt: 1,
    });
    res.json({ conversation, messages });
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    await Message.deleteMany({ conversation: conversation._id });
    res.json({ message: "Conversation deleted" });
  } catch (err) {
    next(err);
  }
};
