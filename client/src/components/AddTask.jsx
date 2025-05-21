'use client';

import { useState } from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
// import './styles/AddTask.css';

function AddTask({ SetisAddFormVisible, setisDeleteFormVisible, setSort, setSearch }) {
   const [searchTask, setSearchTask] = useState('');
   const [showFilters, setShowFilters] = useState(false);
   const [filters, setFilters] = useState({
      priority: '',
      tags: '',
      dueDate: '',
      status: '',
   });

   function handleAddTask() {
      SetisAddFormVisible(true);
   }

   function handleDeleteTask() {
      setisDeleteFormVisible(true);
   }

   function handleSortTask(e) {
      setSort(e.target.value);
   }

   function handleSearchTask(e) {
      const searchValue = e.target.value.toLowerCase();
      setSearchTask(searchValue);
      setSearch({
         text: searchValue,
         ...filters,
      });
   }

   function handleFilterChange(e) {
      const { name, value } = e.target;
      const newFilters = { ...filters, [name]: value };
      setFilters(newFilters);
      setSearch({
         text: searchTask,
         ...newFilters,
      });
   }

   function clearFilters() {
      setFilters({
         priority: '',
         tags: '',
         dueDate: '',
         status: '',
      });
      setSearch({
         text: searchTask,
         priority: '',
         tags: '',
         dueDate: '',
         status: '',
      });
   }

   return (
      <div className="mb-6 bg-white/10 backdrop-blur-md p-4 rounded-xl shadow-lg">
         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Area */}
            <div className="relative w-full md:w-1/3 group">
               <input
                  type="text"
                  value={searchTask}
                  onChange={handleSearchTask}
                  placeholder="Search tasks..."
                  className="w-full h-12 pl-12 pr-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-full border border-white/30 outline-none focus:ring-2 focus:ring-[#9406E6] transition-all duration-300"
               />
               <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
                  <FiSearch className="h-6 w-6" />
               </div>
               <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-[#9406E6] transition-colors"
               >
                  <FiFilter className="h-6 w-6" />
               </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
               {/* Sort Dropdown */}
               <div className="relative group min-w-[140px] w-full md:w-auto">
                  <select
                     onChange={handleSortTask}
                     className="appearance-none h-12 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30 pr-10 outline-none focus:ring-2 focus:ring-[#9406E6] cursor-pointer transition-all duration-300 w-full"
                  >
                     <option value="sortby" className="bg-[#1a1a1a] text-white">
                        Sort By
                     </option>
                     <option value="Task" className="bg-[#1a1a1a] text-white">
                        Task Name
                     </option>
                     <option value="Time" className="bg-[#1a1a1a] text-white">
                        Due Time
                     </option>
                     <option value="Priority" className="bg-[#1a1a1a] text-white">
                        Priority
                     </option>
                     <option value="Status" className="bg-[#1a1a1a] text-white">
                        Status
                     </option>
                     <option value="Created" className="bg-[#1a1a1a] text-white">
                        Created Date
                     </option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-2">
                  <button
                     onClick={handleAddTask}
                     className="h-12 px-6 bg-gradient-to-r from-[#9406E6] to-[#C724B1] text-white rounded-full hover:from-[#7A05BF] hover:to-[#A61D9A] transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                     Add Task
                  </button>
                  <button
                     onClick={handleDeleteTask}
                     className="h-12 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                     Delete Task
                  </button>
               </div>
            </div>
         </div>

         {/* Advanced Filters */}
         {showFilters && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold">Advanced Filters</h3>
                  <button onClick={clearFilters} className="text-white/70 hover:text-white transition-colors">
                     <FiX className="h-5 w-5" />
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                     <label className="block text-white/70 text-sm mb-2">Priority</label>
                     <select
                        name="priority"
                        value={filters.priority}
                        onChange={handleFilterChange}
                        className="w-full h-10 px-3 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 outline-none focus:ring-2 focus:ring-[#9406E6] cursor-pointer"
                     >
                        <option value="" className="bg-[#1a1a1a] text-white">
                           All Priorities
                        </option>
                        <option value="high" className="bg-[#1a1a1a] text-white">
                           High
                        </option>
                        <option value="medium" className="bg-[#1a1a1a] text-white">
                           Medium
                        </option>
                        <option value="low" className="bg-[#1a1a1a] text-white">
                           Low
                        </option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-white/70 text-sm mb-2">Description</label>
                     <input
                        type="text"
                        name="tags"
                        value={filters.tags}
                        onChange={handleFilterChange}
                        placeholder="Filter by description..."
                        className="w-full h-10 px-3 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 outline-none focus:ring-2 focus:ring-[#9406E6] placeholder-white/50"
                     />
                  </div>
                  <div>
                     <label className="block text-white/70 text-sm mb-2">Due Date</label>
                     <input
                        type="date"
                        name="dueDate"
                        value={filters.dueDate}
                        onChange={handleFilterChange}
                        className="w-full h-10 px-3 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 outline-none focus:ring-2 focus:ring-[#9406E6] [&::-webkit-calendar-picker-indicator]:invert"
                     />
                  </div>
                  <div>
                     <label className="block text-white/70 text-sm mb-2">Status</label>
                     <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full h-10 px-3 bg-white/20 backdrop-blur-sm text-white rounded-lg border border-white/30 outline-none focus:ring-2 focus:ring-[#9406E6] cursor-pointer"
                     >
                        <option value="" className="bg-[#1a1a1a] text-white">
                           All Status
                        </option>
                        <option value="completed" className="bg-[#1a1a1a] text-white">
                           Completed
                        </option>
                        <option value="pending" className="bg-[#1a1a1a] text-white">
                           Pending
                        </option>
                        <option value="overdue" className="bg-[#1a1a1a] text-white">
                           Overdue
                        </option>
                     </select>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

export default AddTask;
