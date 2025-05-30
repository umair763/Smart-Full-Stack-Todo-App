'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import NoteModal from './NoteModal';
import { API_URL } from '../config/env';

function NotesList({ taskId }) {
   const [notes, setNotes] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [showNoteModal, setShowNoteModal] = useState(false);
   const [currentNote, setCurrentNote] = useState(null);

   // Fetch notes when component mounts or taskId changes
   useEffect(() => {
      if (taskId) {
         fetchNotes();
      }
   }, [taskId]);

   const fetchNotes = async () => {
      try {
         setLoading(true);
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_URL}/api/tasks/${taskId}/notes`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch notes');
         }

         const data = await response.json();
         setNotes(data);
         setError(null);
      } catch (err) {
         console.error('Error fetching notes:', err);
         setError('Failed to load notes. Please try again.');
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
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         let response;
         if (noteId) {
            // Update existing note
            response = await fetch(`${API_URL}/api/notes/${noteId}`, {
               method: 'PUT',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({ content }),
            });
         } else {
            // Create new note
            response = await fetch(`${API_URL}/api/tasks/${taskId}/notes`, {
               method: 'POST',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({ content }),
            });
         }

         if (!response.ok) {
            throw new Error(noteId ? 'Failed to update note' : 'Failed to create note');
         }

         const data = await response.json();

         if (noteId) {
            // Update the note in the local state
            setNotes(notes.map((note) => (note._id === noteId ? data : note)));
         } else {
            // Add the new note to the local state
            setNotes([data, ...notes]);
         }
      } catch (err) {
         console.error('Error saving note:', err);
         alert(err.message);
      }
   };

   const handleDeleteNote = async (noteId) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_URL}/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete note');
         }

         // Remove the note from the local state
         setNotes(notes.filter((note) => note._id !== noteId));
      } catch (err) {
         console.error('Error deleting note:', err);
         alert(err.message);
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
      <div className="mt-4">
         <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Notes</h3>
            <button
               onClick={handleAddNote}
               className="flex items-center text-sm bg-[#9406E6] text-white px-3 py-1 rounded-md hover:bg-[#7D05C3] transition-colors"
            >
               <FiPlus className="mr-1" />
               Add Note
            </button>
         </div>

         {loading ? (
            <div className="text-center py-4 text-gray-500">Loading notes...</div>
         ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
         ) : notes.length === 0 ? (
            <div className="text-center py-4 text-gray-500 italic">No notes yet. Add one to get started!</div>
         ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
               {notes.map((note) => (
                  <div key={note._id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                     <div className="flex justify-between items-start">
                        <div className="text-xs text-gray-500 mb-1">{formatDate(note.createdAt)}</div>
                        <div className="flex space-x-1">
                           <button
                              onClick={() => handleEditNote(note)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit note"
                           >
                              <FiEdit2 className="h-4 w-4" />
                           </button>
                           <button
                              onClick={() => {
                                 if (window.confirm('Are you sure you want to delete this note?')) {
                                    handleDeleteNote(note._id);
                                 }
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Delete note"
                           >
                              <FiTrash2 className="h-4 w-4" />
                           </button>
                        </div>
                     </div>
                     <div className="text-gray-800 whitespace-pre-wrap break-words">{note.content}</div>
                  </div>
               ))}
            </div>
         )}

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
