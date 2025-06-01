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

dotenv.config();

const app = express();
const server = http.createServer(app);

// Create an EventEmitter for database changes
const dbEvents = new EventEmitter();
// Export dbEvents for use in controllers
export { dbEvents };

// Get the current domain dynamically
const getCurrentDomain = (req) => {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return `${protocol}://${host}`;
};

// Middleware for JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Improved CORS configuration
app.use(
    cors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "https://smart-full-stack-todo-app.vercel.app",
                "https://todo-app-full-stack-frontend.vercel.app",
                "https://smart-todo-task-management-frontend.vercel.app",
                "https://smart-todo-task-management-backend.vercel.app", // Add your backend URL
            ];

            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = "The CORS policy for this site does not allow access from the specified Origin.";
                return callback(new Error(msg), false);
            }

            return callback(null, true);
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    })
);

// Handle preflight requests explicitly
app.options("*", cors());

// Also update your Socket.io CORS configuration
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "https://smart-full-stack-todo-app.vercel.app",
            "https://todo-app-full-stack-frontend.vercel.app",
            "https://smart-todo-task-management-frontend.vercel.app",
            "https://smart-todo-task-management-backend.vercel.app",
        ],
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
    // Send to specific user if connected
    if (connectedUsers.has(userId.toString())) {
        const socketId = connectedUsers.get(userId.toString());

        // Emit notification created event to trigger UI updates
        io.to(socketId).emit("notificationCreated", notification);
        return true;
    } else {
        // Even if user is not connected, emit a general notification
        // This helps with cases where multiple tabs are open
        io.emit("notificationCreated", notification);
    }

    return false;
};

// Make io accessible to route handlers
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// MongoDB Configuration
const PORT = process.env.PORT || 5000;
const MONGO_URI =
    process.env.NODE_ENV === "production"
        ? process.env.MONGO_URI_DEPLOYED
        : process.env.MONGO_URI || "mongodb://localhost:27017/SmartTodoApp";

// Connect to MongoDB with improved options
mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 50000, // Increased timeout
        socketTimeoutMS: 45000, // Socket timeout
        connectTimeoutMS: 50000, // Connection timeout
        maxPoolSize: 10, // Maximum number of connections in the pool
        minPoolSize: 5, // Minimum number of connections in the pool
        retryWrites: true,
        retryReads: true,
        w: "majority", // Write concern
        wtimeoutMS: 2500, // Write concern timeout
    })
    .then(() => {
        console.log("Connected to MongoDB successfully");
        // Start the server only after successful database connection
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit if cannot connect to database
    });

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
});

// Handle process termination
process.on("SIGINT", async () => {
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
    } catch (err) {
        console.error("Error during MongoDB connection closure:", err);
        process.exit(1);
    }
});

// Health check route
app.get("/", (req, res) => {
    res.json({
        message: "Todo API is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// Debug/API routes
app.get("/socket-check", (req, res) => {
    res.json({
        message: "Socket.io is running",
        connectedClients: io.engine.clientsCount,
        connectedUsers: [...connectedUsers.entries()].map(([userId, socketId]) => ({ userId, socketId })),
    });
});

app.get("/api/debug", (req, res) => {
    res.json({
        message: "API Debug Route",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
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

// Add a global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

// Handle 404 for API routes
app.use("/api/*", (req, res) => {
    res.status(404).json({
        message: "API route not found",
        path: req.path,
        method: req.method,
    });
});

// For Vercel: Export the Express app as default
export default app;
