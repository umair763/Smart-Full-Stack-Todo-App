import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        task: {
            type: String,
            required: true,
        },
        date: {
            type: String,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        priority: {
            type: String,
            enum: ["High", "Medium", "Low"],
            default: "Medium",
        },
        completed: {
            type: Boolean,
            default: false,
            required: true,
        },
        subtasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Subtask",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Virtual for getting color based on priority
taskSchema.virtual("color").get(function () {
    const priorityToColor = {
        High: "red",
        Medium: "yellow",
        Low: "green",
    };
    return priorityToColor[this.priority] || "yellow";
});

// Virtual for checking if deadline is exceeded
taskSchema.virtual("isDeadlineExceeded").get(function () {
    if (this.completed) return false;
    const now = new Date();
    const taskDate = new Date(`${this.date}T${this.time}`);
    return now > taskDate;
});

// Ensure virtuals are included in JSON
taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

// Pre-save middleware to ensure completed is always a boolean
taskSchema.pre("save", function (next) {
    if (typeof this.completed !== "boolean") {
        this.completed = false;
    }
    next();
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
