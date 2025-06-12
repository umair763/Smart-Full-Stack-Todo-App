import Subtask from "../models/Subtask.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

// Create a new subtask
export const createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, date, time, priority } = req.body;
        const userId = req.user._id;

        console.log("Creating subtask:", { taskId, title, description, date, time, priority, userId });

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Subtask title is required" });
        }

        // Check if the parent task exists and belongs to the user
        const parentTask = await Task.findOne({ _id: taskId, userId });
        if (!parentTask) {
            return res.status(404).json({ message: "Parent task not found" });
        }

        // Create the subtask
        const subtask = new Subtask({
            title: title.trim(),
            description: description?.trim() || "",
            date: date || "",
            time: time || "",
            priority: priority || "Medium",
            taskId,
            userId,
            status: false,
        });

        const savedSubtask = await subtask.save();
        console.log("Subtask created successfully:", savedSubtask._id);

        // Update parent task's subtask count
        const subtaskCount = await Subtask.countDocuments({ taskId });
        const completedSubtasks = await Subtask.countDocuments({ taskId, status: true });

        await Task.findByIdAndUpdate(taskId, {
            subtaskCount,
            completedSubtasks,
        });

        // Emit socket event for real-time updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskCreated", {
                subtask: savedSubtask,
                parentTaskId: taskId,
                userId,
                subtaskCount,
                completedSubtasks,
            });
        }

        res.status(201).json({
            message: "Subtask created successfully",
            subtask: savedSubtask,
            subtaskCount,
            completedSubtasks,
        });
    } catch (error) {
        console.error("Error creating subtask:", error);
        res.status(500).json({ message: "Failed to create subtask", error: error.message });
    }
};

// Get all subtasks for a task
export const getSubtasks = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;

        // Check if the parent task exists and belongs to the user
        const parentTask = await Task.findOne({ _id: taskId, userId });
        if (!parentTask) {
            return res.status(404).json({ message: "Parent task not found" });
        }

        const subtasks = await Subtask.find({ taskId, userId }).sort({ createdAt: -1 });

        res.status(200).json(subtasks);
    } catch (error) {
        console.error("Error fetching subtasks:", error);
        res.status(500).json({ message: "Failed to fetch subtasks", error: error.message });
    }
};

// Update a subtask
export const updateSubtask = async (req, res) => {
    try {
        const { taskId, subtaskId } = req.params;
        const { title, description, date, time, priority } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Subtask title is required" });
        }

        // Find and update the subtask
        const subtask = await Subtask.findOneAndUpdate(
            { _id: subtaskId, taskId, userId },
            {
                title: title.trim(),
                description: description?.trim() || "",
                date: date || "",
                time: time || "",
                priority: priority || "Medium",
            },
            { new: true }
        );

        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Emit socket event for real-time updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskUpdated", {
                subtask,
                parentTaskId: taskId,
                userId,
            });
        }

        res.status(200).json({
            message: "Subtask updated successfully",
            subtask,
        });
    } catch (error) {
        console.error("Error updating subtask:", error);
        res.status(500).json({ message: "Failed to update subtask", error: error.message });
    }
};

// Update subtask status
export const updateSubtaskStatus = async (req, res) => {
    try {
        const { taskId, subtaskId } = req.params;
        const { completed } = req.body;
        const userId = req.user._id;

        // Find and update the subtask status
        const subtask = await Subtask.findOneAndUpdate({ _id: subtaskId, taskId, userId }, { status: completed }, { new: true });

        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Update parent task's completed subtasks count
        const subtaskCount = await Subtask.countDocuments({ taskId });
        const completedSubtasks = await Subtask.countDocuments({ taskId, status: true });

        await Task.findByIdAndUpdate(taskId, {
            subtaskCount,
            completedSubtasks,
        });

        // Emit socket event for real-time updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskStatusChanged", {
                subtaskId,
                status: completed,
                parentTaskId: taskId,
                userId,
                subtaskCount,
                completedSubtasks,
            });
        }

        res.status(200).json({
            message: "Subtask status updated successfully",
            subtask,
            subtaskCount,
            completedSubtasks,
        });
    } catch (error) {
        console.error("Error updating subtask status:", error);
        res.status(500).json({ message: "Failed to update subtask status", error: error.message });
    }
};

// Delete a subtask
export const deleteSubtask = async (req, res) => {
    try {
        const { taskId, subtaskId } = req.params;
        const userId = req.user._id;

        // Find and delete the subtask
        const subtask = await Subtask.findOneAndDelete({ _id: subtaskId, taskId, userId });

        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Update parent task's subtask count
        const subtaskCount = await Subtask.countDocuments({ taskId });
        const completedSubtasks = await Subtask.countDocuments({ taskId, status: true });

        await Task.findByIdAndUpdate(taskId, {
            subtaskCount,
            completedSubtasks,
        });

        // Emit socket event for real-time updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskDeleted", {
                subtaskId,
                parentTaskId: taskId,
                userId,
                subtaskCount,
                completedSubtasks,
            });
        }

        res.status(200).json({
            message: "Subtask deleted successfully",
            subtaskCount,
            completedSubtasks,
        });
    } catch (error) {
        console.error("Error deleting subtask:", error);
        res.status(500).json({ message: "Failed to delete subtask", error: error.message });
    }
};
