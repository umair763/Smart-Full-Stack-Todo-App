'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../app/context/AuthContext';
import { HiPencilAlt, HiTrash, HiPlus } from 'react-icons/hi';
import NoteModal from './NoteModal';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function NotesList({ taskId }) {
   const [notes, setNotes] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [showNoteModal, setShowNoteModal] = useState(false);
   const [currentNote, setCurrentNote] = useState(null);
   const { token } = useAuth();

   useEffect(() => {
      fetchNotes();
   }, [taskId]);

   const fetchNotes = async () => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/notes`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch notes');
         }

         const data = await response.json();
         setNotes(data);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const handleAddNote = () => {
      setCurrentNote(null);
      setShowNoteModal(true);
   };

   const handleEditNote = (note) => {
      setCurrentNote(note);
      setShowNoteModal(true);
   };

   const handleSaveNote = async (noteId, content) => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
         });

         if (!response.ok) {
            throw new Error('Failed to update note');
         }

         setNotes((prev) => prev.map((note) => (note._id === noteId ? { ...note, content } : note)));
         setCurrentNote(null);
      } catch (err) {
         setError(err.message);
      }
   };

   const handleDeleteNote = async (noteId) => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete note');
         }

         setNotes((prev) => prev.filter((note) => note._id !== noteId));
      } catch (err) {
         setError(err.message);
      }
   };

   // Format date for display
   const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   return (
      <div className="space-y-4">
         <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notes</h3>

         <form
            onSubmit={(e) => {
               e.preventDefault();
               if (currentNote) {
                  handleSaveNote(currentNote._id, currentNote.content);
               }
            }}
            className="flex space-x-2"
         >
            <input
               type="text"
               value={currentNote?.content || ''}
               onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
               placeholder="Add a note..."
               className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
               type="submit"
               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
               <HiPlus className="w-5 h-5" />
            </button>
         </form>

         {error && <div className="text-red-500 text-sm">{error}</div>}

         <div className="space-y-2">
            {notes.map((note) => (
               <div
                  key={note._id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
               >
                  {currentNote === note._id ? (
                     <input
                        type="text"
                        value={note.content}
                        onChange={(e) => setCurrentNote({ ...note, content: e.target.value })}
                        onBlur={() => handleSaveNote(note._id, note.content)}
                        onKeyPress={(e) => {
                           if (e.key === 'Enter') {
                              handleSaveNote(note._id, note.content);
                           }
                        }}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        autoFocus
                     />
                  ) : (
                     <span className="text-gray-900 dark:text-white">{note.content}</span>
                  )}

                  <div className="flex items-center space-x-2">
                     <button
                        onClick={() => handleEditNote(note)}
                        className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                     >
                        <HiPencilAlt className="w-4 h-4" />
                     </button>
                     <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                     >
                        <HiTrash className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            ))}
         </div>

         {/* Note Modal */}
         <NoteModal
            isOpen={showNoteModal}
            onClose={() => setShowNoteModal(false)}
            taskId={taskId}
            note={currentNote}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
         />
      </div>
   );
}

export default NotesList;
