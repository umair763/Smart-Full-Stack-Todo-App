import Subtask from "../models/Subtask.js";
import Task from "../models/Task.js";
import { dbEvents } from "../index.js";

// Get all subtasks for a task
export const getSubtasks = async (req, res) => {
    try {
        const { taskId } = req.params;
        const subtasks = await Subtask.find({ taskId }).sort({ createdAt: -1 });
        res.json(subtasks);
    } catch (error) {
        console.error("Get subtasks error:", error);
        res.status(500).json({ message: "Error fetching subtasks" });
    }
};

// Create a new subtask
export const createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, date, time, priority, parentTask } = req.body;

        if (!title || !date || !time) {
            return res.status(400).json({ message: "Title, date, and time are required" });
        }

        // Use either taskId from params or parentTask from body
        const actualTaskId = taskId || parentTask;
        if (!actualTaskId) {
            return res.status(400).json({ message: "Task ID is required" });
        }

        // Verify task exists and belongs to user
        const task = await Task.findOne({ _id: actualTaskId, userId: req.user._id });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const newSubtask = new Subtask({
            taskId: actualTaskId,
            title,
            description: description || "",
            date,
            time,
            priority: priority || "Medium",
            status: false,
        });

        await newSubtask.save();

        // Add subtask to task's subtasks array
        task.subtasks.push(newSubtask._id);
        await task.save();

        // Emit subtask creation event
        dbEvents.emit("db_change", {
            operation: "create",
            collection: "subtasks",
            message: `New subtask "${title}" created for task "${task.task}"`,
            type: "subtask",
        });

        res.status(201).json(newSubtask);
    } catch (error) {
        console.error("Create subtask error:", error);
        res.status(500).json({ message: "Error creating subtask" });
    }
};

// Update a subtask
export const updateSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { title, description, date, time, priority } = req.body;

        if (!title || !date || !time) {
            return res.status(400).json({ message: "Title, date, and time are required" });
        }

        // Find subtask and verify task ownership
        const subtask = await Subtask.findById(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        const task = await Task.findOne({ _id: subtask.taskId, userId: req.user._id });
        if (!task) {
            return res.status(403).json({ message: "Not authorized to update this subtask" });
        }

        const updatedSubtask = await Subtask.findByIdAndUpdate(
            subtaskId,
            {
                title,
                description,
                date,
                time,
                priority: priority || subtask.priority,
            },
            { new: true }
        );

        // Emit subtask update event
        dbEvents.emit("db_change", {
            operation: "update",
            collection: "subtasks",
            message: `Subtask "${title}" updated for task "${task.task}"`,
            type: "subtask",
        });

        res.json(updatedSubtask);
    } catch (error) {
        console.error("Update subtask error:", error);
        res.status(500).json({ message: "Error updating subtask" });
    }
};

// Delete a subtask
export const deleteSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;

        // Find subtask and verify task ownership
        const subtask = await Subtask.findById(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        const task = await Task.findOne({ _id: subtask.taskId, userId: req.user._id });
        if (!task) {
            return res.status(403).json({ message: "Not authorized to delete this subtask" });
        }

        await Subtask.findByIdAndDelete(subtaskId);

        // Remove subtask from task's subtasks array
        task.subtasks = task.subtasks.filter((id) => id.toString() !== subtaskId.toString());
        await task.save();

        // Emit subtask deletion event
        dbEvents.emit("db_change", {
            operation: "delete",
            collection: "subtasks",
            message: `Subtask "${subtask.title}" deleted from task "${task.task}"`,
            type: "subtask",
        });

        res.json({ message: "Subtask deleted successfully" });
    } catch (error) {
        console.error("Delete subtask error:", error);
        res.status(500).json({ message: "Error deleting subtask" });
    }
};

// Update subtask status
export const updateSubtaskStatus = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { status } = req.body;

        if (typeof status !== "boolean") {
            return res.status(400).json({ message: "Status must be a boolean value" });
        }

        // Find subtask and verify task ownership
        const subtask = await Subtask.findById(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        const task = await Task.findOne({ _id: subtask.taskId, userId: req.user._id }).populate("subtasks");
        if (!task) {
            return res.status(403).json({ message: "Not authorized to update this subtask" });
        }

        const updatedSubtask = await Subtask.findByIdAndUpdate(subtaskId, { status }, { new: true });

        // Calculate new completion counts
        const subtaskCount = task.subtasks.length;
        const completedSubtasks = task.subtasks.filter((st) => (st._id.toString() === subtaskId ? status : st.status)).length;

        // Emit subtask status change event with updated counts
        dbEvents.emit("db_change", {
            operation: "status_change",
            collection: "subtasks",
            message: `Subtask "${subtask.title}" marked as ${status ? "completed" : "incomplete"} for task "${task.task}"`,
            type: "subtask",
            data: {
                subtaskId,
                taskId: task._id,
                status,
                subtaskCount,
                completedSubtasks,
                parentTaskId: task._id,
            },
        });

        res.json({
            ...updatedSubtask.toObject(),
            subtaskCount,
            completedSubtasks,
        });
    } catch (error) {
        console.error("Update subtask status error:", error);
        res.status(500).json({ message: "Error updating subtask status" });
    }
};
