'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiAlertTriangle, FiCalendar, FiClock, FiLink } from 'react-icons/fi';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DependencyModal = ({ isOpen, onClose, task, onAddDependency }) => {
   const [availableTasks, setAvailableTasks] = useState([]);
   const [selectedTaskId, setSelectedTaskId] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState(null);
   const [dependencyType, setDependencyType] = useState('prerequisite'); // 'prerequisite' or 'dependent'

   useEffect(() => {
      if (isOpen) {
         fetchAvailableTasks();
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
         // Filter out the current task and sort by date
         const filteredTasks = data
            .filter((t) => t._id !== task._id)
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

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center border-b px-6 py-4">
               <h3 className="text-xl font-semibold text-gray-900">Add Task Dependency</h3>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                  &times;
               </button>
            </div>

            <div className="px-6 py-4">
               <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                     <span className="font-semibold">Current Task:</span> {task.task}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                     <FiCalendar className="mr-1" /> {task.date} <FiClock className="ml-3 mr-1" /> {task.time}
                  </div>
               </div>

               <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Dependency Type</label>
                  <div className="flex space-x-4">
                     <label className="flex items-center">
                        <input
                           type="radio"
                           name="dependencyType"
                           value="prerequisite"
                           checked={dependencyType === 'prerequisite'}
                           onChange={() => setDependencyType('prerequisite')}
                           className="mr-2"
                        />
                        <span className="text-gray-700">
                           This task depends on another task
                           <span className="block text-xs text-gray-500">
                              (The selected task must be completed before this one)
                           </span>
                        </span>
                     </label>
                  </div>
                  <div className="mt-2">
                     <label className="flex items-center">
                        <input
                           type="radio"
                           name="dependencyType"
                           value="dependent"
                           checked={dependencyType === 'dependent'}
                           onChange={() => setDependencyType('dependent')}
                           className="mr-2"
                        />
                        <span className="text-gray-700">
                           Another task depends on this task
                           <span className="block text-xs text-gray-500">
                              (This task must be completed before the selected one)
                           </span>
                        </span>
                     </label>
                  </div>
               </div>

               {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
                     <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                     <span>{error}</span>
                  </div>
               )}

               <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                     <label htmlFor="taskSelect" className="block text-gray-700 font-medium mb-2">
                        Select Task
                     </label>
                     {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                           <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-700"></div>
                           <span className="ml-2 text-gray-600">Loading tasks...</span>
                        </div>
                     ) : availableTasks.length === 0 ? (
                        <p className="text-gray-500 italic">No available tasks found</p>
                     ) : (
                        <select
                           id="taskSelect"
                           value={selectedTaskId}
                           onChange={(e) => setSelectedTaskId(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                           required
                        >
                           <option value="">-- Select a task --</option>
                           {availableTasks.map((t) => (
                              <option key={t._id} value={t._id}>
                                 {t.task} ({t.date} {t.time})
                              </option>
                           ))}
                        </select>
                     )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={isSubmitting || isLoading || !selectedTaskId}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                     >
                        {isSubmitting ? (
                           <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Adding...
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
