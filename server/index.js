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

// Improved CORS configuration for production
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "https://smart-todo-task-management-frontend.vercel.app",
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

// MongoDB Configuration with better error handling
const MONGO_URI = process.env.MONGO_URI;

// Debug logging
console.log("Environment variables check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI exists:", !!MONGO_URI);
console.log("MONGO_URI (masked):", MONGO_URI ? MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") : "undefined");

if (!MONGO_URI) {
    console.error("MONGO_URI environment variable is required");
}

// Global connection state
let isConnected = false;
let connectionPromise = null;

// MongoDB connection with retry logic and better error handling
const connectDB = async () => {
    // If already connected, return
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log("Already connected to MongoDB");
        return true;
    }

    // If connection is in progress, wait for it
    if (connectionPromise) {
        console.log("Connection in progress, waiting...");
        return await connectionPromise;
    }

    if (!MONGO_URI) {
        console.error("MongoDB URI not provided");
        return false;
    }

    console.log("Attempting to connect to MongoDB...");

    connectionPromise = (async () => {
        try {
            // Close any existing connections
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect();
            }

            await mongoose.connect(MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000, // Increased timeout for serverless
                socketTimeoutMS: 45000,
                maxPoolSize: 5, // Reduced for serverless
                bufferCommands: false,
                bufferMaxEntries: 0,
                // Additional options for better reliability
                connectTimeoutMS: 10000,
                family: 4, // Use IPv4, skip trying IPv6
            });

            isConnected = true;
            console.log("✅ MongoDB connected successfully");
            return true;
        } catch (err) {
            console.error("❌ MongoDB connection error:", err.message);
            console.error("Full error:", err);
            isConnected = false;
            return false;
        } finally {
            connectionPromise = null;
        }
    })();

    return await connectionPromise;
};

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
    isConnected = true;
    console.log("MongoDB connected event fired");
});

mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error event:", err);
    isConnected = false;
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected event fired");
    isConnected = false;
});

// Middleware to ensure database connection
const ensureDBConnection = async (req, res, next) => {
    console.log("Ensuring DB connection for:", req.path);

    if (!isConnected) {
        console.log("Database not connected, attempting connection...");
        const connected = await connectDB();
        if (!connected) {
            return res.status(500).json({
                success: false,
                message: "Database connection failed",
                error: "Unable to connect to MongoDB",
            });
        }
    }
    next();
};

// Socket.io setup (only in non-serverless environment)
let server;
let io;
let connectedUsers = new Map();

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless && (process.env.NODE_ENV !== "production" || process.env.ENABLE_SOCKET === "true")) {
    try {
        server = http.createServer(app);
        io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "https://smart-todo-task-management-frontend.vercel.app",
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
    } catch (error) {
        console.error("Socket.io setup error:", error);
    }
}

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
export { dbEvents };

// Health check route with detailed diagnostics
app.get("/", async (req, res) => {
    try {
        console.log("Health check requested");

        // Attempt to connect if not connected
        let dbStatus = "disconnected";
        let dbError = null;

        if (!isConnected) {
            console.log("Attempting DB connection for health check...");
            const connected = await connectDB();
            if (connected) {
                dbStatus = "connected";
            } else {
                dbError = "Connection failed";
            }
        } else {
            dbStatus = "connected";
        }

        // Test a simple database operation if connected
        let dbTest = null;
        if (isConnected) {
            try {
                await mongoose.connection.db.admin().ping();
                dbTest = "ping successful";
            } catch (pingError) {
                dbTest = `ping failed: ${pingError.message}`;
                dbStatus = "connection unstable";
            }
        }

        res.json({
            success: true,
            message: "Smart Todo API is running in production",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            database: dbStatus,
            dbTest,
            dbError,
            environment: process.env.NODE_ENV || "development",
            isServerless,
            mongoReadyState: mongoose.connection.readyState,
            // Ready state meanings: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        });
    } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({
            success: false,
            message: "Health check failed",
            error: error.message,
            database: "error",
        });
    }
});

// MongoDB connection test route
app.get("/test-db", async (req, res) => {
    try {
        console.log("Database test requested");

        const connected = await connectDB();

        if (!connected) {
            return res.status(500).json({
                success: false,
                message: "Failed to connect to database",
                connectionState: mongoose.connection.readyState,
            });
        }

        // Test database operations
        const dbName = mongoose.connection.db.databaseName;
        const collections = await mongoose.connection.db.listCollections().toArray();

        res.json({
            success: true,
            message: "Database connection successful",
            database: dbName,
            collections: collections.map((c) => c.name),
            connectionState: mongoose.connection.readyState,
        });
    } catch (error) {
        console.error("Database test error:", error);
        res.status(500).json({
            success: false,
            message: "Database test failed",
            error: error.message,
            connectionState: mongoose.connection.readyState,
        });
    }
});

// Debug route for Socket.io (only if socket is available)
app.get("/socket-check", (req, res) => {
    if (io) {
        res.json({
            message: "Socket.io is running",
            connectedClients: io.engine.clientsCount,
            connectedUsers: [...connectedUsers.entries()].map(([userId, socketId]) => ({ userId, socketId })),
        });
    } else {
        res.json({
            message: "Socket.io is not available in serverless environment",
            serverless: isServerless,
        });
    }
});

// Debug route to check routes
app.get("/api/debug", (req, res) => {
    res.json({
        message: "API Debug Route",
        environment: {
            nodeEnv: process.env.NODE_ENV,
            isServerless,
            hasSocket: !!io,
            dbConnected: isConnected,
            mongoReadyState: mongoose.connection.readyState,
        },
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
        },
    });
});

// Apply DB connection middleware to API routes
app.use("/api", ensureDBConnection);

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

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);

    const isDevelopment = process.env.NODE_ENV !== "production";

    res.status(err.status || 500).json({
        success: false,
        message: isDevelopment ? err.message : "Internal server error",
        ...(isDevelopment && {
            error: err.message,
            stack: err.stack,
        }),
    });
});

// Initialize database connection (don't wait for it in serverless)
if (MONGO_URI) {
    console.log("Initializing database connection...");
    connectDB().catch((err) => {
        console.error("Initial DB connection failed:", err);
    });
}

// Export the Express app for Vercel serverless
export default app;

// Only start the server in development or when explicitly enabled
if (!isServerless && (process.env.NODE_ENV !== "production" || process.env.ENABLE_SOCKET === "true")) {
    const PORT = process.env.PORT || 3000;
    if (server) {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } else {
        app.listen(PORT, () => {
            console.log(`Express server running on port ${PORT}`);
        });
    }
}
