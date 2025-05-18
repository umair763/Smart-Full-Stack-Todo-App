'use client';

import { useState } from 'react';
// import './styles/AddTaskForm.css';

function AddTaskForm({ SetisAddFormVisible, addTask }) {
   const [color, setColor] = useState('green');
   const [task, setTask] = useState('');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');
   const [showDatePicker, setShowDatePicker] = useState(false);
   const [showTimePicker, setShowTimePicker] = useState(false);
   const [selectedHour, setSelectedHour] = useState(12);
   const [selectedMinute, setSelectedMinute] = useState(0);
   const [selectedAmPm, setSelectedAmPm] = useState('PM');

   function convertTo12HourFormat(hour, minute, ampm) {
      return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
   }

   function convertToDateFormat(date) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
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

   function handleSubmit(e) {
      e.preventDefault();
      if (!task || !date || !time) return;

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

      const newTask = {
         color,
         task,
         date,
         time,
         status: false,
      };

      addTask(newTask);
      SetisAddFormVisible();
   }

   return (
      <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg mb-6">
         <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-white">Add New Task</h2>
            <button
               onClick={() => SetisAddFormVisible(false)}
               className="text-white hover:text-red-300 transition-colors"
            >
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-white text-sm font-medium mb-2">Task Name</label>
               <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 text-white placeholder-white/60 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] transition-all"
                  placeholder="Enter task name"
                  required
               />
            </div>

            <div className="relative">
               <label className="block text-white text-sm font-medium mb-2">Date (DD/MM/YYYY)</label>
               <div className="relative">
                  <input
                     type="text"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     onFocus={() => setShowDatePicker(true)}
                     className="w-full px-4 py-3 bg-white/10 text-white placeholder-white/60 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] transition-all"
                     placeholder="DD/MM/YYYY"
                     required
                  />
                  <button
                     type="button"
                     onClick={() => setShowDatePicker(!showDatePicker)}
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                  >
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                     </svg>
                  </button>
               </div>

               {/* Date Picker Calendar */}
               {showDatePicker && (
                  <div className="absolute z-10 mt-1 p-4 bg-white rounded-lg shadow-lg">
                     <div className="mb-3">
                        <div className="text-gray-700 font-medium text-center">
                           {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                     </div>
                     <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                           <div key={day} className="text-gray-500 text-xs font-medium">
                              {day}
                           </div>
                        ))}
                     </div>
                     <div className="grid grid-cols-7 gap-1">{generateCalendar()}</div>
                     <div className="mt-3 text-right">
                        <button
                           type="button"
                           className="text-sm text-purple-600 hover:text-purple-800"
                           onClick={() => setShowDatePicker(false)}
                        >
                           Close
                        </button>
                     </div>
                  </div>
               )}
            </div>

            <div className="relative">
               <label className="block text-white text-sm font-medium mb-2">Time (HH:MM AM/PM)</label>
               <div className="relative">
                  <input
                     type="text"
                     value={time}
                     onChange={(e) => setTime(e.target.value)}
                     onFocus={() => setShowTimePicker(true)}
                     className="w-full px-4 py-3 bg-white/10 text-white placeholder-white/60 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] transition-all"
                     placeholder="HH:MM AM/PM"
                     required
                  />
                  <button
                     type="button"
                     onClick={() => setShowTimePicker(!showTimePicker)}
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                  >
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                  </button>
               </div>

               {/* Time Picker */}
               {showTimePicker && (
                  <div className="absolute z-10 mt-1 p-4 bg-white rounded-lg shadow-lg">
                     <div className="mb-3">
                        <div className="text-gray-700 font-medium text-center">Select Time</div>
                     </div>

                     <div className="flex space-x-4">
                        {/* Hour selector */}
                        <div>
                           <div className="text-gray-500 text-xs font-medium text-center mb-2">Hour</div>
                           <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                              {generateHourSelector()}
                           </div>
                        </div>

                        {/* Minute selector */}
                        <div>
                           <div className="text-gray-500 text-xs font-medium text-center mb-2">Minute</div>
                           <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                              {generateMinuteSelector()}
                           </div>
                        </div>

                        {/* AM/PM selector */}
                        <div>
                           <div className="text-gray-500 text-xs font-medium text-center mb-2">AM/PM</div>
                           <div className="flex flex-col gap-2">
                              <button
                                 type="button"
                                 onClick={() => setSelectedAmPm('AM')}
                                 className={`px-4 py-2 rounded-lg ${
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
                                 className={`px-4 py-2 rounded-lg ${
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

                     <div className="mt-3 flex justify-between">
                        <div className="text-lg font-medium">
                           {selectedHour}:{selectedMinute.toString().padStart(2, '0')} {selectedAmPm}
                        </div>
                        <div>
                           <button
                              type="button"
                              className="ml-2 px-4 py-1 bg-[#9406E6] text-white rounded-lg"
                              onClick={handleTimeSelect}
                           >
                              Set Time
                           </button>
                           <button
                              type="button"
                              className="ml-2 px-2 py-1 text-sm text-purple-600 hover:text-purple-800"
                              onClick={() => setShowTimePicker(false)}
                           >
                              Cancel
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            <div>
               <label className="block text-white text-sm font-medium mb-2">Priority</label>
               <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                     <input
                        type="radio"
                        checked={color === 'red'}
                        onChange={() => setColor('red')}
                        className="hidden"
                     />
                     <span
                        className={`w-6 h-6 rounded-full border-2 ${
                           color === 'red' ? 'bg-red-500 border-white' : 'bg-red-500/40 border-transparent'
                        }`}
                     ></span>
                     <span className="ml-2 text-white">High</span>
                  </label>

                  <label className="inline-flex items-center">
                     <input
                        type="radio"
                        checked={color === 'yellow'}
                        onChange={() => setColor('yellow')}
                        className="hidden"
                     />
                     <span
                        className={`w-6 h-6 rounded-full border-2 ${
                           color === 'yellow' ? 'bg-yellow-400 border-white' : 'bg-yellow-400/40 border-transparent'
                        }`}
                     ></span>
                     <span className="ml-2 text-white">Medium</span>
                  </label>

                  <label className="inline-flex items-center">
                     <input
                        type="radio"
                        checked={color === 'green'}
                        onChange={() => setColor('green')}
                        className="hidden"
                     />
                     <span
                        className={`w-6 h-6 rounded-full border-2 ${
                           color === 'green' ? 'bg-green-500 border-white' : 'bg-green-500/40 border-transparent'
                        }`}
                     ></span>
                     <span className="ml-2 text-white">Low</span>
                  </label>
               </div>
            </div>

            <div className="pt-4">
               <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#9406E6] to-[#0066ff] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all"
               >
                  Add Task
               </button>
            </div>
         </form>
      </div>
   );
}

export default AddTaskForm;
