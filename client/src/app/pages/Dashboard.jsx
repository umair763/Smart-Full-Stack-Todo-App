'use client';

import { useState, useEffect } from 'react';
import TodoListParser from '../../components/TodoListParser';
import AddTask from '../../components/AddTask';
import AddTaskForm from '../../components/AddTaskForm';
import DeleteTaskForm from '../../components/DeleteTaskForm';
import Modal from '../../components/Modal';
import Header from '../layout/Header'; // Import Header
import ReminderModal from '../../components/ReminderModal';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Dashboard() {
   const [tasks, setTasks] = useState([]);
   const [isAddFormVisible, setIsAddFormVisible] = useState(false);
   const [isDeleteFormVisible, setIsDeleteFormVisible] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [apiError, setApiError] = useState('');
   const [searchTerm, setSearchTerm] = useState('');
   const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
   const [selectedTask, setSelectedTask] = useState(null);

   useEffect(() => {
      fetchTasks();
   }, []);

   const fetchTasks = async () => {
      setIsLoading(true);
      setApiError('');
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('No authentication token found');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
         }

         const data = await response.json();
         setTasks(data);
      } catch (error) {
         console.error('Error fetching tasks:', error);
         setApiError('Failed to fetch tasks. Please try again.');
      } finally {
         setIsLoading(false);
      }
   };

   const isexceeded = (date, time) => {
      const now = new Date();
      const taskDate = new Date(`${date} ${time}`);
      return taskDate < now;
   };

   const handleisAddFormVisible = () => {
      setIsAddFormVisible(!isAddFormVisible);
   };

   const handleisDeleteFormVisible = () => {
      setIsDeleteFormVisible(!isDeleteFormVisible);
   };

   const handleSearchChange = (searchValue) => {
      setSearchTerm(searchValue);
   };

   function handleAddNewTasks(task) {
      const newTask = {
         ...task,
         _id: Date.now(), // Temporary ID for optimistic update
         completed: false,
         createdAt: new Date().toISOString(),
         userId: localStorage.getItem('userId'),
      };

      // Add task optimistically
      setTasks((prevTasks) => [...prevTasks, newTask]);
      setIsAddFormVisible(false);

      // Make the API call
      addTask(task);
   }

   const addTask = async (task) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(task),
         });

         if (!response.ok) {
            throw new Error('Failed to add task');
         }

         // Refresh tasks to get the actual task with server-generated ID
         fetchTasks();
      } catch (error) {
         console.error('Error adding task:', error);
         setApiError('Failed to add task. Please try again.');
         // Remove the optimistically added task on error
         setTasks((prevTasks) => prevTasks.filter((t) => t._id !== Date.now()));
      }
   };

   const handleDeleteTask = async (taskId) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete task');
         }

         setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
         setIsDeleteFormVisible(false); // Close the form after successful deletion
      } catch (error) {
         console.error('Error deleting task:', error);
         setApiError('Failed to delete task. Please try again.');
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

   return (
      <div className="w-11/12 bg-gradient-to-br from-[#9406E6] to-[#00FFFF] p-2 sm:p-4">
         <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
               <Header />
            </div>

            {/* Main Content */}
            <div className="space-y-4 sm:space-y-6">
               <div className="text">
                  <h1 className="text-2xl sm:text-4xl text-white font-extrabold mb-2 sm:mb-4">Todo App</h1>
                  <h3 className="text-base sm:text-xl text-white font-semibold mb-4 sm:mb-6">
                     To-Do lists help us break life into small steps.
                  </h3>
               </div>
               <AddTask
                  SetisAddFormVisible={handleisAddFormVisible}
                  setisDeleteFormVisible={handleisDeleteFormVisible}
                  onSearchChange={handleSearchChange}
               />
               {apiError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-sm sm:text-base">
                     {apiError}
                  </div>
               )}

               {isLoading ? (
                  <div className="flex justify-center items-center h-32 sm:h-40">
                     <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-white"></div>
                  </div>
               ) : (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-6">
                     <TodoListParser searchTerm={searchTerm} />
                  </div>
               )}
            </div>
         </div>

         {/* Form Modals */}
         <Modal isOpen={isAddFormVisible} onClose={handleisAddFormVisible}>
            <AddTaskForm addTask={handleAddNewTasks} SetisAddFormVisible={handleisAddFormVisible} />
         </Modal>
         <Modal isOpen={isDeleteFormVisible} onClose={handleisDeleteFormVisible}>
            <DeleteTaskForm
               tasks={tasks}
               deleteTask={handleDeleteTask}
               setisDeleteFormVisible={handleisDeleteFormVisible}
            />
         </Modal>
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

export default Dashboard;
