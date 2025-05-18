const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  color: { type: String, required: true },
  task: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
