import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    originalName: String,
    url: String,
    key: String,
    mimeType: String,
    size: Number,
    extractedTextPreview: String, // short preview of parsed content, for UI display
  },
  { _id: false }
);

const generatedFileSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["pdf", "docx", "image"] },
    originalName: String,
    url: String,
    key: String,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
    generatedFiles: { type: [generatedFileSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
