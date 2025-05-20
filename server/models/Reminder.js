import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Task" },
    reminderTime: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Reminder", reminderSchema);
 