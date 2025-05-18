'use client';

import { useState } from 'react';

function DeleteTaskForm({ tasks, deleteTask, setisDeleteFormVisible }) {
   const [selectedTaskId, setSelectedTaskId] = useState('');
   const [showConfirmation, setShowConfirmation] = useState(false);

   const handleTaskSelect = (e) => {
      setSelectedTaskId(e.target.value);
   };

   const handleDeleteClick = () => {
      if (!selectedTaskId) return;
      setShowConfirmation(true);
   };

   const handleConfirmDelete = () => {
      if (selectedTaskId) {
         deleteTask(selectedTaskId);
         setSelectedTaskId('');
         setShowConfirmation(false);
      }
   };

   const handleCancelDelete = () => {
      setShowConfirmation(false);
   };

   const priorityColors = {
      red: 'bg-red-500',
      yellow: 'bg-yellow-400',
      green: 'bg-green-500',
   };

   return (
      <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg mb-6">
         <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-white">Delete Task</h2>
            <button
               onClick={() => setisDeleteFormVisible(false)}
               className="text-white hover:text-red-300 transition-colors"
            >
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         </div>

         {tasks.length > 0 ? (
            <>
               <div className="mb-5">
                  <p className="text-white/80 mb-4">Select a task to delete:</p>
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                     {tasks.map((task) => (
                        <label
                           key={task._id}
                           className={`flex items-center p-3 rounded-lg border border-white/20 cursor-pointer transition-all ${
                              selectedTaskId === task._id ? 'bg-white/30 border-white' : 'bg-white/10 hover:bg-white/20'
                           }`}
                        >
                           <input
                              type="radio"
                              name="taskToDelete"
                              value={task._id}
                              checked={selectedTaskId === task._id}
                              onChange={handleTaskSelect}
                              className="hidden"
                           />
                           <span
                              className={`h-4 w-4 rounded-full mr-3 ${
                                 task.color ? priorityColors[task.color] : 'bg-gray-400'
                              }`}
                           ></span>
                           <div className="flex-1">
                              <p className="text-white font-medium">{task.task}</p>
                              <div className="flex text-white/70 text-sm mt-1">
                                 <p>{task.date}</p>
                                 <span className="mx-2">•</span>
                                 <p>{task.time}</p>
                              </div>
                           </div>
                           <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                 selectedTaskId === task._id
                                    ? 'border-white bg-[#9406E6]'
                                    : 'border-white/50 bg-transparent'
                              }`}
                           >
                              {selectedTaskId === task._id && (
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                 >
                                    <path
                                       fillRule="evenodd"
                                       d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                       clipRule="evenodd"
                                    />
                                 </svg>
                              )}
                           </div>
                        </label>
                     ))}
                  </div>
               </div>

               {/* Delete Button */}
               <button
                  onClick={handleDeleteClick}
                  disabled={!selectedTaskId}
                  className={`w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-lg transition-all ${
                     selectedTaskId
                        ? 'hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98]'
                        : 'opacity-50 cursor-not-allowed'
                  }`}
               >
                  Delete Task
               </button>
            </>
         ) : (
            <div className="text-center py-6">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-white/50 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={1.5}
                     d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
               </svg>
               <p className="text-white/80">No tasks available to delete</p>
            </div>
         )}

         {/* Confirmation Modal */}
         {showConfirmation && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
               <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirm Deletion</h3>
                  <p className="text-gray-600 mb-5">
                     Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                     <button
                        onClick={handleCancelDelete}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleConfirmDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                     >
                        Delete
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

export default DeleteTaskForm;
