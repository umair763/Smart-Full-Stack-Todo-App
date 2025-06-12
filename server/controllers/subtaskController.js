import Subtask from "../models/Subtask.js";
import Task from "../models/Task.js";

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

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
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

        // Check if a subtask with the same title already exists for this task
        const existingSubtask = await Subtask.findOne({
            taskId: actualTaskId,
            title: title,
            // Only check for duplicates created in the last minute
            createdAt: { $gt: new Date(Date.now() - 60000) },
        });

        // if (existingSubtask) {
        //     return res.status(409).json({
        //         message: "A subtask with this title was just created. Please wait a moment before creating another one.",
        //         subtask: existingSubtask,
        //     });
        // }

        const newSubtask = new Subtask({
            taskId: actualTaskId,
            title,
            description: description || "",
            date: date || "",
            time: time || "",
            priority: priority || "Medium",
            status: false,
        });

        await newSubtask.save();

        // Add subtask to task's subtasks array
        task.subtasks.push(newSubtask._id);
        await task.save();

        // Emit specific subtask created event for real-time UI updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskCreated", {
                subtask: newSubtask,
                parentTaskId: actualTaskId,
                userId: req.user._id,
            });
        }

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

        const subtask = await Subtask.findById(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Verify parent task belongs to user
        const task = await Task.findOne({ _id: subtask.taskId, userId: req.user._id });
        if (!task) {
            return res.status(404).json({ message: "Parent task not found" });
        }

        subtask.title = title || subtask.title;
        subtask.description = description !== undefined ? description : subtask.description;
        subtask.date = date || subtask.date;
        subtask.time = time || subtask.time;
        subtask.priority = priority || subtask.priority;

        await subtask.save();

        // Emit specific subtask updated event for real-time UI updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskUpdated", {
                subtask: subtask,
                parentTaskId: subtask.taskId,
                userId: req.user._id,
            });
        }

        res.json(subtask);
    } catch (error) {
        console.error("Update subtask error:", error);
        res.status(500).json({ message: "Error updating subtask" });
    }
};

// Delete a subtask
export const deleteSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const subtask = await Subtask.findById(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Verify parent task belongs to user
        const task = await Task.findOne({ _id: subtask.taskId, userId: req.user._id });
        if (!task) {
            return res.status(404).json({ message: "Parent task not found" });
        }

        await subtask.deleteOne();
        // Remove subtask from task's subtasks array
        task.subtasks = task.subtasks.filter((id) => id.toString() !== subtaskId);
        await task.save();

        // Emit specific subtask deleted event for real-time UI updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskDeleted", {
                subtaskId: subtask._id,
                parentTaskId: subtask.taskId,
                userId: req.user._id,
            });
        }

        res.json({ message: "Subtask deleted" });
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

        // Emit specific subtask status changed event for real-time UI updates
        const io = req.app.get("io");
        if (io) {
            io.emit("subtaskStatusChanged", {
                subtaskId: subtaskId,
                status: status,
                parentTaskId: subtask.taskId,
                subtaskCount: subtaskCount,
                completedSubtasks: completedSubtasks,
                userId: req.user._id,
            });
        }

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
