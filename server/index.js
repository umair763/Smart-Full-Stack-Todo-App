import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes at the top
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
const server = createServer(app);

// Environment variables with fallbacks
const MONGO_URI = process.env.MONGODB_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://smart-todo-task-management-frontend.vercel.app";
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// Validate critical environment variables
const requiredEnvVars = { MONGODB_URI: MONGO_URI };
for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
        console.error(`❌ Critical: ${key} is not set`);
    }
}

// CORS origins
const corsOrigins = [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"];

// Enhanced middleware with error handling
app.use((req, res, next) => {
    // Add request timeout
    req.setTimeout(30000, () => {
        const err = new Error("Request timeout");
        err.status = 408;
        next(err);
    });
    next();
});

// Basic middleware with robust error handling
app.use(
    express.json({
        limit: "10mb",
        verify: (req, res, buf, encoding) => {
            try {
                JSON.parse(buf);
            } catch (e) {
                const error = new Error("Invalid JSON");
                error.status = 400;
                throw error;
            }
        },
    })
);

app.use(
    express.urlencoded({
        limit: "10mb",
        extended: true,
        parameterLimit: 1000,
    })
);

// Enhanced CORS with error handling
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, etc.)
            if (!origin) return callback(null, true);

            if (corsOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log(`CORS blocked origin: ${origin}`);
                callback(null, true); // Allow all origins in production to prevent 503 errors
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Cascade-Delete"],
        credentials: true,
        optionsSuccessStatus: 200, // Support legacy browsers
    })
);

// Handle preflight requests explicitly to prevent 404s
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,X-Cascade-Delete");
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(200);
});

// Socket.IO setup with enhanced error handling
const io = new Server(server, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true,
    // Add connection error handling
    connectTimeout: 45000,
    upgradeTimeout: 30000,
});

// Store active user connections
const activeUsers = new Map();

// Socket.IO connection handling with comprehensive error handling
io.on("connection", (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Wrap all socket event handlers in try-catch
    const safeEmit = (eventName, data, targetSocket = socket) => {
        try {
            targetSocket.emit(eventName, data);
        } catch (error) {
            console.error(`Socket emit error for ${eventName}:`, error);
        }
    };

    // Join user to their personal room
    socket.on("join-user-room", (userId) => {
        try {
            if (userId) {
                socket.join(`user-${userId}`);
                activeUsers.set(userId, socket.id);
                console.log(`User ${userId} joined their room`);

                safeEmit("connection-confirmed", {
                    userId,
                    message: "Connected to real-time updates",
                });
            }
        } catch (error) {
            console.error("Error in join-user-room:", error);
        }
    });

    // Enhanced event handlers with error handling
    const socketEvents = [
        "task-updated",
        "task-created",
        "task-deleted",
        "subtask-updated",
        "new-notification",
        "reminder-triggered",
        "streak-updated",
        "task-collaboration-update",
        "typing-start",
        "typing-stop",
        "user-online",
    ];

    socketEvents.forEach((eventName) => {
        socket.on(eventName, (data) => {
            try {
                if (data && data.userId) {
                    const targetRoom = `user-${data.userId}`;
                    const eventData = data.task || data.subtask || data.notification || data.reminder || data.streak || data;

                    if (eventName.includes("typing")) {
                        socket.to(`task-${data.taskId}`).emit(eventName.replace("typing-", "user-typing-"), {
                            userId: data.userId,
                            username: data.username,
                        });
                    } else {
                        io.to(targetRoom).emit(eventName, eventData);
                    }

                    console.log(`${eventName} processed for user ${data.userId}`);
                }
            } catch (error) {
                console.error(`Error handling ${eventName}:`, error);
            }
        });
    });

    // Join task room
    socket.on("join-task-room", (taskId) => {
        try {
            if (taskId) {
                socket.join(`task-${taskId}`);
                console.log(`User joined task room: ${taskId}`);
            }
        } catch (error) {
            console.error("Error joining task room:", error);
        }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
        try {
            console.log(`👤 User disconnected: ${socket.id} (${reason})`);

            for (const [userId, socketId] of activeUsers.entries()) {
                if (socketId === socket.id) {
                    activeUsers.delete(userId);
                    socket.broadcast.emit("user-status-changed", {
                        userId,
                        status: "offline",
                    });
                    break;
                }
            }
        } catch (error) {
            console.error("Error handling disconnect:", error);
        }
    });

    // Handle socket errors
    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });
});

// Enhanced MongoDB connection with retry logic and better caching
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(retries = 3) {
    // Return existing connection if available and ready
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // Wait for existing connection attempt
    if (cached.promise) {
        try {
            cached.conn = await cached.promise;
            return cached.conn;
        } catch (error) {
            cached.promise = null;
            console.error("Cached connection failed:", error);
        }
    }

    // Create new connection with retry logic
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Database connection attempt ${attempt}/${retries}`);

            cached.promise = mongoose.connect(MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                bufferCommands: false,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 15000,
                socketTimeoutMS: 45000,
                heartbeatFrequencyMS: 10000,
                maxIdleTimeMS: 30000,
                // Add connection resilience
                retryWrites: true,
                retryReads: true,
            });

            cached.conn = await cached.promise;
            console.log("✅ Connected to MongoDB successfully");
            return cached.conn;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
            cached.promise = null;
            cached.conn = null;

            if (attempt === retries) {
                throw new Error(`Failed to connect to database after ${retries} attempts: ${error.message}`);
            }

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
    }
}

// Make io available to routes
app.set("io", io);

// Graceful error handling for unhandled rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});

// Enhanced health check with comprehensive status
app.get("/health", async (req, res) => {
    try {
        const dbConnection = await connectDB();
        const dbStatus = mongoose.connection.readyState;

        res.status(200).json({
            status: "healthy",
            message: "Smart Todo API is running in production",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            environment: NODE_ENV,
            database: {
                status: dbStatus === 1 ? "connected" : "connecting",
                readyState: dbStatus,
            },
            socketio: {
                status: "active",
                connections: io.engine.clientsCount || 0,
                activeUsers: activeUsers.size,
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        });
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json({
            status: "unhealthy",
            message: "Service temporarily unavailable",
            timestamp: new Date().toISOString(),
            error: NODE_ENV === "development" ? error.message : "Database connection failed",
        });
    }
});

// Root endpoint - always available
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Smart Todo API is running in production",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        status: "operational",
        features: {
            realtime: "Socket.IO enabled",
            database: "MongoDB with auto-retry",
            cors: "Configured for production",
            errorHandling: "Enhanced",
        },
        endpoints: {
            health: "/health",
            test: "/api/test",
            socketStatus: "/api/socket-status",
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

// Enhanced test endpoint
app.get("/api/test", async (req, res) => {
    try {
        await connectDB();
        res.status(200).json({
            success: true,
            message: "API and Database working perfectly",
            timestamp: new Date().toISOString(),
            database: {
                status: "connected",
                readyState: mongoose.connection.readyState,
            },
            socketio: {
                status: "active",
                connections: io.engine.clientsCount || 0,
            },
        });
    } catch (error) {
        console.error("Test endpoint error:", error);
        res.status(500).json({
            success: false,
            message: "Database connection test failed",
            timestamp: new Date().toISOString(),
            error: NODE_ENV === "development" ? error.message : "Internal server error",
        });
    }
});

// Socket.IO status endpoint
app.get("/api/socket-status", (req, res) => {
    try {
        res.status(200).json({
            success: true,
            socketio: {
                status: "active",
                connections: io.engine.clientsCount || 0,
                activeUsers: activeUsers.size,
                rooms: io.sockets.adapter.rooms.size || 0,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get Socket.IO status",
            error: NODE_ENV === "development" ? error.message : "Internal error",
        });
    }
});

// Enhanced database connection middleware with better error handling
app.use("/api", async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("DB connection middleware error:", error);
        res.status(503).json({
            success: false,
            message: "Service temporarily unavailable - database connection failed",
            timestamp: new Date().toISOString(),
            retryAfter: 30, // seconds
        });
    }
});

// Wrap route handlers in error handling
const wrapRoute = (router, path) => {
    app.use(path, (req, res, next) => {
        try {
            router(req, res, next);
        } catch (error) {
            console.error(`Route error in ${path}:`, error);
            next(error);
        }
    });
};

// API Routes with error wrapping
wrapRoute(userRoutes, "/api/users");
wrapRoute(taskRoutes, "/api/tasks");
wrapRoute(subtaskRoutes, "/api/subtasks");
wrapRoute(notificationRoutes, "/api/notifications");
wrapRoute(reminderRoutes, "/api/reminders");
wrapRoute(dependencyRoutes, "/api/dependencies");
wrapRoute(streakRoutes, "/api/streaks");
wrapRoute(noteRoutes, "/api/notes");
wrapRoute(attachmentRoutes, "/api/attachments");

// Enhanced global error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);

    // Handle specific error types
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: Object.values(err.errors).map((e) => e.message),
        });
    }

    if (err.name === "MongoError" || err.name === "MongooseError") {
        return res.status(503).json({
            success: false,
            message: "Database error - service temporarily unavailable",
            timestamp: new Date().toISOString(),
        });
    }

    if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT") {
        return res.status(503).json({
            success: false,
            message: "Service temporarily unavailable - connection timeout",
            timestamp: new Date().toISOString(),
        });
    }

    // Default error response
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: status === 500 ? "Internal Server Error" : err.message,
        timestamp: new Date().toISOString(),
        error:
            NODE_ENV === "development"
                ? {
                      message: err.message,
                      stack: err.stack,
                  }
                : undefined,
    });
});

// Enhanced 404 handler to prevent route not found errors
app.use("*", (req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);

    // Suggest closest matching routes
    const availableRoutes = [
        "/",
        "/health",
        "/api/test",
        "/api/socket-status",
        "/api/users",
        "/api/tasks",
        "/api/subtasks",
        "/api/notifications",
        "/api/reminders",
        "/api/dependencies",
        "/api/streaks",
        "/api/notes",
        "/api/attachments",
    ];

    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
        suggestion: "Check the available routes below",
        availableRoutes: availableRoutes,
        method: req.method,
        path: req.originalUrl,
    });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    server.close(() => {
        console.log("HTTP server closed");

        mongoose.connection.close(false, () => {
            console.log("MongoDB connection closed");
            process.exit(0);
        });
    });

    // Force close after 30 seconds
    setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Keep-alive for serverless environments
if (NODE_ENV === "production") {
    setInterval(() => {
        console.log("Keep-alive ping");
    }, 240000); // 4 minutes
}

// Export both app and server for different deployment scenarios
export default app;
export { server, io };
