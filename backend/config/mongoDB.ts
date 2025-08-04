import mongoose from "mongoose";

export const connectMongoDB = async () => {
  try {
    const dbURI: string =
      process.env.MONGO_URI ||
      "mongodb://root:example@localhost:27017/twitter-db";
    await mongoose.connect(dbURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
