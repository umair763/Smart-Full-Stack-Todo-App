import Notification from "../models/Notification.js";

// Get all notifications for a user
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// Create a new notification
export const createNotification = async (req, res) => {
    try {
        const { message, type } = req.body;
        const notification = new Notification({
            userId: req.user._id,
            message,
            type,
        });
        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        console.error("Create notification error:", error);
        res.status(500).json({ message: "Error creating notification" });
    }
};

// Delete a notification
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
        res.json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ message: "Error deleting notification" });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
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
