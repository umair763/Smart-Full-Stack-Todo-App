import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { EventEmitter } from "events";
import dotenv from "dotenv";

// Import and use routes
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import subtaskRoutes from "./routes/subtaskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import dependencyRoutes from "./routes/dependencyRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
export { dbEvents };

// Environment variables
const MONGO_URI = process.env.MONGODB_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://smart-todo-task-management-frontend.vercel.app";

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS
app.use(
    cors({
        origin: [FRONTEND_URL, "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Cascade-Delete"],
        credentials: true,
    })
);

// Socket.io configuration
const io = new Server(server, {
    cors: {
        origin: [FRONTEND_URL, "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
    transports: ["websocket", "polling"],
    path: "/socket.io/",
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handler
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("authenticate", (userId) => {
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        connectedUsers.set(userId, socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

// Make io accessible to route handlers
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// MongoDB connection cache
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false,
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
}

// Health check
app.get("/health", async (req, res) => {
    try {
        await connectDB();
        res.json({
            status: "ok",
            message: "Smart Todo API is running in production",
            timestamp: new Date().toISOString(),
            database: "connected",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Database connection failed",
            timestamp: new Date().toISOString(),
        });
    }
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Smart Todo API is running in production",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});

// Test endpoint
app.get("/api/test", async (req, res) => {
    try {
        await connectDB();
        res.json({
            success: true,
            message: "API and Database working",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/subtasks", subtaskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/dependencies", dependencyRoutes);
app.use("/api/streaks", streakRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/attachments", attachmentRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Error handling for unhandled rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});

export default app;

// Only start the server if not in a serverless environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    connectDB()
        .then(() => {
            server.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
            });
        })
        .catch((error) => {
            console.error("Failed to start server:", error);
            process.exit(1);
        });
}
