import express from "express";
import * as userController from "../controllers/userController.js";
import { getTasks, createTask, deleteTask, updateTask } from "../controllers/taskController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/google-signin", userController.googleSignIn);

// Protected routes
router.use(auth);
router.get("/profile", userController.getProfile);
router.put("/username", userController.updateUsername);
router.put("/profile-image", userController.updateProfileImage);
router.delete("/account", userController.deleteAccount);

// Task routes
router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.delete("/tasks/:id", deleteTask);
router.put("/tasks/:id", updateTask);

export default router;
