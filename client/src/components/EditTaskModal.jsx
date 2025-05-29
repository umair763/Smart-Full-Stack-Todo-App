'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { HiX, HiPencilAlt } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

function EditTaskModal({ isOpen, onClose, onSave, task }) {
   const [formData, setFormData] = useState({
      title: '',
      date: '',
      time: '',
      priority: 'Medium',
   });

   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');

   // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
   const convertDateToInputFormat = (dateStr) => {
      if (!dateStr) return '';
      try {
         const [day, month, year] = dateStr.split('/');
         if (!day || !month || !year) return '';
         return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } catch (error) {
         console.error('Error converting date to input format:', error);
         return '';
      }
   };

   // Helper function to convert YYYY-MM-DD to DD/MM/YYYY
   const convertDateToApiFormat = (dateStr) => {
      if (!dateStr) return '';
      try {
         const [year, month, day] = dateStr.split('-');
         if (!day || !month || !year) return '';
         return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      } catch (error) {
         console.error('Error converting date to API format:', error);
         return '';
      }
   };

   // Helper function to convert 12-hour time to 24-hour time
   const convertTimeToInputFormat = (timeStr) => {
      if (!timeStr) return '';
      try {
         const [time, period] = timeStr.split(' ');
         if (!time || !period) return '';
         const [hours, minutes] = time.split(':');
         if (!hours || !minutes) return '';
         let hour = parseInt(hours, 10);

         if (period === 'PM' && hour !== 12) hour += 12;
         if (period === 'AM' && hour === 12) hour = 0;

         return `${hour.toString().padStart(2, '0')}:${minutes}`;
      } catch (error) {
         console.error('Error converting time to input format:', error);
         return '';
      }
   };

   // Helper function to convert 24-hour time to 12-hour time
   const convertTimeToApiFormat = (timeStr) => {
      if (!timeStr) return '';
      try {
         const [hours, minutes] = timeStr.split(':');
         if (!hours || !minutes) return '';
         const hour = parseInt(hours, 10);
         if (isNaN(hour) || hour < 0 || hour > 23) return '';
         const period = hour >= 12 ? 'PM' : 'AM';
         const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
         return `${hour12}:${minutes} ${period}`;
      } catch (error) {
         console.error('Error converting time to API format:', error);
         return '';
      }
   };

   useEffect(() => {
      if (task) {
         setFormData({
            title: task.task || task.title || '',
            date: convertDateToInputFormat(task.date) || '',
            time: convertTimeToInputFormat(task.time) || '',
            priority: task.priority || 'Medium',
         });
      }
      setError('');
   }, [task, isOpen]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
         setError('Task title is required');
         return;
      }

      if (formData.date && !formData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
         setError('Invalid date format. Please use the date picker.');
         return;
      }

      if (formData.time && !formData.time.match(/^\d{2}:\d{2}$/)) {
         setError('Invalid time format. Please use the time picker.');
         return;
      }

      setIsLoading(true);
      setError('');

      try {
         // Format the date and time for the API
         const apiFormData = {
            task: formData.title.trim(),
            date: formData.date ? convertDateToApiFormat(formData.date) : '',
            time: formData.time ? convertTimeToApiFormat(formData.time) : '',
            priority: formData.priority,
         };

         await onSave(task._id, apiFormData);
         onClose();
      } catch (error) {
         console.error('Error updating task:', error);
         setError(error.message || 'Failed to update task');
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
                     <HiPencilAlt className="h-4 w-4 text-white" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-white font-proza">Edit Task</h2>
                     <p className="text-xs text-white/80 truncate max-w-[180px]">
                        {task?.task || task?.title || 'Task'}
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
                     <label className="block text-white text-xs font-medium mb-1">Task Title *</label>
                     <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm touch-manipulation"
                        placeholder="Enter task title"
                        required
                        disabled={isLoading}
                        autoFocus
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
                           Updating...
                        </span>
                     ) : (
                        'Update Task'
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

export default EditTaskModal;
