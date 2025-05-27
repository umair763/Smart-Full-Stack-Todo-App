import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import User model
import User from "../models/User.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/SmartTodoApp");
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Create test user
const createTestUser = async () => {
    try {
        console.log("👤 Creating test user...");

        // Check if test user already exists
        const existingUser = await User.findOne({ email: "test@example.com" });

        if (existingUser) {
            console.log("✅ Test user already exists:");
            console.log(`   Email: ${existingUser.email}`);
            console.log(`   Username: ${existingUser.username}`);
            return existingUser;
        }

        // Create new test user
        const hashedPassword = await bcrypt.hash("password123", 10);
        const user = new User({
            username: "testuser",
            email: "test@example.com",
            password: hashedPassword,
        });

        await user.save();

        console.log("✅ Test user created successfully:");
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: password123`);

        return user;
    } catch (error) {
        console.error("❌ Error creating test user:", error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        console.log("🌱 Creating test user for development...\n");

        // Connect to database
        await connectDB();

        // Create test user
        await createTestUser();

        console.log("\n🎉 Test user setup completed!");
        console.log("\n📝 You can now:");
        console.log("   1. Run the seeding script: npm run seed");
        console.log("   2. Login with: test@example.com / password123");
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
