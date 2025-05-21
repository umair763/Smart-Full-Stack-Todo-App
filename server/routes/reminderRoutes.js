import express from "express";
import * as reminderController from "../controllers/reminderController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// Add our new simplified endpoint
router.post("/", reminderController.setTaskReminder);

// Keep existing routes
router.post("/create", reminderController.createReminder);
router.get("/task/:taskId", reminderController.getTaskReminders);
router.get("/user", reminderController.getUserReminders);
router.put("/:reminderId", reminderController.updateReminder);
router.delete("/:reminderId", reminderController.deleteReminder);

export default router;
 