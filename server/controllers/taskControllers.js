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
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(500).json({ message: "Failed to add task", error: err.message });
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
		res.json({ message: "Task deleted successfully" });
	} catch (err) {
		res.status(500).json({ message: "Failed to delete task", error: err.message });
	}
};
