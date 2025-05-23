'use client';

import { useState, useEffect } from 'react';
import { FiChevronRight, FiChevronDown, FiLink, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DependencyTree = ({ taskId, onClose }) => {
   const [dependencies, setDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoading, setIsLoading] = useState(true);
   const [expandedSections, setExpandedSections] = useState({ prerequisites: true, dependents: true });

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
         toast.error('Failed to load dependencies');
      } finally {
         setIsLoading(false);
      }
   };

   const handleDeleteDependency = async (dependencyId) => {
      if (!window.confirm('Are you sure you want to remove this dependency?')) {
         return;
      }

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
         fetchDependencies(); // Refresh the dependencies
      } catch (error) {
         console.error('Error deleting dependency:', error);
         toast.error('Failed to remove dependency');
      }
   };

   const toggleSection = (section) => {
      setExpandedSections((prev) => ({
         ...prev,
         [section]: !prev[section],
      }));
   };

   if (isLoading) {
      return (
         <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-purple-900">Task Dependencies</h3>
               <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  Close
               </button>
            </div>
            <div className="flex justify-center py-4">
               <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-700"></div>
               <span className="ml-2 text-purple-700">Loading dependencies...</span>
            </div>
         </div>
      );
   }

   const hasDependencies = dependencies.prerequisites.length > 0 || dependencies.dependents.length > 0;

   return (
      <div className="p-4 bg-purple-50 rounded-lg">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-purple-900">Task Dependencies</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
               Close
            </button>
         </div>

         {!hasDependencies ? (
            <p className="text-gray-600 italic text-center py-2">No dependencies found for this task.</p>
         ) : (
            <div className="space-y-4">
               {/* Prerequisites section */}
               {dependencies.prerequisites.length > 0 && (
                  <div className="border border-purple-200 rounded-md overflow-hidden">
                     <div
                        className="flex items-center justify-between bg-purple-100 px-4 py-2 cursor-pointer"
                        onClick={() => toggleSection('prerequisites')}
                     >
                        <div className="flex items-center">
                           {expandedSections.prerequisites ? (
                              <FiChevronDown className="mr-2 text-purple-700" />
                           ) : (
                              <FiChevronRight className="mr-2 text-purple-700" />
                           )}
                           <h4 className="font-medium text-purple-900">This task depends on</h4>
                        </div>
                        <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                           {dependencies.prerequisites.length}
                        </span>
                     </div>

                     {expandedSections.prerequisites && (
                        <div className="p-3 bg-white">
                           <ul className="space-y-2">
                              {dependencies.prerequisites.map((dep) => (
                                 <li
                                    key={dep._id}
                                    className="flex items-center justify-between p-2 border-l-2 border-purple-300 pl-3"
                                 >
                                    <div className="flex items-center">
                                       <FiLink className="mr-2 text-purple-600" />
                                       <span className="text-gray-800">{dep.prerequisiteTaskId.task}</span>
                                       <span className="ml-2 text-xs text-gray-500">
                                          ({dep.prerequisiteTaskId.date} {dep.prerequisiteTaskId.time})
                                       </span>
                                    </div>
                                    <button
                                       onClick={() => handleDeleteDependency(dep._id)}
                                       className="text-red-500 hover:text-red-700"
                                       title="Remove dependency"
                                    >
                                       <FiTrash2 />
                                    </button>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                  </div>
               )}

               {/* Dependents section */}
               {dependencies.dependents.length > 0 && (
                  <div className="border border-blue-200 rounded-md overflow-hidden">
                     <div
                        className="flex items-center justify-between bg-blue-100 px-4 py-2 cursor-pointer"
                        onClick={() => toggleSection('dependents')}
                     >
                        <div className="flex items-center">
                           {expandedSections.dependents ? (
                              <FiChevronDown className="mr-2 text-blue-700" />
                           ) : (
                              <FiChevronRight className="mr-2 text-blue-700" />
                           )}
                           <h4 className="font-medium text-blue-900">Tasks that depend on this</h4>
                        </div>
                        <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                           {dependencies.dependents.length}
                        </span>
                     </div>

                     {expandedSections.dependents && (
                        <div className="p-3 bg-white">
                           <ul className="space-y-2">
                              {dependencies.dependents.map((dep) => (
                                 <li
                                    key={dep._id}
                                    className="flex items-center justify-between p-2 border-l-2 border-blue-300 pl-3"
                                 >
                                    <div className="flex items-center">
                                       <FiLink className="mr-2 text-blue-600" />
                                       <span className="text-gray-800">{dep.dependentTaskId.task}</span>
                                       <span className="ml-2 text-xs text-gray-500">
                                          ({dep.dependentTaskId.date} {dep.dependentTaskId.time})
                                       </span>
                                    </div>
                                    <button
                                       onClick={() => handleDeleteDependency(dep._id)}
                                       className="text-red-500 hover:text-red-700"
                                       title="Remove dependency"
                                    >
                                       <FiTrash2 />
                                    </button>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default DependencyTree;
