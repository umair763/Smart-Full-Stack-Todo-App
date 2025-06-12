import Task from "../models/Task.js";
import { dbEvents } from "../index.js";
import Notification from "../models/Notification.js";
import Dependency from "../models/Dependency.js";
import { updateStreakFromTasks } from "./streakController.js";

// Get all tasks for a user
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id })
            .populate({
                path: "subtasks",
                options: { sort: { createdAt: -1 } },
            })
            .sort({ createdAt: -1 });

        // Add completion counts for each task
        const tasksWithCounts = tasks.map((task) => {
            const subtaskCount = task.subtasks.length;
            const completedSubtasks = task.subtasks.filter((subtask) => subtask.status).length;
            return {
                ...task.toObject(),
                subtaskCount,
                completedSubtasks,
            };
        });

        res.json(tasksWithCounts);
    } catch (error) {
        console.error("Get tasks error:", error);
        res.status(500).json({ message: "Error fetching tasks" });
    }
};

// Create a new task
export const createTask = async (req, res) => {
    try {
        const { task, date, time, priority } = req.body;

        // Check for duplicate task
        const existingTask = await Task.findOne({
            userId: req.user._id,
            task,
            date,
            time,
        });

        if (existingTask) {
            return res.status(400).json({ message: "A task with the same title, date, and time already exists" });
        }

        // Validate priority
        const validPriorities = ["High", "Medium", "Low"];
        const taskPriority = validPriorities.includes(priority) ? priority : "Medium";

        const newTask = new Task({
            userId: req.user._id,
            task,
            date,
            time,
            priority: taskPriority,
            completed: false,
        });

        await newTask.save();

        // Save notification to DB
        const savedNotification = await Notification.create({
            userId: req.user._id,
            type: "create",
            message: `Task "${task}" created`,
            data: { taskId: newTask._id },
        });

        // Emit task creation event (real-time)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                ...savedNotification.toObject(),
                type: "create",
                message: `Task "${task}" created`,
                persistent: true,
                read: false,
            });
        }

        // Update streak
        try {
            await updateStreakFromTasks(req.user._id);
        } catch (streakError) {
            console.error("Streak update failed during task creation:", streakError);
            // Don't fail the task creation if streak update fails
        }

        res.status(201).json(newTask);
    } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ message: "Error creating task" });
    }
};

// Update a task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { task, date, time, priority, color, completed } = req.body;

        // Map color to priority if color is provided
        const colorToPriority = {
            red: "High",
            yellow: "Medium",
            green: "Low",
        };

        // Determine the priority based on color or direct priority input
        let taskPriority = priority;
        if (color && colorToPriority[color]) {
            taskPriority = colorToPriority[color];
        }

        // Validate priority
        const validPriorities = ["High", "Medium", "Low"];
        taskPriority = validPriorities.includes(taskPriority) ? taskPriority : "Medium";

        // If date or time is being updated, validate dependency constraints
        if (date || time) {
            const currentTask = await Task.findById(id);
            if (!currentTask) {
                return res.status(404).json({ message: "Task not found" });
            }

            const newDate = date || currentTask.date;
            const newTime = time || currentTask.time;
            const newDateTime = new Date(newDate.split("/").reverse().join("-") + " " + newTime);

            // Check if this task is an independent task (prerequisite) for other tasks
            const dependentTasks = await Dependency.find({ prerequisiteTaskId: id }).populate("dependentTaskId", "task date time");
            for (const dep of dependentTasks) {
                const dependentDateTime = new Date(
                    dep.dependentTaskId.date.split("/").reverse().join("-") + " " + dep.dependentTaskId.time
                );
                // Independent task deadline should not be earlier than dependent task deadline
                if (newDateTime < dependentDateTime) {
                    return res.status(400).json({
                        message: `Cannot update task date/time because dependent task "${dep.dependentTaskId.task}" (due ${dep.dependentTaskId.date} ${dep.dependentTaskId.time}) has a later deadline. As an independent task, this task must be due after or at the same time as its dependent tasks.`,
                    });
                }
            }

            // Check if this task depends on other tasks (prerequisites)
            const prerequisites = await Dependency.find({ dependentTaskId: id }).populate("prerequisiteTaskId", "task date time");
            for (const dep of prerequisites) {
                const prerequisiteDateTime = new Date(
                    dep.prerequisiteTaskId.date.split("/").reverse().join("-") + " " + dep.prerequisiteTaskId.time
                );
                // Dependent task deadline should not be later than independent task deadline
                if (newDateTime > prerequisiteDateTime) {
                    return res.status(400).json({
                        message: `Cannot update task date/time because this task depends on "${dep.prerequisiteTaskId.task}" (due ${dep.prerequisiteTaskId.date} ${dep.prerequisiteTaskId.time}). As a dependent task, this task must be due before or at the same time as its independent task.`,
                    });
                }
            }
        }

        const updatedTask = await Task.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            {
                task,
                date,
                time,
                priority: taskPriority,
                completed: completed !== undefined ? completed : false,
            },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Save notification to DB
        const savedNotification = await Notification.create({
            userId: req.user._id,
            type: "update",
            message: `Task "${task}" updated`,
            data: { taskId: updatedTask._id },
        });

        // Emit task update event (real-time)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                ...savedNotification.toObject(),
                type: "update",
                message: `Task "${task}" updated`,
                persistent: true,
                read: false,
            });
        }

        // Update streak
        try {
            await updateStreakFromTasks(req.user._id);
        } catch (streakError) {
            console.error("Streak update failed during task update:", streakError);
            // Don't fail the task update if streak update fails
        }

        res.json(updatedTask);
    } catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({ message: "Error updating task" });
    }
};

// Delete a task
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmCascade } = req.body; // Flag to confirm cascade deletion

        // Check if this task is an independent task (prerequisite) for any other task
        const dependentTasks = await Dependency.find({ prerequisiteTaskId: id }).populate("dependentTaskId", "task");

        if (dependentTasks.length > 0 && !confirmCascade) {
            // Return information about dependent tasks for confirmation
            const dependentTaskNames = dependentTasks.map((dep) => dep.dependentTaskId.task);
            return res.status(409).json({
                message: `This task has ${dependentTasks.length} dependent task(s). Deleting this task will also delete all its dependent tasks.`,
                dependentTasks: dependentTasks.map((dep) => ({
                    id: dep.dependentTaskId._id,
                    name: dep.dependentTaskId.task,
                })),
                requiresConfirmation: true,
                dependentTaskNames,
            });
        }

        const deletedTask = await Task.findOneAndDelete({ _id: id, userId: req.user._id });
        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // If there are dependent tasks and user confirmed cascade deletion
        if (dependentTasks.length > 0 && confirmCascade) {
            // Delete all dependent tasks
            const dependentTaskIds = dependentTasks.map((dep) => dep.dependentTaskId._id);
            await Task.deleteMany({ _id: { $in: dependentTaskIds }, userId: req.user._id });

            // Clean up all related dependencies
            await Dependency.deleteMany({
                $or: [{ prerequisiteTaskId: id }, { dependentTaskId: { $in: dependentTaskIds } }],
            });

            // Save notification for cascade deletion
            const savedNotification = await Notification.create({
                userId: req.user._id,
                type: "delete",
                message: `Task "${deletedTask.task}" and ${dependentTasks.length} dependent task(s) deleted`,
                data: {
                    taskId: deletedTask._id,
                    cascadeDeleted: dependentTaskIds.length,
                },
            });

            // Emit cascade deletion event
            const io = req.app.get("io");
            if (io && io.sendNotification) {
                io.sendNotification(req.user._id, {
                    ...savedNotification.toObject(),
                    type: "delete",
                    message: `Task "${deletedTask.task}" and ${dependentTasks.length} dependent task(s) deleted`,
                    persistent: true,
                    read: false,
                });
            }
        } else {
            // Clean up any dependencies where this task was a dependent task
            await Dependency.deleteMany({ dependentTaskId: id });

            // Save notification for regular deletion
            const savedNotification = await Notification.create({
                userId: req.user._id,
                type: "delete",
                message: `Task "${deletedTask.task}" deleted`,
                data: { taskId: deletedTask._id },
            });

            // Emit task deletion event
            const io = req.app.get("io");
            if (io && io.sendNotification) {
                io.sendNotification(req.user._id, {
                    ...savedNotification.toObject(),
                    type: "delete",
                    message: `Task "${deletedTask.task}" deleted`,
                    persistent: true,
                    read: false,
                });
            }
        }

        // Update streak
        try {
            await updateStreakFromTasks(req.user._id);
        } catch (streakError) {
            console.error("Streak update failed during task deletion:", streakError);
            // Don't fail the task deletion if streak update fails
        }

        res.json({
            message:
                dependentTasks.length > 0 && confirmCascade
                    ? `Task and ${dependentTasks.length} dependent task(s) deleted successfully`
                    : "Task deleted successfully",
            cascadeDeleted: dependentTasks.length > 0 && confirmCascade ? dependentTasks.length : 0,
        });
    } catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({ message: "Error deleting task" });
    }
};

// Get task statistics
export const getTaskStats = async (req, res) => {
    try {
        const { period } = req.query;
        const userId = req.user._id;

        // Basic counts
        const totalTasks = await Task.countDocuments({ userId });
        const completedTasks = await Task.countDocuments({ userId, completed: true });
        const pendingTasks = await Task.countDocuments({ userId, completed: false });

        // Calculate overdue tasks
        const now = new Date();
        const allTasks = await Task.find({ userId });

        const overdueTasks = allTasks.filter((task) => {
            if (task.completed) return false;
            try {
                // Parse the date and time
                const [day, month, year] = task.date.split("/");
                const [time, period] = task.time.split(" ");
                const [hours, minutes] = time.split(":");

                let hour24 = parseInt(hours);
                if (period === "PM" && hour24 !== 12) hour24 += 12;
                if (period === "AM" && hour24 === 12) hour24 = 0;

                const taskDateTime = new Date(year, month - 1, day, hour24, minutes);
                return taskDateTime < now;
            } catch (error) {
                return false;
            }
        }).length;

        // Priority distribution
        const priorityStats = await Task.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
                    },
                },
            },
        ]);

        const priorityDistribution = {
            High: { total: 0, completed: 0 },
            Medium: { total: 0, completed: 0 },
            Low: { total: 0, completed: 0 },
        };

        priorityStats.forEach((stat) => {
            const priority = stat._id || "Medium";
            priorityDistribution[priority] = {
                total: stat.count,
                completed: stat.completed,
            };
        });

        // Time-based statistics based on period
        let timeStats = [];
        const currentDate = new Date();

        if (period === "weekly") {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(currentDate);
                date.setDate(date.getDate() - i);
                const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}/${date.getFullYear()}`;

                const dayTasks = allTasks.filter((task) => task.date === dateStr);
                timeStats.push({
                    name: date.toLocaleDateString("en-US", { weekday: "short" }),
                    fullDate: date.toLocaleDateString("en-GB"), // Add fullDate for tooltip
                    total: dayTasks.length,
                    completed: dayTasks.filter((t) => t.completed).length,
                    pending: dayTasks.filter((t) => !t.completed).length,
                });
            }
        } else if (period === "monthly") {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(currentDate);
                weekEnd.setDate(weekEnd.getDate() - i * 7);
                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekStart.getDate() - 6);

                const weekTasks = allTasks.filter((task) => {
                    try {
                        const [day, month, year] = task.date.split("/");
                        const taskDate = new Date(year, month - 1, day);
                        // Set hours to compare dates properly
                        taskDate.setHours(0, 0, 0, 0);
                        weekStart.setHours(0, 0, 0, 0);
                        weekEnd.setHours(23, 59, 59, 999);
                        return taskDate >= weekStart && taskDate <= weekEnd;
                    } catch {
                        return false;
                    }
                });

                timeStats.push({
                    name: `Week ${4 - i}`,
                    fullDate: `${weekStart.toLocaleDateString("en-GB")} - ${weekEnd.toLocaleDateString("en-GB")}`,
                    total: weekTasks.length,
                    completed: weekTasks.filter((t) => t.completed).length,
                    pending: weekTasks.filter((t) => !t.completed).length,
                });
            }
        } else if (period === "yearly") {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthTasks = allTasks.filter((task) => {
                    try {
                        const [day, month, year] = task.date.split("/");
                        const taskDate = new Date(year, month - 1, day);
                        return taskDate.getMonth() === monthDate.getMonth() && taskDate.getFullYear() === monthDate.getFullYear();
                    } catch {
                        return false;
                    }
                });

                timeStats.push({
                    name: monthDate.toLocaleDateString("en-US", { month: "short" }),
                    fullDate: monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                    total: monthTasks.length,
                    completed: monthTasks.filter((t) => t.completed).length,
                    pending: monthTasks.filter((t) => !t.completed).length,
                });
            }
        }

        // Calculate productivity metrics
        const recentTasks = allTasks.filter((task) => {
            try {
                const [day, month, year] = task.date.split("/");
                const taskDate = new Date(year, month - 1, day);
                const weekAgo = new Date(currentDate);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return taskDate >= weekAgo;
            } catch {
                return false;
            }
        });

        const productivityScore =
            recentTasks.length > 0 ? Math.round((recentTasks.filter((t) => t.completed).length / recentTasks.length) * 100) : 0;

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
            priorityDistribution,
            timeStats,
            productivityScore,
            period: period || "weekly",
        });
    } catch (error) {
        console.error("Get task stats error:", error);
        res.status(500).json({ message: "Error fetching task statistics" });
    }
};

// Update task completion status
export const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;

        // Ensure completed is a boolean
        if (typeof completed !== "boolean") {
            return res.status(400).json({ message: "Invalid completion status" });
        }

        const task = await Task.findOneAndUpdate({ _id: id, userId: req.user._id }, { completed }, { new: true });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json(task);
    } catch (error) {
        console.error("Update task status error:", error);
        res.status(500).json({ message: "Error updating task status" });
    }
};
