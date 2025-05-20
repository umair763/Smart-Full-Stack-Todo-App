const Notification = require("../models/notificationModel");

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
    try {
        // Find all notifications for the current user, sorted by timestamp (newest first)
        const notifications = await Notification.find({ user: req.user }).sort({ timestamp: -1 }).limit(50); // Limit to 50 most recent notifications

        res.json(notifications);
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch notifications",
            error: err.message,
        });
    }
};

// Create a notification
exports.createNotification = async (req, res) => {
    try {
        const { message, type, data } = req.body;

        // Validate required fields
        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // Create new notification
        const notification = new Notification({
            user: req.user,
            message,
            type: type || "info",
            data,
            read: false,
            timestamp: new Date(),
        });

        // Save notification
        const savedNotification = await notification.save();

        // Emit socket notification if available
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("notification", {
                message,
                type: type || "info",
                data,
                timestamp: new Date(),
                _id: savedNotification._id,
            });
        }

        res.status(201).json(savedNotification);
    } catch (err) {
        res.status(500).json({
            message: "Failed to create notification",
            error: err.message,
        });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the notification and ensure it belongs to the user
        const notification = await Notification.findOne({
            _id: id,
            user: req.user,
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Delete the notification
        await Notification.deleteOne({ _id: id });

        res.json({ message: "Notification deleted successfully" });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete notification",
            error: err.message,
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        // Update all unread notifications for the user
        await Notification.updateMany({ user: req.user, read: false }, { $set: { read: true } });

        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({
            message: "Failed to mark notifications as read",
            error: err.message,
        });
    }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the notification and ensure it belongs to the user
        const notification = await Notification.findOne({
            _id: id,
            user: req.user,
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        // Mark as read
        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (err) {
        res.status(500).json({
            message: "Failed to mark notification as read",
            error: err.message,
        });
    }
};
