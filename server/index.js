import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";
import { EventEmitter } from "events";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import subtaskRoutes from "./routes/subtaskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import dependencyRoutes from "./routes/dependencyRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
// Export dbEvents for use in controllers
export { dbEvents };

// Environment variables with fallbacks
const FRONTEND_URL = process.env.FRONTEND_URL || "smart-todo-task-management-frontend.vercel.app";
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Validate required environment variables
if (!MONGO_URI) throw new Error("MONGODB_URI is required");
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");
if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is required");

// Middleware for JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS configuration
app.use(
    cors({
        origin: FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);

// Handle preflight requests explicitly
app.options("*", cors());

// Socket.io configuration
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
    transports: ["websocket", "polling"],
    path: "/socket.io/",
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handler
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // User authentication
    socket.on("authenticate", (userId) => {
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        connectedUsers.set(userId, socket.id);
    });

    // Handle notification events
    socket.on("notificationCreated", (notification) => {
        io.emit("notification", notification);
    });

    socket.on("notificationDeleted", (notificationId) => {
        io.emit("notificationUpdate", {
            type: "delete",
            notificationId,
        });
    });

    socket.on("notificationsCleared", () => {
        io.emit("notificationUpdate", {
            type: "clearAll",
        });
    });

    socket.on("notificationsMarkedAsRead", () => {
        io.emit("notificationUpdate", {
            type: "markAllRead",
        });
    });

    // Handle dependency events
    socket.on("dependencyCreated", (dependency) => {
        io.emit("dependency", dependency);
    });

    socket.on("dependencyDeleted", (dependencyId) => {
        io.emit("dependencyUpdate", {
            type: "delete",
            dependencyId,
        });
    });

    // Handle disconnect
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

// Helper function to send notifications through socket
io.sendNotification = (userId, notification) => {
    if (connectedUsers.has(userId.toString())) {
        const socketId = connectedUsers.get(userId.toString());
        io.to(socketId).emit("notificationCreated", notification);
        return true;
    } else {
        io.emit("notificationCreated", notification);
    }
    return false;
};

// Make io accessible to route handlers
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// Set environment variables for use in other files
process.env.JWT_SECRET = JWT_SECRET;
process.env.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : {},
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
        });
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        console.log("🔄 Retrying connection in 5 seconds...");
        setTimeout(connectWithRetry, 5000);
    }
};

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

// Start server
const PORT = process.env.PORT || 5000;
connectWithRetry().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err);
    // Don't crash the server, but log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    // Give time for logging before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
