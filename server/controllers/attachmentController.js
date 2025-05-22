import Attachment from "../models/Attachment.js";
import { dbEvents } from "../index.js";
import multer from "multer";

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Upload middleware
export const uploadMiddleware = upload.single("file");

// Upload a new attachment
export const uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { taskId } = req.params;
        const { originalname, mimetype, size, buffer } = req.file;

        // Delete any existing attachment for this task
        await Attachment.deleteMany({ taskId, userId: req.user._id });

        const attachment = new Attachment({
            taskId,
            userId: req.user._id,
            filename: `${Date.now()}-${originalname}`,
            originalname,
            mimetype,
            size,
            data: buffer,
        });

        await attachment.save();

        // Emit attachment creation event
        dbEvents.emit("db_change", {
            operation: "create",
            collection: "attachments",
            message: "New attachment uploaded",
            type: "attachment",
        });

        res.status(201).json({
            message: "File uploaded successfully",
            attachment: {
                id: attachment._id,
                filename: attachment.filename,
                originalname: attachment.originalname,
                mimetype: attachment.mimetype,
                size: attachment.size,
                createdAt: attachment.createdAt,
            },
        });
    } catch (error) {
        console.error("Upload attachment error:", error);
        res.status(500).json({ message: "Error uploading file" });
    }
};

// Get attachments for a task
export const getAttachments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const attachments = await Attachment.find({ taskId, userId: req.user._id })
            .select("-data") // Exclude the file data from the response
            .sort({ createdAt: -1 });

        res.json(attachments);
    } catch (error) {
        console.error("Get attachments error:", error);
        res.status(500).json({ message: "Error fetching attachments" });
    }
};

// Download an attachment
export const downloadAttachment = async (req, res) => {
    try {
        const { attachmentId } = req.params;
        const attachment = await Attachment.findOne({ _id: attachmentId, userId: req.user._id });

        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }

        res.setHeader("Content-Type", attachment.mimetype);
        res.setHeader("Content-Disposition", `attachment; filename="${attachment.originalname}"`);
        res.send(attachment.data);
    } catch (error) {
        console.error("Download attachment error:", error);
        res.status(500).json({ message: "Error downloading file" });
    }
};

// Delete an attachment
export const deleteAttachment = async (req, res) => {
    try {
        const { attachmentId } = req.params;
        const attachment = await Attachment.findOneAndDelete({ _id: attachmentId, userId: req.user._id });

        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }

        // Emit attachment deletion event
        dbEvents.emit("db_change", {
            operation: "delete",
            collection: "attachments",
            message: "Attachment deleted",
            type: "attachment",
        });

        res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
        console.error("Delete attachment error:", error);
        res.status(500).json({ message: "Error deleting attachment" });
    }
};
