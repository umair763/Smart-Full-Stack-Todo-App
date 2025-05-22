import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        filename: {
            type: String,
            required: true,
        },
        originalname: {
            type: String,
            required: true,
        },
        mimetype: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        data: {
            type: Buffer,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Attachment = mongoose.model("Attachment", attachmentSchema);

export default Attachment;
