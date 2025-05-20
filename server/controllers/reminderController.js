import { dbEvents } from "../index.js";
import Reminder from "../models/Reminder.js";
import Task from "../models/Task.js";

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

        // Create reminder
        const reminder = new Reminder({
            taskId,
            reminderTime: new Date(reminderTime),
            userId
        });

        await reminder.save();

        // Calculate time until reminder
        const now = new Date();
        const timeUntilReminder = new Date(reminderTime).getTime() - now.getTime();

        // Schedule the reminder notification
        setTimeout(() => {
            // Emit reminder notification with golden bell icon
            dbEvents.emit("db_change", {
                operation: "reminder",
                collection: "reminders",
                message: `🔔 Reminder: "${task.task}" is due now!`,
                type: "reminder",
                data: {
                    taskId: task._id,
                    taskTitle: task.task,
                    reminderTime: reminderTime
                }
            });
        }, timeUntilReminder);

        res.status(201).json({
            message: "Reminder set successfully",
            reminder,
            reminderTime: new Date(reminderTime).toLocaleString()
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

        const reminders = await Reminder.find({ taskId, userId });
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

        const reminder = await Reminder.findOneAndDelete({ _id: reminderId, userId });
        if (!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }

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
            .sort({ customDateTime: 1 });

        res.json(reminders);
    } catch (error) {
        console.error("Error fetching user reminders:", error);
        res.status(500).json({ message: "Error fetching reminders" });
    }
};

// Add the simplified setTaskReminder function that emits notifications
export const setTaskReminder = async (req, res) => {
    try {
        const { taskId, reminderTime } = req.body;

        if (!taskId || !reminderTime) {
            return res.status(400).json({ message: "Task ID and reminder time are required" });
        }

        // Verify the task exists
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Save reminder to DB
        const reminder = new Reminder({ taskId, reminderTime });
        await reminder.save();

        // Emit a notification via the global event emitter
        dbEvents.emit("db_change", {
            operation: "reminder_set",
            collection: "reminders",
            message: `Reminder set on task "${task.task}" for time ${new Date(reminderTime).toLocaleString()}`,
        });

        res.status(201).json({ message: "Reminder set successfully", reminder });
    } catch (error) {
        console.error("Error setting reminder:", error);

        dbEvents.emit("db_change", {
            operation: "reminder_set",
            collection: "reminders",
            error: error.message,
        });

        res.status(500).json({ message: "Failed to set reminder", error: error.message });
    }
};
