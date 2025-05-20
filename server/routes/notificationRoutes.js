const express = require("express");
const {
    getNotifications,
    createNotification,
    deleteNotification,
    markAllAsRead,
    markAsRead,
} = require("../controllers/notificationControllers");
const authenticator = require("../middleware/auth");
const router = express.Router();

// Get all notifications for current user
router.get("/", authenticator, getNotifications);

// Create a new notification
router.post("/", authenticator, createNotification);

// Delete a notification
router.delete("/:id", authenticator, deleteNotification);

// Mark all notifications as read
router.patch("/mark-all-read", authenticator, markAllAsRead);

// Mark a specific notification as read
router.patch("/:id/read", authenticator, markAsRead);

module.exports = router;
