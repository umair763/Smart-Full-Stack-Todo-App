import express from "express";
import {
    getNotifications,
    createNotification,
    deleteNotification,
    markAllAsRead,
    markAsRead,
} from "../controllers/notificationController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All notification routes are protected
router.use(auth);

// Get all notifications for current user
router.get("/", getNotifications);

// Create a new notification
router.post("/", createNotification);

// Delete a notification
router.delete("/:id", deleteNotification);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Mark a specific notification as read
router.patch("/:id/read", markAsRead);

export default router;
