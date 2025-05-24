'use client';

import { useState, useEffect } from 'react';
import DisplayTodoList from './DisplayTodoList';
import { useSocket } from '../app/context/SocketContext';
import { useNotification } from '../app/context/NotificationContext';
import ModernSortTabs from './ModernSortTabs';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TodoListParser({ searchTerm = '' }) {
   const [todoList, setTodoList] = useState([]);
   const [filteredList, setFilteredList] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(null);
   const { socket } = useSocket();
   const { showNotification } = useNotification();
   const [dependencies, setDependencies] = useState([]);
   const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);

   const [sortConfig, setSortConfig] = useState({
      type: 'deadline',
      direction: 'asc',
   });

   // Fetch tasks when component mounts
   useEffect(() => {
      fetchTasks();
      fetchDependencies();
   }, []);

   // Listen for socket events
   useEffect(() => {
      if (!socket) return;

      const handleTaskCreated = (data) => {
         setTodoList((prevList) => [...prevList, data]);
      };

      const handleTaskUpdated = (data) => {
         setTodoList((prevList) => prevList.map((task) => (task._id === data._id ? data : task)));
      };

      const handleTaskDeleted = (data) => {
         setTodoList((prevList) => prevList.filter((task) => task._id !== data.taskId));
      };

      const handleTaskStatusChanged = (data) => {
         setTodoList((prevList) =>
            prevList.map((task) => (task._id === data.taskId ? { ...task, completed: data.completed } : task))
         );
      };

      socket.on('taskCreated', handleTaskCreated);
      socket.on('taskUpdated', handleTaskUpdated);
      socket.on('taskDeleted', handleTaskDeleted);
      socket.on('taskStatusChanged', handleTaskStatusChanged);

      return () => {
         socket.off('taskCreated', handleTaskCreated);
         socket.off('taskUpdated', handleTaskUpdated);
         socket.off('taskDeleted', handleTaskDeleted);
         socket.off('taskStatusChanged', handleTaskStatusChanged);
      };
   }, [socket]);

   // Apply search and sorting whenever relevant state changes
   useEffect(() => {
      if (todoList.length >= 0) {
         // First apply search filter
         let searchFiltered = [...todoList];
         if (searchTerm.trim()) {
            searchFiltered = todoList.filter((task) =>
               task.task.toLowerCase().includes(searchTerm.toLowerCase().trim())
            );
         }

         // Then apply sorting to the search results
         const result = sortTasks(searchFiltered, sortConfig.type, sortConfig.direction);
         setFilteredList(result);
      }
   }, [todoList, sortConfig, searchTerm]);

   // Fetch tasks from the server
   const fetchTasks = async () => {
      setIsLoading(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch tasks');
         }

         const data = await response.json();
         setTodoList(data);
         setError(null);
      } catch (error) {
         console.error('Error fetching tasks:', error);
         setError('Failed to load tasks. Please try again.');
      } finally {
         setIsLoading(false);
      }
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
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch dependencies');
         }

         const data = await response.json();
         setDependencies(data);
      } catch (error) {
         console.error('Error fetching dependencies:', error);
      } finally {
         setIsLoadingDependencies(false);
      }
   };

   // Handle task deletion
   const handleDeleteTask = async (taskId) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete task');
         }

         // Remove the task from the local state
         setTodoList((prevList) => prevList.filter((task) => task._id !== taskId));
         showNotification('Task deleted successfully', 'success');
      } catch (error) {
         console.error('Error deleting task:', error);
         showNotification('Failed to delete task', 'error');
      }
   };

   // Handle task update
   const handleUpdateTask = async (taskId, updatedTask) => {
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
            body: JSON.stringify(updatedTask),
         });

         if (!response.ok) {
            throw new Error('Failed to update task');
         }

         const data = await response.json();

         // Update the task in the local state
         setTodoList((prevList) => prevList.map((task) => (task._id === taskId ? data : task)));
         showNotification('Task updated successfully', 'success');
      } catch (error) {
         console.error('Error updating task:', error);
         showNotification('Failed to update task', 'error');
      }
   };

   // Handle task status change
   const handleTaskStatusChange = async (taskId, currentStatus, errorMessage) => {
      if (errorMessage) {
         showNotification(errorMessage, 'error');
      } else {
         showNotification(`Task marked as ${currentStatus ? 'incomplete' : 'complete'}`, 'success');
      }
   };

   // Sort tasks based on the selected sort type and direction
   const sortTasks = (tasks, sortType, direction) => {
      const sortedTasks = [...tasks];
      const now = new Date();

      // Helper function to create a proper Date object from task data
      const createTaskDateTime = (task) => {
         try {
            if (!task.date) {
               return new Date(8640000000000000); // Far future for tasks without dates
            }

            // Handle DD/MM/YYYY format
            let dateStr = task.date;
            if (dateStr.includes('/')) {
               const parts = dateStr.split('/');
               if (parts.length === 3) {
                  // Convert DD/MM/YYYY to YYYY-MM-DD
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0');
                  const year = parts[2];
                  dateStr = `${year}-${month}-${day}`;
               }
            }

            // Handle time in HH:MM AM/PM format
            let timeStr = task.time || '11:59 PM'; // Default to end of day

            // Convert 12-hour format to 24-hour format for proper parsing
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
               const timeParts = timeStr.split(' ');
               const time = timeParts[0];
               const period = timeParts[1];

               const [hours, minutes] = time.split(':');
               let hour24 = parseInt(hours, 10);

               if (period === 'AM' && hour24 === 12) {
                  hour24 = 0;
               } else if (period === 'PM' && hour24 !== 12) {
                  hour24 += 12;
               }

               timeStr = `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
            }

            // Create the full ISO datetime string
            const fullDateTimeStr = `${dateStr}T${timeStr}`;
            const taskDate = new Date(fullDateTimeStr);

            // Validate the created date
            if (isNaN(taskDate.getTime())) {
               console.warn(`Invalid date created for task: ${task.task}`, { date: task.date, time: task.time });
               return new Date(8640000000000000); // Far future for invalid dates
            }

            return taskDate;
         } catch (error) {
            console.error(`Error parsing date for task: ${task.task}`, error);
            return new Date(8640000000000000); // Far future for error cases
         }
      };

      switch (sortType) {
         case 'alphabetical':
            sortedTasks.sort((a, b) => {
               const comparison = a.task.localeCompare(b.task);
               return direction === 'asc' ? comparison : -comparison;
            });
            break;

         case 'deadline':
            sortedTasks.sort((a, b) => {
               // Create proper Date objects for both tasks
               const dateA = createTaskDateTime(a);
               const dateB = createTaskDateTime(b);

               // Calculate time differences from now (in milliseconds)
               const diffA = dateA.getTime() - now.getTime();
               const diffB = dateB.getTime() - now.getTime();

               // Always sort completed tasks to the end, regardless of direction
               if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
               }

               // Handle sorting direction
               if (direction === 'asc') {
                  // Ascending: Tasks with earliest deadlines first (most urgent)
                  // Negative differences (overdue) come first, then positive (future)
                  return diffA - diffB;
               } else {
                  // Descending: Tasks with latest deadlines first (least urgent)
                  // Positive differences (future) come first, then negative (overdue)
                  return diffB - diffA;
               }
            });
            break;

         case 'priority':
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            sortedTasks.sort((a, b) => {
               const priorityA = priorityOrder[a.priority?.toLowerCase()] || 999;
               const priorityB = priorityOrder[b.priority?.toLowerCase()] || 999;
               const comparison = priorityA - priorityB;
               return direction === 'asc' ? comparison : -comparison;
            });
            break;

         case 'dependencies':
            // Create a map of task IDs to their dependencies
            const dependencyMap = new Map();
            const taskDependencies = new Map();

            // First pass: collect all dependencies
            dependencies.forEach((dep) => {
               const dependentId = dep.dependentTaskId?._id || dep.dependentTaskId;
               const prerequisiteId = dep.prerequisiteTaskId?._id || dep.prerequisiteTaskId;

               if (!dependencyMap.has(dependentId)) {
                  dependencyMap.set(dependentId, new Set());
               }
               dependencyMap.get(dependentId).add(prerequisiteId);

               // Track which tasks have dependencies
               if (!taskDependencies.has(dependentId)) {
                  taskDependencies.set(dependentId, { hasDependencies: true, isDependent: true });
               }
               if (!taskDependencies.has(prerequisiteId)) {
                  taskDependencies.set(prerequisiteId, { hasDependencies: true, isDependent: false });
               }
            });

            // Sort tasks based on dependency relationships
            sortedTasks.sort((a, b) => {
               const aHasDeps = taskDependencies.get(a._id)?.hasDependencies || false;
               const bHasDeps = taskDependencies.get(b._id)?.hasDependencies || false;
               const aIsDependent = taskDependencies.get(a._id)?.isDependent || false;
               const bIsDependent = taskDependencies.get(b._id)?.isDependent || false;

               // If one task has dependencies and the other doesn't, prioritize the one with dependencies
               if (aHasDeps !== bHasDeps) {
                  return direction === 'asc' ? (aHasDeps ? -1 : 1) : aHasDeps ? 1 : -1;
               }

               // If both have dependencies, prioritize dependent tasks
               if (aHasDeps && bHasDeps) {
                  if (aIsDependent !== bIsDependent) {
                     return direction === 'asc' ? (aIsDependent ? -1 : 1) : aIsDependent ? 1 : -1;
                  }
               }

               // For tasks with the same dependency status, sort by deadline using our robust date parsing
               const dateA = createTaskDateTime(a);
               const dateB = createTaskDateTime(b);
               return direction === 'asc' ? dateA - dateB : dateB - dateA;
            });
            break;

         default:
            // Default to deadline sorting with robust parsing
            sortedTasks.sort((a, b) => {
               const dateA = createTaskDateTime(a);
               const dateB = createTaskDateTime(b);

               // Always sort completed tasks to the end
               if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
               }

               const comparison = dateA - dateB;
               return direction === 'asc' ? comparison : -comparison;
            });
      }

      return sortedTasks;
   };

   // Handle sort changes
   const handleSortChange = (sortType, direction) => {
      console.log(`Sorting by ${sortType} in ${direction} order`);
      setSortConfig({ type: sortType, direction });
   };

   // Check if a task's deadline has passed
   const isDeadlineExceeded = (task) => {
      if (task.completed) return false;

      try {
         if (!task.date) return false;

         // Handle DD/MM/YYYY format
         let dateStr = task.date;
         if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
               // Convert DD/MM/YYYY to YYYY-MM-DD
               const day = parts[0].padStart(2, '0');
               const month = parts[1].padStart(2, '0');
               const year = parts[2];
               dateStr = `${year}-${month}-${day}`;
            }
         }

         // Handle time in HH:MM AM/PM format
         let timeStr = task.time || '11:59 PM'; // Default to end of day

         // Convert 12-hour format to 24-hour format for proper parsing
         if (timeStr.includes('AM') || timeStr.includes('PM')) {
            const timeParts = timeStr.split(' ');
            const time = timeParts[0];
            const period = timeParts[1];

            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours, 10);

            if (period === 'AM' && hour24 === 12) {
               hour24 = 0;
            } else if (period === 'PM' && hour24 !== 12) {
               hour24 += 12;
            }

            timeStr = `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
         }

         // Create the full ISO datetime string
         const fullDateTimeStr = `${dateStr}T${timeStr}`;
         const taskDate = new Date(fullDateTimeStr);

         // Validate the created date
         if (isNaN(taskDate.getTime())) {
            console.warn(`Invalid date in isDeadlineExceeded for task: ${task.task}`, {
               date: task.date,
               time: task.time,
            });
            return false; // Don't mark as exceeded if we can't parse the date
         }

         const now = new Date();
         return taskDate < now;
      } catch (error) {
         console.error(`Error checking deadline for task: ${task.task}`, error);
         return false; // Don't mark as exceeded if there's an error
      }
   };

   // Render loading state
   if (isLoading) {
      return (
         <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6]"></div>
         </div>
      );
   }

   // Render error state
   if (error) {
      return (
         <div className="text-center text-red-500 p-4 bg-red-100 rounded-lg">
            <p>{error}</p>
            <button
               onClick={fetchTasks}
               className="mt-2 px-4 py-2 bg-[#9406E6] text-white rounded-md hover:bg-[#7D05C3] transition-colors"
            >
               Try Again
            </button>
         </div>
      );
   }

   return (
      <div className="w-full">
         {/* Sort UI */}
         <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-lg mb-4">
            <ModernSortTabs onSortChange={handleSortChange} />
         </div>

         {/* Task list */}
         <div className="space-y-2">
            {filteredList.length === 0 ? (
               <div className="text-center p-8 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">
                     {searchTerm ? `No tasks found for "${searchTerm}"` : 'No tasks found.'}
                  </p>
               </div>
            ) : (
               filteredList.map((task) => (
                  <DisplayTodoList
                     key={task._id}
                     list={task}
                     isexceeded={isDeadlineExceeded(task)}
                     onDelete={handleDeleteTask}
                     onUpdate={handleUpdateTask}
                     onStatusChange={handleTaskStatusChange}
                     dependencies={dependencies}
                     onDependencyChange={fetchDependencies}
                  />
               ))
            )}
         </div>
      </div>
   );
}

export default TodoListParser;
