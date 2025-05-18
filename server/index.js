const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json()); // Make sure to parse incoming JSON requests

// Middleware for JSON
app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ limit: "1gb", extended: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb+srv://MuhammadUmair:umair@11167@cluster0.jjtx3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/todoapp";

// Connect to MongoDB
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
