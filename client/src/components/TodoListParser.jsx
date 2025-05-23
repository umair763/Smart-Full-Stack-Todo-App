'use client';

import { useState, useEffect } from 'react';
import DisplayTodoList from './DisplayTodoList';
import EditTaskModal from './EditTaskModal';
import ConfirmationModal from './ConfirmationModal';
import ReminderModal from './ReminderModal';
import { toast } from 'react-hot-toast';
import { FiArrowDown, FiArrowUp, FiCalendar, FiLink, FiAlignLeft } from 'react-icons/fi';
import { useNotification } from '../app/context/NotificationContext';
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

   hours = Number.parseInt(hours);
   if (ampm === 'PM' && hours < 12) hours += 12;
   if (ampm === 'AM' && hours === 12) hours = 0;

   return new Date(year, month - 1, day, hours, minutes);
}

function TodoListParser({ todolist, settask }) {
   const validTodoList = Array.isArray(todolist) ? todolist : [];
   const { socket } = useSocket();
   const { createSuccessNotification, createErrorNotification, createInfoNotification } = useNotification();

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

   // State for dependencies
   const [dependencies, setDependencies] = useState([]);
   const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
   const [sortOrder, setSortOrder] = useState('dependencies'); // 'dependencies', 'alphabetical', 'deadline'
   const [sortedTasks, setSortedTasks] = useState([]);
   const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'

   useEffect(() => {
      // Calculate exceeded statuses for all tasks and store them in state
      const statuses = validTodoList.map((task) => isDeadlineExceeded(task));
      setExceededStatuses(statuses);
   }, [validTodoList]); // Recalculate whenever the displayed list changes

   // Fetch dependencies when component mounts
   useEffect(() => {
      fetchDependencies();
   }, []);

   // Sort tasks based on sort order
   useEffect(() => {
      if (!validTodoList.length) {
         setSortedTasks([]);
         return;
      }

      let sorted = [...validTodoList];

      switch (sortOrder) {
         case 'alphabetical':
            // Sort alphabetically by task name
            sorted.sort((a, b) => {
               const result = a.task.localeCompare(b.task);
               return sortDirection === 'asc' ? result : -result;
            });
            break;
         case 'deadline':
            // Sort by deadline (closest first)
            sorted.sort((a, b) => {
               const dateA = convertToComparableDateTime(a.date, a.time);
               const dateB = convertToComparableDateTime(b.date, b.time);
               const result = dateA - dateB;
               return sortDirection === 'asc' ? result : -result;
            });
            break;
         case 'dependencies':
         default:
            // Group by dependencies
            if (dependencies.length > 0) {
               sorted = sortByDependencies(sorted, dependencies);
               // If descending, reverse the array
               if (sortDirection === 'desc') {
                  sorted.reverse();
               }
            }
            break;
      }

      setSortedTasks(sorted);
   }, [validTodoList, dependencies, sortOrder, sortDirection]);

   // Sort tasks by dependencies
   const sortByDependencies = (tasks, dependencies) => {
      // Create a map of task IDs to their dependencies
      const dependencyMap = new Map();
      const taskMap = new Map();

      // Initialize maps
      tasks.forEach((task) => {
         taskMap.set(task._id, task);
         dependencyMap.set(task._id, {
            prerequisites: [],
            dependents: [],
         });
      });

      // Populate dependency relationships
      dependencies.forEach((dep) => {
         const dependentId = dep.dependentTaskId._id || dep.dependentTaskId;
         const prerequisiteId = dep.prerequisiteTaskId._id || dep.prerequisiteTaskId;

         if (dependencyMap.has(dependentId)) {
            dependencyMap.get(dependentId).prerequisites.push(prerequisiteId);
         }

         if (dependencyMap.has(prerequisiteId)) {
            dependencyMap.get(prerequisiteId).dependents.push(dependentId);
         }
      });

      // Find root tasks (those with no prerequisites)
      const rootTasks = Array.from(dependencyMap.entries())
         .filter(([_, deps]) => deps.prerequisites.length === 0)
         .map(([id, _]) => id);

      // Sort function to traverse the dependency tree
      const visited = new Set();
      const result = [];

      const visit = (taskId) => {
         if (visited.has(taskId)) return;
         visited.add(taskId);

         // Add prerequisites first
         const deps = dependencyMap.get(taskId);
         if (deps) {
            deps.prerequisites.forEach((prereqId) => {
               if (taskMap.has(prereqId)) {
                  visit(prereqId);
               }
            });
         }

         // Add the task itself
         if (taskMap.has(taskId)) {
            result.push(taskMap.get(taskId));
         }

         // Add dependents
         if (deps) {
            deps.dependents.forEach((depId) => {
               if (taskMap.has(depId)) {
                  visit(depId);
               }
            });
         }
      };

      // Visit all root tasks
      rootTasks.forEach((taskId) => visit(taskId));

      // Add any remaining tasks that weren't visited
      tasks.forEach((task) => {
         if (!visited.has(task._id)) {
            result.push(task);
         }
      });

      return result;
   };

   // Fetch dependencies from the server
   const fetchDependencies = async () => {
      setIsLoadingDependencies(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/dependencies`, {
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
         res.status(500).json({ message: 'Error creating dependency', error: error.message });
      } finally {
         setIsLoadingDependencies(false);
      }
   };

   // Set up socket.io event listeners for real-time updates
   useEffect(() => {
      if (!socket) return;

      // Listen for task created event
      socket.on('taskCreated', (data) => {
         console.log('Task created:', data);
         if (data && data.task) {
            settask((prevTasks) => [...prevTasks, data.task]);
            createSuccessNotification('New task created');
         }
      });

      // Listen for task updated event
      socket.on('taskUpdated', (data) => {
         console.log('Task updated:', data);
         if (data && data.task) {
            settask((prevTasks) => prevTasks.map((task) => (task._id === data.task._id ? data.task : task)));
            createInfoNotification('Task updated');
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
            createSuccessNotification(data.task.completed ? 'Task marked as completed' : 'Task marked as incomplete');
         }
      });

      // Listen for dependency created event
      socket.on('dependencyCreated', (data) => {
         console.log('Dependency created:', data);
         fetchDependencies(); // Refresh dependencies
      });

      // Listen for dependency deleted event
      socket.on('dependencyDeleted', (data) => {
         console.log('Dependency deleted:', data);
         fetchDependencies(); // Refresh dependencies
      });

      // Cleanup listeners on component unmount
      return () => {
         socket.off('taskCreated');
         socket.off('taskUpdated');
         socket.off('taskDeleted');
         socket.off('taskStatusChanged');
         socket.off('dependencyCreated');
         socket.off('dependencyDeleted');
      };
   }, [socket, settask]);

   // Show notification helper function
   const showNotification = (message, type = 'success') => {
      switch (type) {
         case 'error':
            createErrorNotification(message);
            break;
         case 'info':
            createInfoNotification(message);
            break;
         case 'warning':
            createWarningNotification(message);
            break;
         default:
            createSuccessNotification(message);
      }
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
         const response = await fetch(`${API_BASE_URL}/api/reminders`, {
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

   // Handle dependency change
   const handleDependencyChange = () => {
      fetchDependencies();
   };

   // Toggle sort direction
   const toggleSortDirection = () => {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
   };

   return (
      <div className="space-y-4">
         {/* Sorting controls */}
         <div className="flex items-center justify-between bg-white/10 backdrop-blur-md p-3 rounded-lg mb-4">
            <div className="text-white font-medium">Sort Tasks By:</div>
            <div className="flex space-x-2">
               <button
                  onClick={() => setSortOrder('dependencies')}
                  className={`flex items-center px-3 py-1.5 rounded-md ${
                     sortOrder === 'dependencies' ? 'bg-[#9406E6] text-white' : 'bg-white/20 text-white'
                  }`}
                  title="Sort by dependencies"
               >
                  <FiLink className="mr-1" />
                  <span className="hidden sm:inline">Dependencies</span>
               </button>
               <button
                  onClick={() => setSortOrder('alphabetical')}
                  className={`flex items-center px-3 py-1.5 rounded-md ${
                     sortOrder === 'alphabetical' ? 'bg-[#9406E6] text-white' : 'bg-white/20 text-white'
                  }`}
                  title="Sort alphabetically"
               >
                  <FiAlignLeft className="mr-1" />
                  <span className="hidden sm:inline">A-Z</span>
               </button>
               <button
                  onClick={() => setSortOrder('deadline')}
                  className={`flex items-center px-3 py-1.5 rounded-md ${
                     sortOrder === 'deadline' ? 'bg-[#9406E6] text-white' : 'bg-white/20 text-white'
                  }`}
                  title="Sort by deadline"
               >
                  <FiCalendar className="mr-1" />
                  <span className="hidden sm:inline">Deadline</span>
               </button>
               <button
                  onClick={toggleSortDirection}
                  className="flex items-center px-3 py-1.5 rounded-md bg-white/20 text-white"
                  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
               >
                  {sortDirection === 'asc' ? <FiArrowDown /> : <FiArrowUp />}
               </button>
            </div>
         </div>

         <div className="max-h-[45vh] overflow-y-auto [&::-webkit-scrollbar]:w-[10px] [&::-webkit-scrollbar]:ml-[2px] [&::-webkit-scrollbar-thumb]:bg-[rgba(5,103,189,0.782)] [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(3,90,166,0.782)] [&::-webkit-scrollbar-track]:bg-[rgb(133,198,255)] [&::-webkit-scrollbar-track]:rounded-[10px]">
            {apiError && (
               <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{apiError}</div>
            )}

            {isLoadingDependencies && (
               <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#9406E6]"></div>
                  <span className="ml-2 text-white">Loading tasks...</span>
               </div>
            )}

            {sortedTasks.length > 0 ? (
               sortedTasks.map((list, i) => (
                  <div key={list._id || i} className="relative">
                     <DisplayTodoList
                        list={list}
                        isexceeded={exceededStatuses[validTodoList.findIndex((t) => t._id === list._id)]} // Find the correct exceeded status
                        onDelete={handleDeleteTask}
                        onUpdate={handleUpdateTask}
                        onStatusChange={handleTaskStatusChange}
                        dependencies={dependencies}
                        onDependencyChange={handleDependencyChange}
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
