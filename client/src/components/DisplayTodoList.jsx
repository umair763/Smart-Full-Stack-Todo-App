'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import EditTaskModal from './EditTaskModal';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DisplayTodoList({ list, isexceeded, onDelete, onUpdate, onStatusChange }) {
   const [completed, setCompleted] = useState(list.status || false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);

   // Initialize editedTask with the list props
   const [editedTask, setEditedTask] = useState({
      task: list.task,
      date: list.date,
      time: list.time,
      color: list.color,
   });

   // Sync the component state with the list prop (which might be updated elsewhere)
   useEffect(() => {
      setCompleted(list.status || false);
   }, [list.status]);

   // Handle task status toggle
   async function handleTaskStatusToggle() {
      // Prevent multiple rapid toggling
      if (isUpdating) return;

      setIsUpdating(true);

      try {
         // Optimistically update UI first
         const newStatus = !completed;
         setCompleted(newStatus);

         // Use the dedicated endpoint for status updates
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/status`, {
            method: 'PATCH',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
         });

         if (!response.ok) {
            throw new Error('Failed to update task status');
         }

         // The UI will be updated through Socket.io notification
      } catch (error) {
         // Revert UI state if the update fails
         console.error('Error updating task status:', error);
         setCompleted(!completed);

         // Show notification (handled by parent)
         if (onStatusChange) {
            onStatusChange(list._id, completed, error.message);
         }
      } finally {
         setIsUpdating(false);
      }
   }

   function handleEdit() {
      setShowEditModal(true);
   }

   function handleEditSubmit(e) {
      e.preventDefault();
      onUpdate(list._id, editedTask);
      setShowEditModal(false);
   }

   function handleDelete() {
      if (window.confirm('Are you sure you want to delete this task?')) {
         onDelete(list._id);
      }
   }

   function handleSaveTask(updatedTask) {
      // Call the parent component's update function
      onUpdate(list._id, updatedTask);
      setShowEditModal(false);
   }

   return (
      <>
         <div className="grid grid-cols-[30px,1fr,auto] w-[98%] px-4 py-2 mb-2 mt-2 rounded-lg text-[#1D1D1D] bg-[#C8F0F3]/90 items-center max-[300px]:grid-cols-[20px,1fr,auto] max-[300px]:text-[9px] min-[301px]:max-[340px]:grid-cols-[22px,1fr,auto] min-[301px]:max-[340px]:text-[10px] min-[341px]:max-[600px]:grid-cols-[25px,1fr,auto] min-[341px]:max-[600px]:text-[11px] min-[601px]:grid-cols-[28px,1fr,auto] min-[601px]:text-[12px]">
            <input
               type="radio"
               className={`w-4 h-4 rounded-full cursor-pointer appearance-none ${
                  list.color === 'red'
                     ? 'bg-red-600 border-red-600'
                     : list.color === 'yellow'
                     ? 'bg-yellow-400 border-yellow-400'
                     : 'bg-green-600 border-green-600'
               }`}
            />

            <p
               className={`${
                  completed ? 'line-through text-gray-600' : ''
               } font-bold text-left sm:text-base lg:text-md transition-all`}
            >
               {list.task}
            </p>
            <div className="flex justify-between items-center gap-2">
               <div className="flex flex-col items-start">
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : ''
                     } font-bold text-left sm:text-base lg:text-md transition-all`}
                  >
                     {list.date}
                  </p>
                  <p className="font-bold text-left sm:text-base text-red-700 lg:text-md">
                     {isexceeded && !completed ? 'Deadline exceeded' : ''}
                  </p>
               </div>
               <p
                  className={`${
                     completed ? 'line-through text-gray-600' : ''
                  } font-bold text-left sm:text-base lg:text-md transition-all`}
               >
                  {list.time}
               </p>

               {/* Action buttons */}
               <div className="flex items-center space-x-2 ml-2">
                  {/* Edit button */}
                  <button onClick={handleEdit} className="text-blue-600 hover:text-blue-800" title="Edit task">
                     <FiEdit2 className="h-5 w-5" />
                  </button>

                  {/* Delete button */}
                  <button onClick={handleDelete} className="text-red-600 hover:text-red-800" title="Delete task">
                     <FiTrash2 className="h-5 w-5" />
                  </button>

                  {/* Completion checkbox */}
                  <button
                     onClick={handleTaskStatusToggle}
                     className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                        completed ? 'bg-[#9406E6] text-white' : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/20'
                     }`}
                     disabled={isUpdating}
                     title={completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                     {completed && (
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-4 w-4"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                     )}
                  </button>
               </div>
            </div>
         </div>

         {/* Edit Task Modal */}
         {showEditModal && (
            <EditTaskModal task={list} onClose={() => setShowEditModal(false)} onSave={handleSaveTask} />
         )}
      </>
   );
}

export default DisplayTodoList;
