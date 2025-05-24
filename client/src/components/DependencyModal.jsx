'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiAlertTriangle, FiCalendar, FiClock, FiLink, FiArrowRight, FiInfo } from 'react-icons/fi';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DependencyModal = ({ isOpen, onClose, task, onAddDependency }) => {
   const [availableTasks, setAvailableTasks] = useState([]);
   const [selectedTaskId, setSelectedTaskId] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState(null);
   const [dependencyType, setDependencyType] = useState('prerequisite');
   const [dependencies, setDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoadingDeps, setIsLoadingDeps] = useState(false);

   useEffect(() => {
      if (isOpen) {
         fetchAvailableTasks();
         fetchDependencies();
         setSelectedTaskId('');
         setError(null);
         setDependencyType('prerequisite');
      }
   }, [isOpen, task._id]);

   const fetchAvailableTasks = async () => {
      setIsLoading(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch tasks');
         }

         const data = await response.json();
         // Filter out the current task and completed tasks, sort by date
         const filteredTasks = data
            .filter((t) => t._id !== task._id && !t.completed)
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
         const response = await fetch(`${API_BASE_URL}/api/dependencies/task/${task._id}`, {
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

         // Determine which task is the prerequisite and which is the dependent
         let prerequisiteTaskId, dependentTaskId;

         if (dependencyType === 'prerequisite') {
            // The selected task is a prerequisite for the current task
            prerequisiteTaskId = selectedTaskId;
            dependentTaskId = task._id;
         } else {
            // The current task is a prerequisite for the selected task
            prerequisiteTaskId = task._id;
            dependentTaskId = selectedTaskId;
         }

         const response = await fetch(`${API_BASE_URL}/api/dependencies`, {
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

         toast.success('Dependency added successfully');
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex justify-between items-center border-b px-6 py-4">
               <h3 className="text-xl font-semibold text-gray-900">Add Task Dependency</h3>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>

            <div className="px-6 py-4">
               {/* Info about dependencies */}
               <div className="mb-4 p-3 bg-blue-50 rounded flex items-start text-blue-800 text-sm">
                  <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                     <b>What is a dependency?</b> A dependency means one task must be completed before another can
                     start. You can set this task as a prerequisite for another, or require another task to be completed
                     first.
                  </span>
               </div>
               {/* Dependency summary */}
               <div className="mb-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                     <div className="flex-1 bg-gray-50 rounded p-2 border">
                        <div className="font-semibold text-xs text-gray-700 mb-1">Prerequisites</div>
                        {isLoadingDeps ? (
                           <div className="text-xs text-gray-400">Loading...</div>
                        ) : dependencies.prerequisites.length === 0 ? (
                           <div className="text-xs text-gray-400">None</div>
                        ) : (
                           <ul className="text-xs text-gray-700 list-disc ml-4">
                              {dependencies.prerequisites.map((dep) => (
                                 <li key={dep._id}>{dep.prerequisiteTaskId?.task || 'Unknown Task'}</li>
                              ))}
                           </ul>
                        )}
                     </div>
                     <div className="flex-1 bg-gray-50 rounded p-2 border">
                        <div className="font-semibold text-xs text-gray-700 mb-1">Dependents</div>
                        {isLoadingDeps ? (
                           <div className="text-xs text-gray-400">Loading...</div>
                        ) : dependencies.dependents.length === 0 ? (
                           <div className="text-xs text-gray-400">None</div>
                        ) : (
                           <ul className="text-xs text-gray-700 list-disc ml-4">
                              {dependencies.dependents.map((dep) => (
                                 <li key={dep._id}>{dep.dependentTaskId?.task || 'Unknown Task'}</li>
                              ))}
                           </ul>
                        )}
                     </div>
                  </div>
               </div>

               {/* Current Task Display */}
               <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-900 mb-1">Current Task</p>
                  <p className="font-semibold text-gray-800">{task.task}</p>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                     <FiCalendar className="mr-1" /> {task.date} <FiClock className="ml-3 mr-1" /> {task.time}
                  </div>
               </div>

               {/* Simplified Dependency Type Selection */}
               <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-3">What type of dependency?</label>
                  <div className="grid grid-cols-1 gap-3">
                     <label className="cursor-pointer">
                        <input
                           type="radio"
                           name="dependencyType"
                           value="prerequisite"
                           checked={dependencyType === 'prerequisite'}
                           onChange={() => setDependencyType('prerequisite')}
                           className="sr-only"
                        />
                        <div
                           className={`p-4 border-2 rounded-lg transition-all ${
                              dependencyType === 'prerequisite'
                                 ? 'border-purple-500 bg-purple-50 shadow-md'
                                 : 'border-gray-200 hover:border-gray-300'
                           }`}
                        >
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="font-medium text-gray-900">This task needs another task first</p>
                                 <p className="text-sm text-gray-600">
                                    Selected task must be completed before this one
                                 </p>
                              </div>
                              <div className="flex items-center text-purple-600">
                                 <span className="text-xs bg-purple-100 px-2 py-1 rounded">Selected</span>
                                 <FiArrowRight className="ml-2" />
                                 <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                                    Current
                                 </span>
                              </div>
                           </div>
                        </div>
                     </label>

                     <label className="cursor-pointer">
                        <input
                           type="radio"
                           name="dependencyType"
                           value="dependent"
                           checked={dependencyType === 'dependent'}
                           onChange={() => setDependencyType('dependent')}
                           className="sr-only"
                        />
                        <div
                           className={`p-4 border-2 rounded-lg transition-all ${
                              dependencyType === 'dependent'
                                 ? 'border-purple-500 bg-purple-50 shadow-md'
                                 : 'border-gray-200 hover:border-gray-300'
                           }`}
                        >
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="font-medium text-gray-900">Another task needs this task first</p>
                                 <p className="text-sm text-gray-600">
                                    This task must be completed before the selected one
                                 </p>
                              </div>
                              <div className="flex items-center text-purple-600">
                                 <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Current</span>
                                 <FiArrowRight className="ml-2" />
                                 <span className="text-xs bg-purple-100 px-2 py-1 rounded ml-2">Selected</span>
                              </div>
                           </div>
                        </div>
                     </label>
                  </div>
               </div>

               {/* Error Display */}
               {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
                     <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                     <span>{error}</span>
                  </div>
               )}

               <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                     <label htmlFor="taskSelect" className="block text-gray-700 font-medium mb-2">
                        Select Task
                     </label>
                     {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                           <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-700"></div>
                           <span className="ml-3 text-gray-600">Loading available tasks...</span>
                        </div>
                     ) : availableTasks.length === 0 ? (
                        <div className="text-center py-8">
                           <div className="text-gray-400 mb-2">
                              <FiLink className="h-8 w-8 mx-auto" />
                           </div>
                           <p className="text-gray-500 font-medium">No available tasks found</p>
                           <p className="text-sm text-gray-400">Create more tasks to set up dependencies</p>
                        </div>
                     ) : (
                        <select
                           id="taskSelect"
                           value={selectedTaskId}
                           onChange={(e) => setSelectedTaskId(e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                           required
                        >
                           <option value="">-- Choose a task --</option>
                           {availableTasks.map((t) => (
                              <option key={t._id} value={t._id}>
                                 {t.task} • {t.date} {t.time} • {t.priority}
                              </option>
                           ))}
                        </select>
                     )}
                  </div>

                  {/* Visual Preview */}
                  {selectedTask && (
                     <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700 mb-2">Dependency Preview:</p>
                        <div className="flex items-center justify-center space-x-3">
                           <div
                              className={`px-3 py-2 rounded text-sm font-medium ${
                                 dependencyType === 'prerequisite'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                           >
                              {dependencyType === 'prerequisite' ? selectedTask.task : task.task}
                           </div>
                           <FiArrowRight className="text-gray-400" />
                           <div
                              className={`px-3 py-2 rounded text-sm font-medium ${
                                 dependencyType === 'prerequisite'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                              }`}
                           >
                              {dependencyType === 'prerequisite' ? task.task : selectedTask.task}
                           </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                           {dependencyType === 'prerequisite'
                              ? 'Must be completed first → Can then be started'
                              : 'Can be started → Must be completed first'}
                        </p>
                     </div>
                  )}

                  <div className="flex justify-end space-x-3">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={isSubmitting || isLoading || !selectedTaskId}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                     >
                        {isSubmitting ? (
                           <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Adding Dependency...
                           </>
                        ) : (
                           <>
                              <FiLink className="mr-2" />
                              Add Dependency
                           </>
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
