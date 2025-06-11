'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import DisplayTodoList from '../../components/DisplayTodoList';
import AddTask from '../../components/AddTask';
import DeleteTaskModal from '../../components/DeleteTaskModal';
import { toast } from 'react-hot-toast';
import ModernSortTabs from '../../components/ModernSortTabs';
import DependencyView from '../../components/DependencyView';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function Dashboard() {
   const [tasks, setTasks] = useState([]);
   const [list, setList] = useState([]);
   const [dependencies, setDependencies] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [deleteModal, setDeleteModal] = useState({ show: false, taskId: null });
   const [showNotifications, setShowNotifications] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [taskToDelete, setTaskToDelete] = useState(null);
   const [sortOption, setSortOption] = useState('date'); // Default sort by date
   const [filterOption, setFilterOption] = useState('all'); // Default show all tasks
   const [viewOption, setViewOption] = useState('list'); // Default view is list
   const { token, logout } = useAuth();
   const { notifications, unreadCount, addNotification } = useNotification();
   const { socket, isConnected } = useSocket();
   const navigate = useNavigate();
   const [apiRetries, setApiRetries] = useState(0);
   const [loadingText, setLoadingText] = useState('Loading tasks...');

   // Function to fetch tasks from the server
   const fetchTasks = useCallback(async () => {
      try {
         setLoading(true);
         setLoadingText('Loading tasks...');

         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch tasks');
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
         if (apiRetries < 3) {
            const retryCount = apiRetries + 1;
            setApiRetries(retryCount);
            setLoadingText(`Retrying... (${retryCount}/3)`);

            // Exponential backoff for retries
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => fetchTasks(), delay);
         } else {
            toast.error('Could not load tasks. Please try refreshing the page.');
         }
      } finally {
         if (apiRetries === 0) {
            setLoading(false);
         }
      }
   }, [token, apiRetries]);

   // Function to fetch dependencies
   const fetchDependencies = useCallback(async () => {
      try {
         const token = localStorage.getItem('token');
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
            throw new Error('Failed to fetch dependencies');
         }

         const data = await response.json();
         setDependencies(data);
      } catch (error) {
         console.error('Error fetching dependencies:', error);
         // Don't show error toast for dependencies as it's not critical
      }
   }, [token]);

   useEffect(() => {
      if (!token) {
         navigate('/login');
         return;
      }

      fetchTasks();
      fetchDependencies();
      setupSocketListeners();

      return () => {
         if (socket) {
            socket.off('taskCreated');
            socket.off('taskUpdated');
            socket.off('taskDeleted');
         }
      };
   }, [token, socket, fetchTasks, fetchDependencies, navigate]);

   const setupSocketListeners = () => {
      if (socket) {
         socket.on('taskCreated', (newTask) => {
            setTasks((prev) => [...prev, newTask]);
         });

         socket.on('taskUpdated', (updatedTask) => {
            setTasks((prev) => prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)));
         });

         socket.on('taskDeleted', (deletedTaskId) => {
            setTasks((prev) => prev.filter((task) => task._id !== deletedTaskId));
         });
      }
   };

   const handleAddTask = async (newTask) => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newTask),
         });

         if (!response.ok) {
            throw new Error('Failed to add task');
         }

         const data = await response.json();
         setTasks((prev) => [...prev, data]);
      } catch (err) {
         setError(err.message);
      }
   };

   const handleDeleteTask = async () => {
      if (!deleteModal.taskId) return;

      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks/${deleteModal.taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete task');
         }

         setTasks((prev) => prev.filter((task) => task._id !== deleteModal.taskId));
         setDeleteModal({ show: false, taskId: null });
      } catch (err) {
         setError(err.message);
      }
   };

   const handleDeleteWithCascade = async () => {
      if (!deleteModal.taskId) return;

      try {
         const cascadeResponse = await fetch(`${BACKEND_URL}/api/tasks/${deleteModal.taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
               'X-Cascade-Delete': 'true',
            },
         });

         if (!cascadeResponse.ok) {
            throw new Error('Failed to delete task and dependencies');
         }

         setTasks((prev) => prev.filter((task) => task._id !== deleteModal.taskId));
         setDeleteModal({ show: false, taskId: null });
      } catch (err) {
         setError(err.message);
      }
   };

   const handleLogout = () => {
      logout();
      navigate('/login');
   };

   // Socket event listeners for real-time updates
   useEffect(() => {
      if (!socket) return;

      // Handle task created event
      const handleTaskCreated = (data) => {
         console.log('Task created event received:', data);
         setList((prevList) => [...prevList, data.task]);
      };

      // Handle task updated event
      const handleTaskUpdated = (data) => {
         console.log('Task updated event received:', data);
         setList((prevList) => prevList.map((task) => (task._id === data.task._id ? data.task : task)));
      };

      // Handle task deleted event
      const handleTaskDeleted = (data) => {
         console.log('Task deleted event received:', data);
         setList((prevList) => prevList.filter((task) => task._id !== data.taskId));
      };

      // Handle task status changed event
      const handleTaskStatusChanged = (data) => {
         console.log('Task status changed event received:', data);
         setList((prevList) =>
            prevList.map((task) => (task._id === data.taskId ? { ...task, completed: data.completed } : task))
         );
      };

      // Register socket listeners
      socket.on('taskCreated', handleTaskCreated);
      socket.on('taskUpdated', handleTaskUpdated);
      socket.on('taskDeleted', handleTaskDeleted);
      socket.on('taskStatusChanged', handleTaskStatusChanged);

      // Clean up listeners on unmount
      return () => {
         socket.off('taskCreated', handleTaskCreated);
         socket.off('taskUpdated', handleTaskUpdated);
         socket.off('taskDeleted', handleTaskDeleted);
         socket.off('taskStatusChanged', handleTaskStatusChanged);
      };
   }, [socket]);

   // Function to add a new task
   const addTask = (newTask) => {
      setList([...list, newTask]);
   };

   // Function to handle task deletion
   const handleDeleteTask2 = (taskId) => {
      const taskToDelete = list.find((task) => task._id === taskId);
      setTaskToDelete(taskToDelete);
      setShowDeleteModal(true);
   };

   // Function to confirm task deletion
   const confirmDeleteTask = async () => {
      if (!taskToDelete) return;

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${BACKEND_URL}/api/tasks/${taskToDelete._id}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete task');
         }

         // Remove the task from the list
         setList(list.filter((task) => task._id !== taskToDelete._id));
         toast.success('Task deleted successfully');
      } catch (error) {
         console.error('Error deleting task:', error);
         toast.error('Failed to delete task');
      } finally {
         setShowDeleteModal(false);
         setTaskToDelete(null);
      }
   };

   // Function to update a task
   const handleUpdateTask = (taskId, updatedTask) => {
      setList(list.map((task) => (task._id === taskId ? { ...task, ...updatedTask } : task)));
   };

   // Function to handle task status change
   const handleTaskStatusChange = (taskId, currentStatus, errorMessage) => {
      if (errorMessage) {
         toast.error(errorMessage);
      }
   };

   // Sort and filter tasks
   const sortedAndFilteredTasks = [...list]
      .filter((task) => {
         if (filterOption === 'all') return true;
         if (filterOption === 'completed') return task.completed;
         if (filterOption === 'active') return !task.completed;
         return true;
      })
      .sort((a, b) => {
         if (sortOption === 'date') {
            // Sort by date (and time if dates are equal)
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
         } else if (sortOption === 'priority') {
            // Sort by priority (High > Medium > Low)
            const priorityOrder = { High: 1, Medium: 2, Low: 3 };
            return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
         }
         return 0;
      });

   // Check if a task's deadline has passed
   const isDeadlineExceeded = (task) => {
      if (task.completed) return false; // Don't mark completed tasks as exceeded
      const today = new Date();
      const taskDate = new Date(`${task.date} ${task.time}`);
      return taskDate < today;
   };

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6]"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{loadingText}</p>
            {error && (
               <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                  {error}
                  <button
                     className="ml-2 underline text-red-600 hover:text-red-800"
                     onClick={() => {
                        setApiRetries(0);
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

   if (error) {
      return <div>Error: {error}</div>;
   }

   return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Task Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">
               Manage your tasks and track your progress
               {!isConnected && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400 text-sm">
                     (Offline Mode - Real-time updates disabled)
                  </span>
               )}
            </p>
         </div>

         {/* Add Task Component */}
         <div className="mb-8">
            <AddTask onAddTask={addTask} />
         </div>

         {/* Sort and Filter Options */}
         <div className="mb-6">
            <ModernSortTabs
               sortOption={sortOption}
               filterOption={filterOption}
               viewOption={viewOption}
               onSortChange={setSortOption}
               onFilterChange={setFilterOption}
               onViewChange={setViewOption}
            />
         </div>

         {/* Task List or Dependency View */}
         {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6]"></div>
               <p className="mt-4 text-gray-600 dark:text-gray-300">{loadingText}</p>
               {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                     {error}
                     <button
                        className="ml-2 underline text-red-600 hover:text-red-800"
                        onClick={() => {
                           setApiRetries(0);
                           fetchTasks();
                        }}
                     >
                        Retry Now
                     </button>
                  </div>
               )}
            </div>
         ) : viewOption === 'list' ? (
            <div>
               {sortedAndFilteredTasks.length > 0 ? (
                  sortedAndFilteredTasks.map((task) => (
                     <DisplayTodoList
                        key={task._id}
                        list={task}
                        isexceeded={isDeadlineExceeded(task)}
                        onDelete={handleDeleteTask2}
                        onUpdate={handleUpdateTask}
                        onStatusChange={handleTaskStatusChange}
                        dependencies={dependencies}
                        onDependencyChange={fetchDependencies}
                     />
                  ))
               ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                     <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#9406E6] to-[#00FFFF] rounded-full flex items-center justify-center">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-8 w-8 text-white"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                           />
                        </svg>
                     </div>
                     <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">No tasks found</h3>
                     <p className="text-gray-600 dark:text-gray-300">
                        {filterOption !== 'all'
                           ? `No ${filterOption} tasks available. Try changing the filter.`
                           : 'Add your first task to get started!'}
                     </p>
                  </div>
               )}
            </div>
         ) : (
            <DependencyView tasks={list} dependencies={dependencies} onDependencyChange={fetchDependencies} />
         )}

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
