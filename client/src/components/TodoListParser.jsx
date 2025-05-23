'use client';

import { useState, useEffect } from 'react';
import DisplayTodoList from './DisplayTodoList';
import { useSocket } from '../app/context/SocketContext';
import { useNotification } from '../app/context/NotificationContext';
import SearchBar from './SearchBar';
import TaskFilter from './TaskFilter';
import ModernSortTabs from './ModernSortTabs';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TodoListParser() {
   const [todoList, setTodoList] = useState([]);
   const [filteredList, setFilteredList] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(null);
   const { socket } = useSocket();
   const { showNotification } = useNotification();
   const [dependencies, setDependencies] = useState([]);
   const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);

   // Search and filter state
   const [searchTerm, setSearchTerm] = useState('');
   const [showFilters, setShowFilters] = useState(false);
   const [activeFilters, setActiveFilters] = useState({
      priority: 'all',
      description: '',
      dueDate: '',
      status: 'all',
   });
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

   // Apply search, filters, and sorting whenever relevant state changes
   useEffect(() => {
      applySearchAndFilters();
   }, [todoList, searchTerm, activeFilters, sortConfig]);

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

   // Apply search, filters, and sorting to the task list
   const applySearchAndFilters = () => {
      let result = [...todoList];

      // Apply search
      if (searchTerm.trim() !== '') {
         const searchLower = searchTerm.toLowerCase();
         result = result.filter(
            (task) =>
               // Search in task name
               task.task.toLowerCase().includes(searchLower) ||
               // Search in description (if available)
               (task.description && task.description.toLowerCase().includes(searchLower)) ||
               // Search in notes (if available)
               (task.notes && task.notes.some((note) => note.content.toLowerCase().includes(searchLower)))
         );
      }

      // Apply filters
      if (activeFilters.priority !== 'all') {
         result = result.filter((task) => task.priority && task.priority.toLowerCase() === activeFilters.priority);
      }

      if (activeFilters.description) {
         const descLower = activeFilters.description.toLowerCase();
         result = result.filter((task) => task.description && task.description.toLowerCase().includes(descLower));
      }

      if (activeFilters.dueDate) {
         const filterDate = new Date(activeFilters.dueDate).toDateString();
         result = result.filter((task) => {
            const taskDate = new Date(`${task.date} ${task.time}`).toDateString();
            return taskDate === filterDate;
         });
      }

      if (activeFilters.status !== 'all') {
         const today = new Date();

         if (activeFilters.status === 'completed') {
            result = result.filter((task) => task.completed);
         } else if (activeFilters.status === 'pending') {
            result = result.filter((task) => !task.completed);
         } else if (activeFilters.status === 'overdue') {
            result = result.filter((task) => {
               const taskDate = new Date(`${task.date} ${task.time}`);
               return !task.completed && taskDate < today;
            });
         }
      }

      // Apply sorting
      result = sortTasks(result, sortConfig.type, sortConfig.direction);

      setFilteredList(result);
   };

   // Sort tasks based on the selected sort type and direction
   const sortTasks = (tasks, sortType, direction) => {
      const sortedTasks = [...tasks];

      switch (sortType) {
         case 'alphabetical':
            sortedTasks.sort((a, b) => {
               const comparison = a.task.localeCompare(b.task);
               return direction === 'asc' ? comparison : -comparison;
            });
            break;

         case 'deadline':
            sortedTasks.sort((a, b) => {
               const dateA = new Date(`${a.date} ${a.time}`);
               const dateB = new Date(`${b.date} ${b.time}`);
               const comparison = dateA - dateB;
               return direction === 'asc' ? comparison : -comparison;
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
            // For dependencies, we need to maintain the dependency tree structure
            // This is a simplified version - a full implementation would need to build a dependency graph
            const dependencyMap = new Map();

            // Create a map of task IDs to their dependencies
            dependencies.forEach((dep) => {
               const dependentId = dep.dependentTaskId?._id || dep.dependentTaskId;
               const prerequisiteId = dep.prerequisiteTaskId?._id || dep.prerequisiteTaskId;

               if (!dependencyMap.has(dependentId)) {
                  dependencyMap.set(dependentId, []);
               }
               dependencyMap.get(dependentId).push(prerequisiteId);
            });

            // Helper function to get all prerequisites recursively
            const getAllPrerequisites = (taskId, visited = new Set()) => {
               if (visited.has(taskId)) return [];
               visited.add(taskId);

               const prerequisites = dependencyMap.get(taskId) || [];
               let allPrerequisites = [...prerequisites];

               for (const prereqId of prerequisites) {
                  allPrerequisites = [...allPrerequisites, ...getAllPrerequisites(prereqId, visited)];
               }

               return allPrerequisites;
            };

            // Sort based on dependency relationships
            sortedTasks.sort((a, b) => {
               const aPrereqs = getAllPrerequisites(a._id);
               const bPrereqs = getAllPrerequisites(b._id);

               // If A depends on B, B should come first
               if (aPrereqs.includes(b._id)) return direction === 'asc' ? 1 : -1;
               // If B depends on A, A should come first
               if (bPrereqs.includes(a._id)) return direction === 'asc' ? -1 : 1;

               // If neither depends on the other, sort by number of dependencies
               const comparison = aPrereqs.length - bPrereqs.length;
               return direction === 'asc' ? comparison : -comparison;
            });
            break;

         default:
            // Default to deadline sorting
            sortedTasks.sort((a, b) => {
               const dateA = new Date(`${a.date} ${a.time}`);
               const dateB = new Date(`${b.date} ${b.time}`);
               const comparison = dateA - dateB;
               return direction === 'asc' ? comparison : -comparison;
            });
      }

      return sortedTasks;
   };

   // Handle search term change
   const handleSearchChange = (term) => {
      setSearchTerm(term);
   };

   // Handle filter changes
   const handleFilterChange = (filters) => {
      setActiveFilters(filters);
   };

   // Handle sort changes
   const handleSortChange = (sortType, direction) => {
      setSortConfig({ type: sortType, direction });
   };

   // Check if a task's deadline has passed
   const isDeadlineExceeded = (task) => {
      if (task.completed) return false;

      const today = new Date();
      const taskDate = new Date(`${task.date} ${task.time}`);
      return taskDate < today;
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
         {/* Search and filter UI */}
         <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-lg mb-4">
            <SearchBar
               searchTerm={searchTerm}
               onSearchChange={handleSearchChange}
               onFilterToggle={() => setShowFilters(!showFilters)}
            />

            {showFilters && <TaskFilter onFilterChange={handleFilterChange} />}

            <ModernSortTabs onSortChange={handleSortChange} />
         </div>

         {/* Task list */}
         <div className="space-y-2">
            {filteredList.length === 0 ? (
               <div className="text-center p-8 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">No tasks found. Try adjusting your search or filters.</p>
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
