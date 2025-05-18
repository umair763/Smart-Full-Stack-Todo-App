const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: "*", // In production, limit to your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    },
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

// Make io accessible to route handlers
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// Improved CORS configuration
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow any origin in development
            return callback(null, true);
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
            ],
        },
    });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

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
    console.log(`Socket.io running on ws://localhost:${PORT}`);
});
