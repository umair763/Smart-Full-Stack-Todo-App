'use client';

import { useState, useEffect } from 'react';
import TodoListParser from '../../components/TodoListParser';
import AddTask from '../../components/AddTask';
import AddTaskForm from '../../components/AddTaskForm';
import DeleteTaskForm from '../../components/DeleteTaskForm';
import Modal from '../../components/Modal';
import ReminderModal from '../../components/ReminderModal';
import DeleteTaskModal from '../../components/DeleteTaskModal';

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

   // Simple delete modal state
   const [deleteModal, setDeleteModal] = useState({
      isOpen: false,
      taskId: null,
      taskName: '',
      isDeleting: false,
   });

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
      // Find the task to get its name for the modal
      const taskToDelete = tasks.find((task) => task._id === taskId);

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
         setTasks((prevTasks) => prevTasks.filter((task) => task._id !== deleteModal.taskId));
         setIsDeleteFormVisible(false); // Close the form after successful deletion
         setApiError('');

         // Close the modal
         setDeleteModal({
            isOpen: false,
            taskId: null,
            taskName: '',
            isDeleting: false,
         });

         // Note: We don't create a success notification here because the backend already sends one
      } catch (error) {
         console.error('Error deleting task:', error);
         setApiError(error.message || 'Failed to delete task. Please try again.');
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
      <div className="w-full sm:w-11/12 md:w-10/12 lg:w-11/12 dark:from-gray-900 dark:to-gray-800 p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6">
         <div className="max-w-7xl mx-auto px-1 sm:px-2 md:px-4 lg:px-6">
            {/* Main Content */}
            <div className="space-y-2 sm:space-y-4 md:space-y-6">
               <AddTask
                  SetisAddFormVisible={handleisAddFormVisible}
                  setisDeleteFormVisible={handleisDeleteFormVisible}
                  onSearchChange={handleSearchChange}
               />
               {apiError && (
                  <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-3 rounded text-xs sm:text-sm md:text-base">
                     {apiError}
                  </div>
               )}

               {isLoading ? (
                  <div className="flex justify-center items-center h-24 sm:h-32 md:h-40">
                     <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-white dark:border-gray-300"></div>
                  </div>
               ) : (
                  <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-2 sm:p-3 md:p-4 lg:p-6">
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

export default Dashboard;
