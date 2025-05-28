import Streak from "../models/Streak.js";
import Task from "../models/Task.js";

// Get user's streak data
export const getUserStreak = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find or create streak record
        let streak = await Streak.findOrCreateForUser(userId);

        // Update streak with latest task data
        await updateStreakFromTasks(userId);

        // Refresh the streak data
        streak = await Streak.findOne({ userId });

        res.json({
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            productivityScore: streak.productivityMetrics.overallScore,
            weeklyAverage: streak.productivityMetrics.weeklyAverage,
            monthlyAverage: streak.productivityMetrics.monthlyAverage,
            isStreakActive: streak.isStreakActive,
            daysSinceLastActivity: streak.daysSinceLastActivity,
            statistics: streak.statistics,
        });
    } catch (error) {
        console.error("Get user streak error:", error);
        res.status(500).json({ message: "Error fetching streak data" });
    }
};

// Update streak when task is completed/updated with retry logic
export const updateStreakFromTasks = async (userId, maxRetries = 3) => {
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            // Get all tasks for the user
            const tasks = await Task.find({ userId }).sort({ date: 1 });

            // Find or create streak record (get fresh copy each time)
            let streak = await Streak.findOrCreateForUser(userId);

            // Group tasks by date
            const tasksByDate = {};

            tasks.forEach((task) => {
                if (!task.date) return;

                const dateStr = task.date; // DD/MM/YYYY format
                if (!tasksByDate[dateStr]) {
                    tasksByDate[dateStr] = {
                        total: 0,
                        completed: 0,
                    };
                }

                tasksByDate[dateStr].total++;
                if (task.completed) {
                    tasksByDate[dateStr].completed++;
                }
            });

            // Clear existing daily activities to avoid duplicates
            streak.dailyActivities = [];

            // Update daily activities for each date
            for (const [dateStr, data] of Object.entries(tasksByDate)) {
                try {
                    // Convert DD/MM/YYYY to Date object
                    const [day, month, year] = dateStr.split("/");
                    const date = new Date(year, month - 1, day);

                    if (!isNaN(date.getTime())) {
                        streak.updateDailyActivity(date, data.completed, data.total);
                    }
                } catch (error) {
                    console.error(`Error processing date ${dateStr}:`, error);
                }
            }

            // Calculate streaks and productivity score
            streak.calculateStreaks();
            streak.calculateProductivityScore();

            // Update statistics
            const activeDays = streak.dailyActivities.filter((a) => a.isActiveDay).length;
            const totalCompleted = streak.dailyActivities.reduce((sum, a) => sum + a.tasksCompleted, 0);

            streak.statistics.totalActiveDays = activeDays;
            streak.statistics.totalTasksCompleted = totalCompleted;
            streak.statistics.averageTasksPerDay = activeDays > 0 ? Math.round((totalCompleted / activeDays) * 100) / 100 : 0;

            // Try to save with retry logic
            await streak.save();
            return streak;
        } catch (error) {
            if (error.name === "VersionError" && retryCount < maxRetries - 1) {
                retryCount++;
                console.log(`Retry attempt ${retryCount} for streak update due to version conflict`);
                // Wait a bit before retrying
                await new Promise((resolve) => setTimeout(resolve, 100 * retryCount));
                continue;
            }

            console.error("Update streak from tasks error:", error);
            throw error;
        }
    }

    throw new Error(`Failed to update streak after ${maxRetries} attempts`);
};

// Get detailed productivity analytics
export const getProductivityAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        const { period = "weekly" } = req.query;

        // Update streak data first
        await updateStreakFromTasks(userId);

        const streak = await Streak.findOne({ userId });
        if (!streak) {
            return res.json({
                weeklyTrends: [],
                productivityScore: 0,
                streakData: { current: 0, longest: 0 },
            });
        }

        // Calculate trends based on period
        let trends = [];
        const now = new Date();

        if (period === "weekly") {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                const activity = streak.dailyActivities.find((a) => {
                    const activityDate = new Date(a.date);
                    activityDate.setHours(0, 0, 0, 0);
                    return activityDate.getTime() === date.getTime();
                });

                trends.push({
                    day: date.toLocaleDateString("en-US", { weekday: "short" }),
                    name: date.toLocaleDateString("en-US", { weekday: "short" }), // Add name for consistency
                    fullDate: date.toLocaleDateString("en-GB"), // DD/MM/YYYY format
                    total: activity ? activity.totalTasks : 0,
                    completed: activity ? activity.tasksCompleted : 0,
                    pending: activity ? activity.totalTasks - activity.tasksCompleted : 0,
                    productivity: activity ? activity.completionRate : 0,
                    isActiveDay: activity ? activity.isActiveDay : false,
                });
            }
        } else if (period === "monthly") {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() - i * 7);
                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekStart.getDate() - 6);

                const weekActivities = streak.dailyActivities.filter((a) => {
                    const activityDate = new Date(a.date);
                    activityDate.setHours(0, 0, 0, 0);
                    weekStart.setHours(0, 0, 0, 0);
                    weekEnd.setHours(23, 59, 59, 999);
                    return activityDate >= weekStart && activityDate <= weekEnd;
                });

                const totalTasks = weekActivities.reduce((sum, a) => sum + a.totalTasks, 0);
                const completedTasks = weekActivities.reduce((sum, a) => sum + a.tasksCompleted, 0);
                const avgProductivity =
                    weekActivities.length > 0
                        ? weekActivities.reduce((sum, a) => sum + a.completionRate, 0) / weekActivities.length
                        : 0;

                trends.push({
                    name: `Week ${4 - i}`,
                    fullDate: `${weekStart.toLocaleDateString("en-GB")} - ${weekEnd.toLocaleDateString("en-GB")}`,
                    total: totalTasks,
                    completed: completedTasks,
                    pending: totalTasks - completedTasks,
                    productivity: Math.round(avgProductivity * 100) / 100,
                });
            }
        }

        res.json({
            weeklyTrends: trends,
            productivityScore: streak.productivityMetrics.overallScore,
            streakData: {
                current: streak.currentStreak.count,
                longest: streak.longestStreak.count,
                isActive: streak.isStreakActive,
                daysSinceLastActivity: streak.daysSinceLastActivity,
            },
            metrics: {
                weeklyAverage: streak.productivityMetrics.weeklyAverage,
                monthlyAverage: streak.productivityMetrics.monthlyAverage,
                totalActiveDays: streak.statistics.totalActiveDays,
                averageTasksPerDay: streak.statistics.averageTasksPerDay,
            },
        });
    } catch (error) {
        console.error("Get productivity analytics error:", error);
        res.status(500).json({ message: "Error fetching productivity analytics" });
    }
};

// Manual streak update (for testing or admin purposes)
export const updateStreak = async (req, res) => {
    try {
        const userId = req.user._id;
        const streak = await updateStreakFromTasks(userId);

        res.json({
            message: "Streak updated successfully",
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            productivityScore: streak.productivityMetrics.overallScore,
        });
    } catch (error) {
        console.error("Manual streak update error:", error);
        res.status(500).json({ message: "Error updating streak" });
    }
};

// Get streak history
export const getStreakHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { days = 30 } = req.query;

        const streak = await Streak.findOne({ userId });
        if (!streak) {
            return res.json({ history: [] });
        }

        const now = new Date();
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const history = streak.dailyActivities
            .filter((activity) => new Date(activity.date) >= cutoffDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((activity) => ({
                date: activity.date,
                tasksCompleted: activity.tasksCompleted,
                totalTasks: activity.totalTasks,
                completionRate: activity.completionRate,
                isActiveDay: activity.isActiveDay,
            }));

        res.json({ history });
    } catch (error) {
        console.error("Get streak history error:", error);
        res.status(500).json({ message: "Error fetching streak history" });
    }
};
