const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// Improved CORS configuration
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174", // Add the specific client port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174", // Add the specific client port
            "https://smart-full-stack-todo-app.vercel.app",
            // Allow Vercel preview URLs
            /\.vercel\.app$/,
        ],
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
const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb+srv://MuhammadUmair:umair11167@cluster0.jjtx3.mongodb.net/SmartTodoApp?retryWrites=true&w=majority&appName=Cluster0";

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

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// Home route for testing
app.get("/", (req, res) => {
    res.json({ message: "Todo API is running" });
});

// Add a global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
