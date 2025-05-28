'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { HiX, HiClock, HiBell, HiCalendar } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

function ReminderModal({ isOpen, onClose, task, onSetReminder }) {
   const [reminderDateTime, setReminderDateTime] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');

   // Reset form when modal opens
   useEffect(() => {
      if (isOpen) {
         setReminderDateTime('');
         setError('');
      }
   }, [isOpen]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!reminderDateTime) {
         setError('Please select a reminder date and time');
         return;
      }

      // Validate that reminder time is in the future
      const reminderTime = new Date(reminderDateTime);
      if (reminderTime <= new Date()) {
         setError('Reminder time must be in the future');
         return;
      }

      setIsLoading(true);
      setError('');

      try {
         await onSetReminder(task._id, reminderDateTime);
         setReminderDateTime('');
         onClose();
      } catch (error) {
         console.error('Error setting reminder:', error);
         setError(error.message || 'Failed to set reminder');
      } finally {
         setIsLoading(false);
      }
   };

   const handleChange = (e) => {
      setReminderDateTime(e.target.value);
      // Clear error when user starts typing
      if (error) setError('');
   };

   const handleClose = () => {
      if (!isLoading) {
         setReminderDateTime('');
         setError('');
         onClose();
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && !isLoading) {
         handleClose();
      }
   };

   // Get minimum datetime (current time + 1 minute)
   const getMinDateTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      return now.toISOString().slice(0, 16);
   };

   // Format the selected time for display
   const formatSelectedTime = () => {
      if (!reminderDateTime) return '';
      const date = new Date(reminderDateTime);
      return date.toLocaleString('en-US', {
         weekday: 'short',
         month: 'short',
         day: 'numeric',
         hour: 'numeric',
         minute: '2-digit',
         hour12: true,
      });
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
            className="bg-gradient-to-br from-blue-600/95 to-cyan-600/95 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-sm mx-3 transform transition-all duration-300 ease-out"
            style={{
               animation: 'modalSlideIn 0.4s ease-out forwards',
            }}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
               <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-1.5 rounded-full">
                     <HiBell className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-white font-proza">Set Reminder</h2>
                     <p className="text-xs text-white/80 truncate max-w-[180px]">Never forget this task ⏰</p>
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
                  {/* Reminder DateTime */}
                  <div>
                     <label className="block text-white text-xs font-medium mb-1">When to remind you? *</label>
                     <div className="relative">
                        <input
                           type="datetime-local"
                           value={reminderDateTime}
                           onChange={handleChange}
                           min={getMinDateTime()}
                           className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:border-transparent text-sm touch-manipulation"
                           required
                           disabled={isLoading}
                           autoFocus
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50">
                        </div>
                     </div>
                     {reminderDateTime && <p className="text-cyan-100/80 text-xs mt-1">📅 {formatSelectedTime()}</p>}
                  </div>

                  {/* Task Info */}
                  <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                     <div className="flex items-center space-x-2 mb-2">
                        <HiClock className="h-4 w-4 text-cyan-200" />
                        <span className="text-cyan-100 text-xs font-medium">Task to remind</span>
                     </div>
                     <p className="text-white text-sm font-medium truncate">{task?.task || task?.title}</p>
                     {(task?.date || task?.time) && (
                        <p className="text-cyan-100/70 text-xs mt-1">
                           📋 Due: {task?.date} {task?.time && `at ${task.time}`}
                        </p>
                     )}
                  </div>
               </form>
            </div>

            {/* Footer - Action Buttons */}
            <div className="p-4 border-t border-white/20 bg-white/5">
               <div className="flex flex-col space-y-2">
                  <button
                     onClick={handleSubmit}
                     disabled={isLoading || !reminderDateTime}
                     className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-sm touch-manipulation ${
                        !isLoading && reminderDateTime
                           ? 'bg-white text-blue-600 hover:bg-white/90 shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98]'
                           : 'bg-white/30 text-white/50 cursor-not-allowed'
                     }`}
                  >
                     {isLoading ? (
                        <span className="flex items-center justify-center">
                           <AiOutlineLoading3Quarters className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" />
                           Setting...
                        </span>
                     ) : (
                        '🔔 Set Reminder'
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

export default ReminderModal;
