import express from "express";
import * as subtaskController from "../controllers/subtaskController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// Subtask routes
router.get("/:taskId/subtasks", subtaskController.getSubtasks);
router.post("/:taskId/subtasks", subtaskController.createSubtask);
router.put("/:taskId/subtasks/:subtaskId", subtaskController.updateSubtask);
router.delete("/:taskId/subtasks/:subtaskId", subtaskController.deleteSubtask);
router.patch("/:taskId/subtasks/:subtaskId/status", subtaskController.updateSubtaskStatus);

export default router;
