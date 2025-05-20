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
   const [isAddFormVisible, setIsAddFormVisible] = useState(false);
   const [isDeleteFormVisible, setIsDeleteFormVisible] = useState(false);
   const [tasks, setTasks] = useState([]);
   const [sortby, setSortBy] = useState('sortby');
   const [searchtask, setSearchTask] = useState('');
   const [isexceeded, setIFexceeded] = useState(false);
   const [apiError, setApiError] = useState(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
   const [selectedTask, setSelectedTask] = useState(null);

   useEffect(() => {
      const fetchTasks = async () => {
         setIsLoading(true);
         setApiError(null);

         try {
            const token = localStorage.getItem('token');
            if (!token) {
               throw new Error('No token found, please log in.');
            }

            const response = await fetch(`${API_BASE_URL}/api/tasks`, {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (!response.ok) {
               throw new Error(`Server returned ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            if (Array.isArray(data)) {
               setTasks(data);
            } else {
               console.error('Expected an array, but got:', data);
               setTasks([]);
            }
         } catch (error) {
            console.error('Error fetching tasks:', error);
            setApiError(error.message);
            setTasks([]);
         } finally {
            setIsLoading(false);
         }
      };

      fetchTasks();
   }, []);

   const handleisAddFormVisible = () => {
      setIsAddFormVisible((prev) => !prev);
      if (isDeleteFormVisible) setIsDeleteFormVisible(false);
   };

   const handleisDeleteFormVisible = () => {
      setIsDeleteFormVisible((prev) => !prev);
      if (isAddFormVisible) setIsAddFormVisible(false);
   };

   function handleAddNewTasks(task) {
      setApiError(null);
      const token = localStorage.getItem('token');

      fetch(`${API_BASE_URL}/api/tasks`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify(task),
      })
         .then((res) => {
            if (!res.ok) {
               throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
         })
         .then((newTask) => {
            setTasks([...tasks, newTask]);
            setIsAddFormVisible(false); // Close the form after successful addition
         })
         .catch((err) => {
            console.error('Error adding task:', err);
            setApiError('Failed to add task. Please try again.');
         });
   }

   const handleDeleteTask = async (taskId) => {
      setApiError(null);
      const token = localStorage.getItem('token');

      try {
         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to delete task: ${errorMessage}`);
         }

         setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
         setIsDeleteFormVisible(false); // Close the form after successful deletion
      } catch (error) {
         console.error('Error deleting task:', error);
         setApiError('Failed to delete task. Please try again.');
      }
   };

   // Convert date from dd/mm/yyyy format and time from hh:mm AM/PM to a Date object
   function convertToComparableDateTime(date, time) {
      const [day, month, year] = date.split('/');
      let [hours, minutes, ampm] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1, 4);

      // Convert hours to 24-hour format
      hours = Number.parseInt(hours);
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0; // Handle midnight

      // Create a Date object with the converted values
      return new Date(year, month - 1, day, hours, minutes);
   }

   function sortByDateTime(tasks) {
      const now = new Date();

      return tasks.sort((a, b) => {
         // Convert task dates and times to comparable formats
         const dateA = convertToComparableDateTime(a.date, a.time);
         const dateB = convertToComparableDateTime(b.date, b.time);

         // Compare by date (earlier date comes first)
         if (dateA < now && dateB >= now) return -1; // A has exceeded, comes first
         if (dateA >= now && dateB < now) return 1; // B has exceeded, comes first

         if (dateA < dateB) return -1;
         if (dateA > dateB) return 1;

         // If dates are equal, compare by time
         return dateA - dateB;
      });
   }

   const sorted = [...tasks];

   if (sortby === 'Task') {
      // Sort tasks alphabetically by task name
      sorted.sort((a, b) => a.task.localeCompare(b.task));
   } else if (sortby === 'Time') {
      // Sort tasks by time
      sortByDateTime(sorted);
   }

   let searched = sorted;
   if (searchtask) {
      searched = sorted.filter((el) => el.task.toLowerCase().includes(searchtask.toLowerCase()));
   }

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
                  setSort={setSortBy}
                  setSearch={setSearchTask}
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
                     <TodoListParser todolist={searched} setexceeded={isexceeded} settask={setTasks} />
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
