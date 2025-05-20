const express = require("express");
const {
    getSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    updateSubtaskStatus,
} = require("../controllers/subtaskControllers");
const authenticator = require("../middleware/auth");
const router = express.Router();

// Get all subtasks for a specific parent task
router.get("/:taskId/subtasks", authenticator, getSubtasks);

// Create a new subtask for a parent task
router.post("/:taskId/subtasks", authenticator, createSubtask);

// Update a subtask
router.put("/subtasks/:subtaskId", authenticator, updateSubtask);

// Delete a subtask
router.delete("/subtasks/:subtaskId", authenticator, deleteSubtask);

// Update just the subtask status
router.patch("/subtasks/:subtaskId/status", authenticator, updateSubtaskStatus);

module.exports = router;
