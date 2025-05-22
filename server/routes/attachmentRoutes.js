import express from "express";
import {
    uploadAttachment,
    getAttachments,
    downloadAttachment,
    deleteAttachment,
    uploadMiddleware,
} from "../controllers/attachmentController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Upload a new attachment
router.post("/tasks/:taskId/attachments", auth, uploadMiddleware, uploadAttachment);

// Get all attachments for a task
router.get("/tasks/:taskId/attachments", auth, getAttachments);

// Download an attachment
router.get("/attachments/:attachmentId/download", auth, downloadAttachment);

// Delete an attachment
router.delete("/attachments/:attachmentId", auth, deleteAttachment);

export default router;
