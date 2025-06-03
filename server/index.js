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

// Debug logging (remove sensitive info)
console.log("Environment variables check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGO_URI exists:", !!MONGO_URI);
console.log("VERCEL:", process.env.VERCEL);

if (!MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is required");
    process.exit(1);
}

// Global connection state
let isConnected = false;
let connectionPromise = null;

// MongoDB connection with improved serverless handling
const connectDB = async () => {
    // If already connected and connection is stable, return
    if (isConnected && mongoose.connection.readyState === 1) {
        try {
            // Quick ping to verify connection is still alive
            await mongoose.connection.db.admin().ping();
            console.log("✅ Using existing MongoDB connection");
            return true;
        } catch (pingError) {
            console.log("⚠️ Existing connection failed ping, reconnecting...");
            isConnected = false;
        }
    }

    // If connection is in progress, wait for it
    if (connectionPromise) {
        console.log("⏳ Connection in progress, waiting...");
        return await connectionPromise;
    }

    console.log("🔄 Attempting to connect to MongoDB...");

    connectionPromise = (async () => {
        try {
            // Disconnect any existing connections
            if (mongoose.connection.readyState !== 0) {
                console.log("🔌 Closing existing connection...");
                await mongoose.disconnect();
            }

            // Serverless-optimized connection options
            const connectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 15000, // Increased for serverless cold starts
                socketTimeoutMS: 45000,
                connectTimeoutMS: 15000,
                maxPoolSize: 1, // Minimal pool for serverless
                minPoolSize: 0,
                maxIdleTimeMS: 30000,
                bufferCommands: false,
                // REMOVED: bufferMaxEntries: 0, - This is deprecated
                family: 4, // Force IPv4
                // Additional serverless optimizations
                retryWrites: true,
                retryReads: true,
                authSource: "admin",
            };

            await mongoose.connect(MONGO_URI, connectionOptions);

            // Verify connection with a ping
            await mongoose.connection.db.admin().ping();

            isConnected = true;
            console.log("✅ MongoDB connected successfully");
            console.log("📊 Database:", mongoose.connection.db.databaseName);

            return true;
        } catch (err) {
            console.error("❌ MongoDB connection error:", err.message);

            // Log specific error types for debugging
            if (err.name === "MongoServerSelectionError") {
                console.error("🔍 Server selection failed - check network connectivity and URI");
            } else if (err.name === "MongoAuthenticationError") {
                console.error("🔐 Authentication failed - check credentials");
            } else if (err.name === "MongoNetworkError") {
                console.error("🌐 Network error - check internet connection");
            }

            isConnected = false;
            throw err;
        } finally {
            connectionPromise = null;
        }
    })();

    return await connectionPromise;
};

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
    isConnected = true;
    console.log("🟢 MongoDB connected event fired");
});

mongoose.connection.on("error", (err) => {
    console.error("🔴 MongoDB connection error event:", err.message);
    isConnected = false;
});

mongoose.connection.on("disconnected", () => {
    console.warn("🟡 MongoDB disconnected event fired");
    isConnected = false;
});

// Handle process termination
process.on("SIGINT", async () => {
    console.log("🛑 Received SIGINT, closing MongoDB connection...");
    await mongoose.connection.close();
    process.exit(0);
});

// Middleware to ensure database connection with retry logic
const ensureDBConnection = async (req, res, next) => {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            if (!isConnected || mongoose.connection.readyState !== 1) {
                console.log(`🔄 Database not connected, attempt ${retries + 1}/${maxRetries} for: ${req.path}`);
                const connected = await connectDB();

                if (!connected) {
                    throw new Error("Connection failed");
                }
            }

            // Verify connection is working
            await mongoose.connection.db.admin().ping();
            return next();
        } catch (error) {
            retries++;
            console.error(`❌ DB connection attempt ${retries} failed:`, error.message);

            if (retries >= maxRetries) {
                console.error("🚫 Max connection retries exceeded");
                return res.status(503).json({
                    success: false,
                    message: "Database temporarily unavailable",
                    error: "Connection failed after multiple attempts",
                    retries: retries,
                });
            }

            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
        }
    }
};

// Socket.io setup (only in non-serverless environment)
let server;
let io;
let connectedUsers = new Map();

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);

if (!isServerless) {
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
            console.log("🔌 New client connected:", socket.id);

            socket.on("authenticate", (userId) => {
                console.log(`👤 User ${userId} authenticated with socket ${socket.id}`);
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
                console.log("🔌 Client disconnected:", socket.id);
                for (const [userId, socketId] of connectedUsers.entries()) {
                    if (socketId === socket.id) {
                        connectedUsers.delete(userId);
                        console.log(`👤 User ${userId} disconnected`);
                        break;
                    }
                }
            });
        });

        // Make io accessible to route handlers
        app.set("io", io);
        app.set("connectedUsers", connectedUsers);
        console.log("🌐 Socket.io initialized successfully");
    } catch (error) {
        console.error("❌ Socket.io setup error:", error);
    }
} else {
    console.log("☁️ Running in serverless mode - Socket.io disabled");
}

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
export { dbEvents };

// Health check route with comprehensive diagnostics
app.get("/", async (req, res) => {
    try {
        console.log("🏥 Health check requested");

        let dbStatus = "disconnected";
        let dbError = null;
        let dbTest = null;
        let connectionTime = null;

        const startTime = Date.now();

        try {
            const connected = await connectDB();
            connectionTime = Date.now() - startTime;

            if (connected) {
                dbStatus = "connected";
                // Perform a simple database test
                const pingResult = await mongoose.connection.db.admin().ping();
                dbTest = "ping successful";
                console.log("✅ Database ping successful:", pingResult);
            } else {
                dbError = "Connection failed";
            }
        } catch (error) {
            dbError = error.message;
            dbStatus = "error";
            connectionTime = Date.now() - startTime;
            console.error("❌ Health check DB error:", error.message);
        }

        const response = {
            success: true,
            message: "Smart Todo API is running",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            database: {
                status: dbStatus,
                test: dbTest,
                error: dbError,
                connectionTime: connectionTime ? `${connectionTime}ms` : null,
                readyState: mongoose.connection.readyState,
                readyStateText: getReadyStateText(mongoose.connection.readyState),
            },
            environment: {
                nodeEnv: process.env.NODE_ENV || "development",
                isServerless: !!isServerless,
                platform: process.env.VERCEL ? "Vercel" : process.env.AWS_LAMBDA_FUNCTION_NAME ? "AWS Lambda" : "Local",
                hasSocket: !!io,
            },
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        };

        // Set appropriate status code
        const statusCode = dbStatus === "connected" ? 200 : 503;
        res.status(statusCode).json(response);
    } catch (error) {
        console.error("❌ Health check error:", error);
        res.status(500).json({
            success: false,
            message: "Health check failed",
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Helper function to get readable connection state
function getReadyStateText(state) {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    return states[state] || "unknown";
}

// MongoDB connection test route with detailed diagnostics
app.get("/test-db", async (req, res) => {
    try {
        console.log("🧪 Database test requested");

        const startTime = Date.now();
        const connected = await connectDB();
        const connectionTime = Date.now() - startTime;

        if (!connected) {
            return res.status(503).json({
                success: false,
                message: "Failed to connect to database",
                connectionState: mongoose.connection.readyState,
                connectionTime: `${connectionTime}ms`,
                timestamp: new Date().toISOString(),
            });
        }

        // Perform comprehensive database tests
        const tests = {};

        try {
            // Test 1: Ping
            const pingStart = Date.now();
            await mongoose.connection.db.admin().ping();
            tests.ping = { success: true, time: `${Date.now() - pingStart}ms` };
        } catch (error) {
            tests.ping = { success: false, error: error.message };
        }

        try {
            // Test 2: List collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            tests.collections = {
                success: true,
                count: collections.length,
                names: collections.map((c) => c.name),
            };
        } catch (error) {
            tests.collections = { success: false, error: error.message };
        }

        try {
            // Test 3: Database stats
            const stats = await mongoose.connection.db.stats();
            tests.stats = {
                success: true,
                dataSize: stats.dataSize,
                indexSize: stats.indexSize,
                collections: stats.collections,
            };
        } catch (error) {
            tests.stats = { success: false, error: error.message };
        }

        const allTestsPass = Object.values(tests).every((test) => test.success);

        res.status(allTestsPass ? 200 : 206).json({
            success: allTestsPass,
            message: allTestsPass ? "All database tests passed" : "Some database tests failed",
            database: mongoose.connection.db.databaseName,
            connectionTime: `${connectionTime}ms`,
            connectionState: mongoose.connection.readyState,
            tests,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("❌ Database test error:", error);
        res.status(500).json({
            success: false,
            message: "Database test failed",
            error: error.message,
            connectionState: mongoose.connection.readyState,
            timestamp: new Date().toISOString(),
        });
    }
});

// Socket.io status route
app.get("/socket-check", (req, res) => {
    if (io) {
        res.json({
            success: true,
            message: "Socket.io is running",
            connectedClients: io.engine.clientsCount,
            connectedUsers: [...connectedUsers.entries()].map(([userId, socketId]) => ({ userId, socketId })),
            serverless: false,
        });
    } else {
        res.json({
            success: true,
            message: "Socket.io is not available in serverless environment",
            serverless: isServerless,
            reason: "Socket.io requires persistent connections",
        });
    }
});

// Comprehensive debug route
app.get("/api/debug", (req, res) => {
    res.json({
        success: true,
        message: "API Debug Information",
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV,
            nodeVersion: process.version,
            platform: process.platform,
            isServerless,
            serverlessProvider: process.env.VERCEL ? "Vercel" : process.env.AWS_LAMBDA_FUNCTION_NAME ? "AWS Lambda" : null,
            hasSocket: !!io,
            dbConnected: isConnected,
            mongoReadyState: mongoose.connection.readyState,
            mongoHost: mongoose.connection.host,
            mongoPort: mongoose.connection.port,
            mongoDbName: mongoose.connection.db?.databaseName || null,
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
        performance: {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
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
        method: req.method,
        timestamp: new Date().toISOString(),
    });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error("🚨 Error occurred:", err.stack);

    const isDevelopment = process.env.NODE_ENV !== "production";

    // Handle specific error types
    let statusCode = err.status || err.statusCode || 500;
    let message = "Internal server error";

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation error";
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    } else if (err.name === "MongoError" || err.name === "MongoServerError") {
        statusCode = 503;
        message = "Database error";
    } else if (isDevelopment) {
        message = err.message;
    }

    res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && {
            error: err.message,
            stack: err.stack,
            name: err.name,
        }),
    });
});

// Initialize database connection for serverless
console.log("🚀 Initializing application...");
if (MONGO_URI) {
    connectDB()
        .then(() => {
            console.log("✅ Initial database connection successful");
        })
        .catch((err) => {
            console.error("❌ Initial database connection failed:", err.message);
            // Don't exit in serverless environment
            if (!isServerless) {
                process.exit(1);
            }
        });
} else {
    console.error("❌ MongoDB URI not provided");
    if (!isServerless) {
        process.exit(1);
    }
}

// Export the Express app for Vercel serverless
export default app;

// Only start the server in development or when explicitly enabled
if (!isServerless) {
    const PORT = process.env.PORT || 3000;
    if (server) {
        server.listen(PORT, () => {
            console.log(`🚀 Server with Socket.io running on port ${PORT}`);
        });
    } else {
        app.listen(PORT, () => {
            console.log(`🚀 Express server running on port ${PORT}`);
        });
    }
} else {
    console.log("☁️ Serverless mode - server will be managed by platform");
}
