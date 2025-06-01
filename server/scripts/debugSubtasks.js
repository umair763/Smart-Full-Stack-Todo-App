import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import User from "../models/User.js";
import Task from "../models/Task.js";
import Subtask from "../models/Subtask.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        const connectionString =
            "mongodb+srv://MuhammadUmair:umair@11167@cluster0.jjtx3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/SmartTodoApp";
        await mongoose.connect(connectionString);
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Debug subtasks relationship
const debugSubtasks = async () => {
    try {
        const targetUserId = "6835e33b4606f2769a593e79";

        console.log("🔍 Debugging subtasks relationship...\n");

        // Get user's tasks
        const userTasks = await Task.find({ userId: targetUserId });
        console.log(`📝 User has ${userTasks.length} tasks\n`);

        // Check each task for subtasks
        for (const task of userTasks) {
            console.log(`📋 Task: "${task.task}"`);
            console.log(`   • Task ID: ${task._id}`);
            console.log(`   • Subtask Count (stored): ${task.subtaskCount || 0}`);
            console.log(`   • Completed Subtasks (stored): ${task.completedSubtasks || 0}`);

            // Find actual subtasks for this task
            const actualSubtasks = await Subtask.find({ taskId: task._id });
            console.log(`   • Actual subtasks found: ${actualSubtasks.length}`);

            if (actualSubtasks.length > 0) {
                console.log(`   • Subtasks:`);
                actualSubtasks.forEach((subtask, index) => {
                    console.log(`     ${index + 1}. ${subtask.title} (${subtask.status ? "Completed" : "Pending"})`);
                });

                // Check if task.subtaskCount matches actual count
                if (task.subtaskCount !== actualSubtasks.length) {
                    console.log(`   ⚠️  MISMATCH: Task shows ${task.subtaskCount} but has ${actualSubtasks.length} actual subtasks`);
                }
            } else if (task.subtaskCount > 0) {
                console.log(`   ⚠️  PROBLEM: Task shows ${task.subtaskCount} subtasks but none found in database`);
            }

            console.log("");
        }

        // Check all subtasks in database
        const allSubtasks = await Subtask.find({});
        console.log(`\n📊 Total subtasks in database: ${allSubtasks.length}`);

        // Check which tasks these subtasks belong to
        const taskIds = [...new Set(allSubtasks.map((st) => st.taskId.toString()))];
        console.log(`🔗 Subtasks belong to ${taskIds.length} different tasks`);

        // Check if any subtasks belong to tasks not owned by our user
        for (const taskId of taskIds) {
            const task = await Task.findById(taskId);
            if (task) {
                const belongsToUser = task.userId.toString() === targetUserId;
                console.log(`   • Task ${taskId}: ${belongsToUser ? "✅ Belongs to user" : "❌ Belongs to different user"}`);
                if (!belongsToUser) {
                    console.log(`     Owner: ${task.userId}`);
                }
            } else {
                console.log(`   • Task ${taskId}: ❌ Task not found (orphaned subtasks)`);
            }
        }
    } catch (error) {
        console.error("❌ Error debugging subtasks:", error);
        throw error;
    }
};

// Main function
const main = async () => {
    try {
        await connectDB();
        await debugSubtasks();
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\n🔌 Database connection closed");
        process.exit(0);
    }
};

// Run the script
main();
