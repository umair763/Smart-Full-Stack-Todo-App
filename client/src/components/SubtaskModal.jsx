'use client';

import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiCalendar, FiClock, FiList, FiFlag } from 'react-icons/fi';
import Modal from './Modal';

function SubtaskModal({ isOpen, onClose, onSave, parentTaskId, parentTask, subtask = null }) {
   const [title, setTitle] = useState('');
   const [description, setDescription] = useState('');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');
   const [priority, setPriority] = useState('Medium');
   const [showDatePicker, setShowDatePicker] = useState(false);
   const [showTimePicker, setShowTimePicker] = useState(false);
   const [selectedHour, setSelectedHour] = useState(12);
   const [selectedMinute, setSelectedMinute] = useState(0);
   const [selectedAmPm, setSelectedAmPm] = useState('PM');

   // Set form values if editing an existing subtask
   useEffect(() => {
      if (subtask) {
         setTitle(subtask.title || '');
         setDescription(subtask.description || '');
         setDate(subtask.date || '');
         setTime(subtask.time || '');
         setPriority(subtask.priority || 'Medium');
      } else {
         // Reset form for new subtasks
         setTitle('');
         setDescription('');
         setDate('');
         setTime('');
         setPriority('Medium');
      }
   }, [subtask, isOpen]);

   function convertTo12HourFormat(hour, minute, ampm) {
      return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
   }

   // Format date to DD/MM/YYYY
   const formatDate = (selectedDate) => {
      const date = new Date(selectedDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
   };

   // Handle date selection from calendar
   const handleDateSelect = (selectedDate) => {
      setDate(formatDate(selectedDate));
      setShowDatePicker(false);
   };

   // Handle time selection
   const handleTimeSelect = () => {
      const formattedTime = convertTo12HourFormat(selectedHour, selectedMinute, selectedAmPm);
      setTime(formattedTime);
      setShowTimePicker(false);
   };

   // Generate current month calendar
   const generateCalendar = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

      const days = [];

      // Add empty cells for days before the first day of month
      for (let i = 0; i < firstDayOfMonth; i++) {
         days.push(<div key={`empty-${i}`} className="h-6 w-6"></div>);
      }

      // Add days of month
      for (let day = 1; day <= daysInMonth; day++) {
         const isToday = day === today.getDate();
         const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day
            .toString()
            .padStart(2, '0')}`;

         days.push(
            <button
               key={day}
               type="button"
               onClick={() => handleDateSelect(dateString)}
               className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors text-xs font-medium ${
                  isToday ? 'bg-[#9406E6] text-white' : 'hover:bg-purple-200 text-gray-700'
               }`}
            >
               {day}
            </button>
         );
      }

      return days;
   };

   // Generate hour selector for time picker
   const generateHourSelector = () => {
      const hours = [];
      for (let i = 1; i <= 12; i++) {
         hours.push(
            <button
               key={i}
               type="button"
               onClick={() => setSelectedHour(i)}
               className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                  selectedHour === i ? 'bg-[#9406E6] text-white' : 'hover:bg-purple-200 text-gray-700'
               }`}
            >
               {i}
            </button>
         );
      }
      return hours;
   };

   // Generate minute selector for time picker
   const generateMinuteSelector = () => {
      const minutes = [];
      for (let i = 0; i < 60; i += 5) {
         minutes.push(
            <button
               key={i}
               type="button"
               onClick={() => setSelectedMinute(i)}
               className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                  selectedMinute === i ? 'bg-[#9406E6] text-white' : 'hover:bg-purple-200 text-gray-700'
               }`}
            >
               {i.toString().padStart(2, '0')}
            </button>
         );
      }
      return minutes;
   };

   // Handle form submission
   function handleSubmit(e) {
      e.preventDefault();
      if (!title || !date || !time) return;

      // Validate date format (DD/MM/YYYY)
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(date)) {
         alert('Please enter date in DD/MM/YYYY format');
         return;
      }

      // Validate time format (HH:MM AM/PM)
      const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9]\s(AM|PM)$/;
      if (!timeRegex.test(time)) {
         alert('Please enter time in HH:MM AM/PM format');
         return;
      }

      // Check if subtask deadline is before parent task's deadline
      if (parentTaskId && validateDeadline()) {
         const subtaskData = {
            title,
            description,
            date,
            time,
            priority,
         };

         onSave(subtaskData, subtask?._id);
         onClose();
      }
   }

   // Validate that subtask deadline is not before parent task deadline
   const validateDeadline = () => {
      // Convert date strings to Date objects
      const parentDateParts = parentTask.date.split('/');
      const parentDate = new Date(
         `${parentDateParts[2]}-${parentDateParts[1]}-${parentDateParts[0]}T${convertTimeStringTo24Hour(
            parentTask.time
         )}`
      );

      const subtaskDateParts = date.split('/');
      const subtaskDate = new Date(
         `${subtaskDateParts[2]}-${subtaskDateParts[1]}-${subtaskDateParts[0]}T${convertTimeStringTo24Hour(time)}`
      );

      // Check if subtask date is before parent date
      if (subtaskDate < parentDate) {
         // Use the notification context to show error
         import('../app/context/NotificationContext')
            .then(({ useNotification }) => {
               const { createErrorNotification } = useNotification();
               createErrorNotification('Error: Subtask deadline cannot be set before parent task deadline.', true);
            })
            .catch(() => {
               // Fallback to alert if notification context not available
               alert('Error: Subtask deadline cannot be set before parent task deadline.');
            });
         return false;
      }

      return true;
   };

   // Convert time string from 12-hour format (HH:MM AM/PM) to 24-hour format (HH:MM:00)
   const convertTimeStringTo24Hour = (timeString) => {
      const [time, period] = timeString.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'PM' && hours !== 12) {
         hours += 12;
      } else if (period === 'AM' && hours === 12) {
         hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
   };

   const priorityOptions = [
      { value: 'Low', label: 'Low', color: 'green', icon: '🟢' },
      { value: 'Medium', label: 'Medium', color: 'yellow', icon: '🟡' },
      { value: 'High', label: 'High', color: 'red', icon: '🔴' },
   ];

   return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
         <div className="p-3 sm:p-4 lg:p-5">
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                     {subtask ? <FiList className="h-4 w-4 text-white" /> : <FiPlus className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                     <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        {subtask ? 'Edit Subtask' : 'Create Subtask'}
                     </h2>
                     <p className="text-xs text-gray-600">{subtask ? 'Update details' : 'Break down your task'}</p>
                  </div>
               </div>
            <button
               onClick={onClose}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 group"
            >
                  <FiX className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
            </button>
            </div>

            {/* Compact Parent Task Info */}
            {parentTask && (
               <div className="bg-gradient-to-r from-indigo-100/60 to-purple-100/60 backdrop-blur-sm rounded-xl p-3 border border-indigo-200/50 mb-4">
                  <div className="flex items-center space-x-2">
                     <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FiList className="h-3 w-3 text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{parentTask.task}</p>
                        <p className="text-xs text-gray-600">
                           Due: {parentTask.date} at {parentTask.time}
                        </p>
                     </div>
                  </div>
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
               {/* Title Input */}
               <div className="space-y-1">
                  <label className="block text-gray-900 text-sm font-semibold">Subtask Title</label>
                  <input
                     type="text"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm"
                     placeholder="Enter subtask title..."
                     required
                  />
               </div>

               {/* Description Input */}
               <div className="space-y-1">
                  <label className="block text-gray-900 text-sm font-semibold">
                     Description <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                  </label>
                  <textarea
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none text-sm"
                     placeholder="Add details or notes..."
                     rows="2"
                  />
               </div>

               {/* Date and Time Section */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Date Input */}
                  <div className="space-y-1">
                     <label className="block text-gray-900 text-sm font-semibold flex items-center space-x-1">
                        <FiCalendar className="h-3 w-3 text-indigo-500" />
                        <span>Due Date</span>
                     </label>
                  <div className="relative">
                     <input
                        type="text"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onFocus={() => setShowDatePicker(true)}
                           className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm"
                        placeholder="DD/MM/YYYY"
                        required
                     />
                     {showDatePicker && (
                           <div className="absolute z-20 mt-1 p-3 bg-white rounded-xl shadow-2xl border border-gray-200 backdrop-blur-xl max-w-[280px]">
                           <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-semibold text-gray-900 text-sm">
                                    {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
                              </h4>
                              <button
                                 type="button"
                                 onClick={() => setShowDatePicker(false)}
                                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                    <FiX className="h-3 w-3 text-gray-600" />
                              </button>
                           </div>
                              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                    <div key={day} className="text-xs font-medium text-gray-500 py-1">
                                    {day}
                                 </div>
                              ))}
                           </div>
                           <div className="grid grid-cols-7 gap-1">{generateCalendar()}</div>
                        </div>
                     )}
                  </div>
               </div>

                  {/* Time Input */}
                  <div className="space-y-1">
                     <label className="block text-gray-900 text-sm font-semibold flex items-center space-x-1">
                        <FiClock className="h-3 w-3 text-indigo-500" />
                        <span>Due Time</span>
                     </label>
                  <div className="relative">
                     <input
                        type="text"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onFocus={() => setShowTimePicker(true)}
                           className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm"
                        placeholder="HH:MM AM/PM"
                        required
                     />
                     {showTimePicker && (
                           <div className="absolute z-20 mt-1 p-3 bg-white rounded-xl shadow-2xl border border-gray-200 backdrop-blur-xl">
                           <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-semibold text-gray-900 text-sm">Select Time</h4>
                              <button
                                 type="button"
                                 onClick={() => setShowTimePicker(false)}
                                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                    <FiX className="h-3 w-3 text-gray-600" />
                              </button>
                              </div>
                              <div className="flex gap-3">
                                 <div>
                                    <p className="text-xs font-medium text-gray-700 mb-1">Hour</p>
                                    <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
                                       {generateHourSelector()}
                                    </div>
                              </div>
                              <div>
                                    <p className="text-xs font-medium text-gray-700 mb-1">Min</p>
                                    <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
                                       {generateMinuteSelector()}
                                    </div>
                              </div>
                              <div>
                                    <p className="text-xs font-medium text-gray-700 mb-1">Period</p>
                                 <div className="flex flex-col gap-1">
                                    <button
                                       type="button"
                                       onClick={() => setSelectedAmPm('AM')}
                                          className={`h-7 w-10 rounded-lg flex items-center justify-center font-medium transition-all text-xs ${
                                          selectedAmPm === 'AM'
                                                ? 'bg-indigo-500 text-white shadow-md'
                                                : 'hover:bg-indigo-100 text-gray-700 border border-gray-200'
                                       }`}
                                    >
                                       AM
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => setSelectedAmPm('PM')}
                                          className={`h-7 w-10 rounded-lg flex items-center justify-center font-medium transition-all text-xs ${
                                          selectedAmPm === 'PM'
                                                ? 'bg-indigo-500 text-white shadow-md'
                                                : 'hover:bg-indigo-100 text-gray-700 border border-gray-200'
                                       }`}
                                    >
                                       PM
                                    </button>
                                 </div>
                              </div>
                           </div>
                           <button
                              type="button"
                              onClick={handleTimeSelect}
                                 className="mt-2 w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-1.5 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold text-sm"
                           >
                              Set Time
                           </button>
                        </div>
                     )}
                     </div>
                  </div>
               </div>

               {/* Compact Priority Selection */}
               <div className="space-y-2">
                  <label className="block text-gray-900 text-sm font-semibold flex items-center space-x-1">
                     <FiFlag className="h-3 w-3 text-indigo-500" />
                     <span>Priority</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                     {priorityOptions.map((option) => (
                     <button
                           key={option.value}
                        type="button"
                           onClick={() => setPriority(option.value)}
                           className={`
                              p-2 rounded-lg border-2 transition-all duration-300 hover:shadow-sm text-center
                              ${
                                 priority === option.value
                                    ? option.color === 'green'
                                       ? 'bg-green-50 border-green-400 shadow-sm'
                                       : option.color === 'yellow'
                                       ? 'bg-yellow-50 border-yellow-400 shadow-sm'
                                       : 'bg-red-50 border-red-400 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                              }
                           `}
                        >
                           <div className="flex flex-col items-center space-y-1">
                              <span className="text-lg">{option.icon}</span>
                              <span
                                 className={`font-medium text-xs ${
                                    priority === option.value
                                       ? option.color === 'green'
                                          ? 'text-green-800'
                                          : option.color === 'yellow'
                                          ? 'text-yellow-800'
                                          : 'text-red-800'
                                       : 'text-gray-700'
                                 }`}
                              >
                                 {option.label}
                              </span>
                           </div>
                     </button>
                     ))}
                  </div>
               </div>

               {/* Compact Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-2 pt-3">
                  <button
                     type="button"
                     onClick={onClose}
                     className="w-full sm:w-auto px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="w-full sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2 text-sm"
                  >
                     {subtask ? <FiList className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
                     <span>{subtask ? 'Update' : 'Create'}</span>
                  </button>
               </div>
            </form>
         </div>
      </Modal>
   );
}

export default SubtaskModal;
