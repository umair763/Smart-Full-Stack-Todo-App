const Notification = require("../models/Notification");
const { io } = require("../socket");

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ timestamp: -1 }).limit(50);
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// Get notifications since a specific timestamp (for polling)
export const getNotificationsSince = async (req, res) => {
    try {
        const { timestamp } = req.params;
        const since = new Date(Number.parseInt(timestamp));

        if (isNaN(since.getTime())) {
            return res.status(400).json({ message: "Invalid timestamp format" });
        }

        const notifications = await Notification.find({
            userId: req.user._id,
            createdAt: { $gt: since },
        })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notifications);
    } catch (error) {
        console.error("Get notifications since error:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// Create a new notification
exports.createNotification = async (req, res) => {
    try {
        const { type, message, data } = req.body;
        const notification = new Notification({
            user: req.user._id,
            type,
            message,
            data,
            timestamp: new Date(),
        });

        await notification.save();

        // Emit socket event for real-time update
        io.to(req.user._id.toString()).emit("notification", notification);

        res.status(201).json(notification);
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ message: "Error creating notification" });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Emit socket event for real-time update
        io.to(req.user._id.toString()).emit("notificationUpdate", {
            type: "delete",
            notificationId: req.params.id,
        });

        res.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Error deleting notification" });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });

        // Emit socket event for real-time update
        io.to(req.user._id.toString()).emit("notificationUpdate", { type: "markAllRead" });

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
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

export const clearNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.deleteMany({ userId });
        res.json({ message: "All notifications cleared" });
    } catch (error) {
        res.status(500).json({ message: "Error clearing notifications" });
    }
};

// Delete all notifications
exports.deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });

        // Emit socket event for real-time update
        io.to(req.user._id.toString()).emit("notificationUpdate", { type: "clearAll" });

        res.json({ message: "All notifications deleted" });
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        res.status(500).json({ message: "Error deleting all notifications" });
    }
};

// Create a notification for CRUD operations
exports.createCRUDNotification = async (userId, type, message, data = {}) => {
    try {
        const notification = new Notification({
            user: userId,
            type,
            message,
            data,
            timestamp: new Date(),
        });

        await notification.save();

        // Emit socket event for real-time update
        io.to(userId.toString()).emit("notification", notification);

        return notification;
    } catch (error) {
        console.error("Error creating CRUD notification:", error);
        throw error;
    }
};
