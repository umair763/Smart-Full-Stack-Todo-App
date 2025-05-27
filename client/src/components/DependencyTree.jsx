'use client';

import { useState, useEffect } from 'react';
import { FiArrowRight, FiClock, FiCalendar, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DependencyTree = ({ taskId, onClose }) => {
   const [dependencies, setDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(null);

   useEffect(() => {
      fetchDependencies();
   }, [taskId]);

   const fetchDependencies = async () => {
      setIsLoading(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/dependencies/task/${taskId}`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch dependencies');
         }

         const data = await response.json();
         setDependencies(data);
      } catch (error) {
         console.error('Error fetching dependencies:', error);
         setError('Failed to load dependencies');
      } finally {
         setIsLoading(false);
      }
   };

   const formatDateTime = (date, time) => {
      return `${date} at ${time}`;
   };

   const getTaskStatusColor = (task) => {
      if (task.completed) return 'bg-green-100 border-green-300 text-green-800';

      // Check if overdue
      const taskDateTime = new Date(task.date.split('/').reverse().join('-') + ' ' + task.time);
      const now = new Date();
      if (taskDateTime < now) return 'bg-red-100 border-red-300 text-red-800';

      return 'bg-blue-100 border-blue-300 text-blue-800';
   };

   const getTaskStatusIcon = (task) => {
      if (task.completed) return <FiCheckCircle className="text-green-600" />;

      // Check if overdue
      const taskDateTime = new Date(task.date.split('/').reverse().join('-') + ' ' + task.time);
      const now = new Date();
      if (taskDateTime < now) return <FiAlertCircle className="text-red-600" />;

      return <FiClock className="text-blue-600" />;
   };

   const handleDeleteDependency = async (dependencyId) => {
      if (!window.confirm('Are you sure you want to remove this dependency?')) {
         return;
      }

      // Optimistically update UI immediately
      const previousDependencies = { ...dependencies };
      setDependencies((prev) => ({
         prerequisites: prev.prerequisites.filter((dep) => dep._id !== dependencyId),
         dependents: prev.dependents.filter((dep) => dep._id !== dependencyId),
      }));

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/dependencies/${dependencyId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete dependency');
         }

         toast.success('Dependency removed successfully');
         // Refresh the dependencies to ensure consistency
         fetchDependencies();
      } catch (error) {
         console.error('Error deleting dependency:', error);
         toast.error('Failed to remove dependency');
         // Revert UI changes on error
         setDependencies(previousDependencies);
      }
   };

   if (isLoading) {
      return (
         <div className="bg-white rounded-lg shadow-lg p-6 border">
            <div className="flex items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
               <span className="ml-3 text-gray-600">Loading dependency tree...</span>
            </div>
         </div>
      );
   }

   if (error) {
      return (
         <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="text-center text-red-600">
               <FiAlertCircle className="h-8 w-8 mx-auto mb-2" />
               <p>{error}</p>
            </div>
         </div>
      );
   }

   const hasPrerequisites = dependencies.prerequisites.length > 0;
   const hasDependents = dependencies.dependents.length > 0;

   return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
         {/* Header */}
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-semibold">Task Dependency Tree</h3>
               <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                  <FiX className="h-5 w-5" />
            </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">Visual representation of task dependencies and workflow</p>
         </div>

         <div className="p-6">
            {!hasPrerequisites && !hasDependents ? (
               <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                     <FiCheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Dependencies</h4>
                  <p className="text-gray-500">This task has no dependencies and can be worked on independently.</p>
               </div>
            ) : (
               <div className="space-y-8">
                  {/* Prerequisites Section */}
                  {hasPrerequisites && (
                     <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                           <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                              <FiClock className="h-4 w-4 text-orange-600" />
                           </div>
                           Prerequisites (Must complete first)
                        </h4>
                        <div className="space-y-3">
                           {dependencies.prerequisites.map((dep, index) => (
                              <div key={dep._id} className="flex items-center space-x-4">
                                 <div
                                    className={`flex-1 p-4 rounded-lg border-2 ${getTaskStatusColor(
                                       dep.prerequisiteTaskId
                                    )}`}
                                 >
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center space-x-3">
                                          {getTaskStatusIcon(dep.prerequisiteTaskId)}
                                          <div>
                                             <h5 className="font-semibold">{dep.prerequisiteTaskId.task}</h5>
                                             <div className="flex items-center text-sm opacity-75">
                                                <FiCalendar className="mr-1" />
                                                {formatDateTime(
                                                   dep.prerequisiteTaskId.date,
                                                   dep.prerequisiteTaskId.time
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                       <div className="text-xs font-medium px-2 py-1 bg-white rounded">
                                          {dep.prerequisiteTaskId.priority}
                                       </div>
                                    </div>
                                 </div>
                                 <FiArrowRight className="text-gray-400 text-xl" />
                                 <div className="text-sm text-gray-600 font-medium">Current Task</div>
                              </div>
                           ))}
                        </div>
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                           <p className="text-sm text-orange-800">
                              <strong>Rule:</strong> The current task cannot be started until all prerequisite tasks are
                              completed.
                           </p>
                        </div>
                     </div>
                  )}

                  {/* Dependents Section */}
                  {hasDependents && (
                     <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                           <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                              <FiArrowRight className="h-4 w-4 text-purple-600" />
                           </div>
                           Dependent Tasks (Waiting for this task)
                        </h4>
                        <div className="space-y-3">
                           {dependencies.dependents.map((dep, index) => (
                              <div key={dep._id} className="flex items-center space-x-4">
                                 <div className="text-sm text-gray-600 font-medium">Current Task</div>
                                 <FiArrowRight className="text-gray-400 text-xl" />
                                 <div
                                    className={`flex-1 p-4 rounded-lg border-2 ${getTaskStatusColor(
                                       dep.dependentTaskId
                                    )}`}
                                 >
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center space-x-3">
                                          {getTaskStatusIcon(dep.dependentTaskId)}
                                          <div>
                                             <h5 className="font-semibold">{dep.dependentTaskId.task}</h5>
                                             <div className="flex items-center text-sm opacity-75">
                                                <FiCalendar className="mr-1" />
                                                {formatDateTime(dep.dependentTaskId.date, dep.dependentTaskId.time)}
                                             </div>
                                          </div>
                                       </div>
                                       <div className="text-xs font-medium px-2 py-1 bg-white rounded">
                                          {dep.dependentTaskId.priority}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                           <p className="text-sm text-purple-800">
                              <strong>Rule:</strong> These tasks cannot be started until the current task is completed.
                           </p>
                        </div>
                        </div>
                     )}

                  {/* Workflow Summary */}
                  {hasPrerequisites && hasDependents && (
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Workflow Summary</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                           <p>1. Complete all prerequisite tasks first</p>
                           <p>2. Then work on the current task</p>
                           <p>3. Once current task is done, dependent tasks can begin</p>
                        </div>
                  </div>
               )}
            </div>
         )}
         </div>
      </div>
   );
};

export default DependencyTree;
