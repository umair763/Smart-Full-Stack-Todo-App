'use client';

import { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';

function AddTaskForm({ SetisAddFormVisible, addTask }) {
   const [task, setTask] = useState('');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');
   const [priority, setPriority] = useState('Medium');
   const [dependencyTaskId, setDependencyTaskId] = useState('');
   const [searchTerm, setSearchTerm] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [isSearching, setIsSearching] = useState(false);
   const [selectedDependency, setSelectedDependency] = useState(null);

   // Get today's date in YYYY-MM-DD format for min date validation
   const today = new Date().toISOString().split('T')[0];

   // Format date from YYYY-MM-DD to DD/MM/YYYY
   const formatDateForSubmission = (dateString) => {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
   };

   // Convert 24-hour time to 12-hour AM/PM format
   const formatTimeForSubmission = (timeString) => {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
   };

   // Search for tasks to set as dependencies
   const handleSearchTasks = async (searchValue) => {
      setSearchTerm(searchValue);

      if (searchValue.length < 2) {
         setSearchResults([]);
         return;
      }

      setIsSearching(true);

      try {
         const token = localStorage.getItem('token');
         const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
         const response = await fetch(`${API_BASE_URL}/api/tasks?search=${encodeURIComponent(searchValue)}`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to search tasks');
         }

         const data = await response.json();
         // Filter out completed tasks
         const filteredResults = data.filter((t) => !t.completed);
         setSearchResults(filteredResults);
      } catch (error) {
         console.error('Error searching tasks:', error);
      } finally {
         setIsSearching(false);
      }
   };

   // Handle dependency selection
   const handleSelectDependency = (taskItem) => {
      setSelectedDependency(taskItem);
      setDependencyTaskId(taskItem._id);
      setSearchTerm(taskItem.task);
      setSearchResults([]);
   };

   // Clear dependency selection
   const clearDependency = () => {
      setSelectedDependency(null);
      setDependencyTaskId('');
      setSearchTerm('');
      setSearchResults([]);
   };

   function handleSubmit(e) {
      e.preventDefault();
      if (!task || !date || !time) {
         // Form validation is handled by HTML5 required attributes
         return;
      }

      const newTask = {
         task,
         date: formatDateForSubmission(date),
         time: formatTimeForSubmission(time),
         priority,
         dependencyTaskId: dependencyTaskId || null,
      };

      addTask(newTask);
      SetisAddFormVisible(false);
   }

   return (
      <div className="bg-gradient-to-r from-[#9406E6] to-[#C724B1] rounded-2xl shadow-2xl w-full mx-auto p-1 sm:p-2 flex items-center justify-center min-h-[80vh]">
         <div className="bg-white/90 rounded-2xl w-full max-w-lg mx-auto p-0">
            {/* Header with single close button */}
            <div className="flex justify-between items-center p-4 pb-3 border-b border-gray-100">
               <h2 className="text-xl font-bold text-gray-800">Add New Task</h2>
               <button
                  onClick={() => SetisAddFormVisible(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  aria-label="Close modal"
               >
                  <HiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
               {/* Task Name */}
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                     Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     value={task}
                     onChange={(e) => setTask(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 bg-white"
                     placeholder="Enter task name"
                     required
                  />
               </div>

               {/* Date and Time Row */}
               <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                     </label>
                     <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={today}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 bg-white"
                        required
                     />
                  </div>

                  {/* Time */}
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Time <span className="text-red-500">*</span>
                     </label>
                     <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 bg-white"
                        required
                     />
                  </div>
               </div>

               {/* Priority */}
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                     {[
                        { value: 'High', color: 'bg-red-500', label: 'High', ring: 'ring-red-500' },
                        { value: 'Medium', color: 'bg-yellow-400', label: 'Medium', ring: 'ring-yellow-400' },
                        { value: 'Low', color: 'bg-green-500', label: 'Low', ring: 'ring-green-500' },
                     ].map((item) => (
                        <label key={item.value} className="cursor-pointer">
                           <input
                              type="radio"
                              name="priority"
                              value={item.value}
                              checked={priority === item.value}
                              onChange={(e) => setPriority(e.target.value)}
                              className="sr-only"
                           />
                           <div
                              className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                                 priority === item.value
                                    ? `border-purple-500 bg-purple-50 ring-2 ${item.ring} ring-opacity-20`
                                    : 'border-gray-200 hover:border-gray-300'
                              }`}
                           >
                              <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-1`}></div>
                              <span className="text-xs font-medium text-gray-700">{item.label}</span>
                           </div>
                        </label>
                     ))}
                  </div>
               </div>

               {/* Dependency (Optional) */}
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                     Dependency <span className="text-gray-400">(Optional)</span>
                  </label>

                  {selectedDependency ? (
                     <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                           <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{selectedDependency.task}</p>
                              <p className="text-xs text-gray-500">
                                 Due: {selectedDependency.date} at {selectedDependency.time}
                              </p>
                           </div>
                           <button
                              type="button"
                              onClick={clearDependency}
                              className="p-1 hover:bg-purple-100 rounded-full transition-colors ml-2"
                           >
                              <HiX className="w-4 h-4 text-gray-500" />
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="relative">
                        <input
                           type="text"
                           value={searchTerm}
                           onChange={(e) => handleSearchTasks(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 placeholder-gray-400 bg-white"
                           placeholder="Search for a task this depends on"
                        />

                        {isSearching && (
                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                           </div>
                        )}

                        {searchResults.length > 0 && (
                           <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-32 overflow-y-auto">
                              {searchResults.map((taskItem) => (
                                 <div
                                    key={taskItem._id}
                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleSelectDependency(taskItem)}
                                 >
                                    <div className="font-medium text-gray-800 text-sm truncate">{taskItem.task}</div>
                                    <div className="text-xs text-gray-500">
                                       Due: {taskItem.date} at {taskItem.time}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* Submit Button */}
               <div className="pt-2">
                  <button
                     type="submit"
                     className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 focus:ring-4 focus:ring-purple-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                     Add Task
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}

export default AddTaskForm;
