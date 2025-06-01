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

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
export { dbEvents };

// Environment variables with fallbacks
const FRONTEND_URL = process.env.FRONTEND_URL || "https://smart-todo-task-management-frontend.vercel.app";
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Validate required environment variables
if (!MONGO_URI) {
    console.error("❌ MONGODB_URI is not set");
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET is not set");
    process.exit(1);
}
if (!GOOGLE_CLIENT_ID) {
    console.error("❌ GOOGLE_CLIENT_ID is not set");
    process.exit(1);
}

// Middleware for JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS configuration
app.use(
    cors({
        origin: [FRONTEND_URL, "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Cascade-Delete"],
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

// Set environment variables for use in other files
process.env.JWT_SECRET = JWT_SECRET;
process.env.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;

// MongoDB connection with caching for serverless
let cachedConnection = null;

const connectToDatabase = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log("Using cached database connection");
        return cachedConnection;
    }

    try {
        console.log("Creating new database connection");
        cachedConnection = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            retryWrites: true,
            w: "majority",
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ Connected to MongoDB");
        return cachedConnection;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
};

// Middleware to ensure database connection
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});

// Add health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Smart Todo API is running",
        timestamp: new Date().toISOString(),
    });
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

// Enhanced error handling
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});

// Export the Express app for Vercel
export default app;

// Only start the server if not in a serverless environment
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    connectToDatabase()
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
