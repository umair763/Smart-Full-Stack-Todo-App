'use client';

import { useState } from 'react';
// import './styles/AddTask.css';

function AddTask({ SetisAddFormVisible, setisDeleteFormVisible, setSort, setSearch }) {
   const [searchTask, setSearchTask] = useState('');

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
      setSearch(searchValue);
   }

   return (
      <div className="mb-6 bg-white/10 backdrop-blur-md p-4 rounded-xl shadow-lg">
         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Area - Reduced width on desktop */}
            <div className="relative w-full md:w-1/3 group">
               <input
                  type="text"
                  value={searchTask}
                  onChange={handleSearchTask}
                  placeholder="Search tasks..."
                  className="w-full h-12 pl-12 pr-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-full border border-white/30 outline-none focus:ring-2 focus:ring-[#9406E6] transition-all duration-300"
               />
               <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     className="h-6 w-6"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                     />
                  </svg>
               </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
               {/* Sort Dropdown - Fixed width */}
               <div className="relative group min-w-[140px] w-full md:w-auto">
                  <select
                     onChange={handleSortTask}
                     className="appearance-none h-12 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30 pr-10 outline-none focus:ring-2 focus:ring-[#9406E6] cursor-pointer transition-all duration-300 w-full"
                  >
                     <option value="sortby">Sort By</option>
                     <option value="Task">Task</option>
                     <option value="Time">Time</option>
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

               {/* Add Task Button - Fixed width on mobile, auto on desktop */}
               <button
                  onClick={handleAddTask}
                  className="h-12 px-4 py-2 bg-gradient-to-r from-[#9406E6] to-[#0066ff] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 transition-all duration-300 w-full md:w-auto flex items-center justify-center gap-2 whitespace-nowrap"
               >
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     className="h-5 w-5"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden md:inline">Add Task</span>
               </button>

               {/* Delete Task Button - Fixed width on mobile, auto on desktop */}
               <button
                  onClick={handleDeleteTask}
                  className="h-12 px-4 py-2 bg-gradient-to-r from-[#ff3366] to-[#ff6633] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-red-500/30 active:scale-95 transition-all duration-300 w-full md:w-auto flex items-center justify-center gap-2 whitespace-nowrap"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                     />
                  </svg>
                  <span className="hidden md:inline">Delete Task</span>
               </button>
            </div>
         </div>
      </div>
   );
}

export default AddTask;
