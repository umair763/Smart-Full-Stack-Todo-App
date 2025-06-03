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

dotenv.config();

const app = express();

// Improved CORS configuration for production
app.use(
    cors({
        origin: "https://smart-todo-task-management-frontend.vercel.app",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);

// Handle preflight requests explicitly
app.options("*", cors());

// Middleware for JSON with reasonable limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// MongoDB Configuration
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is required");
}

// MongoDB connection with retry logic
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Reduced timeout for serverless
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        // Don't throw error, let the function continue
        // The connection will be retried on next request
    }
};

// Initial connection
connectDB();

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
});

// Only create HTTP server and Socket.io in non-serverless environment
let server;
let io;
let connectedUsers = new Map();

if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SOCKET === "true") {
    server = http.createServer(app);
    io = new Server(server, {
        cors: {
            origin: "https://smart-todo-task-management-frontend.vercel.app",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        },
        transports: ["websocket", "polling"],
        path: "/socket.io/",
    });

    // Socket.io connection handler
    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("authenticate", (userId) => {
            console.log(`User ${userId} authenticated with socket ${socket.id}`);
            connectedUsers.set(userId, socket.id);
        });

        // Handle notification events
        socket.on("notificationCreated", (notification) => {
            // Broadcast to all connected clients
            io.emit("notification", notification);
        });

        socket.on("notificationDeleted", (notificationId) => {
            // Broadcast to all connected clients
            io.emit("notificationUpdate", {
                type: "delete",
                notificationId,
            });
        });

        socket.on("notificationsCleared", () => {
            // Broadcast to all connected clients
            io.emit("notificationUpdate", {
                type: "clearAll",
            });
        });

        socket.on("notificationsMarkedAsRead", () => {
            // Broadcast to all connected clients
            io.emit("notificationUpdate", {
                type: "markAllRead",
            });
        });

        // Handle dependency events
        socket.on("dependencyCreated", (dependency) => {
            // Broadcast to all connected clients
            io.emit("dependency", dependency);
        });

        socket.on("dependencyDeleted", (dependencyId) => {
            // Broadcast to all connected clients
            io.emit("dependencyUpdate", {
                type: "delete",
                dependencyId,
            });
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
}

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
export { dbEvents };

// Debug route to check if server is running
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Smart Todo API is running in production",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});

// Debug route for Socket.io
app.get("/socket-check", (req, res) => {
    res.json({
        message: "Socket.io is running",
        connectedClients: io.engine.clientsCount,
        connectedUsers: [...connectedUsers.entries()].map(([userId, socketId]) => ({ userId, socketId })),
    });
});

// Debug route to check routes
app.get("/api/debug", (req, res) => {
    res.json({
        message: "API Debug Route",
        routes: {
            users: [
                { method: "POST", path: "/api/users/google-signin" },
                { method: "POST", path: "/api/users/register" },
                { method: "POST", path: "/api/users/login" },
                { method: "GET", path: "/api/users/profile" },
                { method: "POST", path: "/api/users/update-username" },
                { method: "POST", path: "/api/users/update-profile-image" },
                { method: "DELETE", path: "/api/users/delete-account" },
            ],
            tasks: [
                { method: "GET", path: "/api/tasks" },
                { method: "POST", path: "/api/tasks" },
                { method: "PUT", path: "/api/tasks/:id" },
                { method: "DELETE", path: "/api/tasks/:id" },
                { method: "GET", path: "/api/tasks/stats" },
                { method: "PATCH", path: "/api/tasks/:id/status" },
            ],
            subtasks: [
                { method: "GET", path: "/api/tasks/:taskId/subtasks" },
                { method: "POST", path: "/api/tasks/:taskId/subtasks" },
                { method: "PUT", path: "/api/subtasks/:subtaskId" },
                { method: "DELETE", path: "/api/subtasks/:subtaskId" },
                { method: "PATCH", path: "/api/subtasks/:subtaskId/status" },
            ],
            dependencies: [
                { method: "GET", path: "/api/dependencies" },
                { method: "GET", path: "/api/dependencies/task/:taskId" },
                { method: "POST", path: "/api/dependencies" },
                { method: "PUT", path: "/api/dependencies/:id" },
                { method: "DELETE", path: "/api/dependencies/:id" },
                { method: "POST", path: "/api/dependencies/validate" },
            ],
            streaks: [
                { method: "GET", path: "/api/streaks" },
                { method: "GET", path: "/api/streaks/analytics" },
                { method: "POST", path: "/api/streaks/update" },
                { method: "GET", path: "/api/streaks/history" },
            ],
            sockets: [
                { event: "connection", description: "New client connected" },
                { event: "authenticate", description: "Authenticate user with socket" },
                { event: "disconnect", description: "Client disconnected" },
                { event: "taskCreated", description: "Task created notification" },
                { event: "taskUpdated", description: "Task updated notification" },
                { event: "taskDeleted", description: "Task deleted notification" },
                { event: "taskStatusChanged", description: "Task status changed notification" },
                { event: "subtaskCreated", description: "Subtask created notification" },
                { event: "subtaskUpdated", description: "Subtask updated notification" },
                { event: "subtaskDeleted", description: "Subtask deleted notification" },
                { event: "subtaskStatusChanged", description: "Subtask status changed notification" },
                { event: "dependencyCreated", description: "Dependency created notification" },
                { event: "dependencyDeleted", description: "Dependency deleted notification" },
            ],
        },
    });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", subtaskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/dependencies", dependencyRoutes);
app.use("/api/streaks", streakRoutes);

app.use("/api", noteRoutes);
app.use("/api", attachmentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
        error: process.env.NODE_ENV === "production" ? undefined : err,
    });
});

// Export the Express app for Vercel serverless
export default app;

// Only start the server in development or when explicitly enabled
if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SOCKET === "true") {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
