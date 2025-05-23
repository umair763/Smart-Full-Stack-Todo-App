import express from "express";
import * as dependencyController from "../controllers/dependencyController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// Dependency routes
router.get("/", dependencyController.getDependencies);
router.get("/task/:taskId", dependencyController.getTaskDependencies);
router.post("/", dependencyController.createDependency);
router.put("/:id", dependencyController.updateDependency);
router.delete("/:id", dependencyController.deleteDependency);
router.post("/validate", dependencyController.validateDependency);

export default router;
