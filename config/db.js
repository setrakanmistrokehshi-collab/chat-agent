import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Check if the URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connected`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // Stop the app if DB connection fails
  }
};