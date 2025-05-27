import Task from "../models/Task.js";
import { dbEvents } from "../index.js";
import Notification from "../models/Notification.js";
import Dependency from "../models/Dependency.js";

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
        const totalTasks = await Task.countDocuments({ userId: req.user._id });
        const completedTasks = await Task.countDocuments({
            userId: req.user._id,
            completed: true,
        });
        const pendingTasks = await Task.countDocuments({
            userId: req.user._id,
            completed: false,
        });

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
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
