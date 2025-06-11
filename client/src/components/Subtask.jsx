'use client';

import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { HiCalendar, HiCheck, HiPencilAlt } from 'react-icons/hi';
import DeleteSubtaskModal from './DeleteSubtaskModal';
import { useAuth } from '../app/context/AuthContext';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function Subtask({ subtask, onDelete, onUpdate, onStatusChange }) {
   const [completed, setCompleted] = useState(subtask.status || false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const { token } = useAuth();

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
      // Will be implemented with a modal form
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
            return 'border-red-500 bg-red-50';
         case 'medium':
            return 'border-yellow-500 bg-yellow-50';
         case 'low':
            return 'border-green-500 bg-green-50';
         default:
            return 'border-purple-500 bg-purple-50';
      }
   };

   // Render priority badge based on priority level
   const renderPriorityBadge = () => {
      const priorityColors = {
         Low: 'bg-green-100 text-green-800 border-green-300',
         Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
         High: 'bg-red-100 text-red-800 border-red-300',
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
         className={`
          group relative flex items-center justify-between 
          p-3 border-l-4 ${getPriorityColorClass()} 
          rounded-r-lg bg-white shadow-sm border border-gray-100
          mb-2 transition-all duration-200 ease-in-out
          hover:shadow-md hover:bg-gray-50/30
          ${completed ? 'opacity-75' : ''}
        `}
      >
         {/* Task Title Section */}
         <div className="flex-1 min-w-0 pr-4">
            <h3
               className={`
              text-sm font-medium leading-5 transition-all duration-200
              ${completed ? 'line-through text-gray-500 decoration-2' : 'text-gray-900 group-hover:text-gray-800'}
            `}
               title={subtask.title} // Tooltip for truncated text
            >
               {subtask.title}
            </h3>
         </div>

         {/* Right Section - Priority, Date, and Actions */}
         <div className="flex items-center gap-3 flex-shrink-0">
            {/* Priority Badge */}
            <div className="hidden sm:block flex-shrink-0">{renderPriorityBadge()}</div>

            {/* Due Date - Hidden on very small screens */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
               <HiCalendar className="w-3 h-3" />
               <span className="font-medium">{subtask.date}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
               {/* Completion Checkbox - Most Important Action First */}
               <button
                  onClick={handleStatusChange}
                  disabled={isUpdating}
                  aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
                  className={`
                w-6 h-6 flex items-center justify-center rounded-full 
                border-2 transition-all duration-200 flex-shrink-0
                ${
                   completed
                      ? 'bg-green-500 border-green-500 text-white shadow-sm'
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                }
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
               >
                  {isUpdating ? (
                     <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                     completed && <HiCheck className="w-3.5 h-3.5" />
                  )}
               </button>

               {/* Edit Button */}
               <button
                  onClick={handleEdit}
                  aria-label="Edit subtask"
                  className="
                p-1.5 rounded-full text-gray-400 transition-all duration-200
                hover:text-blue-600 hover:bg-blue-50 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                opacity-0 group-hover:opacity-100 sm:opacity-100
              "
               >
                  <HiPencilAlt className="w-4 h-4" />
               </button>

               {/* Delete Button */}
               <button
                  onClick={handleDelete}
                  aria-label="Delete subtask"
                  className="
                p-1.5 rounded-full text-gray-400 transition-all duration-200
                hover:text-red-600 hover:bg-red-50
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                opacity-0 group-hover:opacity-100 sm:opacity-100
              "
               >
                  <FiTrash2 className="w-4 h-4" />
               </button>
            </div>
         </div>

         {/* Mobile-only Priority and Date Info */}
         <div className="absolute -bottom-1 left-4 sm:hidden">
            <div className="flex items-center gap-2 text-xs">
               <div className="scale-75">{renderPriorityBadge()}</div>
               <div className="flex items-center gap-1 text-gray-500 bg-white px-1.5 py-0.5 rounded border">
                  <HiCalendar className="w-2.5 h-2.5" />
                  <span>{subtask.date}</span>
               </div>
            </div>
         </div>

         {/* Delete Confirmation Modal */}
         <DeleteSubtaskModal
            isOpen={showDeleteModal}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
         />
      </div>
   );
}

export default Subtask;
