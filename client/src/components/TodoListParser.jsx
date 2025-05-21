'use client';

import { useState, useEffect } from 'react';
import DisplayTodoList from './DisplayTodoList';
import EditTaskModal from './EditTaskModal';
import ConfirmationModal from './ConfirmationModal';
import { useSocket } from '../app/context/SocketContext';
import ReminderModal from './ReminderModal';
import { toast } from 'react-hot-toast';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Function to check if a task has exceeded its deadline
function isDeadlineExceeded(task) {
   const now = new Date(); // Current date and time
   const taskDateTime = convertToComparableDateTime(task.date, task.time);

   // Extract just the date part from the current time for comparison (ignoring the time part)
   const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

   // Extract just the date part from the task date for comparison (ignoring the time part)
   const taskDateOnly = new Date(taskDateTime.getFullYear(), taskDateTime.getMonth(), taskDateTime.getDate());

   // If the task date is before today, it's considered exceeded
   if (taskDateOnly < nowDateOnly) {
      return true;
   }

   // If the task date is today, check the time
   if (taskDateOnly.getTime() === nowDateOnly.getTime()) {
      // Compare times
      return taskDateTime < now; // If the task time is earlier than the current time, it's exceeded
   }

   // If the task is in the future, it's not exceeded
   return false;
}

// Convert date and time to comparable Date object
function convertToComparableDateTime(date, time) {
   const [day, month, year] = date.split('/');
   let [hours, minutes, ampm] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1, 4);

   hours = parseInt(hours);
   if (ampm === 'PM' && hours < 12) hours += 12;
   if (ampm === 'AM' && hours === 12) hours = 0;

   return new Date(year, month - 1, day, hours, minutes);
}

function TodoListParser({ todolist, settask }) {
   const validTodoList = Array.isArray(todolist) ? todolist : [];
   const { socket } = useSocket();

   // Use state to store whether each task has exceeded the deadline
   const [exceededStatuses, setExceededStatuses] = useState([]);

   // State for edit modal
   const [editModalOpen, setEditModalOpen] = useState(false);
   const [taskToEdit, setTaskToEdit] = useState(null);

   // State for delete confirmation modal
   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
   const [taskIdToDelete, setTaskIdToDelete] = useState(null);

   // State for API errors
   const [apiError, setApiError] = useState(null);

   const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
   const [selectedTask, setSelectedTask] = useState(null);

   const [isMenuOpen, setIsMenuOpen] = useState(null);

   useEffect(() => {
      // Calculate exceeded statuses for all tasks and store them in state
      const statuses = validTodoList.map((task) => isDeadlineExceeded(task));
      setExceededStatuses(statuses);
   }, [validTodoList]); // Recalculate whenever the displayed list changes

   // Set up socket.io event listeners for real-time updates
   useEffect(() => {
      if (!socket) return;

      // Listen for task created event
      socket.on('taskCreated', (data) => {
         console.log('Task created:', data);
         if (data && data.task) {
            settask((prevTasks) => [...prevTasks, data.task]);
            showNotification('New task created', 'success');
         }
      });

      // Listen for task updated event
      socket.on('taskUpdated', (data) => {
         console.log('Task updated:', data);
         if (data && data.task) {
            settask((prevTasks) => prevTasks.map((task) => (task._id === data.task._id ? data.task : task)));
            showNotification('Task updated', 'info');
         }
      });

      // Listen for task deleted event
      socket.on('taskDeleted', (data) => {
         console.log('Task deleted:', data);
         if (data && data.taskId) {
            settask((prevTasks) => prevTasks.filter((task) => task._id !== data.taskId));
            showNotification('Task deleted', 'warning');
         }
      });

      // Listen for task status changed event
      socket.on('taskStatusChanged', (data) => {
         console.log('Task status changed:', data);
         if (data && data.task) {
            settask((prevTasks) => prevTasks.map((task) => (task._id === data.task._id ? data.task : task)));
            showNotification(
               data.task.completed ? 'Task marked as completed' : 'Task marked as incomplete',
               data.task.completed ? 'success' : 'info'
            );
         }
      });

      // Cleanup listeners on component unmount
      return () => {
         socket.off('taskCreated');
         socket.off('taskUpdated');
         socket.off('taskDeleted');
         socket.off('taskStatusChanged');
      };
   }, [socket, settask]);

   // Show notification helper function
   const showNotification = (message, type = 'success') => {
      // Import and use the notification context
      import('../app/context/NotificationContext').then(({ useNotification }) => {
         const { createSuccessNotification, createErrorNotification, createInfoNotification } = useNotification();

         switch (type) {
            case 'error':
               createErrorNotification(message);
               break;
            case 'info':
               createInfoNotification(message);
               break;
            default:
               createSuccessNotification(message);
         }
      });
   };

   // Delete task handler
   const handleDeleteTask = async (taskId) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
         });

         if (!response.ok) {
            throw new Error('Failed to delete task');
         }

         // Update local state by filtering out the deleted task
         settask((prevTasks) => prevTasks.filter((task) => task._id !== taskId));

         // Show success notification (persistent)
         showNotification('Task deleted successfully', 'success');
      } catch (error) {
         console.error('Error deleting task:', error);
         showNotification('Failed to delete task. Please try again.', 'error');
      }
   };

   // Update task handler
   const handleUpdateTask = async (taskId, updatedTaskData) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTaskData),
         });

         if (!response.ok) {
            throw new Error('Failed to update task');
         }

         // Show success notification (persistent)
         showNotification('Task updated successfully', 'success');

         // Update the task in the local state
         settask((prevTasks) =>
            prevTasks.map((task) => (task._id === taskId ? { ...task, ...updatedTaskData } : task))
         );
      } catch (error) {
         setApiError(error.message);
         showNotification('Failed to update task: ' + error.message, 'error');
      }
   };

   // Handle task status change
   const handleTaskStatusChange = async (taskId, completed) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed }),
         });

         if (!response.ok) {
            throw new Error('Failed to update task status');
         }

         // Update the local state
         settask((prevTasks) => prevTasks.map((task) => (task._id === taskId ? { ...task, completed } : task)));

         // Show success notification (persistent)
         showNotification(`Task ${completed ? 'completed' : 'marked as incomplete'}`, completed ? 'success' : 'info');

         return true;
      } catch (error) {
         console.error('Error updating task status:', error);
         showNotification('Failed to update task status: ' + error.message, 'error');
         return false;
      }
   };

   // Handle edit task
   const handleEditTask = (task) => {
      setTaskToEdit(task);
      setEditModalOpen(true);
   };

   // Handle save edited task
   const handleSaveTask = async (updatedTask) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${updatedTask._id}`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedTask),
         });

         if (!response.ok) {
            throw new Error('Failed to update task');
         }

         // Close modal and refresh tasks
         setEditModalOpen(false);

         // Update the task in the local state
         // Note: In a real app, you might want to trigger a refresh of the tasks from the parent component
         window.location.reload();
      } catch (error) {
         setApiError(error.message);
      }
   };

   // Handle delete task
   const handleDeleteClick = (taskId) => {
      setTaskIdToDelete(taskId);
      setDeleteModalOpen(true);
   };

   // Handle confirm delete
   const handleConfirmDelete = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskIdToDelete}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete task');
         }

         // Close modal and refresh tasks
         setDeleteModalOpen(false);

         // Show success notification
         showNotification('Task deleted successfully');

         // Update the task list in the local state
         settask((prevTasks) => prevTasks.filter((task) => task._id !== taskIdToDelete));
      } catch (error) {
         setApiError(error.message);
         showNotification('Failed to delete task: ' + error.message, 'error');
         setDeleteModalOpen(false);
      }
   };

   const handleSetReminder = async (reminderData) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reminders`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(reminderData),
         });

         if (!response.ok) {
            throw new Error('Failed to set reminder');
         }

         toast.success('Reminder set successfully');
      } catch (error) {
         console.error('Error setting reminder:', error);
         toast.error('Failed to set reminder');
      }
   };

   return (
      <div className="max-h-[45vh] overflow-y-auto [&::-webkit-scrollbar]:w-[10px] [&::-webkit-scrollbar]:ml-[2px] [&::-webkit-scrollbar-thumb]:bg-[rgba(5,103,189,0.782)] [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(3,90,166,0.782)] [&::-webkit-scrollbar-track]:bg-[rgb(133,198,255)] [&::-webkit-scrollbar-track]:rounded-[10px]">
         {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{apiError}</div>
         )}

         {validTodoList.length > 0 ? (
            validTodoList.map((list, i) => (
               <div key={list._id || i} className="relative">
                  <DisplayTodoList
                     list={list}
                     isexceeded={exceededStatuses[i]} // Pass the exceeded status for each task
                     onDelete={handleDeleteTask}
                     onUpdate={handleUpdateTask}
                     onStatusChange={handleTaskStatusChange}
                  />
                  {isMenuOpen === list._id && (
                     <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-lg shadow-lg z-10">
                        <div className="py-1">
                           {/* Set Reminder Option */}
                           <button
                              onClick={() => {
                                 setSelectedTask(list);
                                 setIsReminderModalOpen(true);
                                 setIsMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors flex items-center"
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

                           {/* Edit Option */}
                           <button
                              onClick={() => {
                                 setSelectedTask(list);
                                 setEditModalOpen(true);
                                 setIsMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors flex items-center"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                 />
                              </svg>
                              Edit
                           </button>

                           {/* Delete Option */}
                           <button
                              onClick={() => {
                                 setSelectedTask(list);
                                 setDeleteModalOpen(true);
                                 setIsMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/20 transition-colors flex items-center"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                 />
                              </svg>
                              Delete
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            ))
         ) : (
            <NoTasksMessage />
         )}

         {/* Edit Task Modal */}
         {editModalOpen && (
            <EditTaskModal task={taskToEdit} onClose={() => setEditModalOpen(false)} onSave={handleSaveTask} />
         )}

         {/* Delete Confirmation Modal */}
         {deleteModalOpen && (
            <ConfirmationModal
               message="Are you sure you want to delete this task? This action cannot be undone."
               onConfirm={handleConfirmDelete}
               onCancel={() => setDeleteModalOpen(false)}
            />
         )}

         {/* Reminder Modal */}
         <ReminderModal
            isOpen={isReminderModalOpen}
            onClose={() => {
               setIsReminderModalOpen(false);
               setSelectedTask(null);
            }}
            task={selectedTask}
            onSetReminder={handleSetReminder}
         />
      </div>
   );
}

export default TodoListParser;

const NoTasksMessage = () => {
   return (
      <div className="flex flex-col items-center justify-center h-full w-full mt-3">
         <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 shadow-lg">
            <h2 className="text-2xl font-semibold text-center text-white">No Tasks Available</h2>
            <p className="text-center text-gray-200 mt-2">
               It seems you haven't added any tasks yet. Get started by adding a new task!
            </p>
         </div>
      </div>
   );
};
