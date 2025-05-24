'use client';

import { useState, useEffect } from 'react';
import { FiLink, FiUnlink, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TaskDependencyList({ taskId }) {
   const [dependencies, setDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(null);
   const [expandedSection, setExpandedSection] = useState('both'); // 'prerequisites', 'dependents', 'both', 'none'

   useEffect(() => {
      fetchDependencies();
   }, [taskId]);

   const fetchDependencies = async () => {
      setIsLoading(true);
      setError(null);

      try {
         const token = localStorage.getItem('token');
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
      } catch (err) {
         console.error('Error fetching dependencies:', err);
         setError('Failed to load dependencies. Please try again.');
      } finally {
         setIsLoading(false);
      }
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
         // Refresh to ensure consistency
         fetchDependencies();
      } catch (err) {
         console.error('Error deleting dependency:', err);
         toast.error('Failed to remove dependency');
         // Revert UI changes on error
         setDependencies(previousDependencies);
      }
   };

   const toggleSection = (section) => {
      if (expandedSection === section) {
         setExpandedSection('none');
      } else {
         setExpandedSection(section);
      }
   };

   if (isLoading) {
      return (
         <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9406E6]"></div>
         </div>
      );
   }

   if (error) {
      return <div className="p-4 text-red-500">{error}</div>;
   }

   const hasDependencies = dependencies.prerequisites.length > 0 || dependencies.dependents.length > 0;

   if (!hasDependencies) {
      return <div className="p-4 text-gray-500 italic">No dependencies found for this task.</div>;
   }

   return (
      <div className="space-y-4">
         {dependencies.prerequisites.length > 0 && (
            <div className="bg-white/5 backdrop-blur-md rounded-lg overflow-hidden">
               <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/10"
                  onClick={() => toggleSection('prerequisites')}
               >
                  <h3 className="font-medium text-white flex items-center">
                     <FiLink className="mr-2" /> Prerequisites (This task depends on)
                  </h3>
                  {expandedSection === 'prerequisites' || expandedSection === 'both' ? (
                     <FiChevronDown className="text-white" />
                  ) : (
                     <FiChevronRight className="text-white" />
                  )}
               </div>

               {(expandedSection === 'prerequisites' || expandedSection === 'both') && (
                  <div className="p-3 border-t border-white/10">
                     <ul className="space-y-2">
                        {dependencies.prerequisites.map((dep) => (
                           <li key={dep._id} className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <span className="font-medium text-white">{dep.prerequisiteTaskId.task}</span>
                                    <div className="text-sm text-gray-300">
                                       Due: {dep.prerequisiteTaskId.date} at {dep.prerequisiteTaskId.time}
                                    </div>
                                 </div>
                                 <button
                                    onClick={() => handleDeleteDependency(dep._id)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    title="Remove dependency"
                                 >
                                    <FiUnlink />
                                 </button>
                              </div>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
         )}

         {dependencies.dependents.length > 0 && (
            <div className="bg-white/5 backdrop-blur-md rounded-lg overflow-hidden">
               <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/10"
                  onClick={() => toggleSection('dependents')}
               >
                  <h3 className="font-medium text-white flex items-center">
                     <FiLink className="mr-2" /> Dependents (Tasks that depend on this)
                  </h3>
                  {expandedSection === 'dependents' || expandedSection === 'both' ? (
                     <FiChevronDown className="text-white" />
                  ) : (
                     <FiChevronRight className="text-white" />
                  )}
               </div>

               {(expandedSection === 'dependents' || expandedSection === 'both') && (
                  <div className="p-3 border-t border-white/10">
                     <ul className="space-y-2">
                        {dependencies.dependents.map((dep) => (
                           <li key={dep._id} className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <span className="font-medium text-white">{dep.dependentTaskId.task}</span>
                                    <div className="text-sm text-gray-300">
                                       Due: {dep.dependentTaskId.date} at {dep.dependentTaskId.time}
                                    </div>
                                 </div>
                                 <button
                                    onClick={() => handleDeleteDependency(dep._id)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    title="Remove dependency"
                                 >
                                    <FiUnlink />
                                 </button>
                              </div>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
         )}
      </div>
   );
}

export default TaskDependencyList;
