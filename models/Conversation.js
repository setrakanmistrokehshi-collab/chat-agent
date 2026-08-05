import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Conversation", trim: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
