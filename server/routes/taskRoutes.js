const express = require("express");
const { getTasks, createTask, deleteTask, updateTask, getTaskStats, updateTaskStatus } = require("../controllers/taskControllers");
const authenticator = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticator, getTasks);
router.post("/", authenticator, createTask);
router.put("/:id", authenticator, updateTask);
router.delete("/:id", authenticator, deleteTask);
router.get("/stats", authenticator, getTaskStats);
router.patch("/:id/status", authenticator, updateTaskStatus);

module.exports = router;
