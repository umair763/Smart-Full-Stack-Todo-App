import Reminder from "../models/Reminder.js";
import Task from "../models/Task.js";
import { dbEvents } from "../index.js";
import Notification from "../models/Notification.js";

class ReminderService {
    constructor() {
        this.checkInterval = 60000; // Check every minute
        this.startChecking();
    }

    async startChecking() {
        // Initial check
        await this.checkDueReminders();

        // Set up interval for checking
        setInterval(async () => {
            await this.checkDueReminders();
        }, this.checkInterval);
    }

    async checkDueReminders() {
        try {
            const now = new Date();
            const dueReminders = await Reminder.find({
                reminderTime: { $lte: now },
                isActive: true,
            }).populate("taskId");

            for (const reminder of dueReminders) {
                if (reminder.taskId) {
                    // Save notification to DB
                    await Notification.create({
                        userId: reminder.userId,
                        type: "reminder",
                        message: `🔔 Reminder: "${reminder.taskId.task}" is due now!`,
                        data: {
                            taskId: reminder.taskId._id,
                            taskTitle: reminder.taskId.task,
                            reminderTime: reminder.reminderTime,
                        },
                    });
                    // Emit reminder notification
                    dbEvents.emit("db_change", {
                        operation: "reminder",
                        collection: "reminders",
                        message: `🔔 Reminder: "${reminder.taskId.task}" is due now!`,
                        type: "reminder",
                        data: {
                            taskId: reminder.taskId._id,
                            taskTitle: reminder.taskId.task,
                            reminderTime: reminder.reminderTime,
                        },
                    });
                    // Mark reminder as inactive
                    reminder.isActive = false;
                    await reminder.save();
                }
            }
        } catch (error) {
            console.error("Error checking due reminders:", error);
        }
    }

    async createReminder(taskId, reminderTime, userId) {
        try {
            // Validate inputs
            if (!taskId || !reminderTime || !userId) {
                throw new Error("Missing required fields: taskId, reminderTime, or userId");
            }

            // Validate reminder time
            const reminderDateTime = new Date(reminderTime);
            if (isNaN(reminderDateTime.getTime())) {
                throw new Error("Invalid reminder time format");
            }

            if (reminderDateTime <= new Date()) {
                throw new Error("Reminder time must be in the future");
            }

            // Check if a reminder already exists for this task
            const existingReminder = await Reminder.findOne({
                taskId,
                userId,
                isActive: true,
            });

            if (existingReminder) {
                // Update existing reminder
                existingReminder.reminderTime = reminderDateTime;
                await existingReminder.save();
                return existingReminder;
            }

            // Create new reminder
            const reminder = new Reminder({
                taskId,
                reminderTime: reminderDateTime,
                userId,
                isActive: true,
            });

            await reminder.save();
            return reminder;
        } catch (error) {
            console.error("Error creating reminder:", error);
            throw error;
        }
    }
}

// Create a singleton instance
const reminderService = new ReminderService();
export default reminderService;
