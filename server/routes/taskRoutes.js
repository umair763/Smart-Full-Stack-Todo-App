import express from "express";
import * as taskController from "../controllers/taskController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// Task routes
router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
router.get("/stats", taskController.getTaskStats);
router.patch("/:id/status", taskController.updateTaskStatus);

export default router;
