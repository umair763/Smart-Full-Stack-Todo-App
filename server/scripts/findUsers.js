import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import User model
import User from "../models/User.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(
            "mongodb+srv://MuhammadUmair:umair@11167@cluster0.jjtx3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/SmartTodoApp"
        );
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Find all users
const findAllUsers = async () => {
    try {
        console.log("🔍 Searching for all users in database...\n");

        const users = await User.find({});

        if (users.length === 0) {
            console.log("❌ No users found in database!");
            console.log("💡 Please create a user account first by registering in the application.");
            return;
        }

        console.log(`✅ Found ${users.length} user(s):\n`);

        users.forEach((user, index) => {
            console.log(`👤 User ${index + 1}:`);
            console.log(`   • ID: ${user._id}`);
            console.log(`   • Email: ${user.email}`);
            console.log(`   • Username: ${user.username || "No username"}`);
            console.log(`   • Google ID: ${user.googleId || "No Google ID"}`);
            console.log(`   • Created: ${user.createdAt || "Unknown"}`);
            console.log("");
        });

        console.log("💡 Copy the correct User ID to update the seeding script.");
    } catch (error) {
        console.error("❌ Error finding users:", error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        // Connect to database
        await connectDB();

        // Find all users
        await findAllUsers();
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
        process.exit(0);
    }
};

// Run the script
main();
