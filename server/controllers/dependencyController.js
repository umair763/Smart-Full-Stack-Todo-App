import Dependency from "../models/Dependency.js";
import Task from "../models/Task.js";
import { dbEvents } from "../index.js";
import Notification from "../models/Notification.js";

// Helper function to convert date and time to a Date object
const convertToDate = (dateStr, timeStr) => {
    const [day, month, year] = dateStr.split("/");
    let [hours, minutes, ampm] = timeStr.match(/(\d+):(\d+)\s(AM|PM)/).slice(1, 4);

    hours = parseInt(hours);
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    // Create date in UTC to avoid timezone issues
    return new Date(Date.UTC(year, month - 1, day, hours, minutes));
};

// Helper function to check for circular dependencies
const checkForCircularDependency = async (dependentTaskId, prerequisiteTaskId, userId) => {
    // Check if the prerequisite task depends on the dependent task (direct circular dependency)
    const directCircular = await Dependency.findOne({
        dependentTaskId: prerequisiteTaskId,
        prerequisiteTaskId: dependentTaskId,
        userId,
    });

    if (directCircular) {
        return true;
    }

    // Check for indirect circular dependencies using a depth-first search
    const visited = new Set();
    const stack = [prerequisiteTaskId];

    while (stack.length > 0) {
        const currentTaskId = stack.pop();

        if (visited.has(currentTaskId.toString())) {
            continue;
        }

        visited.add(currentTaskId.toString());

        // Find all tasks that the current task depends on
        const dependencies = await Dependency.find({
            dependentTaskId: currentTaskId,
            userId,
        });

        for (const dependency of dependencies) {
            if (dependency.prerequisiteTaskId.equals(dependentTaskId)) {
                return true; // Found a circular dependency
            }

            stack.push(dependency.prerequisiteTaskId);
        }
    }

    return false;
};

// Helper function to validate deadline constraints
const validateDeadlineConstraints = async (dependentTaskId, prerequisiteTaskId) => {
    const dependentTask = await Task.findById(dependentTaskId);
    const prerequisiteTask = await Task.findById(prerequisiteTaskId);

    if (!dependentTask || !prerequisiteTask) {
        throw new Error("One or both tasks not found");
    }

    const dependentDate = convertToDate(dependentTask.date, dependentTask.time);
    const prerequisiteDate = convertToDate(prerequisiteTask.date, prerequisiteTask.time);

    // CORRECT LOGIC: The dependent task's due date must not be later than the independent task's due date
    // This ensures the dependent task can be completed within the timeframe of the independent task
    if (dependentDate > prerequisiteDate) {
        return {
            valid: false,
            message: `Invalid dependency: "${dependentTask.task}" (due ${dependentTask.date} ${dependentTask.time}) cannot depend on "${prerequisiteTask.task}" (due ${prerequisiteTask.date} ${prerequisiteTask.time}) because the dependent task has a later due date. The dependent task must be due before or at the same time as the independent task.`,
            dependentTask,
            prerequisiteTask,
        };
    }

    return { valid: true };
};

// Get all dependencies for a user
export const getDependencies = async (req, res) => {
    try {
        const dependencies = await Dependency.find({ userId: req.user._id })
            .populate("dependentTaskId", "task date time priority completed")
            .populate("prerequisiteTaskId", "task date time priority completed")
            .sort({ createdAt: -1 });

        res.json(dependencies);
    } catch (error) {
        console.error("Get dependencies error:", error);
        res.status(500).json({ message: "Error fetching dependencies" });
    }
};

// Get dependencies for a specific task
export const getTaskDependencies = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Find dependencies where the task is dependent on other tasks
        const prerequisites = await Dependency.find({
            dependentTaskId: taskId,
            userId: req.user._id,
        }).populate("prerequisiteTaskId", "task date time priority completed");

        // Find dependencies where other tasks depend on this task
        const dependents = await Dependency.find({
            prerequisiteTaskId: taskId,
            userId: req.user._id,
        }).populate("dependentTaskId", "task date time priority completed");

        res.json({
            prerequisites: prerequisites,
            dependents: dependents,
        });
    } catch (error) {
        console.error("Get task dependencies error:", error);
        res.status(500).json({ message: "Error fetching task dependencies" });
    }
};

// Create a new dependency
export const createDependency = async (req, res) => {
    try {
        const { dependentTaskId, prerequisiteTaskId, description } = req.body;

        // Validate that both tasks exist and belong to the user
        const dependentTask = await Task.findOne({ _id: dependentTaskId, userId: req.user._id });
        const prerequisiteTask = await Task.findOne({ _id: prerequisiteTaskId, userId: req.user._id });

        if (!dependentTask) {
            return res.status(404).json({ message: "Dependent task not found" });
        }

        if (!prerequisiteTask) {
            return res.status(404).json({ message: "Prerequisite task not found" });
        }

        // Check for circular dependencies
        const isCircular = await checkForCircularDependency(dependentTaskId, prerequisiteTaskId, req.user._id);
        if (isCircular) {
            return res.status(400).json({ message: "Circular dependency detected" });
        }

        // Validate deadline constraints
        const deadlineValidation = await validateDeadlineConstraints(dependentTaskId, prerequisiteTaskId);
        if (!deadlineValidation.valid) {
            return res.status(400).json({
                message: deadlineValidation.message,
                dependentTask: deadlineValidation.dependentTask,
                prerequisiteTask: deadlineValidation.prerequisiteTask,
            });
        }

        // Check if the dependency already exists
        const existingDependency = await Dependency.findOne({
            dependentTaskId,
            prerequisiteTaskId,
            userId: req.user._id,
        });

        if (existingDependency) {
            return res.status(400).json({ message: "This dependency already exists" });
        }

        // Create the new dependency
        const newDependency = new Dependency({
            dependentTaskId,
            prerequisiteTaskId,
            userId: req.user._id,
            description: description || "",
        });

        await newDependency.save();

        // Populate the task details for the response
        await newDependency.populate("dependentTaskId", "task date time priority completed");
        await newDependency.populate("prerequisiteTaskId", "task date time priority completed");

        // Save notification to DB
        const savedNotification = await Notification.create({
            userId: req.user._id,
            type: "dependency",
            message: `Dependency created: "${prerequisiteTask.task}" is now a prerequisite for "${dependentTask.task}"`,
            data: {
                dependencyId: newDependency._id,
                dependentTaskId,
                prerequisiteTaskId,
            },
        });

        // Emit dependency creation event (real-time)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                ...savedNotification.toObject(),
                type: "dependency",
                message: `Dependency created: "${prerequisiteTask.task}" is now a prerequisite for "${dependentTask.task}"`,
                persistent: true,
                read: false,
            });
        }

        res.status(201).json(newDependency);
    } catch (error) {
        console.error("Create dependency error:", error);
        res.status(500).json({ message: "Error creating dependency" });
    }
};

// Update a dependency
export const updateDependency = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;

        const dependency = await Dependency.findOne({ _id: id, userId: req.user._id });

        if (!dependency) {
            return res.status(404).json({ message: "Dependency not found" });
        }

        // Only the description can be updated
        dependency.description = description || dependency.description;

        await dependency.save();

        // Populate the task details for the response
        await dependency.populate("dependentTaskId", "task date time priority completed");
        await dependency.populate("prerequisiteTaskId", "task date time priority completed");

        // Emit dependency update event
        dbEvents.emit("db_change", {
            operation: "update",
            collection: "dependencies",
            message: `Dependency updated`,
            type: "dependency",
        });

        res.json(dependency);
    } catch (error) {
        console.error("Update dependency error:", error);
        res.status(500).json({ message: "Error updating dependency" });
    }
};

// Delete a dependency
export const deleteDependency = async (req, res) => {
    try {
        const { id } = req.params;

        const dependency = await Dependency.findOne({ _id: id, userId: req.user._id })
            .populate("dependentTaskId", "task")
            .populate("prerequisiteTaskId", "task");

        if (!dependency) {
            return res.status(404).json({ message: "Dependency not found" });
        }

        const dependentTaskName = dependency.dependentTaskId.task;
        const prerequisiteTaskName = dependency.prerequisiteTaskId.task;

        await Dependency.deleteOne({ _id: id });

        // Save notification to DB
        const savedNotification = await Notification.create({
            userId: req.user._id,
            type: "dependency",
            message: `Dependency removed: "${prerequisiteTaskName}" is no longer a prerequisite for "${dependentTaskName}"`,
            data: {
                dependencyId: id,
                dependentTaskId: dependency.dependentTaskId._id,
                prerequisiteTaskId: dependency.prerequisiteTaskId._id,
            },
        });

        // Emit dependency deletion event (real-time)
        const io = req.app.get("io");
        if (io && io.sendNotification) {
            io.sendNotification(req.user._id, {
                ...savedNotification.toObject(),
                type: "dependency",
                message: `Dependency removed: "${prerequisiteTaskName}" is no longer a prerequisite for "${dependentTaskName}"`,
                persistent: true,
                read: false,
            });
        }

        res.json({ message: "Dependency deleted" });
    } catch (error) {
        console.error("Delete dependency error:", error);
        res.status(500).json({ message: "Error deleting dependency" });
    }
};

// Validate a potential dependency
export const validateDependency = async (req, res) => {
    try {
        const { dependentTaskId, prerequisiteTaskId } = req.body;

        // Validate that both tasks exist and belong to the user
        const dependentTask = await Task.findOne({ _id: dependentTaskId, userId: req.user._id });
        const prerequisiteTask = await Task.findOne({ _id: prerequisiteTaskId, userId: req.user._id });

        if (!dependentTask) {
            return res.status(404).json({ message: "Dependent task not found" });
        }

        if (!prerequisiteTask) {
            return res.status(404).json({ message: "Prerequisite task not found" });
        }

        // Check for circular dependencies
        const isCircular = await checkForCircularDependency(dependentTaskId, prerequisiteTaskId, req.user._id);
        if (isCircular) {
            return res.status(400).json({ message: "Circular dependency detected" });
        }

        // Validate deadline constraints
        const deadlineValidation = await validateDeadlineConstraints(dependentTaskId, prerequisiteTaskId);
        if (!deadlineValidation.valid) {
            return res.status(400).json({
                message: deadlineValidation.message,
                dependentTask: deadlineValidation.dependentTask,
                prerequisiteTask: deadlineValidation.prerequisiteTask,
            });
        }

        res.json({ valid: true });
    } catch (error) {
        console.error("Validate dependency error:", error);
        res.status(500).json({ message: "Error validating dependency" });
    }
};
