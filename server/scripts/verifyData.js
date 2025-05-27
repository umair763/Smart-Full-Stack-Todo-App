import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import User from "../models/User.js";
import Task from "../models/Task.js";
import Subtask from "../models/Subtask.js";
import Dependency from "../models/Dependency.js";
import Note from "../models/Note.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        const connectionString = process.env.MONGO_URI || "mongodb://localhost:27017/SmartTodoApp";
        console.log(`🔗 Connecting to: ${connectionString}`);

        await mongoose.connect(connectionString);
        console.log("✅ MongoDB connected successfully");

        // Get database name
        const dbName = mongoose.connection.db.databaseName;
        console.log(`📊 Connected to database: ${dbName}`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Verify data exists
const verifyData = async () => {
    try {
        console.log("\n🔍 Verifying data in database...\n");

        // Check users
        const userCount = await User.countDocuments();
        console.log(`👤 Users: ${userCount}`);

        if (userCount > 0) {
            const users = await User.find({}).limit(3);
            users.forEach((user) => {
                console.log(`   • ${user.email} (ID: ${user._id})`);
            });
        }

        // Check tasks
        const taskCount = await Task.countDocuments();
        console.log(`\n📝 Tasks: ${taskCount}`);

        if (taskCount > 0) {
            const tasks = await Task.find({}).limit(5);
            tasks.forEach((task) => {
                console.log(`   • ${task.task} (User: ${task.userId})`);
            });
        }

        // Check subtasks
        const subtaskCount = await Subtask.countDocuments();
        console.log(`\n📋 Subtasks: ${subtaskCount}`);

        // Check notes
        const noteCount = await Note.countDocuments();
        console.log(`\n📝 Notes: ${noteCount}`);

        // Check dependencies
        const dependencyCount = await Dependency.countDocuments();
        console.log(`\n🔗 Dependencies: ${dependencyCount}`);

        // Check specific user's data
        const targetUserId = "6835e33b4606f2769a593e79";
        console.log(`\n🎯 Data for target user (${targetUserId}):`);

        const userTasks = await Task.find({ userId: targetUserId });
        console.log(`   • Tasks: ${userTasks.length}`);

        const userNotes = await Note.find({ userId: targetUserId });
        console.log(`   • Notes: ${userNotes.length}`);

        const userDependencies = await Dependency.find({ userId: targetUserId });
        console.log(`   • Dependencies: ${userDependencies.length}`);

        // Check subtasks for this user's tasks
        const taskIds = userTasks.map((task) => task._id);
        const userSubtasks = await Subtask.find({ taskId: { $in: taskIds } });
        console.log(`   • Subtasks: ${userSubtasks.length}`);

        // Show which tasks have subtasks
        const tasksWithSubtasks = await Task.find({
            userId: targetUserId,
            subtaskCount: { $gt: 0 },
        });
        console.log(`   • Tasks with subtasks: ${tasksWithSubtasks.length}`);
        tasksWithSubtasks.forEach((task) => {
            console.log(`     - ${task.task} (${task.subtaskCount} subtasks)`);
        });

        // Show collections in database
        console.log(`\n📚 Collections in database:`);
        const collections = await mongoose.connection.db.listCollections().toArray();
        collections.forEach((collection) => {
            console.log(`   • ${collection.name}`);
        });

        if (taskCount === 0) {
            console.log(`\n❌ No tasks found! This suggests the data wasn't saved properly.`);
            console.log(`💡 Possible issues:`);
            console.log(`   1. Wrong database connection`);
            console.log(`   2. Data was saved to a different database`);
            console.log(`   3. Transaction rollback occurred`);
        } else {
            console.log(`\n✅ Data verification completed successfully!`);
        }
    } catch (error) {
        console.error("❌ Error verifying data:", error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        // Connect to database
        await connectDB();

        // Verify data
        await verifyData();
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log("\n🔌 Database connection closed");
        process.exit(0);
    }
};

// Run the script
main();
