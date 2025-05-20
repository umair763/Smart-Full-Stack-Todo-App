const Subtask = require("../models/subtaskModel");
const Task = require("../models/taskModel");

// Get all subtasks for a specific parent task
exports.getSubtasks = async (req, res) => {
    try {
        const { taskId } = req.params;
        const subtasks = await Subtask.find({ parentTask: taskId, user: req.user });
        res.json(subtasks);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch subtasks", error: err.message });
    }
};

// Create a new subtask for a parent task
exports.createSubtask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, date, time, priority } = req.body;

    if (!title || !date || !time) {
        return res.status(400).json({ message: "Title, date, and time are required" });
    }

    try {
        // Check if parent task exists and belongs to user
        const parentTask = await Task.findOne({ _id: taskId, user: req.user });
        if (!parentTask) {
            return res.status(404).json({ message: "Parent task not found" });
        }

        const newSubtask = new Subtask({
            title,
            description,
            date,
            time,
            priority: priority || "Medium",
            status: false,
            parentTask: taskId,
            user: req.user,
        });

        const savedSubtask = await newSubtask.save();

        // Update parent task with subtask reference and increment count
        await Task.findByIdAndUpdate(taskId, {
            $push: { subtasks: savedSubtask._id },
            $inc: { subtaskCount: 1 },
            updatedAt: new Date(),
        });

        // Emit Socket.io event for subtask creation
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("subtaskCreated", {
                subtask: savedSubtask,
                taskId: taskId,
                message: "New subtask created successfully",
            });
        }

        res.status(201).json(savedSubtask);
    } catch (err) {
        res.status(500).json({ message: "Failed to add subtask", error: err.message });
    }
};

// Update a subtask
exports.updateSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { title, description, date, time, priority, status } = req.body;

        // Validate required fields
        if (!title || !date || !time) {
            return res.status(400).json({ message: "Title, date, and time are required" });
        }

        // Find the subtask and ensure it belongs to the user
        const existingSubtask = await Subtask.findOne({ _id: subtaskId, user: req.user });
        if (!existingSubtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Check if status is being updated to handle parent task's completedSubtasks count
        const statusChanged = status !== undefined && status !== existingSubtask.status;
        const parentTaskId = existingSubtask.parentTask;

        // Update the subtask
        const updatedSubtask = await Subtask.findByIdAndUpdate(
            subtaskId,
            {
                title,
                description,
                date,
                time,
                priority,
                status: status !== undefined ? status : existingSubtask.status,
                updatedAt: new Date(),
            },
            { new: true } // Return the updated document
        );

        // If status changed, update the parent task's completedSubtasks count
        if (statusChanged) {
            const increment = status ? 1 : -1;
            await Task.findByIdAndUpdate(parentTaskId, {
                $inc: { completedSubtasks: increment },
                updatedAt: new Date(),
            });
        }

        // Emit Socket.io event for subtask update
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("subtaskUpdated", {
                subtask: updatedSubtask,
                message: "Subtask updated successfully",
            });
        }

        res.json(updatedSubtask);
    } catch (err) {
        res.status(500).json({ message: "Failed to update subtask", error: err.message });
    }
};

// Delete a subtask
exports.deleteSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const subtask = await Subtask.findOne({ _id: subtaskId, user: req.user });

        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        const parentTaskId = subtask.parentTask;
        const wasCompleted = subtask.status;

        await Subtask.findByIdAndDelete(subtaskId);

        // Update parent task: remove subtask reference, decrement counts
        const updateData = {
            $pull: { subtasks: subtaskId },
            $inc: { subtaskCount: -1 },
            updatedAt: new Date(),
        };

        // If subtask was completed, also decrement completedSubtasks count
        if (wasCompleted) {
            updateData.$inc.completedSubtasks = -1;
        }

        await Task.findByIdAndUpdate(parentTaskId, updateData);

        // Emit Socket.io event for subtask deletion
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("subtaskDeleted", {
                subtaskId: subtaskId,
                parentTaskId: parentTaskId,
                message: "Subtask deleted successfully",
            });
        }

        res.json({ message: "Subtask deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete subtask", error: err.message });
    }
};

// Update just the subtask status
exports.updateSubtaskStatus = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { status } = req.body;

        if (status === undefined) {
            return res.status(400).json({ message: "Status is required" });
        }

        const subtask = await Subtask.findOne({ _id: subtaskId, user: req.user });
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Skip update if status hasn't changed
        if (subtask.status === status) {
            return res.json(subtask);
        }

        const parentTaskId = subtask.parentTask;
        const updatedSubtask = await Subtask.findByIdAndUpdate(
            subtaskId,
            {
                status,
                updatedAt: new Date(),
            },
            { new: true }
        );

        // Update parent task's completedSubtasks count
        const increment = status ? 1 : -1;
        await Task.findByIdAndUpdate(parentTaskId, {
            $inc: { completedSubtasks: increment },
            updatedAt: new Date(),
        });

        // Emit Socket.io event for status change
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("subtaskStatusChanged", {
                subtask: updatedSubtask,
                parentTaskId: parentTaskId,
                message: status ? "Subtask marked as completed" : "Subtask marked as incomplete",
            });
        }

        res.json(updatedSubtask);
    } catch (err) {
        res.status(500).json({ message: "Failed to update subtask status", error: err.message });
    }
};
