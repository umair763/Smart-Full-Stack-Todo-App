import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Task" },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    reminderTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Reminder", reminderSchema);
