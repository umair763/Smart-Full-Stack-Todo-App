const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    color: { type: String, required: true },
    task: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtask" }],
    subtaskCount: { type: Number, default: 0 },
    completedSubtasks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
