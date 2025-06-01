import express from "express";
import mongoose from "mongoose";
import cors from "cors";
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

// Environment variables with fallbacks
const FRONTEND_URL = process.env.FRONTEND_URL || "https://smart-todo-task-management-frontend.vercel.app";
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Validate required environment variables
if (!MONGO_URI) {
    console.error("❌ MONGODB_URI is not set");
    // Don't exit in serverless environment, let it fail gracefully
}
if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET is not set");
}
if (!GOOGLE_CLIENT_ID) {
    console.error("❌ GOOGLE_CLIENT_ID is not set");
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

// Set environment variables for use in other files
if (JWT_SECRET) process.env.JWT_SECRET = JWT_SECRET;
if (GOOGLE_CLIENT_ID) process.env.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;

// MongoDB connection with enhanced caching for serverless
let cachedConnection = null;
let connectionPromise = null;

const connectToDatabase = async () => {
    // If we already have a cached connection and it's ready, use it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log("Using cached database connection");
        return cachedConnection;
    }

    // If there's already a connection attempt in progress, wait for it
    if (connectionPromise) {
        console.log("Waiting for existing connection attempt");
        return connectionPromise;
    }

    // If connection exists but not ready, wait for it
    if (mongoose.connection.readyState === 2) {
        console.log("Connection in progress, waiting...");
        return new Promise((resolve, reject) => {
            mongoose.connection.once("connected", () => resolve(cachedConnection));
            mongoose.connection.once("error", reject);
        });
    }

    try {
        console.log("Creating new database connection");

        // Create the connection promise
        connectionPromise = mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Increased timeout
            socketTimeoutMS: 45000,
            maxPoolSize: 5, // Reduced for serverless
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            bufferCommands: false, // Disable mongoose buffering
            bufferMaxEntries: 0,
        });

        cachedConnection = await connectionPromise;
        console.log("✅ Connected to MongoDB");

        // Clear the promise after successful connection
        connectionPromise = null;

        return cachedConnection;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        connectionPromise = null; // Clear failed promise
        cachedConnection = null; // Clear failed connection
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
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
        });
    }
});

// Add health check endpoint
app.get("/health", (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };

    res.status(200).json({
        status: "ok",
        message: "Smart Todo API is running in production",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: {
            status: dbStatusText[dbStatus] || "unknown",
            readyState: dbStatus,
        },
        version: "1.0.0",
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Smart Todo API is running in production",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        endpoints: {
            health: "/health",
            api: {
                users: "/api/users",
                tasks: "/api/tasks",
                subtasks: "/api/subtasks",
                notifications: "/api/notifications",
                reminders: "/api/reminders",
                dependencies: "/api/dependencies",
                streaks: "/api/streaks",
                notes: "/api/notes",
                attachments: "/api/attachments",
            },
        },
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
    console.error("Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        availableRoutes: [
            "/",
            "/health",
            "/api/users",
            "/api/tasks",
            "/api/subtasks",
            "/api/notifications",
            "/api/reminders",
            "/api/dependencies",
            "/api/streaks",
            "/api/notes",
            "/api/attachments",
        ],
    });
});

// Error handling for unhandled rejections (with better logging)
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});

// Graceful shutdown for serverless
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing database connection...");
    try {
        await mongoose.connection.close();
        console.log("Database connection closed.");
    } catch (error) {
        console.error("Error closing database connection:", error);
    }
});

// Export the Express app for Vercel
export default app;
