'use client';

import { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Subtask({ subtask, onDelete, onUpdate, onStatusChange }) {
   const [completed, setCompleted] = useState(subtask.status || false);
   const [isUpdating, setIsUpdating] = useState(false);

   // Handle subtask status toggle
   async function handleSubtaskStatusToggle() {
      // Prevent multiple rapid toggling
      if (isUpdating) return;

      setIsUpdating(true);

      try {
         // Optimistically update UI first
         const newStatus = !completed;
         setCompleted(newStatus);

         // Use the dedicated endpoint for status updates
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${subtask.taskId}/subtasks/${subtask._id}/status`, {
            method: 'PATCH',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
         });

         if (!response.ok) {
            throw new Error('Failed to update subtask status');
         }

         // The UI will be updated through Socket.io notification
      } catch (error) {
         // Revert UI state if the update fails
         console.error('Error updating subtask status:', error);
         setCompleted(!completed);

         // Show notification (handled by parent)
         if (onStatusChange) {
            onStatusChange(subtask._id, completed, error.message);
         }
      } finally {
         setIsUpdating(false);
      }
   }

   function handleEdit() {
      // Will be implemented with a modal form
      onUpdate(subtask);
   }

   function handleDelete() {
      if (window.confirm('Are you sure you want to delete this subtask?')) {
         onDelete(subtask._id);
      }
   }

   // Get background color based on priority
   const getPriorityBackground = () => {
      switch (subtask.priority) {
         case 'High':
            return 'bg-red-50';
         case 'Medium':
            return 'bg-yellow-50';
         case 'Low':
            return 'bg-green-50';
         default:
            return 'bg-[#E0F3FA]/90';
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
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
               priorityColors[subtask.priority] || priorityColors.Medium
            }`}
         >
            {subtask.priority}
         </span>
      );
   };

   return (
      <div
         className={`grid grid-cols-[30px,1fr,auto] w-full px-2 py-8.5 rounded-lg text-[#1D1D1D] ${getPriorityBackground()} items-center max-[300px]:grid-cols-[20px,1fr,auto] max-[300px]:text-[9px] min-[301px]:max-[340px]:grid-cols-[22px,1fr,auto] min-[301px]:max-[340px]:text-[10px] min-[341px]:max-[600px]:grid-cols-[25px,1fr,auto] min-[341px]:max-[600px]:text-[11px] min-[601px]:grid-cols-[28px,1fr,auto] min-[601px]:text-[12px]`}
      >
         <input
            type="radio"
            className=" w-4 h-4 rounded-full cursor-pointer appearance-none bg-[#B39DDB] border-[#B39DDB]"
         />

         <div className="flex flex-col">
            <p
               className={`${
                  completed ? 'line-through text-gray-600' : ''
               } font-bold text-left sm:text-base lg:text-md transition-all`}
            >
               {subtask.title}
            </p>
            {subtask.description && (
               <p className="text-xs text-gray-600 truncate max-w-[200px]">{subtask.description}</p>
            )}
         </div>

         <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
               <div className="flex flex-col items-start">
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : ''
                     } font-bold text-left sm:text-base lg:text-md transition-all`}
                  >
                     {subtask.date}
                  </p>
               </div>
               <p
                  className={`${
                     completed ? 'line-through text-gray-600' : ''
                  } font-bold text-left sm:text-base lg:text-md transition-all`}
               >
                  {subtask.time}
               </p>
               {renderPriorityBadge()}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 ml-2">
               {/* Edit button */}
               <button onClick={handleEdit} className="text-blue-600 hover:text-blue-800" title="Edit subtask">
                  <FiEdit2 className="h-5 w-5" />
               </button>

               {/* Delete button */}
               <button onClick={handleDelete} className="text-red-600 hover:text-red-800" title="Delete subtask">
                  <FiTrash2 className="h-5 w-5" />
               </button>

               {/* Completion checkbox */}
               <button
                  onClick={handleSubtaskStatusToggle}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                     completed ? 'bg-[#9406E6] text-white' : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/20'
                  }`}
                  disabled={isUpdating}
                  title={completed ? 'Mark as incomplete' : 'Mark as complete'}
               >
                  {completed && (
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                     </svg>
                  )}
               </button>
            </div>
         </div>
      </div>
   );
}

export default Subtask;
