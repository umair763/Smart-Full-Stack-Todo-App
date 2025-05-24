'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

function AddTask({ SetisAddFormVisible, setisDeleteFormVisible, onSearchChange }) {
   const [searchTask, setSearchTask] = useState('');

   function handleAddTask() {
      SetisAddFormVisible(true);
   }

   function handleDeleteTask() {
      setisDeleteFormVisible(true);
   }

   function handleSearchTask(e) {
      const searchValue = e.target.value;
      setSearchTask(searchValue);
      if (onSearchChange) {
         onSearchChange(searchValue);
      }
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
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
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
      </div>
   );
}

export default AddTask;
