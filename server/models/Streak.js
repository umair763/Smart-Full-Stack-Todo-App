import mongoose from "mongoose";

const streakSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Current streak information
        currentStreak: {
            count: {
                type: Number,
                default: 0,
                min: 0,
            },
            startDate: {
                type: Date,
                default: null,
            },
            lastActiveDate: {
                type: Date,
                default: null,
            },
        },

        // Longest streak record
        longestStreak: {
            count: {
                type: Number,
                default: 0,
                min: 0,
            },
            startDate: {
                type: Date,
                default: null,
            },
            endDate: {
                type: Date,
                default: null,
            },
        },

        // Daily activity tracking
        dailyActivities: [
            {
                date: {
                    type: Date,
                    required: true,
                },
                tasksCompleted: {
                    type: Number,
                    default: 0,
                    min: 0,
                },
                totalTasks: {
                    type: Number,
                    default: 0,
                    min: 0,
                },
                completionRate: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 100,
                },
                isActiveDay: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        // Productivity metrics
        productivityMetrics: {
            weeklyAverage: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            monthlyAverage: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            overallScore: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            lastCalculated: {
                type: Date,
                default: Date.now,
            },
        },

        // Streak rules configuration
        streakRules: {
            minimumTasksForActiveDay: {
                type: Number,
                default: 1,
            },
            minimumCompletionRate: {
                type: Number,
                default: 50, // 50% completion rate required for active day
            },
            gracePeriodHours: {
                type: Number,
                default: 24, // Allow 24 hours grace period
            },
        },

        // Statistics
        statistics: {
            totalActiveDays: {
                type: Number,
                default: 0,
            },
            totalTasksCompleted: {
                type: Number,
                default: 0,
            },
            averageTasksPerDay: {
                type: Number,
                default: 0,
            },
            bestMonth: {
                month: Number,
                year: Number,
                score: Number,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        versionKey: false, // Disable versioning to prevent conflicts
    }
);

// Indexes for performance
streakSchema.index({ userId: 1, "dailyActivities.date": -1 });
streakSchema.index({ "currentStreak.lastActiveDate": -1 });
streakSchema.index({ "longestStreak.count": -1 });

// Virtual for current streak status
streakSchema.virtual("isStreakActive").get(function () {
    if (!this.currentStreak.lastActiveDate) return false;

    const now = new Date();
    const lastActive = new Date(this.currentStreak.lastActiveDate);
    const hoursDiff = (now - lastActive) / (1000 * 60 * 60);

    return hoursDiff <= this.streakRules.gracePeriodHours;
});

// Virtual for days since last activity
streakSchema.virtual("daysSinceLastActivity").get(function () {
    if (!this.currentStreak.lastActiveDate) return null;

    const now = new Date();
    const lastActive = new Date(this.currentStreak.lastActiveDate);
    return Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
});

// Method to update daily activity
streakSchema.methods.updateDailyActivity = function (date, tasksCompleted, totalTasks) {
    const dateStr = date.toISOString().split("T")[0];
    const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

    // Check if this qualifies as an active day
    const isActiveDay =
        tasksCompleted >= this.streakRules.minimumTasksForActiveDay && completionRate >= this.streakRules.minimumCompletionRate;

    // Find or create daily activity record
    const existingIndex = this.dailyActivities.findIndex((activity) => activity.date.toISOString().split("T")[0] === dateStr);

    const activityData = {
        date: new Date(dateStr),
        tasksCompleted,
        totalTasks,
        completionRate: Math.round(completionRate * 100) / 100,
        isActiveDay,
    };

    if (existingIndex >= 0) {
        this.dailyActivities[existingIndex] = activityData;
    } else {
        this.dailyActivities.push(activityData);
    }

    // Sort activities by date (newest first)
    this.dailyActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Keep only last 365 days
    this.dailyActivities = this.dailyActivities.slice(0, 365);

    return isActiveDay;
};

// Method to calculate and update streaks
streakSchema.methods.calculateStreaks = function () {
    if (this.dailyActivities.length === 0) return;

    // Sort activities by date (newest first)
    const sortedActivities = this.dailyActivities
        .filter((activity) => activity.isActiveDay)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedActivities.length === 0) {
        this.currentStreak.count = 0;
        this.currentStreak.startDate = null;
        this.currentStreak.lastActiveDate = null;
        return;
    }

    // Calculate current streak
    let currentCount = 0;
    let currentStart = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedActivities.length; i++) {
        const activityDate = new Date(sortedActivities[i].date);
        activityDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        // Check if this activity is consecutive
        if (activityDate.getTime() === expectedDate.getTime()) {
            currentCount++;
            currentStart = activityDate;
        } else {
            break;
        }
    }

    // Update current streak
    this.currentStreak.count = currentCount;
    this.currentStreak.startDate = currentStart;
    this.currentStreak.lastActiveDate = currentCount > 0 ? sortedActivities[0].date : null;

    // Calculate longest streak
    let longestCount = 0;
    let longestStart = null;
    let longestEnd = null;
    let tempCount = 0;
    let tempStart = null;

    // Sort all activities by date (oldest first) for longest streak calculation
    const allActivities = this.dailyActivities
        .filter((activity) => activity.isActiveDay)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < allActivities.length; i++) {
        const currentDate = new Date(allActivities[i].date);

        if (i === 0) {
            tempCount = 1;
            tempStart = currentDate;
        } else {
            const prevDate = new Date(allActivities[i - 1].date);
            const daysDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

            if (daysDiff === 1) {
                // Consecutive day
                tempCount++;
            } else {
                // Streak broken, check if it's the longest
                if (tempCount > longestCount) {
                    longestCount = tempCount;
                    longestStart = tempStart;
                    longestEnd = new Date(allActivities[i - 1].date);
                }
                tempCount = 1;
                tempStart = currentDate;
            }
        }
    }

    // Check final streak
    if (tempCount > longestCount) {
        longestCount = tempCount;
        longestStart = tempStart;
        longestEnd = allActivities[allActivities.length - 1] ? new Date(allActivities[allActivities.length - 1].date) : tempStart;
    }

    // Update longest streak
    this.longestStreak.count = Math.max(longestCount, this.longestStreak.count);
    if (longestCount > 0 && longestCount >= this.longestStreak.count) {
        this.longestStreak.startDate = longestStart;
        this.longestStreak.endDate = longestEnd;
    }
};

// Method to calculate productivity score
streakSchema.methods.calculateProductivityScore = function () {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Weekly score (last 7 days)
    const weeklyActivities = this.dailyActivities.filter((activity) => new Date(activity.date) >= weekAgo);

    const weeklyScore =
        weeklyActivities.length > 0
            ? weeklyActivities.reduce((sum, activity) => sum + activity.completionRate, 0) / weeklyActivities.length
            : 0;

    // Monthly score (last 30 days)
    const monthlyActivities = this.dailyActivities.filter((activity) => new Date(activity.date) >= monthAgo);

    const monthlyScore =
        monthlyActivities.length > 0
            ? monthlyActivities.reduce((sum, activity) => sum + activity.completionRate, 0) / monthlyActivities.length
            : 0;

    // Overall score calculation
    const streakBonus = Math.min(this.currentStreak.count * 2, 20); // Max 20 bonus points
    const consistencyBonus = weeklyActivities.filter((a) => a.isActiveDay).length * 2; // 2 points per active day
    const volumeBonus = Math.min(weeklyActivities.reduce((sum, a) => sum + a.tasksCompleted, 0) / 10, 15); // Max 15 points

    const overallScore = Math.min(weeklyScore * 0.4 + monthlyScore * 0.3 + streakBonus + consistencyBonus + volumeBonus, 100);

    // Update metrics
    this.productivityMetrics.weeklyAverage = Math.round(weeklyScore * 100) / 100;
    this.productivityMetrics.monthlyAverage = Math.round(monthlyScore * 100) / 100;
    this.productivityMetrics.overallScore = Math.round(overallScore * 100) / 100;
    this.productivityMetrics.lastCalculated = now;

    return this.productivityMetrics.overallScore;
};

// Static method to find or create streak record for user
streakSchema.statics.findOrCreateForUser = async function (userId) {
    try {
        let streak = await this.findOne({ userId });

        if (!streak) {
            try {
                streak = new this({ userId });
                await streak.save();
            } catch (error) {
                // If creation fails due to duplicate key, try to find again
                if (error.code === 11000) {
                    streak = await this.findOne({ userId });
                    if (!streak) {
                        throw new Error("Failed to create or find streak record");
                    }
                } else {
                    throw error;
                }
            }
        }

        return streak;
    } catch (error) {
        console.error("Error in findOrCreateForUser:", error);
        throw error;
    }
};

const Streak = mongoose.model("Streak", streakSchema);

export default Streak;
