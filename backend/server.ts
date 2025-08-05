import express, { Application, Request, Response, NextFunction } from "express";

import cors from "cors";

import helmet from "helmet";

import cookieParser from "cookie-parser";

import dotenv from "dotenv";

import { Server } from "http";

import { connectMongoDB } from "./config/mongoDB";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5000",
    credentials: true,
  })
); // Enable CORS with credentials
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to Express 5 TypeScript API!",
    version: "5.1.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    nodejs: process.version,
    express: "5.x",
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handler
process.on("SIGTERM", () => {
  console.log("💀 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("💀 SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server
const server: Server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  connectMongoDB();
});

export default app;
