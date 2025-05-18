import { useState, useEffect } from 'react';
import TodoListParser from '../component/TodoListParser';
import AddTask from '../component/AddTask';
import AddTaskForm from '../component/AddTaskForm';
import DeleteTaskForm from '../component/DeleteTaskForm';
import UserProfile from '../component/UserProfile';

function Dashboard() {
   const [isAddFormVisible, setIsAddFormVisible] = useState(false);
   const [isDeleteFormVisible, setIsDeleteFormVisible] = useState(false);
   const [tasks, setTasks] = useState([]);
   const [sortby, setSortBy] = useState('sortby');
   const [searchtask, setSearchTask] = useState('');
   const [isexceeded, setIFexceeded] = useState(false);

   useEffect(() => {
      const fetchTasks = async () => {
         try {
            const token = localStorage.getItem('token');
            if (!token) {
               throw new Error('No token found, please log in.');
            }

            const response = await fetch('https://smart-full-stack-todo-app.vercel.app/api/tasks', {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            });

            if (!response.ok) {
               throw new Error('Network response was not ok');
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
            setTasks([]);
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
      fetch('https://smart-full-stack-todo-app.vercel.app/api/tasks', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify(task),
      })
         .then((res) => {
            if (!res.ok) {
               throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
         })
         .then((newTask) => setTasks([...tasks, newTask]))
         .catch((err) => console.error('Error adding task:', err));
   }

   const handleDeleteTask = async (taskId) => {
      try {
         const response = await fetch(`https://smart-full-stack-todo-app.vercel.app/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
         });

         if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to delete task: ${errorMessage}`);
         }

         setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
      } catch (error) {
         console.error('Error deleting task:', error);
      }
   };

   // Convert date from dd/mm/yyyy format and time from hh:mm AM/PM to a Date object
   function convertToComparableDateTime(date, time) {
      const [day, month, year] = date.split('/');
      let [hours, minutes, ampm] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1, 4);

      // Convert hours to 24-hour format
      hours = parseInt(hours);
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

   let sorted = [...tasks];

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

   return (
      <div className="w-11/12 p-5 rounded-xl shadow-lg bg-gradient-to-br from-[#9406E6] to-[#00FFFF] grid grid-cols-1 md:grid-cols-[1.5fr,1fr] lg:grid-cols-[1.5fr,1fr] gap-4">
         <div className="div-1">
            <div className="text">
               <h1 className="text-4xl text-white font-extrabold mb-4">Todo App</h1>
               <h3 className="text-xl text-white font-semibold mb-6">
                  To-Do lists help us break life into small steps.
               </h3>
            </div>
            <AddTask
               SetisAddFormVisible={handleisAddFormVisible}
               setisDeleteFormVisible={handleisDeleteFormVisible}
               setSort={setSortBy}
               setSearch={setSearchTask}
            />
            <TodoListParser todolist={searched} setexceeded={isexceeded} settask={tasks} />
         </div>

         <div className="right-side">
            {isAddFormVisible && (
               <AddTaskForm addTask={handleAddNewTasks} SetisAddFormVisible={handleisAddFormVisible} />
            )}
            {isDeleteFormVisible && (
               <DeleteTaskForm
                  tasks={tasks}
                  deleteTask={handleDeleteTask}
                  setisDeleteFormVisible={handleisDeleteFormVisible}
               />
            )}
            {!isAddFormVisible && !isDeleteFormVisible && <UserProfile />}
         </div>
      </div>
   );
}

export default Dashboard;
