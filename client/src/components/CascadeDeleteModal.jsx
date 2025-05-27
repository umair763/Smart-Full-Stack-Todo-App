'use client';

import React from 'react';
import { FiAlertTriangle, FiTrash2, FiX, FiArrowDown } from 'react-icons/fi';

const CascadeDeleteModal = ({ isOpen, onClose, onConfirm, taskName, dependentTasks, isLoading }) => {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
         <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm mx-auto transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-t-lg">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                     <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <FiAlertTriangle className="h-4 w-4" />
                     </div>
                     <h3 className="text-base font-semibold">Confirm Deletion</h3>
                  </div>
                  <button
                     onClick={onClose}
                     className="text-white hover:text-red-200 transition-colors"
                     disabled={isLoading}
                  >
                     <FiX className="h-4 w-4" />
                  </button>
               </div>
            </div>

            {/* Content */}
            <div className="p-4">
               {/* Warning Message */}
               <div className="mb-4">
                  <div className="flex items-start space-x-2 mb-3">
                     <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiAlertTriangle className="h-3 w-3 text-red-600" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Multiple tasks will be deleted</h4>
                        <p className="text-gray-600 text-xs leading-relaxed">
                           <strong>"{taskName}"</strong> has dependent tasks that will also be removed.
                        </p>
                     </div>
                  </div>
               </div>

               {/* Deletion Flow Visualization */}
               <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h5 className="font-medium text-gray-800 mb-2 text-xs">Tasks to be deleted:</h5>

                  {/* Independent Task */}
                  <div className="flex items-center space-x-2 mb-2">
                     <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <FiTrash2 className="h-2 w-2 text-white" />
                     </div>
                     <div className="flex-1 bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-semibold text-red-800 text-xs truncate">{taskName}</p>
                        <p className="text-red-600 text-[10px]">Independent Task</p>
                     </div>
                  </div>

                  {/* Arrow */}
                  {dependentTasks.length > 0 && (
                     <div className="flex justify-center mb-2">
                        <FiArrowDown className="text-gray-400 h-3 w-3" />
                     </div>
                  )}

                  {/* Dependent Tasks */}
                  <div className="space-y-1">
                     {dependentTasks.slice(0, 3).map((task, index) => (
                        <div key={task.id} className="flex items-center space-x-2">
                           <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <FiTrash2 className="h-2 w-2 text-white" />
                           </div>
                           <div className="flex-1 bg-orange-50 border border-orange-200 rounded p-2">
                              <p className="font-semibold text-orange-800 text-xs truncate">{task.name}</p>
                              <p className="text-orange-600 text-[10px]">Dependent Task</p>
                           </div>
                        </div>
                     ))}
                     {dependentTasks.length > 3 && (
                        <div className="text-center text-gray-500 text-xs py-1">
                           +{dependentTasks.length - 3} more tasks
                        </div>
                     )}
                  </div>
               </div>

               {/* Summary */}
               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                     <FiAlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                     <div>
                        <p className="text-yellow-800 text-xs font-medium">
                           Total: {1 + dependentTasks.length} task{1 + dependentTasks.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-yellow-700 text-[10px] mt-0.5">Cannot be undone</p>
                     </div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex space-x-2">
                  <button
                     onClick={onClose}
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors text-sm font-medium"
                     disabled={isLoading}
                  >
                     Cancel
                  </button>
                  <button
                     onClick={onConfirm}
                     disabled={isLoading}
                     className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm font-medium"
                  >
                     {isLoading ? (
                        <>
                           <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-1"></div>
                           <span className="text-xs">Deleting...</span>
                        </>
                     ) : (
                        <>
                           <FiTrash2 className="mr-1 h-3 w-3" />
                           <span className="text-xs">Delete All</span>
                        </>
                     )}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default React.memo(CascadeDeleteModal);
