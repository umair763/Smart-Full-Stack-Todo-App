import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["reminder", "create", "update", "delete", "info", "warning", "error", "dependency"],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    data: {
        type: Object,
        default: {},
    },
    read: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
