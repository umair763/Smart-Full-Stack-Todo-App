import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All notification routes are protected
router.use(auth);

// Get all notifications for current user
router.get("/", notificationController.getNotifications);

// Get notifications since a specific timestamp (for polling)
router.get("/since/:timestamp", notificationController.getNotificationsSince);

// Mark a specific notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", notificationController.markAllAsRead);

// Delete a notification
router.delete("/:id", notificationController.deleteNotification);

// Clear all notifications for current user
router.delete("/", notificationController.clearNotifications);

export default router;
