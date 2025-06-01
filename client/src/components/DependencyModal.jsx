'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiAlertTriangle, FiCalendar, FiClock, FiLink, FiArrowRight, FiInfo, FiCheckCircle } from 'react-icons/fi';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

const DependencyModal = ({ isOpen, onClose, task, onAddDependency }) => {
   const [availableTasks, setAvailableTasks] = useState([]);
   const [selectedTaskId, setSelectedTaskId] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState(null);
   const [dependencies, setDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoadingDeps, setIsLoadingDeps] = useState(false);

   useEffect(() => {
      if (isOpen) {
         fetchAvailableTasks();
         fetchDependencies();
         setSelectedTaskId('');
         setError(null);
      }
   }, [isOpen, task._id]);

   const fetchAvailableTasks = async () => {
      setIsLoading(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${BACKEND_URL}/api/tasks`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch tasks');
         }

         const data = await response.json();
         // Filter out the current task and completed tasks
         // Show tasks that can depend on the current task (tasks with same or earlier deadlines)
         const currentTaskDate = new Date(task.date.split('/').reverse().join('-') + ' ' + task.time);

         const filteredTasks = data
            .filter((t) => {
               if (t._id === task._id || t.completed) return false;

               // Show tasks that have the same or earlier deadline than the current task
               // This means these tasks can depend on the current task (independent task)
               const taskDate = new Date(t.date.split('/').reverse().join('-') + ' ' + t.time);
               return taskDate <= currentTaskDate;
            })
            .sort((a, b) => {
               const dateA = new Date(a.date.split('/').reverse().join('-'));
               const dateB = new Date(b.date.split('/').reverse().join('-'));
               return dateA - dateB;
            });

         setAvailableTasks(filteredTasks);
      } catch (error) {
         console.error('Error fetching tasks:', error);
         setError('Failed to load available tasks');
      } finally {
         setIsLoading(false);
      }
   };

   const fetchDependencies = async () => {
      setIsLoadingDeps(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) throw new Error('Authentication required');
         const response = await fetch(`${BACKEND_URL}/api/dependencies/task/${task._id}`, {
            headers: { Authorization: `Bearer ${token}` },
         });
         if (!response.ok) throw new Error('Failed to fetch dependencies');
         const data = await response.json();
         setDependencies(data);
      } catch (err) {
         setDependencies({ prerequisites: [], dependents: [] });
      } finally {
         setIsLoadingDeps(false);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedTaskId) {
         setError('Please select a task');
         return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         // Clear logic: Current task becomes prerequisite, selected task becomes dependent
         const prerequisiteTaskId = task._id;
         const dependentTaskId = selectedTaskId;

         const response = await fetch(`${BACKEND_URL}/api/dependencies`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
               prerequisiteTaskId,
               dependentTaskId,
            }),
         });

         const data = await response.json();

         if (!response.ok) {
            throw new Error(data.message || 'Failed to create dependency');
         }

         toast.success('Dependency created successfully!');
         if (onAddDependency) {
            onAddDependency(data);
         }
         onClose();
      } catch (error) {
         console.error('Error creating dependency:', error);
         setError(error.message || 'Failed to create dependency');
      } finally {
         setIsSubmitting(false);
      }
   };

   if (!isOpen) return null;

   const selectedTask = availableTasks.find((t) => t._id === selectedTaskId);

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
         <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-3 sm:px-6 py-3 sm:py-4">
               <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Create Task Dependency</h3>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>

            <div className="px-3 sm:px-6 py-3 sm:py-4">
               {/* Clear explanation */}
               <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                     <FiInfo className="mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-blue-600" />
                     <div>
                        <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">How Dependencies Work</h4>
                        <p className="text-blue-800 text-xs sm:text-sm mb-2">
                           You're about to make <strong>"{task.task}"</strong> an independent task that other tasks
                           depend on.
                        </p>
                        <p className="text-blue-700 text-xs sm:text-sm">
                           The selected dependent task must be completed within the timeframe of{' '}
                           <strong>"{task.task}"</strong>.
                        </p>
                     </div>
                  </div>
               </div>

               {/* Current task display */}
               <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                     <FiCheckCircle className="mr-2 text-green-600 flex-shrink-0" />
                     <h4 className="font-semibold text-green-900 text-sm sm:text-base">
                        Prerequisite Task (Must be completed first)
                     </h4>
                  </div>
                  <div className="bg-white rounded-md p-2 sm:p-3 border border-green-200">
                     <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{task.task}</p>
                     <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1 flex-wrap gap-2">
                        <div className="flex items-center">
                           <FiCalendar className="mr-1 flex-shrink-0" />
                           <span>{task.date}</span>
                        </div>
                        <div className="flex items-center">
                           <FiClock className="mr-1 flex-shrink-0" />
                           <span>{task.time}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Current dependencies summary */}
               <div className="mb-4 sm:mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Current Dependencies</h4>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                     <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border">
                        <div className="font-medium text-xs sm:text-sm text-gray-700 mb-2">This task depends on:</div>
                        {isLoadingDeps ? (
                           <div className="text-xs sm:text-sm text-gray-400">Loading...</div>
                        ) : dependencies.prerequisites.length === 0 ? (
                           <div className="text-xs sm:text-sm text-gray-500 italic">No prerequisites</div>
                        ) : (
                           <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                              {dependencies.prerequisites.map((dep) => (
                                 <li key={dep._id} className="flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                                    <span className="truncate">{dep.prerequisiteTaskId?.task || 'Unknown Task'}</span>
                                 </li>
                              ))}
                           </ul>
                        )}
                     </div>
                     <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border">
                        <div className="font-medium text-xs sm:text-sm text-gray-700 mb-2">
                           Other tasks depend on this:
                        </div>
                        {isLoadingDeps ? (
                           <div className="text-xs sm:text-sm text-gray-400">Loading...</div>
                        ) : dependencies.dependents.length === 0 ? (
                           <div className="text-xs sm:text-sm text-gray-500 italic">No dependents</div>
                        ) : (
                           <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
                              {dependencies.dependents.map((dep) => (
                                 <li key={dep._id} className="flex items-center">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                                    <span className="truncate">{dep.dependentTaskId?.task || 'Unknown Task'}</span>
                                 </li>
                              ))}
                           </ul>
                        )}
                     </div>
                  </div>
               </div>

               {/* Error Display */}
               {error && (
                  <div className="mb-4 p-2 sm:p-3 bg-red-50 text-red-700 rounded-md flex items-start border border-red-200">
                     <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                     <span className="text-xs sm:text-sm">{error}</span>
                  </div>
               )}

               <form onSubmit={handleSubmit}>
                  <div className="mb-4 sm:mb-6">
                     <label
                        htmlFor="taskSelect"
                        className="block text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base"
                     >
                        Select a task that should depend on "{task.task}"
                     </label>
                     <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        Only tasks with deadlines on or before {task.date} {task.time} are shown, as dependent tasks
                        must be completed within the timeframe of the independent task.
                     </p>

                     {isLoading ? (
                        <div className="flex items-center justify-center py-6 sm:py-8">
                           <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-t-2 border-b-2 border-blue-600"></div>
                           <span className="ml-3 text-gray-600 text-sm sm:text-base">Loading available tasks...</span>
                        </div>
                     ) : availableTasks.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border border-gray-200">
                           <div className="text-gray-400 mb-2">
                              <FiLink className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" />
                           </div>
                           <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
                              No suitable tasks found
                           </p>
                           <p className="text-xs sm:text-sm text-gray-500 px-2">
                              Create tasks with deadlines on or before {task.date} {task.time} to set up dependencies.
                           </p>
                        </div>
                     ) : (
                        <select
                           id="taskSelect"
                           value={selectedTaskId}
                           onChange={(e) => setSelectedTaskId(e.target.value)}
                           className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-sm sm:text-base"
                           required
                        >
                           <option value="">-- Choose a task that will depend on "{task.task}" --</option>
                           {availableTasks.map((t) => (
                              <option key={t._id} value={t._id}>
                                 {t.task} • Due: {t.date} {t.time} • Priority: {t.priority}
                              </option>
                           ))}
                        </select>
                     )}
                  </div>

                  {/* Visual Preview */}
                  {selectedTask && (
                     <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-gray-200">
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Dependency Preview:</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                           <div className="flex-1 text-center w-full">
                              <div className="bg-green-100 border border-green-300 rounded-lg p-2 sm:p-3 mb-2">
                                 <p className="font-semibold text-green-800 text-xs sm:text-sm truncate">{task.task}</p>
                                 <p className="text-xs text-green-600">
                                    Due: {task.date} {task.time}
                                 </p>
                              </div>
                              <p className="text-xs text-green-700 font-medium">PREREQUISITE</p>
                              <p className="text-xs text-green-600">Must complete first</p>
                           </div>

                           <div className="flex flex-col items-center">
                              <FiArrowRight className="text-gray-400 text-lg sm:text-xl mb-1 transform sm:transform-none rotate-90 sm:rotate-0" />
                              <p className="text-xs text-gray-500 font-medium">THEN</p>
                           </div>

                           <div className="flex-1 text-center w-full">
                              <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 sm:p-3 mb-2">
                                 <p className="font-semibold text-blue-800 text-xs sm:text-sm truncate">
                                    {selectedTask.task}
                                 </p>
                                 <p className="text-xs text-blue-600">
                                    Due: {selectedTask.date} {selectedTask.time}
                                 </p>
                              </div>
                              <p className="text-xs text-blue-700 font-medium">DEPENDENT</p>
                              <p className="text-xs text-blue-600">Can start after prerequisite</p>
                           </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                           <p className="text-xs text-gray-600 text-center">
                              <strong>Result:</strong> "{selectedTask.task}" cannot be started until "{task.task}" is
                              marked as complete.
                           </p>
                        </div>
                     </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                     <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors text-sm sm:text-base"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={isSubmitting || isLoading || !selectedTaskId}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                     >
                        {isSubmitting ? (
                           <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Creating Dependency...
                           </>
                        ) : (
                           'Create Dependency'
                        )}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
};

export default DependencyModal;
