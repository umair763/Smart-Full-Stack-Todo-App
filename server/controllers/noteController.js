import Note from "../models/Note.js";
import { dbEvents } from "../index.js";

// Get all notes for a task
export const getNotes = async (req, res) => {
    try {
        const { taskId } = req.params;
        const notes = await Note.find({ taskId, userId: req.user._id }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error("Get notes error:", error);
        res.status(500).json({ message: "Error fetching notes" });
    }
};

// Create a new note
export const createNote = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Note content is required" });
        }

        const note = new Note({
            taskId,
            userId: req.user._id,
            content,
        });

        await note.save();

        // Emit note creation event
        dbEvents.emit("db_change", {
            operation: "create",
            collection: "notes",
            message: "New note added",
            type: "note",
        });

        res.status(201).json(note);
    } catch (error) {
        console.error("Create note error:", error);
        res.status(500).json({ message: "Error creating note" });
    }
};

// Update a note
export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Note content is required" });
        }

        const updatedNote = await Note.findOneAndUpdate({ _id: id, userId: req.user._id }, { content }, { new: true });

        if (!updatedNote) {
            return res.status(404).json({ message: "Note not found" });
        }

        // Emit note update event
        dbEvents.emit("db_change", {
            operation: "update",
            collection: "notes",
            message: "Note updated",
            type: "note",
        });

        res.json(updatedNote);
    } catch (error) {
        console.error("Update note error:", error);
        res.status(500).json({ message: "Error updating note" });
    }
};

// Delete a note
export const deleteNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const note = await Note.findOneAndDelete({ _id: noteId, userId: req.user._id });

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        // Emit note deletion event
        dbEvents.emit("db_change", {
            operation: "delete",
            collection: "notes",
            message: "Note deleted",
            type: "note",
        });

        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Delete note error:", error);
        res.status(500).json({ message: "Error deleting note" });
    }
};
