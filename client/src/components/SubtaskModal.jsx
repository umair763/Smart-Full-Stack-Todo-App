'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

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
         days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
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
               className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
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
               className={`h-10 w-10 rounded-full flex items-center justify-center ${
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
               className={`h-10 w-10 rounded-full flex items-center justify-center ${
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

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
         <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6 m-4 relative">
            <button
               onClick={onClose}
               className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
               <FiX className="h-6 w-6" />
            </button>

            <h2 className="text-xl font-bold mb-5 text-gray-800">{subtask ? 'Edit Subtask' : 'Add New Subtask'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Subtask Title</label>
                  <input
                     type="text"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] transition-all"
                     placeholder="Enter subtask title"
                     required
                  />
               </div>

               <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] transition-all"
                     placeholder="Enter description"
                     rows="2"
                  />
               </div>

               <div className="relative">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Date (DD/MM/YYYY)</label>
                  <div className="relative">
                     <input
                        type="text"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onFocus={() => setShowDatePicker(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] transition-all"
                        placeholder="DD/MM/YYYY"
                        required
                     />
                     {showDatePicker && (
                        <div className="absolute z-10 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                           <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-800">
                                 {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                              </h4>
                              <button
                                 type="button"
                                 onClick={() => setShowDatePicker(false)}
                                 className="text-gray-600 hover:text-gray-800"
                              >
                                 <FiX className="h-5 w-5" />
                              </button>
                           </div>
                           <div className="grid grid-cols-7 gap-1 text-center mb-2">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                 <div key={day} className="text-xs font-medium text-gray-500">
                                    {day}
                                 </div>
                              ))}
                           </div>
                           <div className="grid grid-cols-7 gap-1">{generateCalendar()}</div>
                        </div>
                     )}
                  </div>
               </div>

               <div className="relative">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Time (HH:MM AM/PM)</label>
                  <div className="relative">
                     <input
                        type="text"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onFocus={() => setShowTimePicker(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] transition-all"
                        placeholder="HH:MM AM/PM"
                        required
                     />
                     {showTimePicker && (
                        <div className="absolute z-10 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                           <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-800">Select Time</h4>
                              <button
                                 type="button"
                                 onClick={() => setShowTimePicker(false)}
                                 className="text-gray-600 hover:text-gray-800"
                              >
                                 <FiX className="h-5 w-5" />
                              </button>
                           </div>
                           <div className="flex gap-4">
                              <div>
                                 <p className="text-xs font-medium text-gray-500 mb-1">Hour</p>
                                 <div className="grid grid-cols-4 gap-1">{generateHourSelector()}</div>
                              </div>
                              <div>
                                 <p className="text-xs font-medium text-gray-500 mb-1">Minute</p>
                                 <div className="grid grid-cols-4 gap-1">{generateMinuteSelector()}</div>
                              </div>
                              <div>
                                 <p className="text-xs font-medium text-gray-500 mb-1">AM/PM</p>
                                 <div className="flex flex-col gap-1">
                                    <button
                                       type="button"
                                       onClick={() => setSelectedAmPm('AM')}
                                       className={`h-10 w-14 rounded-lg flex items-center justify-center ${
                                          selectedAmPm === 'AM'
                                             ? 'bg-[#9406E6] text-white'
                                             : 'hover:bg-purple-200 text-gray-700'
                                       }`}
                                    >
                                       AM
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => setSelectedAmPm('PM')}
                                       className={`h-10 w-14 rounded-lg flex items-center justify-center ${
                                          selectedAmPm === 'PM'
                                             ? 'bg-[#9406E6] text-white'
                                             : 'hover:bg-purple-200 text-gray-700'
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
                              className="mt-3 w-full bg-[#9406E6] text-white py-2 rounded-lg hover:bg-[#7D05C3] transition-colors"
                           >
                              Set Time
                           </button>
                        </div>
                     )}
                  </div>
               </div>

               <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Priority</label>
                  <div className="flex gap-2">
                     <button
                        type="button"
                        onClick={() => setPriority('Low')}
                        className={`flex-1 py-2 px-4 rounded-lg border ${
                           priority === 'Low'
                              ? 'bg-green-100 border-green-500 text-green-800'
                              : 'border-gray-300 hover:bg-green-50 text-gray-700'
                        }`}
                     >
                        Low
                     </button>
                     <button
                        type="button"
                        onClick={() => setPriority('Medium')}
                        className={`flex-1 py-2 px-4 rounded-lg border ${
                           priority === 'Medium'
                              ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
                              : 'border-gray-300 hover:bg-yellow-50 text-gray-700'
                        }`}
                     >
                        Medium
                     </button>
                     <button
                        type="button"
                        onClick={() => setPriority('High')}
                        className={`flex-1 py-2 px-4 rounded-lg border ${
                           priority === 'High'
                              ? 'bg-red-100 border-red-500 text-red-800'
                              : 'border-gray-300 hover:bg-red-50 text-gray-700'
                        }`}
                     >
                        High
                     </button>
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                  <button
                     type="button"
                     onClick={onClose}
                     className="px-4 py-2 border border-gray-300 rounded-lg mr-2 hover:bg-gray-100 transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="px-4 py-2 bg-[#9406E6] text-white rounded-lg hover:bg-[#7D05C3] transition-colors"
                  >
                     {subtask ? 'Update Subtask' : 'Add Subtask'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}

export default SubtaskModal;
