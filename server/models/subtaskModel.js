const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: String, required: true },
    time: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: Boolean, default: false },
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Subtask = mongoose.model("Subtask", subtaskSchema);

module.exports = Subtask;
