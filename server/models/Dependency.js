import mongoose from "mongoose";
import Task from "./Task.js";

const dependencySchema = new mongoose.Schema(
    {
        // The task that depends on another task
        dependentTaskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        // The task that is depended upon (prerequisite task)
        prerequisiteTaskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        // The user who created this dependency
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Optional description of the dependency relationship
        description: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Ensure a task cannot depend on itself
dependencySchema.pre("save", async function (next) {
    if (this.dependentTaskId.equals(this.prerequisiteTaskId)) {
        return next(new Error("A task cannot depend on itself"));
    }
    next();
});

// Compound index to ensure uniqueness of dependency relationships
dependencySchema.index({ dependentTaskId: 1, prerequisiteTaskId: 1 }, { unique: true });

export default mongoose.model("Dependency", dependencySchema);
