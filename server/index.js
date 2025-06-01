import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

// Environment variables
const MONGO_URI = process.env.MONGODB_URI;

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS
app.use(cors({
    origin: ["https://smart-todo-task-management-frontend.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Cascade-Delete"],
    credentials: true
}));

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
            database: "connected"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Database connection failed",
            timestamp: new Date().toISOString()
        });
    }
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Smart Todo API is running in production",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// Test endpoint
app.get("/api/test", async (req, res) => {
    try {
        await connectDB();
        res.json({
            success: true,
            message: "API and Database working",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Import and use routes only after basic setup
try {
    const userRoutes = await import("./routes/userRoutes.js");
    const taskRoutes = await import("./routes/taskRoutes.js");
    const subtaskRoutes = await import("./routes/subtaskRoutes.js");
    const notificationRoutes = await import("./routes/notificationRoutes.js");
    const reminderRoutes = await import("./routes/reminderRoutes.js");
    const dependencyRoutes = await import("./routes/dependencyRoutes.js");
    const streakRoutes = await import("./routes/streakRoutes.js");
    const noteRoutes = await import("./routes/noteRoutes.js");
    const attachmentRoutes = await import("./routes/attachmentRoutes.js");

    // API Routes
    app.use("/api/users", userRoutes.default);
    app.use("/api/tasks", taskRoutes.default);
    app.use("/api/subtasks", subtaskRoutes.default);
    app.use("/api/notifications", notificationRoutes.default);
    app.use("/api/reminders", reminderRoutes.default);
    app.use("/api/dependencies", dependencyRoutes.default);
    app.use("/api/streaks", streakRoutes.default);
    app.use("/api/notes", noteRoutes.default);
    app.use("/api/attachments", attachmentRoutes.default);
} catch (error) {
    console.error("Route import error:", error);
    
    // Fallback routes
    app.use("/api/*", (req, res) => {
        res.status(503).json({
            success: false,
            message: "Route temporarily unavailable"
        });
    });
}

// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

export default app;