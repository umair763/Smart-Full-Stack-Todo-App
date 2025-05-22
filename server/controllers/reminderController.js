import { dbEvents } from "../index.js";
import Reminder from "../models/Reminder.js";
import Task from "../models/Task.js";
import reminderService from "../services/reminderService.js";

// Helper function to calculate reminder time based on preset type
const calculateReminderTime = (taskDateTime, presetType) => {
    const date = new Date(taskDateTime);
    switch (presetType) {
        case "10min":
            return new Date(date.getTime() - 10 * 60 * 1000);
        case "1hour":
            return new Date(date.getTime() - 60 * 60 * 1000);
        case "1day":
            return new Date(date.getTime() - 24 * 60 * 60 * 1000);
        case "attime":
            return date;
        default:
            return date;
    }
};

// Create a new reminder
export const createReminder = async (req, res) => {
    try {
        const { taskId, reminderTime } = req.body;
        const userId = req.user._id;

        // Verify task exists and belongs to user
        const task = await Task.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Create reminder using the service
        const reminder = await reminderService.createReminder(taskId, reminderTime, userId);

        // Emit initial reminder set notification
        dbEvents.emit("db_change", {
            operation: "reminder_set",
            collection: "reminders",
            message: `Reminder set for task "${task.task}" at ${new Date(reminderTime).toLocaleString()}`,
            type: "info",
        });

        res.status(201).json({
            message: "Reminder set successfully",
            reminder,
            reminderTime: new Date(reminderTime).toLocaleString(),
        });
    } catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({ message: "Error creating reminder", error: error.message });
    }
};

// Get all reminders for a task
export const getTaskReminders = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;

        const reminders = await Reminder.find({ taskId, userId }).populate("taskId", "task date time").sort({ reminderTime: 1 });

        res.json(reminders);
    } catch (error) {
        console.error("Error fetching reminders:", error);
        res.status(500).json({ message: "Error fetching reminders" });
    }
};

// Update a reminder
export const updateReminder = async (req, res) => {
    try {
        const { reminderId } = req.params;
        const { reminderType, presetType, customDateTime } = req.body;
        const userId = req.user._id;

        const reminder = await Reminder.findOne({ _id: reminderId, userId });
        if (!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }

        // Update reminder fields
        reminder.reminderType = reminderType;
        if (reminderType === "preset") {
            const task = await Task.findOne({ _id: reminder.taskId });
            const taskDateTime = new Date(`${task.date} ${task.time}`);
            reminder.customDateTime = undefined;
            reminder.presetType = presetType;
        } else {
            reminder.presetType = undefined;
            reminder.customDateTime = new Date(customDateTime);
        }

        await reminder.save();
        res.json(reminder);
    } catch (error) {
        console.error("Error updating reminder:", error);
        res.status(500).json({ message: "Error updating reminder" });
    }
};

// Delete a reminder
export const deleteReminder = async (req, res) => {
    try {
        const { reminderId } = req.params;
        const userId = req.user._id;

        // Validate reminderId
        if (!reminderId) {
            return res.status(400).json({ message: "Reminder ID is required" });
        }

        // Find and delete the reminder
        const reminder = await Reminder.findOneAndDelete({ _id: reminderId, userId });
        if (!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }

        // Emit reminder deletion event
        dbEvents.emit("db_change", {
            operation: "delete",
            collection: "reminders",
            message: "Reminder deleted",
            type: "reminder",
        });

        res.json({ message: "Reminder deleted successfully" });
    } catch (error) {
        console.error("Error deleting reminder:", error);
        res.status(500).json({ message: "Error deleting reminder" });
    }
};

// Get all active reminders for a user
export const getUserReminders = async (req, res) => {
    try {
        const userId = req.user._id;
        const reminders = await Reminder.find({ userId, isActive: true })
            .populate("taskId", "task date time")
            .sort({ reminderTime: 1 });

        res.json(reminders);
    } catch (error) {
        console.error("Error fetching user reminders:", error);
        res.status(500).json({ message: "Error fetching reminders" });
    }
};

// Add the simplified setTaskReminder function that emits notifications
export const setTaskReminder = async (req, res) => {
    try {
        const { taskId, reminderTime, userId } = req.body;

        // Validate required fields
        if (!taskId || !reminderTime || !userId) {
            return res.status(400).json({
                success: false,
                message: "Task ID, reminder time, and user ID are required",
            });
        }

        // Verify the task exists and belongs to the user
        const task = await Task.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or does not belong to the user",
            });
        }

        // Create the reminder using the reminder service
        const reminder = await reminderService.createReminder(taskId, reminderTime, userId);

        // Emit notification that reminder was set
        dbEvents.emit("db_change", {
            operation: "reminder",
            collection: "reminders",
            message: `🔔 Reminder set for "${task.task}"`,
            type: "reminder",
            data: {
                taskId: task._id,
                taskTitle: task.task,
                reminderTime: reminder.reminderTime,
            },
        });

        res.status(201).json({
            success: true,
            message: "Reminder set successfully",
            data: reminder,
        });
    } catch (error) {
        console.error("Error setting reminder:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to set reminder",
        });
    }
};
