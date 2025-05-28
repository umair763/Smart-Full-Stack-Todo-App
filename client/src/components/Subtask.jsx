'use client';

import { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { HiCalendar, HiCheck } from 'react-icons/hi';

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
            className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${
               priorityColors[subtask.priority] || priorityColors.Medium
            }`}
         >
            {subtask.priority}
         </span>
      );
   };

   return (
      <>
         {/* Mobile Layout (< 640px) - Card Style */}
         <div className={`sm:hidden p-2 sm:p-3 rounded-lg border-l-4 ${getPriorityColorClass()}`}>
            {/* Header Section - Title & Priority */}
            <div className="flex items-start justify-between mb-2">
               <div className="flex items-start space-x-2 flex-1 min-w-0">
                  {/* Priority Radio Button */}
                  <input
                     type="radio"
                     className="w-3 h-3 rounded-full cursor-pointer appearance-none flex-shrink-0 mt-1 bg-purple-500 border-purple-500"
                  />

                  <div className="flex-1 min-w-0">
                     {/* Subtask Title */}
                     <h4
                        className={`${
                           completed ? 'line-through text-gray-500' : 'text-gray-900'
                        } font-medium text-sm leading-tight mb-1 transition-all`}
                     >
                        {subtask.title}
                     </h4>

                     {/* Description */}
                     {subtask.description && (
                        <p className="text-xs text-gray-600 line-clamp-1 mb-1">{subtask.description}</p>
                     )}

                     {/* Priority Badge */}
                     {renderPriorityBadge()}
                  </div>
               </div>

               {/* Completion Status */}
               <button
                  onClick={handleSubtaskStatusToggle}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                     completed ? 'bg-[#9406E6] text-white shadow-md' : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/10'
                  }`}
                  disabled={isUpdating}
                  title={completed ? 'Mark as incomplete' : 'Mark as complete'}
               >
                  {completed && (
                     <HiCheck className="h-3 w-3" />
                  )}
               </button>
            </div>

            {/* Date & Time Section */}
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-1 rounded">
                     <HiCalendar className="h-3 w-3 text-white" />
                  </div>
                  <span className={`${completed ? 'line-through text-gray-500' : 'text-gray-700'} font-medium`}>
                     {subtask.date}
                  </span>
                  <span className={`${completed ? 'line-through text-gray-500' : 'text-gray-600'}`}>
                     {subtask.time}
                  </span>
               </div>

               {/* Action Buttons */}
               <div className="flex items-center space-x-1">
                  {/* Edit */}
                  <button
                     onClick={handleEdit}
                     className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                     title="Edit subtask"
                  >
                     <FiEdit2 className="h-3 w-3" />
                  </button>

                  {/* Delete */}
                  <button
                     onClick={handleDelete}
                     className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                     title="Delete subtask"
                  >
                     <FiTrash2 className="h-3 w-3" />
                  </button>
               </div>
            </div>
         </div>

         {/* Desktop Layout (>= 640px) - Grid Layout */}
         <div
            className={`hidden sm:grid grid-cols-[20px,1fr,auto] w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border-l-4 ${getPriorityColorClass()} items-center gap-2 sm:gap-3`}
         >
            {/* Priority Radio Button */}
            <input
               type="radio"
               className="w-3 h-3 sm:w-4 sm:h-4 rounded-full cursor-pointer appearance-none flex-shrink-0 bg-purple-500 border-purple-500"
            />

            {/* Main Content Section */}
            <div className="flex flex-col min-w-0">
               <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                  {/* Subtask Title */}
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : 'text-gray-900'
                     } font-medium text-sm sm:text-base transition-all truncate flex-1 min-w-0`}
                  >
                     {subtask.title}
                  </p>

                  {/* Priority badge */}
                  {renderPriorityBadge()}
               </div>

               {/* Description */}
               {subtask.description && (
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 mt-1">{subtask.description}</p>
               )}
            </div>

            {/* Right Section - Date, Time & Actions */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
               {/* Date and Time Section */}
               <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 text-right">
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : 'text-gray-700'
                     } font-medium text-xs sm:text-sm transition-all whitespace-nowrap`}
                  >
                     {subtask.date}
                  </p>
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : 'text-gray-600'
                     } text-xs sm:text-sm transition-all whitespace-nowrap`}
                  >
                     {subtask.time}
                  </p>
               </div>

               {/* Action buttons */}
               <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  {/* Edit button */}
                  <button
                     onClick={handleEdit}
                     className="text-blue-600 hover:text-blue-800 p-0.5 sm:p-1 rounded transition-colors"
                     title="Edit subtask"
                  >
                     <FiEdit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>

                  {/* Delete button */}
                  <button
                     onClick={handleDelete}
                     className="text-red-600 hover:text-red-800 p-0.5 sm:p-1 rounded transition-colors"
                     title="Delete subtask"
                  >
                     <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>

                  {/* Completion checkbox */}
                  <button
                     onClick={handleSubtaskStatusToggle}
                     className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        completed ? 'bg-[#9406E6] text-white' : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/20'
                     }`}
                     disabled={isUpdating}
                     title={completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                     {completed && (
                        <HiCheck className="h-3 w-3" />
                     )}
                  </button>
               </div>
            </div>
         </div>
      </>
   );
}

export default Subtask;
