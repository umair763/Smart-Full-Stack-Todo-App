'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiMoreVertical, FiChevronDown, FiChevronRight, FiPlus } from 'react-icons/fi';
import EditTaskModal from './EditTaskModal';
import Subtask from './Subtask';
import SubtaskModal from './SubtaskModal';
import { useSocket } from '../app/context/SocketContext';
import ReminderModal from './ReminderModal';
import { toast } from 'react-hot-toast';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DisplayTodoList({ list, isexceeded, onDelete, onUpdate, onStatusChange }) {
   const [completed, setCompleted] = useState(list.completed || false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showSubtasks, setShowSubtasks] = useState(false);
   const [subtasks, setSubtasks] = useState([]);
   const [showSubtaskModal, setShowSubtaskModal] = useState(false);
   const [currentSubtask, setCurrentSubtask] = useState(null);
   const [showMoreOptions, setShowMoreOptions] = useState(false);
   const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
   const { socket } = useSocket();
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

   // Initialize editedTask with the list props
   const [editedTask, setEditedTask] = useState({
      task: list.task,
      date: list.date,
      time: list.time,
      color: list.color,
   });

   // Sync the component state with the list prop
   useEffect(() => {
      setCompleted(list.completed || false);
   }, [list.completed]);

   // Fetch subtasks when expanding
   useEffect(() => {
      if (showSubtasks && subtasks.length === 0 && !isLoadingSubtasks) {
         fetchSubtasks();
      }
   }, [showSubtasks]);

   // Handle socket events for subtask changes
   useEffect(() => {
      if (!socket) return;

      // Handle subtask created event
      const handleSubtaskCreated = (data) => {
         if (data.taskId === list._id) {
            setSubtasks((prev) => {
               const newSubtasks = [...prev, data.subtask];
               return sortSubtasksByPriority(newSubtasks);
            });
            // Update parent task counts
            onUpdate(list._id, {
               ...list,
               subtaskCount: (list.subtaskCount || 0) + 1,
               completedSubtasks: list.completedSubtasks || 0,
            });
         }
      };

      // Handle subtask status changed event
      const handleSubtaskStatusChanged = (data) => {
         if (data.data && data.data.parentTaskId === list._id) {
            // Update the subtask in local state
            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) =>
                  st._id === data.data.subtaskId ? { ...st, status: data.data.status } : st
               );
               return sortSubtasksByPriority(updatedSubtasks);
            });

            // Update parent task with new completion counts
            onUpdate(list._id, {
               ...list,
               subtaskCount: data.data.subtaskCount,
               completedSubtasks: data.data.completedSubtasks,
            });
         }
      };

      // Handle subtask updated event
      const handleSubtaskUpdated = (data) => {
         if (data.subtask && data.subtask.taskId === list._id) {
            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) => (st._id === data.subtask._id ? data.subtask : st));
               return sortSubtasksByPriority(updatedSubtasks);
            });
         }
      };

      // Handle subtask deleted event
      const handleSubtaskDeleted = (data) => {
         if (data.parentTaskId === list._id) {
            setSubtasks((prev) => {
               const filteredSubtasks = prev.filter((st) => st._id !== data.subtaskId);
               return sortSubtasksByPriority(filteredSubtasks);
            });
            // Update parent task counts
            onUpdate(list._id, {
               ...list,
               subtaskCount: Math.max((list.subtaskCount || 0) - 1, 0),
               completedSubtasks: Math.max((list.completedSubtasks || 0) - 1, 0),
            });
         }
      };

      // Register socket listeners
      socket.on('subtaskCreated', handleSubtaskCreated);
      socket.on('subtaskStatusChanged', handleSubtaskStatusChanged);
      socket.on('subtaskUpdated', handleSubtaskUpdated);
      socket.on('subtaskDeleted', handleSubtaskDeleted);

      // Clean up listeners on unmount
      return () => {
         socket.off('subtaskCreated', handleSubtaskCreated);
         socket.off('subtaskStatusChanged', handleSubtaskStatusChanged);
         socket.off('subtaskUpdated', handleSubtaskUpdated);
         socket.off('subtaskDeleted', handleSubtaskDeleted);
      };
   }, [socket, list._id, list.subtaskCount, list.completedSubtasks]);

   // Fetch subtasks from the server
   const fetchSubtasks = async () => {
      setIsLoadingSubtasks(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/subtasks`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch subtasks');
         }

         const data = await response.json();
         // Sort subtasks by priority (High > Medium > Low)
         const sortedSubtasks = sortSubtasksByPriority(data);
         setSubtasks(sortedSubtasks);
      } catch (error) {
         console.error('Error fetching subtasks:', error);
      } finally {
         setIsLoadingSubtasks(false);
      }
   };

   // Helper function to sort subtasks by priority
   const sortSubtasksByPriority = (subtasks) => {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return [...subtasks].sort((a, b) => {
         return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      });
   };

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
            body: JSON.stringify({ completed: newStatus }),
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

   // Toggle subtasks visibility
   const toggleSubtasks = (e) => {
      e.stopPropagation(); // Prevent event bubbling
      if (list.subtaskCount > 0) {
         setShowSubtasks(!showSubtasks);
         if (!showSubtasks && subtasks.length === 0) {
            fetchSubtasks();
         }
      }
   };

   // Toggle the more options menu
   const toggleMoreOptions = (e) => {
      e.stopPropagation();
      setShowMoreOptions(!showMoreOptions);
   };

   // Open subtask modal for adding a new subtask
   const handleAddSubtask = () => {
      setCurrentSubtask(null);
      setShowSubtaskModal(true);
      setShowMoreOptions(false);
   };

   // Save a new subtask
   const handleSaveSubtask = async (subtaskData, subtaskId = null) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         // Format the subtask data
         const formattedData = {
            ...subtaskData,
            taskId: list._id,
            status: false,
         };

         let response;
         if (subtaskId) {
            // Update existing subtask
            response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/subtasks/${subtaskId}`, {
               method: 'PUT',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(formattedData),
            });
         } else {
            // Create new subtask
            response = await fetch(`${API_BASE_URL}/api/tasks/${list._id}/subtasks`, {
               method: 'POST',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(formattedData),
            });
         }

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || (subtaskId ? 'Failed to update subtask' : 'Failed to create subtask'));
         }

         const data = await response.json();

         if (subtaskId) {
            // Update the subtask in the local state
            const updatedSubtasks = subtasks.map((st) => (st._id === subtaskId ? data : st));
            setSubtasks(sortSubtasksByPriority(updatedSubtasks));
         } else {
            // Add the new subtask to the local state and re-sort
            const newSubtasks = [...subtasks, data];
            setSubtasks(sortSubtasksByPriority(newSubtasks));
            // Show subtasks if they were hidden
            setShowSubtasks(true);
         }

         // Close the modal
         setShowSubtaskModal(false);
      } catch (error) {
         console.error('Error saving subtask:', error);
         toast.error(error.message || 'Failed to save subtask');
      }
   };

   // Handle subtask deletion
   const handleDeleteSubtask = async (subtaskId) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/subtasks/${subtaskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete subtask');
         }

         // Remove the subtask from the local state
         setSubtasks((prevSubtasks) => prevSubtasks.filter((st) => st._id !== subtaskId));
      } catch (error) {
         console.error('Error deleting subtask:', error);
      }
   };

   // Handle subtask edit
   const handleEditSubtask = (subtask) => {
      setCurrentSubtask(subtask);
      setShowSubtaskModal(true);
   };

   // Handle subtask status change
   const handleSubtaskStatusChange = async (subtaskId, currentStatus, errorMessage) => {
      // If there was no error, update the parent task's completion summary
      if (!errorMessage) {
         try {
            // Find the subtask in our local state and update its status
            const updatedSubtasks = subtasks.map((st) => {
               if (st._id === subtaskId) {
                  return { ...st, status: !currentStatus };
               }
               return st;
            });

            setSubtasks(updatedSubtasks);

            // Calculate new completion counts
            const totalSubtasks = updatedSubtasks.length;
            const completedCount = updatedSubtasks.filter((st) => st.status).length;

            // Update the parent task locally for immediate UI feedback
            const updatedTask = {
               ...list,
               subtaskCount: totalSubtasks,
               completedSubtasks: completedCount,
            };

            // Call the parent update handler to update in parent components
            if (onUpdate) {
               onUpdate(list._id, updatedTask);
            }
         } catch (error) {
            console.error('Error updating subtask status locally:', error);
         }
      } else {
         console.log(`Subtask ${subtaskId} status change failed. Error: ${errorMessage}`);
      }
   };

   // Render subtask count and progress
   const renderSubtaskProgress = () => {
      const { subtaskCount = 0, completedSubtasks = 0 } = list;

      if (subtaskCount === 0) return null;

      return (
         <div className="flex items-center text-xs text-gray-600 mt-1">
            <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
               <div
                  className="bg-[#9406E6] h-2.5 rounded-full"
                  style={{ width: `${subtaskCount > 0 ? (completedSubtasks / subtaskCount) * 100 : 0}%` }}
               ></div>
            </div>
            <span>
               {completedSubtasks}/{subtaskCount} completed
            </span>
         </div>
      );
   };

   const handleSetReminder = async (taskId, reminderTime) => {
      try {
         console.log('DisplayTodoList - Setting reminder for task:', { taskId, reminderTime });

         if (!taskId || !reminderTime) {
            console.error('Missing required data:', { taskId, reminderTime });
            toast.error('Task ID and reminder time are required');
            return;
         }

         const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reminders`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
               taskId,
               reminderTime,
               userId: list.userId,
            }),
         });

         const data = await response.json();

         if (!response.ok) {
            console.error('Failed to set reminder:', data);
            throw new Error(data.message || 'Failed to set reminder');
         }

         console.log('Reminder set successfully:', data);
         toast.success('Reminder set successfully!');
         setIsReminderModalOpen(false);
      } catch (error) {
         console.error('Error setting reminder:', error);
         toast.error(error.message || 'Failed to set reminder. Please try again.');
      }
   };

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

            <div className="flex flex-col">
               <div className="flex items-center">
                  {/* Expand/collapse button for subtasks */}
                  {list.subtaskCount > 0 && (
                     <button
                        onClick={toggleSubtasks}
                        className="mr-1 text-gray-600 hover:text-[#9406E6] transition-colors"
                        title={showSubtasks ? 'Collapse subtasks' : 'Expand subtasks'}
                     >
                        {showSubtasks ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                     </button>
                  )}
                  <p
                     className={`${
                        completed ? 'line-through text-gray-600' : ''
                     } font-bold text-left sm:text-base lg:text-md transition-all`}
                  >
                     {list.task}
                  </p>
               </div>

               {/* Subtask progress indicator */}
               {list.subtaskCount > 0 && (
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                     <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                           className="bg-[#9406E6] h-2.5 rounded-full"
                           style={{ width: `${(list.completedSubtasks / list.subtaskCount) * 100}%` }}
                        ></div>
                     </div>
                     <span>
                        {list.completedSubtasks}/{list.subtaskCount} completed
                     </span>
                  </div>
               )}
            </div>
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

                  {/* More options (three dots) */}
                  <div className="relative">
                     <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-gray-600 hover:text-gray-800"
                        title="More options"
                     >
                        <FiMoreVertical className="h-5 w-5" />
                     </button>

                     {/* Dropdown menu */}
                     {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                           <button
                              onClick={() => {
                                 setIsReminderModalOpen(true);
                                 setIsMenuOpen(false);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                           >
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-5 w-5 mr-2"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                 />
                              </svg>
                              Set Reminder
                           </button>
                           <button
                              onClick={handleAddSubtask}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                           >
                              <FiPlus className="mr-2 h-4 w-4" />
                              Add Subtask
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Subtasks section */}
         {showSubtasks && list.subtaskCount > 0 && (
            <div className="relative pl-6 mb-2 group">
               {/* Vertical connector from parent to first child */}
               <div className="absolute left-[16px] top-[5px] bottom-2 w-[2px] bg-gray-300 group-hover:bg-[#9406E6] transition-colors z-0"></div>

               {isLoadingSubtasks ? (
                  <div className="text-center py-2 text-gray-400 italic">Loading subtasks...</div>
               ) : subtasks.length > 0 ? (
                  subtasks.map((subtask, index) => (
                     <div key={subtask._id} className="relative ml-4 -mb-2 flex items-start">
                        {/* Horizontal connector + arrow */}
                        <div className="absolute left-[-24px] top-[33px] flex items-center z-10">
                           <div className="w-[20px] h-[2px] bg-gray-300 group-hover:bg-[#9406E6] transition-all"></div>
                           <div className="w-2 h-2 rotate-45 border-t-2 border-r-2 border-gray-300 group-hover:border-[#9406E6] ml-1 mt-[-1px]"></div>
                        </div>
                        {/* Subtask component */}
                        <Subtask
                           subtask={subtask}
                           onDelete={handleDeleteSubtask}
                           onUpdate={handleEditSubtask}
                           onStatusChange={handleSubtaskStatusChange}
                        />
                     </div>
                  ))
               ) : (
                  <div className="text-center py-2 text-gray-400 italic">No subtasks found</div>
               )}
            </div>
         )}

         {/* Edit Task Modal */}
         {showEditModal && (
            <EditTaskModal task={list} onClose={() => setShowEditModal(false)} onSave={handleSaveTask} />
         )}

         {/* Subtask Modal */}
         {showSubtaskModal && (
            <SubtaskModal
               isOpen={showSubtaskModal}
               onClose={() => setShowSubtaskModal(false)}
               onSave={handleSaveSubtask}
               parentTaskId={list._id}
               parentTask={list}
               subtask={currentSubtask}
            />
         )}

         {/* Reminder Modal */}
         <ReminderModal
            isOpen={isReminderModalOpen}
            onClose={() => {
               setIsReminderModalOpen(false);
               console.log('DisplayTodoList - Closing reminder modal, current task:', list);
            }}
            task={list}
            onSetReminder={(taskId, reminderTime) => {
               console.log('DisplayTodoList - Setting reminder for task:', { taskId, reminderTime });
               handleSetReminder(taskId, reminderTime);
            }}
         />
      </>
   );
}

export default DisplayTodoList;
