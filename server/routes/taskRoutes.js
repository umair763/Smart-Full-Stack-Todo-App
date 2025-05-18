const express = require("express");
const { getTasks, createTask, deleteTask } = require("../controllers/taskControllers");
const authenticator = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticator, getTasks);
router.post("/", authenticator, createTask);
router.delete("/:id", authenticator, deleteTask);

module.exports = router;
