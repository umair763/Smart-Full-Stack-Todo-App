import express from "express";
import { getUserStreak, getProductivityAnalytics, updateStreak, getStreakHistory } from "../controllers/streakController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get user's current streak data
router.get("/", getUserStreak);

// Get detailed productivity analytics
router.get("/analytics", getProductivityAnalytics);

// Manual streak update
router.post("/update", updateStreak);

// Get streak history
router.get("/history", getStreakHistory);

export default router;
