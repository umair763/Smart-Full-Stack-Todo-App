'use client';

import { useState } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiFilter, FiX } from 'react-icons/fi';
import { HiSparkles, HiViewGrid } from 'react-icons/hi';
import AddTaskForm from './AddTaskForm';
import DeleteTaskForm from './DeleteTaskForm';

function AddTask({ onSearchChange, onAddTask, tasks = [], onDeleteTask }) {
   const [searchTask, setSearchTask] = useState('');
   const [isAddFormVisible, setIsAddFormVisible] = useState(false);
   const [isDeleteFormVisible, setIsDeleteFormVisible] = useState(false);

   function handleAddTask(newTask) {
      // Call the parent's onAddTask function
      if (onAddTask && typeof onAddTask === 'function') {
         onAddTask(newTask);
         setIsAddFormVisible(false);
      } else {
         console.error('onAddTask is not a function:', onAddTask);
      }
   }

   function handleDeleteTask() {
      setIsDeleteFormVisible(true);
   }

   function handleSearchTask(e) {
      const searchValue = e.target.value;
      setSearchTask(searchValue);
      if (onSearchChange) {
         onSearchChange(searchValue);
      }
   }

   function clearSearch() {
      setSearchTask('');
      if (onSearchChange) {
         onSearchChange('');
      }
   }

   return (
      <div className="mb-3 -mt-10">
         {/* Enhanced Container with Glassmorphism */}
         <div className="relative bg-white/15 backdrop-blur-lg border border-white/20 p-4 sm:p-3 lg:p-5 rounded-2xl shadow-xl">
            {/* Background Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 rounded-2xl"></div>

            {/* Content */}
            <div className="relative">
               {/* Header Section */}
               <div className="flex items-center justify-between mb-4 sm:mb-5 ">
                  <div className="flex items-center space-x-3">
                     <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2.5 rounded-xl shadow-lg">
                        <HiViewGrid className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                     </div>
                     <div>
                        <h2 className="text-base sm:text-lg font-bold text-white font-proza">Task Management</h2>
                        <p className="text-xs sm:text-sm text-white/80">Search, create, and organize your tasks</p>
                     </div>
                  </div>

                  {/* Quick Stats Badge */}
                  <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                     <HiSparkles className="h-4 w-4 text-yellow-300" />
                     <span className="text-sm font-semibold text-white">Quick Actions</span>
                  </div>
               </div>

               {/* Main Content Area */}
               <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:items-end">
                  {/* Enhanced Search Area */}
                  <div className="flex-1 lg:flex-grow">
                     <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 p-0.5">
                           <div className="relative">
                              <input
                                 type="text"
                                 value={searchTask}
                                 onChange={handleSearchTask}
                                 placeholder="Search tasks by name..."
                                 className="w-full h-8 sm:h-8 pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 bg-transparent text-white placeholder-white/70 rounded-xl outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 text-xs sm:text-sm"
                              />
                              <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/80">
                                 <FiSearch className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>

                              {/* Clear Button */}
                              {searchTask && (
                                 <button
                                    onClick={clearSearch}
                                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-all duration-200"
                                 >
                                    <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Enhanced Action Buttons - Always Horizontal */}
                  <div className="flex flex-row gap-2 sm:gap-3 lg:gap-4 lg:flex-shrink-0 justify-center sm:justify-start">
                     {/* Add Task Button */}
                     <button
                        onClick={() => setIsAddFormVisible(true)}
                        className="group relative overflow-hidden mt-2 h-9 sm:h-10 px-3 sm:px-4 lg:px-5 bg-gradient-to-r from-[#9406E6] via-[#C724B1] to-[#9406E6] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg whitespace-nowrap min-w-fit flex-shrink-0"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                        <div className="relative flex items-center justify-center space-x-1 sm:space-x-2 lg:space-x-2">
                           <FiPlus className="h-3 w-3 sm:h-4 sm:w-4 group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
                           <span className="text-xs sm:text-sm flex-shrink-0">Add Task</span>
                        </div>
                     </button>

                     {/* Delete Task Button */}
                     <button
                        onClick={handleDeleteTask}
                        disabled={!tasks || tasks.length === 0}
                        className={`group relative overflow-hidden mt-2 h-9 sm:h-10 px-3 sm:px-4 lg:px-5 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg whitespace-nowrap min-w-fit flex-shrink-0 ${
                           !tasks || tasks.length === 0
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
                        }`}
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                        <div className="relative flex items-center justify-center space-x-1 sm:space-x-2 lg:space-x-3">
                           <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                           <span className="text-xs sm:text-sm lg:text-base flex-shrink-0">Delete Task</span>
                        </div>
                     </button>
                  </div>
               </div>

               {/* Search Results Indicator */}
               {searchTask && (
                  <div className="mt-4 flex items-center space-x-2 text-white/80">
                     <FiFilter className="h-4 w-4" />
                     <span className="text-sm">
                        Filtering tasks by: <span className="font-semibold text-white">"{searchTask}"</span>
                     </span>
                  </div>
               )}
            </div>
         </div>

         {/* Add Task Form Modal */}
         {isAddFormVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <AddTaskForm SetisAddFormVisible={setIsAddFormVisible} addTask={handleAddTask} />
               </div>
            </div>
         )}

         {/* Delete Task Form Modal */}
         {isDeleteFormVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="w-full max-w-md">
                  <DeleteTaskForm
                     setisDeleteFormVisible={setIsDeleteFormVisible}
                     tasks={tasks}
                     onDeleteTask={onDeleteTask}
                  />
               </div>
            </div>
         )}
      </div>
   );
}

export default AddTask;
