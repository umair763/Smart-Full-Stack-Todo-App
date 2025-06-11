import express from "express";
import {
    getNotifications,
    createNotification,
    deleteNotification,
    clearNotifications,
    markAllAsRead,
    markAsRead,
    getNotificationsSince,
} from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all notifications for a user
router.get("/", authenticateToken, getNotifications);

// Get notifications since a specific timestamp (for polling)
router.get("/since/:timestamp", authenticateToken, getNotificationsSince);

// Create a new notification
router.post("/", authenticateToken, createNotification);

// Mark all notifications as read
router.put("/read-all", authenticateToken, markAllAsRead);

// Mark a specific notification as read
router.put("/:id/read", authenticateToken, markAsRead);

// Delete a specific notification
router.delete("/:id", authenticateToken, deleteNotification);

// Clear all notifications
router.delete("/", authenticateToken, clearNotifications);

export default router;
