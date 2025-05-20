import Task from "../models/Task.js";
import { dbEvents } from "../index.js";

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

        // Emit task creation event
        dbEvents.emit("db_change", {
            operation: "create",
            collection: "tasks",
            message: `New task "${task}" created`,
            type: "task",
        });

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

        // Emit task update event
        dbEvents.emit("db_change", {
            operation: "update",
            collection: "tasks",
            message: `Task "${task}" updated`,
            type: "task",
        });

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
        const task = await Task.findOne({ _id: id, userId: req.user._id });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        await Task.findByIdAndDelete(id);

        // Emit task deletion event
        dbEvents.emit("db_change", {
            operation: "delete",
            collection: "tasks",
            message: `Task "${task.task}" deleted`,
            type: "task",
        });

        res.json({ message: "Task deleted successfully" });
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

        // Emit task status change event
        dbEvents.emit("db_change", {
            operation: "status_change",
            collection: "tasks",
            message: `Task "${task.task}" marked as ${completed ? "completed" : "incomplete"}`,
            type: "task",
        });

        res.json(task);
    } catch (error) {
        console.error("Update task status error:", error);
        res.status(500).json({ message: "Error updating task status" });
    }
};
