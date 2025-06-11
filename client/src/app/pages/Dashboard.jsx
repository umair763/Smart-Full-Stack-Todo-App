'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import AddTask from '../../components/AddTask';
import DeleteTaskModal from '../../components/DeleteTaskModal';
import { toast } from 'react-hot-toast';
import DependencyView from '../../components/DependencyView';
import TodoListParser from '../../components/TodoListParser';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function Dashboard() {
   const [tasks, setTasks] = useState([]);
   const [list, setList] = useState([]);
   const [dependencies, setDependencies] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [taskToDelete, setTaskToDelete] = useState(null);
   const [sortOption, setSortOption] = useState('default');
   const [sortDirection, setSortDirection] = useState('asc');
   const [filterOption, setFilterOption] = useState('all');
   const [viewOption, setViewOption] = useState('list');
   const [searchTerm, setSearchTerm] = useState('');
   const { isLoggedIn, token, logout } = useAuth();
   const { createSuccessNotification, createErrorNotification } = useNotification();
   const { socket, isConnected } = useSocket();
   const [apiRetries, setApiRetries] = useState(0);
   const [loadingText, setLoadingText] = useState('Loading tasks...');
   const navigate = useNavigate();

   // Function to fetch tasks from the server with improved error handling
   const fetchTasks = useCallback(
      async (retryCount = 0) => {
         try {
            setLoading(true);
            setLoadingText(retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading tasks...');

            if (!token) {
               console.error('No authentication token found');
               setError('Authentication required. Please log in again.');
               setLoading(false);
               return;
            }

            console.log('Fetching tasks from:', `${BACKEND_URL}/api/tasks`);
            const response = await fetch(`${BACKEND_URL}/api/tasks`, {
               method: 'GET',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
            });

            if (!response.ok) {
               if (response.status === 401) {
                  console.error('Authentication failed');
                  logout();
                  navigate('/auth/login');
                  return;
               }
               const errorData = await response.json().catch(() => ({}));
               throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch tasks`);
            }

            const data = await response.json();
            console.log('Tasks fetched successfully:', data.length);
            setList(data);
            setTasks(data);
            setError(null);
            setApiRetries(0);
         } catch (error) {
            console.error('Error fetching tasks:', error);
            setError(`Failed to load tasks: ${error.message}`);

            // Implement retry logic
            if (retryCount < 3) {
               const nextRetry = retryCount + 1;
               setApiRetries(nextRetry);
               console.log(`Retrying fetch tasks (${nextRetry}/3) in ${nextRetry * 1000}ms...`);

               setTimeout(() => fetchTasks(nextRetry), nextRetry * 1000);
            } else {
               toast.error('Could not load tasks. Please refresh the page.');
               setLoadingText('Failed to load tasks');
            }
         } finally {
            if (retryCount === 0) {
               setLoading(false);
            }
         }
      },
      [token, logout, navigate]
   );

   // Function to fetch dependencies with improved error handling
   const fetchDependencies = useCallback(
      async (retryCount = 0) => {
         try {
            if (!token) {
               throw new Error('Authentication required');
            }

            const response = await fetch(`${BACKEND_URL}/api/dependencies`, {
               method: 'GET',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
            });

            if (!response.ok) {
               throw new Error(`HTTP ${response.status}: Failed to fetch dependencies`);
            }

            const data = await response.json();
            setDependencies(data);
            console.log('Dependencies fetched successfully:', data.length);
         } catch (error) {
            console.error('Error fetching dependencies:', error);

            // Retry logic for dependencies (less critical)
            if (retryCount < 2) {
               setTimeout(() => fetchDependencies(retryCount + 1), (retryCount + 1) * 1000);
            }
            // Don't show error toast for dependencies as it's not critical
         }
      },
      [token]
   );

   // Initial data fetch
   useEffect(() => {
      if (!isLoggedIn || !token) {
         return;
      }

      fetchTasks();
      fetchDependencies();
   }, [isLoggedIn, token, fetchTasks, fetchDependencies]);

   // Fixed handleAddTask function
   const handleAddTask = useCallback(
      async (newTask) => {
         try {
            if (!token) {
               throw new Error('Authentication required');
            }

            console.log('Adding new task:', newTask);

            const response = await fetch(`${BACKEND_URL}/api/tasks`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
               },
               body: JSON.stringify(newTask),
            });

            if (!response.ok) {
               const errorData = await response.json().catch(() => ({}));
               throw new Error(errorData.message || 'Failed to add task');
            }

            const data = await response.json();
            console.log('Task added successfully:', data);

            // Update local state
            setTasks((prev) => [...prev, data]);
            setList((prev) => [...prev, data]);

            toast.success('Task added successfully');

            // Refresh tasks to ensure consistency
            setTimeout(() => {
               fetchTasks();
            }, 1000);
         } catch (err) {
            console.error('Error adding task:', err);
            toast.error(err.message || 'Failed to add task');
            setError(err.message);
         }
      },
      [token, fetchTasks]
   );

   // Fixed handleDeleteTask function
   const handleDeleteTask = useCallback(
      async (taskId) => {
         try {
            if (!token) {
               throw new Error('Authentication required');
            }

            console.log('Deleting task:', taskId);

            const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
               method: 'DELETE',
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (!response.ok) {
               const errorData = await response.json().catch(() => ({}));
               throw new Error(errorData.message || 'Failed to delete task');
            }

            console.log('Task deleted successfully');

            // Update local state
            setTasks((prev) => prev.filter((task) => task._id !== taskId));
            setList((prev) => prev.filter((task) => task._id !== taskId));

            toast.success('Task deleted successfully');

            // Refresh tasks to ensure consistency
            setTimeout(() => {
               fetchTasks();
            }, 1000);
         } catch (err) {
            console.error('Error deleting task:', err);
            toast.error(err.message || 'Failed to delete task');
            setError(err.message);
         }
      },
      [token, fetchTasks]
   );

   // Function to handle task deletion with modal
   const handleDeleteTask2 = useCallback(
      (taskId) => {
         const taskToDelete = list.find((task) => task._id === taskId);
         setTaskToDelete(taskToDelete);
         setShowDeleteModal(true);
      },
      [list]
   );

   // Function to confirm task deletion
   const confirmDeleteTask = useCallback(async () => {
      if (!taskToDelete) return;

      try {
         await handleDeleteTask(taskToDelete._id);
      } catch (error) {
         console.error('Error in confirmDeleteTask:', error);
      } finally {
         setShowDeleteModal(false);
         setTaskToDelete(null);
      }
   }, [taskToDelete, handleDeleteTask]);

   // Function to update a task
   const handleUpdateTask = useCallback((taskId, updatedTask) => {
      setList((prevList) => prevList.map((task) => (task._id === taskId ? { ...task, ...updatedTask } : task)));
      setTasks((prevTasks) => prevTasks.map((task) => (task._id === taskId ? { ...task, ...updatedTask } : task)));
   }, []);

   // Function to handle task status change
   const handleTaskStatusChange = useCallback(
      (taskId, currentStatus, errorMessage) => {
         if (errorMessage) {
            toast.error(errorMessage);
         } else {
            // Refresh the task list to get updated data
            setTimeout(() => {
               fetchTasks();
            }, 1000);
         }
      },
      [fetchTasks]
   );

   // Handle sorting change
   const handleSortChange = useCallback((sortType, direction = 'asc') => {
      setSortOption(sortType);
      setSortDirection(direction);
   }, []);

   // Handle search change
   const handleSearchChange = useCallback((searchValue) => {
      setSearchTerm(searchValue);
   }, []);

   // Function to check if task has dependencies
   const hasTaskDependencies = useCallback(
      (taskId) => {
         return dependencies.some((dep) => dep.taskId === taskId || dep.dependsOnTaskId === taskId);
      },
      [dependencies]
   );

   // Sort and filter tasks
   const sortedAndFilteredTasks = [...list]
      .filter((task) => {
         // Filter by completion status
         if (filterOption === 'completed') return task.completed;
         if (filterOption === 'active') return !task.completed;

         // Filter by search term
         if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
               task.task?.toLowerCase().includes(searchLower) ||
               task.title?.toLowerCase().includes(searchLower) ||
               task.description?.toLowerCase().includes(searchLower)
            );
         }

         return true;
      })
      .sort((a, b) => {
         // Always sort tasks with dependencies to the top first
         const aHasDeps = hasTaskDependencies(a._id);
         const bHasDeps = hasTaskDependencies(b._id);

         if (aHasDeps && !bHasDeps) return -1;
         if (!aHasDeps && bHasDeps) return 1;

         // Then apply the selected sorting
         switch (sortOption) {
            case 'deadline':
               const dateA = new Date(`${a.date} ${a.time}`);
               const dateB = new Date(`${b.date} ${b.time}`);
               return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;

            case 'priority':
               const priorityOrder = { High: 3, Medium: 2, Low: 1 };
               const priorityA = priorityOrder[a.priority] || 0;
               const priorityB = priorityOrder[b.priority] || 0;
               return sortDirection === 'asc' ? priorityB - priorityA : priorityA - priorityB;

            case 'alphabetical':
               const nameA = (a.task || a.title || '').toLowerCase();
               const nameB = (b.task || b.title || '').toLowerCase();
               return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);

            case 'dependencies':
               // Already handled above
               return 0;

            default:
               // Default order (creation order)
               return 0;
         }
      });

   // Check if a task's deadline has passed
   const isDeadlineExceeded = useCallback((task) => {
      if (task.completed) return false;
      const today = new Date();
      const taskDate = new Date(`${task.date} ${task.time}`);
      return taskDate < today;
   }, []);

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6]"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{loadingText}</p>
            {error && (
               <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg max-w-md text-center">
                  <p className="text-sm">{error}</p>
                  <button
                     className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                     onClick={() => {
                        setApiRetries(0);
                        setError(null);
                        fetchTasks();
                     }}
                  >
                     Retry Now
                  </button>
               </div>
            )}
         </div>
      );
   }

   if (error && !loading) {
      return (
         <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md">
               <div className="text-red-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                     />
                  </svg>
               </div>
               <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Tasks</h3>
               <p className="text-gray-600 mb-4">{error}</p>
               <button
                  className="px-6 py-2 bg-[#9406E6] text-white rounded-lg hover:bg-[#7D05C3] transition-colors"
                  onClick={() => {
                     setError(null);
                     setApiRetries(0);
                     fetchTasks();
                  }}
               >
                  Try Again
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
         <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Task Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">
               Manage your tasks and track your progress
               {!isConnected && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400 text-sm">
                     (Real-time updates disabled in serverless mode)
                  </span>
               )}
            </p>
         </div>

         {/* Task Management Component - Search, Add, Delete */}
         <div className="mb-6">
            <AddTask
               onAddTask={handleAddTask}
               tasks={list}
               onDeleteTask={handleDeleteTask}
               onSearchChange={handleSearchChange}
            />
         </div>

         {/* Task List with integrated Sort and Display */}
         <div>
            {viewOption === 'list' ? (
               <TodoListParser
                  searchTerm={searchTerm}
                  tasks={sortedAndFilteredTasks}
                  onDelete={handleDeleteTask2}
                  onUpdate={handleUpdateTask}
                  onStatusChange={handleTaskStatusChange}
                  dependencies={dependencies}
                  onDependencyChange={fetchDependencies}
                  isDeadlineExceeded={isDeadlineExceeded}
               />
            ) : (
               <DependencyView tasks={list} dependencies={dependencies} onDependencyChange={fetchDependencies} />
            )}
         </div>

         {/* Delete Task Modal */}
         <DeleteTaskModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDeleteTask}
            task={taskToDelete}
         />
      </div>
   );
}

export default Dashboard;
