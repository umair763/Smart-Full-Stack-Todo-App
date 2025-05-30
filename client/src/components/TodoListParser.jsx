'use client';

import { useState, useEffect, useMemo } from 'react';
import DisplayTodoList from './DisplayTodoList';
import { useSocket } from '../app/context/SocketContext';
import { useNotification } from '../app/context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import ModernSortTabs from './ModernSortTabs';
import DeleteTaskModal from './DeleteTaskModal';
import { HiSortAscending, HiClipboardList, HiChevronUp, HiChevronDown, HiCalendar } from 'react-icons/hi';
import { API_BASE_URL } from '../config/env';

function TodoListParser({ searchTerm = '' }) {
   const [todoList, setTodoList] = useState([]);
   const [filteredList, setFilteredList] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(null);
   const { socket } = useSocket();
   const { createSuccessNotification, createErrorNotification } = useNotification();
   const { isDark } = useTheme();
   const [dependencies, setDependencies] = useState([]);
   const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);

   // Simple delete modal state
   const [deleteModal, setDeleteModal] = useState({
      isOpen: false,
      taskId: null,
      taskName: '',
      isDeleting: false,
   });

   const [sortConfig, setSortConfig] = useState({
      type: 'deadline',
      direction: 'asc',
   });

   // Virtual scrolling state for performance optimization
   const [scrollTop, setScrollTop] = useState(0);
   const [containerHeight, setContainerHeight] = useState(0);
   const [isScrolling, setIsScrolling] = useState(false);
   const [scrollTimeout, setScrollTimeout] = useState(null);
   const itemHeight = 85; // Reduced from 100 to 85 for more compact display
   const buffer = 5; // Number of items to render outside visible area

   // Calculate visible items for virtual scrolling
   const getVisibleItems = () => {
      if (filteredList.length <= 20) {
         // For small lists, render all items
         return { startIndex: 0, endIndex: filteredList.length - 1, visibleItems: filteredList };
      }

      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      const endIndex = Math.min(
         filteredList.length - 1,
         Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
      );

      return {
         startIndex,
         endIndex,
         visibleItems: filteredList.slice(startIndex, endIndex + 1),
      };
   };

   const { startIndex, endIndex, visibleItems } = getVisibleItems();

   // Get current visible task count for scrolling indicator
   const getVisibleTaskCount = () => {
      if (filteredList.length === 0 || !containerHeight) return { visible: 0, total: 0 };

      const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
      const visibleEndIndex = Math.min(filteredList.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight));

      const visibleCount = Math.max(0, visibleEndIndex - visibleStartIndex + 1);

      return {
         visible: Math.min(visibleCount, filteredList.length),
         total: filteredList.length,
         startIndex: visibleStartIndex + 1, // 1-based for display
         endIndex: Math.min(visibleEndIndex + 1, filteredList.length), // 1-based for display
      };
   };

   // Get current date range being viewed
   const getCurrentDateRange = () => {
      if (filteredList.length === 0 || !containerHeight) return '';

      const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
      const visibleEndIndex = Math.min(filteredList.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight));

      // Ensure we have valid indices
      if (visibleStartIndex >= filteredList.length || visibleEndIndex < 0) return '';

      const startTask = filteredList[visibleStartIndex];
      const endTask = filteredList[Math.min(visibleEndIndex, filteredList.length - 1)];

      if (!startTask?.date || !endTask?.date) return '';

      const startDate = startTask.date;
      const endDate = endTask.date;

      // Format dates for better display
      const formatDisplayDate = (dateStr) => {
         try {
            const [day, month, year] = dateStr.split('/');
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', {
               month: 'short',
               day: 'numeric',
               year: year !== new Date().getFullYear().toString() ? 'numeric' : undefined,
            });
         } catch {
            return dateStr;
         }
      };

      if (startDate === endDate) {
         return formatDisplayDate(startDate);
      } else {
         const formattedStart = formatDisplayDate(startDate);
         const formattedEnd = formatDisplayDate(endDate);
         return `${formattedStart} - ${formattedEnd}`;
      }
   };

   // Handle scroll for virtual scrolling
   const handleScroll = (e) => {
      setScrollTop(e.target.scrollTop);
      if (!containerHeight) {
         setContainerHeight(e.target.clientHeight);
      }

      // Show scrolling indicator
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeout) {
         clearTimeout(scrollTimeout);
      }

      // Hide scrolling indicator after 1.5 seconds of no scrolling
      const timeout = setTimeout(() => {
         setIsScrolling(false);
      }, 1500);

      setScrollTimeout(timeout);
   };

   // Scroll to top function
   const scrollToTop = () => {
      const container = document.getElementById('task-list-container');
      if (container) {
         container.scrollTo({ top: 0, behavior: 'smooth' });
      }
   };

   // Scroll to bottom function
   const scrollToBottom = () => {
      const container = document.getElementById('task-list-container');
      if (container) {
         const maxScroll = container.scrollHeight - container.clientHeight;
         container.scrollTo({ top: maxScroll, behavior: 'smooth' });
      }
   };

   // Add custom scrollbar styles
   useEffect(() => {
      const style = document.createElement('style');
      style.textContent = `
         .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
         }
         .custom-scrollbar::-webkit-scrollbar-track {
            background: ${isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.3)'};
            border-radius: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #9406E6, #7D05C3);
            border-radius: 4px;
            transition: background 0.2s ease;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #7D05C3, #6B04A8);
         }
         .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #9406E6 ${isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.3)'};
         }
         .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
         }
         @keyframes fadeIn {
            from {
               opacity: 0;
               transform: translateY(-10px) translateX(10px);
            }
            to {
               opacity: 1;
               transform: translateY(0) translateX(0);
            }
         }
      `;
      document.head.appendChild(style);

      return () => {
         document.head.removeChild(style);
      };
   }, [isDark]);

   // Cleanup scroll timeout on unmount
   useEffect(() => {
      return () => {
         if (scrollTimeout) {
            clearTimeout(scrollTimeout);
         }
      };
   }, [scrollTimeout]);

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
      // Find the task to get its name for the modal
      const taskToDelete = todoList.find((task) => task._id === taskId);

      // Show confirmation modal first
      setDeleteModal({
         isOpen: true,
         taskId: taskId,
         taskName: taskToDelete?.task || 'Unknown Task',
         isDeleting: false,
      });
   };

   // Handle simple delete confirmation
   const handleDeleteConfirm = async () => {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         // First attempt to delete without confirmation
         const response = await fetch(`${API_BASE_URL}/api/tasks/${deleteModal.taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (response.status === 409) {
            // Task has dependents, force delete with cascade
            const cascadeResponse = await fetch(`${API_BASE_URL}/api/tasks/${deleteModal.taskId}`, {
               method: 'DELETE',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({ confirmCascade: true }),
            });

            if (!cascadeResponse.ok) {
               const errorData = await cascadeResponse.json();
               throw new Error(errorData.message || 'Failed to delete task');
            }
         } else if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete task');
         }

         // Regular deletion (no dependents) - Remove the task from local state
         setTodoList((prevList) => prevList.filter((task) => task._id !== deleteModal.taskId));

         // Close the modal
         setDeleteModal({
            isOpen: false,
            taskId: null,
            taskName: '',
            isDeleting: false,
         });

         // Note: We don't create a success notification here because the backend already sends one
         // This removes the duplicate notification issue
      } catch (error) {
         console.error('Error deleting task:', error);
         createErrorNotification(error.message || 'Failed to delete task');
         setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
      }
   };

   // Handle simple delete cancel
   const handleDeleteCancel = () => {
      setDeleteModal({
         isOpen: false,
         taskId: null,
         taskName: '',
         isDeleting: false,
      });
   };

   // Handle task update
   const handleUpdateTask = async (taskId, updatedTask) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         // Validate date format (DD/MM/YYYY)
         if (updatedTask.date && !updatedTask.date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            throw new Error('Invalid date format. Expected format: DD/MM/YYYY');
         }

         // Validate time format (HH:MM AM/PM)
         if (updatedTask.time && !updatedTask.time.match(/^\d{1,2}:\d{2}\s(?:AM|PM)$/)) {
            throw new Error('Invalid time format. Expected format: HH:MM AM/PM');
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
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task');
         }

         const data = await response.json();

         // Update the task in the local state
         setTodoList((prevList) => prevList.map((task) => (task._id === taskId ? data : task)));
      } catch (error) {
         console.error('Error updating task:', error);
         createErrorNotification(error.message || 'Failed to update task');
         throw error; // Re-throw the error to be handled by the caller
      }
   };

   // Handle task status change
   const handleTaskStatusChange = async (taskId, currentStatus, errorMessage) => {
      if (errorMessage) {
         createErrorNotification(errorMessage);
      } else {
         createSuccessNotification(`Task marked as ${currentStatus ? 'incomplete' : 'complete'}`);
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
         <div
            className={`text-center p-4 rounded-lg ${
               isDark
                  ? 'text-red-400 bg-red-900/20 border border-red-800'
                  : 'text-red-500 bg-red-100 border border-red-200'
            }`}
         >
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
         {/* Enhanced Sort UI - Reduced Size */}
         <div className="relative mb-4">
            {/* Background with theme-responsive styling */}
            <div
               className={`absolute inset-0 rounded-xl border shadow-lg ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
               }`}
            ></div>

            {/* Content */}
            <div className="relative p-3 sm:p-4">
               <ModernSortTabs onSortChange={handleSortChange} />
               <div className="flex items-center justify-between mb-3">
                  {/* Task count badge */}
                  <div
                     className={`backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border ${
                        isDark
                           ? 'bg-purple-900/50 border-purple-700 text-purple-200'
                           : 'bg-purple-100 border-purple-200 text-purple-700'
                     }`}
                  >
                     <span className="text-xs sm:text-sm font-semibold">
                        {filteredList.length} {filteredList.length === 1 ? 'Task' : 'Tasks'}
                     </span>
                  </div>
               </div>
            </div>
         </div>

         {/* Task list with enhanced styling and scrollable container */}
         <div className="relative">
            {/* Scrollable container with fixed height */}
            <div
               className="h-[70vh] overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
               id="task-list-container"
               onScroll={handleScroll}
            >
               {filteredList.length === 0 ? (
                  <div
                     className={`text-center p-8 sm:p-12 rounded-2xl border shadow-lg ${
                        isDark
                           ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600'
                           : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                     }`}
                  >
                     <div className="flex flex-col items-center space-y-4">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-full">
                           <HiClipboardList className="h-8 w-8 text-white" />
                        </div>
                        <div>
                           <h3
                              className={`text-lg font-semibold mb-2 font-proza ${
                                 isDark ? 'text-gray-200' : 'text-gray-700'
                              }`}
                           >
                              {searchTerm ? 'No matching tasks found' : 'No tasks yet'}
                           </h3>
                           <p className={`max-w-md ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {searchTerm
                                 ? `No tasks found for "${searchTerm}". Try adjusting your search term.`
                                 : 'Create your first task to get started with organizing your work!'}
                           </p>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div
                     style={{
                        height: filteredList.length * itemHeight,
                        position: 'relative',
                     }}
                  >
                     {/* Virtual scrolling spacer for items before visible area */}
                     <div style={{ height: startIndex * itemHeight }} />

                     {/* Visible items */}
                     <div>
                        {visibleItems.map((task, index) => (
                           <div
                              key={task._id}
                              style={{
                                 minHeight: itemHeight,
                                 position: 'relative',
                              }}
                           >
                              <DisplayTodoList
                                 list={task}
                                 isexceeded={isDeadlineExceeded(task)}
                                 onDelete={handleDeleteTask}
                                 onUpdate={handleUpdateTask}
                                 onStatusChange={handleTaskStatusChange}
                                 dependencies={dependencies}
                                 onDependencyChange={fetchDependencies}
                              />
                           </div>
                        ))}
                     </div>

                     {/* Virtual scrolling spacer for items after visible area */}
                     <div style={{ height: (filteredList.length - endIndex - 1) * itemHeight }} />
                  </div>
               )}
            </div>

            {/* Scroll indicators and controls */}
            {filteredList.length > 5 && (
               <>
                  {/* Top fade indicator */}
                  <div
                     className={`absolute top-0 left-0 right-0 h-6 pointer-events-none z-10 rounded-t-xl ${
                        isDark
                           ? 'bg-gradient-to-b from-gray-800/30 via-gray-800/10 to-transparent'
                           : 'bg-gradient-to-b from-white/30 via-white/10 to-transparent'
                     }`}
                  ></div>

                  {/* Bottom fade indicator */}
                  <div
                     className={`absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10 rounded-b-xl ${
                        isDark
                           ? 'bg-gradient-to-t from-gray-800/30 via-gray-800/10 to-transparent'
                           : 'bg-gradient-to-t from-white/30 via-white/10 to-transparent'
                     }`}
                  ></div>

                  {/* Date indicator - shows while scrolling */}
                  {isScrolling && getCurrentDateRange() && (
                     <div
                        className={`absolute top-1/2 right-4 transform -translate-y-1/2 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg z-30 animate-fade-in ${
                           isDark
                              ? 'bg-gradient-to-r from-purple-800 to-purple-900 border border-purple-600/20'
                              : 'bg-gradient-to-r from-purple-800 to-purple-900 border border-white/20'
                        }`}
                     >
                        <div className="flex items-center gap-2">
                           <HiCalendar className="h-3 w-3" />
                           <span>{getCurrentDateRange()}</span>
                        </div>
                     </div>
                  )}

                  {/* Task count indicator - shows while scrolling */}
                  {isScrolling && filteredList.length > 10 && (
                     <div
                        className={`absolute top-16 right-4 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg z-30 animate-fade-in ${
                           isDark
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700 border border-purple-500/20'
                              : 'bg-gradient-to-r from-purple-600 to-purple-700 border border-white/20'
                        }`}
                     >
                        <div className="flex items-center gap-2">
                           <HiClipboardList className="h-3 w-3" />
                           <span>
                              {(() => {
                                 const { visible, total, startIndex, endIndex } = getVisibleTaskCount();
                                 return `${startIndex}-${endIndex} of ${total}`;
                              })()}
                           </span>
                        </div>
                     </div>
                  )}

                  {/* Navigation buttons container - bottom left */}
                  <div className="absolute bottom-3 left-6 flex flex-col gap-2 z-20">
                     {/* Scroll to top button */}
                     <button
                        onClick={scrollToTop}
                        className={`backdrop-blur-sm text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                           isDark
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border border-purple-500/20'
                              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border border-white/20'
                        }`}
                        title="Scroll to top"
                     >
                        <HiChevronUp className="h-4 w-4" />
                     </button>

                     {/* Scroll to bottom button */}
                     <button
                        onClick={scrollToBottom}
                        className={`backdrop-blur-sm text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                           isDark
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border border-purple-500/20'
                              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border border-white/20'
                        }`}
                        title="Scroll to bottom"
                     >
                        <HiChevronDown className="h-4 w-4" />
                     </button>
                  </div>
               </>
            )}
         </div>

         {/* Simple Delete Task Modal */}
         <DeleteTaskModal
            isOpen={deleteModal.isOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            taskName={deleteModal.taskName}
            isDeleting={deleteModal.isDeleting}
         />
      </div>
   );
}

export default TodoListParser;
