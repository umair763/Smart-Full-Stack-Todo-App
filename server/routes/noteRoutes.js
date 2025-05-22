import express from "express";
import { createNote, getNotes, deleteNote } from "../controllers/noteController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create a new note
router.post("/tasks/:taskId/notes", auth, createNote);

// Get all notes for a task
router.get("/tasks/:taskId/notes", auth, getNotes);

// Delete a note
router.delete("/notes/:noteId", auth, deleteNote);

export default router;
