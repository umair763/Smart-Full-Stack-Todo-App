import Task from "../models/Task.js";
import { dbEvents } from "../index.js";
import Notification from "../models/Notification.js";
import Dependency from "../models/Dependency.js";

// Get all tasks for a user
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id })
            .populate({
                path: "subtasks",
                options: { sort: { createdAt: -1 } },
            })
            .sort({ createdAt: -1 });

        // Add completion counts for each task
        const tasksWithCounts = tasks.map((task) => {
            const subtaskCount = task.subtasks.length;
            const completedSubtasks = task.subtasks.filter((subtask) => subtask.status).length;
            return {
                ...task.toObject(),
                subtaskCount,
                completedSubtasks,
            };
        });

        res.json(tasksWithCounts);
    } catch (error) {
        console.error("Get tasks error:", error);
        res.status(500).json({ message: "Error fetching tasks" });
    }
};

// Create a new task
export const createTask = async (req, res) => {
    try {
        const { task, date, time, priority } = req.body;

        // Validate priority
        const validPriorities = ["High", "Medium", "Low"];
        const taskPriority = validPriorities.includes(priority) ? priority : "Medium";

        const newTask = new Task({
            userId: req.user._id,
            task,
            date,
            time,
            priority: taskPriority,
            completed: false,
        });

        await newTask.save();

        // Save notification to DB
        const savedNotification = await Notification.create({
            userId: req.user._id,
            type: "create",
            message: `Task "${task}" created`,
            data: { taskId: newTask._id },
        });

        // Emit task creation event (real-time)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                ...savedNotification.toObject(),
                type: "create",
                message: `Task "${task}" created`,
                persistent: true,
                read: false,
            });
        }

        res.status(201).json(newTask);
    } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ message: "Error creating task" });
    }
};

// Update a task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { task, date, time, priority, color, completed } = req.body;

        // Map color to priority if color is provided
        const colorToPriority = {
            red: "High",
            yellow: "Medium",
            green: "Low",
        };

        // Determine the priority based on color or direct priority input
        let taskPriority = priority;
        if (color && colorToPriority[color]) {
            taskPriority = colorToPriority[color];
        }

        // Validate priority
        const validPriorities = ["High", "Medium", "Low"];
        taskPriority = validPriorities.includes(taskPriority) ? taskPriority : "Medium";

        const updatedTask = await Task.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            {
                task,
                date,
                time,
                priority: taskPriority,
                completed: completed !== undefined ? completed : false,
            },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Save notification to DB
        const savedNotification = await Notification.create({
            userId: req.user._id,
            type: "update",
            message: `Task "${task}" updated`,
            data: { taskId: updatedTask._id },
        });

        // Emit task update event (real-time)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                ...savedNotification.toObject(),
                type: "update",
                message: `Task "${task}" updated`,
                persistent: true,
                read: false,
            });
        }

        res.json(updatedTask);
    } catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({ message: "Error updating task" });
    }
};

// Delete a task
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if this task is a prerequisite for any other task
        const dependent = await Dependency.findOne({ prerequisiteTaskId: id });
        if (dependent) {
            return res
                .status(400)
                .json({ message: "Cannot delete this task because other tasks depend on it. Please delete dependent tasks first." });
        }
        const deletedTask = await Task.findOneAndDelete({ _id: id, userId: req.user._id });
        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Save notification to DB
        const savedNotification = await Notification.create({
            userId: req.user._id,
            type: "delete",
            message: `Task "${deletedTask.task}" deleted`,
            data: { taskId: deletedTask._id },
        });

        // Emit task deletion event (real-time)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                ...savedNotification.toObject(),
                type: "delete",
                message: `Task "${deletedTask.task}" deleted`,
                persistent: true,
                read: false,
            });
        }

        res.json({ message: "Task deleted" });
    } catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({ message: "Error deleting task" });
    }
};

// Get task statistics
export const getTaskStats = async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments({ userId: req.user._id });
        const completedTasks = await Task.countDocuments({
            userId: req.user._id,
            completed: true,
        });
        const pendingTasks = await Task.countDocuments({
            userId: req.user._id,
            completed: false,
        });

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
        });
    } catch (error) {
        console.error("Get task stats error:", error);
        res.status(500).json({ message: "Error fetching task statistics" });
    }
};

// Update task completion status
export const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;

        // Ensure completed is a boolean
        if (typeof completed !== "boolean") {
            return res.status(400).json({ message: "Invalid completion status" });
        }

        const task = await Task.findOneAndUpdate({ _id: id, userId: req.user._id }, { completed }, { new: true });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json(task);
    } catch (error) {
        console.error("Update task status error:", error);
        res.status(500).json({ message: "Error updating task status" });
    }
};
