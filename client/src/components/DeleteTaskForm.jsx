'use client';

import { useState } from 'react';
import { FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import { HiExclamationTriangle } from 'react-icons/hi';

function DeleteTaskForm({ setisDeleteFormVisible, tasks = [], onDeleteTask }) {
   const [selectedTasks, setSelectedTasks] = useState([]);
   const [loading, setLoading] = useState(false);

   // Ensure tasks is always an array
   const safeTasks = Array.isArray(tasks) ? tasks : [];

   const handleTaskSelection = (taskId) => {
      setSelectedTasks((prev) => {
         if (prev.includes(taskId)) {
            return prev.filter((id) => id !== taskId);
         } else {
            return [...prev, taskId];
         }
      });
   };

   const handleSelectAll = () => {
      if (selectedTasks.length === safeTasks.length) {
         setSelectedTasks([]);
      } else {
         setSelectedTasks(safeTasks.map((task) => task._id));
      }
   };

   const handleDeleteSelected = async () => {
      if (selectedTasks.length === 0) return;

      setLoading(true);
      try {
         // Call the delete function for each selected task
         for (const taskId of selectedTasks) {
            if (onDeleteTask) {
               await onDeleteTask(taskId);
            }
         }
         setisDeleteFormVisible(false);
      } catch (error) {
         console.error('Error deleting tasks:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleClose = () => {
      setisDeleteFormVisible(false);
   };

   return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
         {/* Header */}
         <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
               <div className="bg-white/20 p-2 rounded-lg">
                  <FiTrash2 className="h-5 w-5 text-white" />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-white">Delete Tasks</h2>
                  <p className="text-red-100 text-sm">Select tasks to delete permanently</p>
               </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200">
               <FiX className="h-5 w-5 text-white" />
            </button>
         </div>

         {/* Content */}
         <div className="p-6">
            {safeTasks.length === 0 ? (
               <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                     <HiExclamationTriangle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tasks Available</h3>
                  <p className="text-gray-600 dark:text-gray-300">There are no tasks to delete at the moment.</p>
               </div>
            ) : (
               <>
                  {/* Select All */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                     <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                           type="checkbox"
                           checked={selectedTasks.length === safeTasks.length && safeTasks.length > 0}
                           onChange={handleSelectAll}
                           className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                           Select All ({safeTasks.length} tasks)
                        </span>
                     </label>
                     <span className="text-sm text-gray-500 dark:text-gray-400">{selectedTasks.length} selected</span>
                  </div>

                  {/* Task List */}
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
                     {safeTasks.map((task) => (
                        <div
                           key={task._id}
                           className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedTasks.includes(task._id)
                                 ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                                 : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                           }`}
                           onClick={() => handleTaskSelection(task._id)}
                        >
                           <div className="flex items-center space-x-3">
                              <input
                                 type="checkbox"
                                 checked={selectedTasks.includes(task._id)}
                                 onChange={() => handleTaskSelection(task._id)}
                                 className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="flex-1">
                                 <h4 className="font-medium text-gray-900 dark:text-white">
                                    {task.task || task.title}
                                 </h4>
                                 <div className="flex items-center space-x-4 mt-1">
                                    <span
                                       className={`px-2 py-1 text-xs rounded-full ${
                                          task.priority === 'High'
                                             ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                             : task.priority === 'Medium'
                                             ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                             : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                       }`}
                                    >
                                       {task.priority}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                       {task.date} {task.time}
                                    </span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Warning */}
                  {selectedTasks.length > 0 && (
                     <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                           <FiAlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                           <div>
                              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                 Warning: Permanent Deletion
                              </h4>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                 You are about to permanently delete {selectedTasks.length} task
                                 {selectedTasks.length > 1 ? 's' : ''}. This action cannot be undone.
                              </p>
                           </div>
                        </div>
                     </div>
                  )}
               </>
            )}
         </div>

         {/* Footer */}
         {safeTasks.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
               <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200"
               >
                  Cancel
               </button>
               <button
                  onClick={handleDeleteSelected}
                  disabled={selectedTasks.length === 0 || loading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 ${
                     selectedTasks.length === 0 || loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                  }`}
               >
                  {loading ? (
                     <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                     </div>
                  ) : (
                     `Delete ${selectedTasks.length} Task${selectedTasks.length > 1 ? 's' : ''}`
                  )}
               </button>
            </div>
         )}
      </div>
   );
}

export default DeleteTaskForm;
