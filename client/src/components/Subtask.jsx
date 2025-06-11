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
      <>
         {/* Mobile Layout (< 640px) - Card Style */}
         <div className={`mt-3 sm:hidden p-3 sm:p-4 rounded-lg border-l-4 ${getPriorityColorClass()}`}>
            {/* Header Section - Title & Priority */}
            <div className="flex items-start justify-between mb-3">
               <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Priority Radio Button */}
                  <input
                     type="radio"
                     className="w-4 h-4 rounded-full cursor-pointer appearance-none flex-shrink-0 mt-1 bg-purple-500 border-purple-500"
                  />

                  <div className="flex-1 min-w-0">
                     {/* Subtask Title - Enhanced size */}
                     <h4
                        className={`${
                           completed ? 'line-through text-gray-500' : 'text-gray-900'
                        } font-medium text-base leading-tight mb-2 transition-all`}
                     >
                        {subtask.title}
                     </h4>

                     {/* Description - Enhanced size */}
                     {subtask.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{subtask.description}</p>
                     )}

                     {/* Priority Badge */}
                     {renderPriorityBadge()}
                  </div>
               </div>

               {/* Completion Status */}
               <button
                  onClick={handleStatusChange}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                     completed ? 'bg-[#9406E6] text-white shadow-md' : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/10'
                  }`}
                  disabled={isUpdating}
                  title={completed ? 'Mark as incomplete' : 'Mark as complete'}
               >
                  {completed && <HiCheck className="h-4 w-4" />}
               </button>
            </div>

            {/* Date & Time Section */}
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-1.5 rounded">
                     <HiCalendar className="h-4 w-4 text-white" />
                  </div>
                  <span className={`${completed ? 'line-through text-gray-500' : 'text-gray-700'} font-medium`}>
                     {subtask.date}
                  </span>
                  <span className={`${completed ? 'line-through text-gray-500' : 'text-gray-600'}`}>
                     {subtask.time}
                  </span>
               </div>

               {/* Action Buttons */}
               <div className="flex items-center space-x-2">
                  {/* Edit */}
                  <button
                     onClick={handleEdit}
                     className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                     title="Edit subtask"
                  >
                     <HiPencilAlt className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                     onClick={handleDelete}
                     className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                     title="Delete subtask"
                  >
                     <FiTrash2 className="h-4 w-4" />
                  </button>
               </div>
            </div>
         </div>

         {/* Desktop Layout (>= 640px) - Grid Layout */}
         <div
            className={`mt-3 hidden sm:grid grid-cols-[24px,1fr,auto] w-full px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg border-l-4 ${getPriorityColorClass()} items-center gap-3 sm:gap-4`}
         >
            {/* Priority Radio Button */}
            <input
               type="radio"
               className="w-4 h-4 sm:w-5 sm:h-5 rounded-full cursor-pointer appearance-none flex-shrink-0 bg-purple-500 border-purple-500"
            />

            {/* Main Content Section */}
            <div className="flex flex-col min-w-0">
               <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                  {/* Subtask Title - Enhanced size */}
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : 'text-gray-900'
                     } font-medium text-base sm:text-lg transition-all truncate flex-1 min-w-0`}
                  >
                     {subtask.title}
                  </p>

                  {/* Priority badge */}
                  {renderPriorityBadge()}
               </div>

               {/* Description - Enhanced size */}
               {subtask.description && (
                  <p className="text-sm sm:text-base text-gray-600 line-clamp-1 mt-1.5">{subtask.description}</p>
               )}
            </div>

            {/* Right Section - Date, Time & Actions */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 flex-shrink-0">
               {/* Date and Time Section */}
               <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 text-right">
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : 'text-gray-700'
                     } font-medium text-sm sm:text-base transition-all whitespace-nowrap`}
                  >
                     {subtask.date}
                  </p>
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : 'text-gray-600'
                     } text-sm sm:text-base transition-all whitespace-nowrap`}
                  >
                     {subtask.time}
                  </p>
               </div>

               {/* Action buttons */}
               <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Edit button */}
                  <button
                     onClick={handleEdit}
                     className="text-blue-600 hover:text-blue-800 p-1 sm:p-1.5 rounded transition-colors"
                     title="Edit subtask"
                  >
                     <HiPencilAlt className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Delete button */}
                  <button
                     onClick={handleDelete}
                     className="text-red-600 hover:text-red-800 p-1 sm:p-1.5 rounded transition-colors"
                     title="Delete subtask"
                  >
                     <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Completion checkbox */}
                  <button
                     onClick={handleStatusChange}
                     className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        completed ? 'bg-[#9406E6] text-white' : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/20'
                     }`}
                     disabled={isUpdating}
                     title={completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                     {completed && <HiCheck className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </button>
               </div>
            </div>
         </div>

         {/* Delete Confirmation Modal */}
         <DeleteSubtaskModal
            isOpen={showDeleteModal}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
            subtaskTitle={subtask.title}
         />
      </>
   );
}

export default Subtask;
