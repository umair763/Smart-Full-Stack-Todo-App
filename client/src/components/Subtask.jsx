'use client';

import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { HiCalendar, HiCheck, HiPencilAlt } from 'react-icons/hi';
import DeleteSubtaskModal from './DeleteSubtaskModal';
import { useAuth } from '../app/context/AuthContext';
import { useTheme } from '../app/context/ThemeContext';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function Subtask({ subtask, onDelete, onUpdate, onStatusChange }) {
   const [completed, setCompleted] = useState(subtask.status || false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [showDescription, setShowDescription] = useState(false);
   const { token } = useAuth();
   const { isDarkMode } = useTheme();

   // Handle subtask status toggle
   const handleStatusChange = async () => {
      setIsUpdating(true);

      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${subtask.taskId}/subtasks/${subtask._id}/status`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ completed: !completed }),
         });

         if (!response.ok) {
            throw new Error('Failed to update subtask status');
         }

         setCompleted(!completed);
         onStatusChange(subtask._id, completed, null);
      } catch (error) {
         console.error('Error updating subtask status:', error);
         setCompleted(!completed);
         onStatusChange(subtask._id, completed, error.message);
      } finally {
         setIsUpdating(false);
      }
   };

   function handleEdit() {
      onUpdate(subtask);
   }

   function handleDelete() {
      setShowDeleteModal(true);
   }

   const handleConfirmDelete = async () => {
      setIsDeleting(true);
      try {
         await onDelete(subtask._id);
         setShowDeleteModal(false);
      } catch (error) {
         console.error('Error deleting subtask:', error);
      } finally {
         setIsDeleting(false);
      }
   };

   const handleCancelDelete = () => {
      setShowDeleteModal(false);
   };

   // Get priority color class
   const getPriorityColorClass = () => {
      switch (subtask.priority?.toLowerCase()) {
         case 'high':
            return isDarkMode ? 'border-red-400 bg-red-900/20' : 'border-red-500 bg-red-50';
         case 'medium':
            return isDarkMode ? 'border-yellow-400 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50';
         case 'low':
            return isDarkMode ? 'border-green-400 bg-green-900/20' : 'border-green-500 bg-green-50';
         default:
            return isDarkMode ? 'border-purple-400 bg-purple-900/20' : 'border-purple-500 bg-purple-50';
      }
   };

   // Render priority badge based on priority level
   const renderPriorityBadge = () => {
      const priorityColors = {
         Low: isDarkMode
            ? 'bg-green-900/30 text-green-300 border-green-600'
            : 'bg-green-100 text-green-800 border-green-300',
         Medium: isDarkMode
            ? 'bg-yellow-900/30 text-yellow-300 border-yellow-600'
            : 'bg-yellow-100 text-yellow-800 border-yellow-300',
         High: isDarkMode ? 'bg-red-900/30 text-red-300 border-red-600' : 'bg-red-100 text-red-800 border-red-300',
      };

      return (
         <span
            className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded text-sm font-medium border flex-shrink-0 ${
               priorityColors[subtask.priority] || priorityColors.Medium
            }`}
         >
            {subtask.priority}
         </span>
      );
   };

   return (
      <div
         className={`flex flex-col p-1.5 border-l-4 ${getPriorityColorClass()} rounded-r-lg shadow-sm mb-0.5 transition-colors duration-200 ${
            isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'
         }`}
      >
         {/* Main Row */}
         <div className="flex items-center justify-between">
            {/* Task Title - Leftmost */}
            <div className="flex-1 min-w-0 mr-2">
               <h3
                  className={`text-sm font-medium truncate ${
                     completed
                        ? isDarkMode
                           ? 'line-through text-gray-500'
                           : 'line-through text-gray-500'
                        : isDarkMode
                        ? 'text-gray-100'
                        : 'text-gray-900'
                  }`}
               >
                  {subtask.title}
               </h3>
            </div>

            {/* Right Section - Priority, Date, and Actions */}
            <div
               className={`flex items-center gap-2 flex-shrink-0 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
               }`}
            >
               {/* Priority Badge */}
               <div className="flex-shrink-0 rounded-lg">{renderPriorityBadge()}</div>

               {/* Due Date */}
               {subtask.date && (
                  <div className={`flex items-center gap-1 text-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                     <HiCalendar className="w-5 h-5" />
                     <span>{subtask.date}</span>
                  </div>
               )}

               {/* Action Buttons */}
               <div className="flex items-center gap-1 ml-auto">
                  {/* Edit Button */}
                  <button
                     onClick={handleEdit}
                     aria-label="Edit Subtask"
                     className={`p-1 rounded-full transition-colors ${
                        isDarkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-100/70'
                     }`}
                  >
                     <HiPencilAlt className="w-5 h-5" />
                  </button>

                  {/* Delete Button */}
                  <button
                     onClick={handleDelete}
                     aria-label="Delete Subtask"
                     className={`p-1 rounded-full transition-colors ${
                        isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100/70'
                     }`}
                  >
                     <FiTrash2 className="w-5 h-5" />
                  </button>

                  {/* Completion Checkbox */}
                  <button
                     onClick={handleStatusChange}
                     disabled={isUpdating}
                     aria-label="Mark Subtask as Complete"
                     className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-colors ${
                        completed
                           ? 'bg-green-600 border-green-600 text-white'
                           : isDarkMode
                           ? 'border-gray-500 hover:border-green-500'
                           : 'border-gray-400 hover:border-green-600'
                     }`}
                  >
                     {completed && <HiCheck className="w-3 h-3" />}
                  </button>
               </div>
            </div>
         </div>

         {/* Description Row - Only show if description exists */}
         {subtask.description && subtask.description.trim() && (
            <div className="mt-1 ml-0">
               <p
                  className={`text-xs leading-relaxed ${
                     completed
                        ? isDarkMode
                           ? 'text-gray-600 line-through'
                           : 'text-gray-500 line-through'
                        : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-600'
                  } ${subtask.description.length > 100 && !showDescription ? 'line-clamp-2' : ''}`}
               >
                  {subtask.description}
               </p>
               {subtask.description.length > 100 && (
                  <button
                     onClick={() => setShowDescription(!showDescription)}
                     className={`text-xs mt-1 ${
                        isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                     } transition-colors`}
                  >
                     {showDescription ? 'Show less' : 'Show more'}
                  </button>
               )}
            </div>
         )}

         {/* Delete Confirmation Modal */}
         <DeleteSubtaskModal
            isOpen={showDeleteModal}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
            subtaskTitle={subtask.title}
         />
      </div>
   );
}

export default Subtask;
