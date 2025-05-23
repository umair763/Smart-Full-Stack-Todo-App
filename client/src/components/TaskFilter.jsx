'use client';

import { useState, useEffect } from 'react';
import { FiX, FiFilter, FiCalendar } from 'react-icons/fi';

const TaskFilter = ({ onFilterChange }) => {
   const [isOpen, setIsOpen] = useState(false);
   const [filters, setFilters] = useState({
      priority: 'all',
      description: '',
      dueDate: '',
      status: 'all',
   });

   // Apply filters when they change
   useEffect(() => {
      onFilterChange(filters);
   }, [filters, onFilterChange]);

   const handleFilterChange = (field, value) => {
      setFilters((prev) => ({
         ...prev,
         [field]: value,
      }));
   };

   const clearFilters = () => {
      setFilters({
         priority: 'all',
         description: '',
         dueDate: '',
         status: 'all',
      });
   };

   return (
      <div className="mb-4 relative">
         <div className="flex items-center mb-2">
            <button
               onClick={() => setIsOpen(!isOpen)}
               className="flex items-center text-white bg-[#9406E6] hover:bg-[#7D05C3] px-3 py-1.5 rounded-md transition-colors"
            >
               <FiFilter className="mr-2" />
               Advanced Filters
               {Object.values(filters).some((val) => val !== 'all' && val !== '') && (
                  <span className="ml-2 bg-white text-[#9406E6] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                     {Object.values(filters).filter((val) => val !== 'all' && val !== '').length}
                  </span>
               )}
            </button>
            {isOpen && (
               <button onClick={clearFilters} className="ml-2 text-gray-600 hover:text-gray-800 text-sm underline">
                  Clear All
               </button>
            )}
         </div>

         {isOpen && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg shadow-md mb-4 relative">
               <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
               >
                  <FiX className="h-5 w-5" />
               </button>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                     <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#9406E6] focus:border-[#9406E6]"
                     >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                     </select>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                     <input
                        type="text"
                        placeholder="Filter by description..."
                        value={filters.description}
                        onChange={(e) => handleFilterChange('description', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#9406E6] focus:border-[#9406E6]"
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                     <div className="relative">
                        <input
                           type="date"
                           value={filters.dueDate}
                           onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                           className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#9406E6] focus:border-[#9406E6]"
                        />
                        <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                     <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#9406E6] focus:border-[#9406E6]"
                     >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                     </select>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default TaskFilter;
