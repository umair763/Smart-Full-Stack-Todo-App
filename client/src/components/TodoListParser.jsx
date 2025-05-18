'use client';

import { useState, useEffect } from 'react';
import DisplayTodoList from './DisplayTodoList';
import EditTaskModal from './EditTaskModal';
import ConfirmationModal from './ConfirmationModal';
import Notification from './Notification';
import { useSocket } from '../app/context/SocketContext';

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

   // State for notifications
   const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

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
               data.task.status ? 'Task marked as completed' : 'Task marked as incomplete',
               data.task.status ? 'success' : 'info'
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
      setNotification({ show: true, message, type });

      // Auto-hide notification after 3 seconds
      setTimeout(() => {
         setNotification({ show: false, message: '', type: 'success' });
      }, 3000);
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

         // Show success notification
         showNotification('Task deleted successfully');
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

         // Show success notification
         showNotification('Task updated successfully');

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
            body: JSON.stringify({ status: completed }),
         });

         if (!response.ok) {
            throw new Error('Failed to update task status');
         }

         // Update the local state
         settask((prevTasks) => prevTasks.map((task) => (task._id === taskId ? { ...task, status: completed } : task)));

         // Show success notification
         showNotification(`Task ${completed ? 'completed' : 'marked as incomplete'}`);

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

   return (
      <div className="max-h-[45vh] overflow-y-auto [&::-webkit-scrollbar]:w-[10px] [&::-webkit-scrollbar]:ml-[2px] [&::-webkit-scrollbar-thumb]:bg-[rgba(5,103,189,0.782)] [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(3,90,166,0.782)] [&::-webkit-scrollbar-track]:bg-[rgb(133,198,255)] [&::-webkit-scrollbar-track]:rounded-[10px]">
         {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{apiError}</div>
         )}

         {/* Notification component */}
         {notification.show && (
            <Notification
               message={notification.message}
               type={notification.type}
               onClose={() => setNotification({ ...notification, show: false })}
            />
         )}

         {validTodoList.length > 0 ? (
            validTodoList.map((list, i) => (
               <DisplayTodoList
                  key={list._id || i}
                  list={list}
                  isexceeded={exceededStatuses[i]} // Pass the exceeded status for each task
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                  onStatusChange={handleTaskStatusChange}
               />
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
