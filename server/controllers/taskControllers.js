const Task = require("../models/taskModel");

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch tasks", error: err.message });
    }
};

exports.createTask = async (req, res) => {
    const { color, task, date, time } = req.body;

    if (!color || !task || !date || !time) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const newTask = new Task({
            color,
            task,
            date,
            time,
            status: false, // Default status
            user: req.user, // Associate task with logged-in user
        });

        const savedTask = await newTask.save();

        // Emit Socket.io event for task creation
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("taskCreated", {
                task: savedTask,
                message: "New task created successfully",
            });
        }

        res.status(201).json(savedTask);
    } catch (err) {
        res.status(500).json({ message: "Failed to add task", error: err.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { color, task, date, time, status } = req.body;

        // Validate required fields
        if (!color || !task || !date || !time) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Find the task and ensure it belongs to the user
        const existingTask = await Task.findOne({ _id: id, user: req.user });
        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { color, task, date, time, status: status !== undefined ? status : existingTask.status },
            { new: true } // Return the updated document
        );

        // Emit Socket.io event for task update
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("taskUpdated", {
                task: updatedTask,
                message: "Task updated successfully",
            });
        }

        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ message: "Failed to update task", error: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findOne({ _id: id, user: req.user }); // Ensure task belongs to user

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        await Task.findByIdAndDelete(id);

        // Emit Socket.io event for task deletion
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("taskDeleted", {
                taskId: id,
                message: "Task deleted successfully",
            });
        }

        res.json({ message: "Task deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete task", error: err.message });
    }
};

// Add a specific endpoint for updating task status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined) {
            return res.status(400).json({ message: "Status is required" });
        }

        const task = await Task.findOne({ _id: id, user: req.user });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const updatedTask = await Task.findByIdAndUpdate(id, { status }, { new: true });

        // Emit Socket.io event for status change
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        if (io && connectedUsers.has(req.user.toString())) {
            const socketId = connectedUsers.get(req.user.toString());
            io.to(socketId).emit("taskStatusChanged", {
                task: updatedTask,
                message: status ? "Task marked as completed" : "Task marked as incomplete",
            });
        }

        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ message: "Failed to update task status", error: err.message });
    }
};

// Task statistics endpoint for Insights page
exports.getTaskStats = async (req, res) => {
    try {
        const { period } = req.query; // Get period (weekly, monthly, yearly)
        const userId = req.user;

        // Get all user tasks
        const tasks = await Task.find({ user: userId });

        if (!tasks || tasks.length === 0) {
            return res.json({
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                stats: [],
            });
        }

        // Calculate overall statistics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task) => task.status).length;
        const pendingTasks = totalTasks - completedTasks;

        // Format data based on period
        let stats = [];
        const now = new Date();

        switch (period) {
            case "weekly":
                // Get data for current week (last 7 days)
                const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                // Initialize data for each day
                stats = daysOfWeek.map((day) => ({
                    name: day,
                    total: 0,
                    completed: 0,
                }));

                // Count tasks for each day
                tasks.forEach((task) => {
                    // Parse date from task (assuming format DD/MM/YYYY)
                    const [day, month, year] = task.date.split("/");
                    const taskDate = new Date(year, month - 1, day);

                    // Skip if task date is invalid or beyond current week
                    if (isNaN(taskDate.getTime())) return;

                    // Check if task is within last 7 days
                    const dayIndex = taskDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

                    // Only count if within the last 7 days
                    const daysDiff = Math.floor((now - taskDate) / (1000 * 60 * 60 * 24));
                    if (daysDiff <= 7) {
                        stats[dayIndex].total++;
                        if (task.status) {
                            stats[dayIndex].completed++;
                        }
                    }
                });
                break;

            case "monthly":
                // Get data for current month (last 4 weeks)
                stats = [
                    { name: "Week 1", total: 0, completed: 0 },
                    { name: "Week 2", total: 0, completed: 0 },
                    { name: "Week 3", total: 0, completed: 0 },
                    { name: "Week 4", total: 0, completed: 0 },
                ];

                // Count tasks for each week
                tasks.forEach((task) => {
                    // Parse date from task
                    const [day, month, year] = task.date.split("/");
                    const taskDate = new Date(year, month - 1, day);

                    // Skip if task date is invalid
                    if (isNaN(taskDate.getTime())) return;

                    // Check if task is within last month
                    const daysDiff = Math.floor((now - taskDate) / (1000 * 60 * 60 * 24));
                    if (daysDiff <= 30) {
                        // Assign to appropriate week
                        const weekIndex = Math.min(3, Math.floor(daysDiff / 7));
                        stats[weekIndex].total++;
                        if (task.status) {
                            stats[weekIndex].completed++;
                        }
                    }
                });
                break;

            case "yearly":
                // Get data for current year (all 12 months)
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                // Initialize data for each month
                stats = months.map((month) => ({
                    name: month,
                    total: 0,
                    completed: 0,
                }));

                // Count tasks for each month
                tasks.forEach((task) => {
                    // Parse date from task
                    const [day, month, year] = task.date.split("/");
                    const taskDate = new Date(year, month - 1, day);

                    // Skip if task date is invalid
                    if (isNaN(taskDate.getTime())) return;

                    // Check if task is within last year
                    const monthsDiff = (now.getFullYear() - taskDate.getFullYear()) * 12 + (now.getMonth() - taskDate.getMonth());

                    if (monthsDiff <= 12) {
                        const monthIndex = taskDate.getMonth(); // 0 = January, 1 = February, etc.
                        stats[monthIndex].total++;
                        if (task.status) {
                            stats[monthIndex].completed++;
                        }
                    }
                });
                break;

            default:
                // Default to weekly if period is not recognized
                return res.status(400).json({ message: "Invalid period. Use 'weekly', 'monthly', or 'yearly'" });
        }

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            stats,
        });
    } catch (err) {
        console.error("Error getting task stats:", err);
        res.status(500).json({ message: "Failed to fetch task statistics", error: err.message });
    }
};
