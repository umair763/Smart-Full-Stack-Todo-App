'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { HiX, HiCalendar, HiClock, HiPlus, HiPencilAlt } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { API_BASE_URL } from '../config/env';

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
   }, [subtask, isOpen]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
         setError('Subtask title is required');
         return;
      }

      setIsLoading(true);
      setError('');

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const url = isEditing
            ? `${API_BASE_URL}/api/tasks/${parentTaskId}/subtasks/${subtask._id}`
            : `${API_BASE_URL}/api/tasks/${parentTaskId}/subtasks`;

         const method = isEditing ? 'PUT' : 'POST';

         const response = await fetch(url, {
            method,
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} subtask`);
         }

         const result = await response.json();

         // Call the onSave callback if provided
         if (onSave) {
            onSave(result.subtask || result);
         }

         // Close the modal
         onClose();
      } catch (error) {
         console.error(`Error ${isEditing ? 'updating' : 'creating'} subtask:`, error);
         setError(error.message || `Failed to ${isEditing ? 'update' : 'create'} subtask`);
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
         onClose();
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && !isLoading) {
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
            className="bg-gradient-to-br from-indigo-600/95 to-purple-600/95 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-sm mx-3 transform transition-all duration-300 ease-out"
            style={{
               animation: 'modalSlideIn 0.4s ease-out forwards',
            }}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
               <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-1.5 rounded-full">
                     {isEditing ? (
                        <HiPencilAlt className="h-4 w-4 text-white" />
                     ) : (
                        <HiPlus className="h-4 w-4 text-white" />
                     )}
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-white font-proza">
                        {isEditing ? 'Edit Subtask' : 'Add Subtask'}
                     </h2>
                     <p className="text-xs text-white/80 truncate max-w-[180px]">
                        {parentTask?.title || 'Parent Task'}
                     </p>
                  </div>
               </div>
               {!isLoading && (
                  <button
                     onClick={handleClose}
                     className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20 touch-manipulation"
                  >
                     <HiX className="h-5 w-5" />
                  </button>
               )}
            </div>

            {/* Content */}
            <div className="p-4">
               {/* Error Message */}
               {error && (
                  <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                     <p className="text-red-200 text-xs">{error}</p>
                  </div>
               )}

               {/* Form */}
               <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Title */}
                  <div>
                     <label className="block text-white text-xs font-medium mb-1">Subtask Title *</label>
                     <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm touch-manipulation"
                        placeholder="Enter subtask title"
                        required
                        disabled={isLoading}
                        autoFocus
                     />
                  </div>

                  {/* Description */}
                  <div>
                     <label className="block text-white text-xs font-medium mb-1">Description</label>
                     <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent resize-none text-sm touch-manipulation"
                        placeholder="Enter description (optional)"
                        disabled={isLoading}
                     />
                  </div>

                  {/* Date and Time - Compact Grid */}
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="block text-white text-xs font-medium mb-1">Date</label>
                        <input
                           type="date"
                           name="date"
                           value={formData.date}
                           onChange={handleChange}
                           className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm touch-manipulation"
                           disabled={isLoading}
                        />
                     </div>
                     <div>
                        <label className="block text-white text-xs font-medium mb-1">Time</label>
                        <input
                           type="time"
                           name="time"
                           value={formData.time}
                           onChange={handleChange}
                           className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm touch-manipulation"
                           disabled={isLoading}
                        />
                     </div>
                  </div>

                  {/* Priority */}
                  <div>
                     <label className="block text-white text-xs font-medium mb-1">Priority</label>
                     <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm touch-manipulation"
                        disabled={isLoading}
                     >
                        <option value="Low" className="text-gray-900">
                           Low
                        </option>
                        <option value="Medium" className="text-gray-900">
                           Medium
                        </option>
                        <option value="High" className="text-gray-900">
                           High
                        </option>
                     </select>
                  </div>
               </form>
            </div>

            {/* Footer - Action Buttons */}
            <div className="p-4 border-t border-white/20 bg-white/5">
               <div className="flex flex-col space-y-2">
                  <button
                     onClick={handleSubmit}
                     disabled={isLoading || !formData.title.trim()}
                     className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-sm touch-manipulation ${
                        !isLoading && formData.title.trim()
                           ? 'bg-white text-indigo-600 hover:bg-white/90 shadow-lg hover:shadow-white/25 active:scale-[0.98]'
                           : 'bg-white/30 text-white/50 cursor-not-allowed'
                     }`}
                  >
                     {isLoading ? (
                        <span className="flex items-center justify-center">
                           <AiOutlineLoading3Quarters className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" />
                           {isEditing ? 'Updating...' : 'Creating...'}
                        </span>
                     ) : (
                        <>{isEditing ? 'Update Subtask' : 'Create Subtask'}</>
                     )}
                  </button>
                  <button
                     type="button"
                     onClick={handleClose}
                     disabled={isLoading}
                     className={`w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] text-sm touch-manipulation ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                     }`}
                  >
                     Cancel
                  </button>
               </div>
            </div>
         </div>
      </div>
   );

   // Use React Portal to render the modal at the document body level
   return createPortal(modalContent, document.body);
}

export default SubtaskModal;
