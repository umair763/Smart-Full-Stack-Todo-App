import Notification from "../models/Notification.js";
import { dbEvents } from "../index.js";

// Get all notifications for a user
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50); // Limit to last 50 notifications

        res.json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// Get notifications since a specific timestamp (for polling)
export const getNotificationsSince = async (req, res) => {
    try {
        const { timestamp } = req.params;
        const since = new Date(timestamp);

        if (isNaN(since.getTime())) {
            return res.status(400).json({ message: "Invalid timestamp format" });
        }

        const notifications = await Notification.find({
            userId: req.user._id,
            createdAt: { $gt: since },
        })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to last 20 new notifications

        res.json(notifications);
    } catch (error) {
        console.error("Get notifications since error:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// Create a new notification
export const createNotification = async (req, res) => {
    try {
        const { type, message, data } = req.body;

        if (!type || !message) {
            return res.status(400).json({ message: "Type and message are required" });
        }

        const notification = new Notification({
            userId: req.user._id,
            type,
            message,
            data: data || {},
            read: false,
        });

        await notification.save();

        // Emit notification event for real-time updates (if socket.io is available)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, notification);
        }

        // Emit database change event
        dbEvents.emit("db_change", {
            operation: "create",
            collection: "notifications",
            message: "New notification created",
            type: "notification",
            data: notification,
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error("Create notification error:", error);
        res.status(500).json({ message: "Error creating notification" });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });

        // Emit notification update event
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                type: "markAllRead",
                userId: req.user._id,
            });
        }

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ message: "Error marking notifications as read" });
    }
};

// Mark a specific notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate({ _id: id, userId: req.user._id }, { read: true }, { new: true });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(notification);
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ message: "Error marking notification as read" });
    }
};

// Delete a specific notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            userId: req.user._id,
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Emit notification deletion event
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                type: "delete",
                notificationId: id,
                userId: req.user._id,
            });
        }

        res.json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ message: "Error deleting notification" });
    }
};

// Clear all notifications
export const clearNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user._id });

        // Emit clear all notifications event
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                type: "clearAll",
                userId: req.user._id,
            });
        }

        res.json({ message: "All notifications cleared successfully" });
    } catch (error) {
        console.error("Clear notifications error:", error);
        res.status(500).json({ message: "Error clearing notifications" });
    }
};
