'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle';
import AddTaskForm from '../../components/AddTaskForm';
import DisplayTodoList from '../../components/DisplayTodoList';
import NotificationCenter from '../../components/NotificationCenter';
import UserProfile from '../../components/UserProfile';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function Dashboard() {
   const [tasks, setTasks] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [deleteModal, setDeleteModal] = useState({ show: false, taskId: null });
   const [showNotifications, setShowNotifications] = useState(false);
   const { token, logout } = useAuth();
   const { notifications, unreadCount } = useNotifications();
   const { socket } = useSocket();
   const navigate = useNavigate();

   useEffect(() => {
      if (!token) {
         navigate('/login');
         return;
      }

      fetchTasks();
      setupSocketListeners();

      return () => {
         if (socket) {
            socket.off('taskCreated');
            socket.off('taskUpdated');
            socket.off('taskDeleted');
         }
      };
   }, [token, socket]);

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

   const fetchTasks = async () => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/tasks`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch tasks');
         }

         const data = await response.json();
         setTasks(data);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
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

   if (loading) {
      return <div>Loading...</div>;
   }

   if (error) {
      return <div>Error: {error}</div>;
   }

   return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
         <nav className="bg-white dark:bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between h-16">
                  <div className="flex items-center">
                     <h1 className="text-xl font-bold text-gray-900 dark:text-white">Task Manager</h1>
                  </div>
                  <div className="flex items-center space-x-4">
                     <ThemeToggle />
                     <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                     >
                        <span className="sr-only">Notifications</span>
                        <svg
                           className="h-6 w-6"
                           fill="none"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth="2"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && (
                           <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                        )}
                     </button>
                     <UserProfile onLogout={handleLogout} />
                  </div>
               </div>
            </div>
         </nav>

         <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
               <AddTaskForm onAddTask={handleAddTask} />
               <DisplayTodoList tasks={tasks} onDeleteTask={(taskId) => setDeleteModal({ show: true, taskId })} />
            </div>
         </main>

         <AnimatePresence>
            {showNotifications && (
               <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-16 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
               >
                  <NotificationCenter />
               </motion.div>
            )}
         </AnimatePresence>

         {deleteModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Task</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                     Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-4">
                     <button
                        onClick={() => setDeleteModal({ show: false, taskId: null })}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleDeleteTask}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                     >
                        Delete
                     </button>
                     <button
                        onClick={handleDeleteWithCascade}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-800 hover:bg-red-900 rounded-md"
                     >
                        Delete with Dependencies
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

export default Dashboard;
