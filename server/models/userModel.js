const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    gender: { type: String, default: "" },
    occupation: { type: String, default: "" },
    organization: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    picture: { type: String }, // Store image as base64 String in MongoDB
});

const User = mongoose.model("User", userSchema);

module.exports = User;
