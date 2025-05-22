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

import noteRoutes from "./routes/noteRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
// Export dbEvents for use in controllers
export { dbEvents };

// Improved CORS configuration
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow any origin in development
            return callback(null, true);
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);

// Handle preflight requests explicitly
app.options("*", cors());

// Middleware for JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setup Socket.io AFTER CORS middleware
const io = new Server(server, {
    cors: {
        origin: "*", // In production, limit to your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
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

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        // Remove user from connectedUsers map
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
        io.to(socketId).emit("notification", notification);
        return true;
    }
    return false;
};

// Make io accessible to route handlers
app.set("io", io);
app.set("connectedUsers", connectedUsers);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/SmartTodoApp";

// Connect to MongoDB
mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Add error handler for MongoDB connection
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
});

// Debug route to check if server is running
app.get("/", (req, res) => {
    res.json({ message: "Todo API is running" });
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

app.use("/api", noteRoutes);
app.use("/api", attachmentRoutes);

// Add a global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

// Use server.listen instead of app.listen for Socket.io
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Socket.io running on ws://localhost:${PORT}/socket.io/`);
});

// Handle database changes
dbEvents.on("db_change", (changeData) => {
    // Enhanced notification with icons for different operation types
    let icon = "🔔";
    let type = "info";

    switch (changeData.operation) {
        case "create":
            icon = "✨";
            type = "success";
            break;
        case "update":
            icon = "📝";
            type = "info";
            break;
        case "delete":
            icon = "🗑️";
            type = "error";
            break;
        case "status_change":
            icon = "✅";
            type = "success";
            break;
        case "reminder":
            icon = "⏰";
            type = "reminder";
            break;
    }

    // Emit a single notification event
    io.emit("db_change", {
        operation: changeData.operation,
        message: `${icon} ${changeData.message}`,
        type: type,
    });
});
