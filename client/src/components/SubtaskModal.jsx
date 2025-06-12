'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { HiX, HiPlus, HiPencilAlt } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useAuth } from '../app/context/AuthContext';
import { useNotification } from '../app/context/NotificationContext';
import { useTheme } from '../app/context/ThemeContext';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function SubtaskModal({ isOpen, onClose, onSave, parentTaskId, parentTask, subtask = null }) {
   const [formData, setFormData] = useState({
      title: '',
      description: '',
      date: '',
      time: '',
      priority: 'Medium',
   });

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');
   const { token } = useAuth();
   const { createSuccessNotification, createErrorNotification } = useNotification();
   const isSubmitting = useRef(false);
   const { isDark } = useTheme();

   // Check if we're editing an existing subtask
   const isEditing = Boolean(subtask);

   useEffect(() => {
      if (subtask) {
         // Editing existing subtask
         setFormData({
            title: subtask.title || '',
            description: subtask.description || '',
            date: subtask.date || '',
            time: subtask.time || '',
            priority: subtask.priority || 'Medium',
         });
      } else {
         // Creating new subtask - reset form
         setFormData({
            title: '',
            description: '',
            date: '',
            time: '',
            priority: 'Medium',
         });
      }
      setError('');
      isSubmitting.current = false;
   }, [subtask, isOpen]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
         setError('Subtask title is required');
         return;
      }

      // Prevent duplicate submissions using ref
      if (isSubmitting.current || isLoading) {
         console.log('Preventing duplicate submission');
         return;
      }

      // Set submission flag
      isSubmitting.current = true;
      setIsLoading(true);
      setError('');

      try {
         const url = isEditing
            ? `${BACKEND_URL}/api/tasks/${parentTaskId}/subtasks/${subtask._id}`
            : `${BACKEND_URL}/api/tasks/${parentTaskId}/subtasks`;

         const method = isEditing ? 'PUT' : 'POST';

         console.log(`Submitting subtask form: ${method} ${url}`);

         const response = await fetch(url, {
            method,
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
         });

         const data = await response.json();

         if (!response.ok) {
            throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} subtask`);
         }

         // Show success notification
         createSuccessNotification(
            `Subtask ${isEditing ? 'updated' : 'created'} successfully: ${formData.title}`,
            true
         );

         // Call the onSave callback if provided
         if (onSave) {
            onSave(data.subtask || data);
         }

         // Close the modal
         onClose();
      } catch (error) {
         console.error(`Error ${isEditing ? 'updating' : 'creating'} subtask:`, error);
         setError(error.message || `Failed to ${isEditing ? 'update' : 'create'} subtask`);
         createErrorNotification(`Failed to ${isEditing ? 'update' : 'create'} subtask: ${error.message}`, true);

         // Reset submission flag on error
         isSubmitting.current = false;
      } finally {
         setIsLoading(false);
      }
   };

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: value,
      }));
      // Clear error when user starts typing
      if (error) setError('');
   };

   const handleClose = () => {
      if (!isLoading) {
         isSubmitting.current = false;
         onClose();
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && !isLoading) {
         isSubmitting.current = false;
         onClose();
      }
   };

   if (!isOpen) return null;

   const modalContent = (
      <div
         className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-3 sm:p-4"
         style={{
            animation: 'modalBackdropFadeIn 0.3s ease-out forwards',
         }}
         onClick={handleBackdropClick}
      >
         <div
            className={`rounded-xl shadow-2xl w-full max-w-sm mx-3 transform transition-all duration-300 ease-out ${
               isDark
                  ? 'bg-gray-800/95 border border-gray-700'
                  : 'bg-gradient-to-br from-indigo-600/95 to-purple-600/95'
            } backdrop-blur-lg`}
            style={{
               animation: 'modalSlideIn 0.4s ease-out forwards',
            }}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div
               className={`flex items-center justify-between p-4 border-b ${
                  isDark ? 'border-gray-700' : 'border-white/20'
               }`}
            >
               <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white/20'}`}>
                     {isEditing ? (
                        <HiPencilAlt className="h-4 w-4 text-white" />
                     ) : (
                        <HiPlus className="h-4 w-4 text-white" />
                     )}
                  </div>
                  <div>
                     <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-white'} font-proza`}>
                        {isEditing ? 'Edit Subtask' : 'Add Subtask'}
                     </h2>
                     <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-white/80'} truncate max-w-[180px]`}>
                        {parentTask?.title || 'Parent Task'}
                     </p>
                  </div>
               </div>
               {!isLoading && (
                  <button
                     onClick={handleClose}
                     className={`${
                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-white/80 hover:text-white'
                     } transition-colors p-1 rounded-full hover:bg-white/20 touch-manipulation`}
                  >
                     <HiX className="h-5 w-5" />
                  </button>
               )}
            </div>

            {/* Content */}
            <div className="p-4">
               <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title Input */}
                  <div>
                     <label
                        htmlFor="title"
                        className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-white'}`}
                     >
                        Title
                     </label>
                     <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${
                           isDark
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-white/10 border-white/20 text-white placeholder-white/50'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                        placeholder="Enter subtask title"
                        required
                     />
                  </div>

                  {/* Description Input */}
                  <div>
                     <label
                        htmlFor="description"
                        className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-white'}`}
                     >
                        Description
                     </label>
                     <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border ${
                           isDark
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-white/10 border-white/20 text-white placeholder-white/50'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                        placeholder="Enter subtask description (optional)"
                     />
                  </div>

                  {/* Priority Selection */}
                  <div>
                     <label
                        htmlFor="priority"
                        className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-white'}`}
                     >
                        Priority
                     </label>
                     <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${
                           isDark
                              ? 'bg-gray-700 border-gray-600 text-gray-100'
                              : 'bg-white/10 border-white/20 text-white'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                     >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                     </select>
                  </div>

                  {/* Date and Time Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label
                           htmlFor="date"
                           className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-white'}`}
                        >
                           Date
                        </label>
                        <input
                           type="date"
                           id="date"
                           name="date"
                           value={formData.date}
                           onChange={handleChange}
                           className={`w-full px-3 py-2 rounded-lg border ${
                              isDark
                                 ? 'bg-gray-700 border-gray-600 text-gray-100'
                                 : 'bg-white/10 border-white/20 text-white'
                           } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                        />
                     </div>
                     <div>
                        <label
                           htmlFor="time"
                           className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-white'}`}
                        >
                           Time
                        </label>
                        <input
                           type="time"
                           id="time"
                           name="time"
                           value={formData.time}
                           onChange={handleChange}
                           className={`w-full px-3 py-2 rounded-lg border ${
                              isDark
                                 ? 'bg-gray-700 border-gray-600 text-gray-100'
                                 : 'bg-white/10 border-white/20 text-white'
                           } focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                        />
                     </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                     <div className="text-red-500 text-sm mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                        {error}
                     </div>
                  )}

                  {/* Submit Button */}
                  <button
                     type="submit"
                     disabled={isLoading}
                     className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                     } ${
                        isDark
                           ? 'bg-purple-600 hover:bg-purple-700 text-white'
                           : 'bg-white text-purple-600 hover:bg-white/90'
                     }`}
                  >
                     {isLoading ? (
                        <div className="flex items-center justify-center">
                           <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 mr-2" />
                           {isEditing ? 'Updating...' : 'Creating...'}
                        </div>
                     ) : isEditing ? (
                        'Update Subtask'
                     ) : (
                        'Create Subtask'
                     )}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );

   return isOpen ? createPortal(modalContent, document.body) : null;
}

export default SubtaskModal;
