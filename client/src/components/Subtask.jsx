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
         className={`flex items-center justify-between p-2 border-l-4 ${getPriorityColorClass()} rounded-r-lg shadow-sm mb-1`}
      >
         <div className="flex items-center space-x-2 flex-1 min-w-0">
            <button
               onClick={handleStatusChange}
               disabled={isUpdating}
               className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'
               }`}
            >
               {completed && <HiCheck className="w-3 h-3" />}
            </button>
            <div className="flex-1 min-w-0">
               <h3
                  className={`text-sm font-medium truncate ${
                     completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
               >
                  {subtask.title}
               </h3>
               <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="flex items-center">
                     <HiCalendar className="w-3 h-3 mr-1" />
                     <span>{subtask.date}</span>
                  </div>
                  {renderPriorityBadge()}
               </div>
            </div>
         </div>
         <div className="flex items-center space-x-1 ml-2">
            <button
               onClick={handleEdit}
               className="p-1 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
            >
               <HiPencilAlt className="w-4 h-4" />
            </button>
            <button
               onClick={handleDelete}
               className="p-1 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
            >
               <FiTrash2 className="w-4 h-4" />
            </button>
         </div>
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
