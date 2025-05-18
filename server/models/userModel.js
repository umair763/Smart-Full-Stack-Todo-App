const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    gender: { type: String },
    occupation: { type: String },
    organization: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    picture: { type: Buffer }, // Store image as Buffer in MongoDB
});

const User = mongoose.model("User", userSchema);

module.exports = User;
