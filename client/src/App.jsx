import { useState, useEffect, useSyncExternalStore } from 'react';
// import './App.css';
import TodoListParser from './components/TodoListParser';
import AddTask from './components/AddTask';
import AddTaskForm from './components/AddTaskForm';
import DeleteTaskForm from './components/DeleteTaskForm';
import LoginForm from './components/LoginForm';
import UserProfile from './components/UserProfile';

function App() {
   const [isAddFormVisible, setIsAddFormVisible] = useState(false);
   const [isDeleteFormVisible, setIsDeleteFormVisible] = useState(false);
   const [tasks, setTasks] = useState([]); // Initialize as an empty array
   const [sortby, setSortBy] = useState('sortby');
   const [searchtask, setSearchTask] = useState('');
   const [islogin, setlogin] = useState(false);
   const [isexceeded, setIFexceeded] = useState(false);

   useEffect(() => {
      const fetchTasks = async () => {
         try {
            const token = localStorage.getItem('token'); // Get token from localStorage
            if (!token) {
               throw new Error('No token found, please log in.');
            }

            const response = await fetch('http://localhost:5000/api/tasks', {
               headers: {
                  Authorization: `Bearer ${token}`, // Ensure 'Bearer' is included
               },
            });

            if (!response.ok) {
               throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (Array.isArray(data)) {
               setTasks(data); // Set tasks only for the logged-in user
            } else {
               console.error('Expected an array, but got:', data);
               setTasks([]);
            }
         } catch (error) {
            console.error('Error fetching tasks:', error);
            setTasks([]); // Set to an empty array on error
         }
      };

      fetchTasks();
   }, [islogin]); // Fetch tasks whenever the login state changes

   const handleisAddFormVisible = () => {
      setIsAddFormVisible((prev) => !prev);
      if (isDeleteFormVisible) setIsDeleteFormVisible(false);
   };

   const handleisDeleteFormVisible = () => {
      setIsDeleteFormVisible((prev) => !prev);
      if (isAddFormVisible) setIsAddFormVisible(false);
   };

   function handleAddNewTasks(task) {
      fetch('http://localhost:5000/api/tasks', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Ensure correct format
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
         const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
            // Add `/tasks/` before taskId
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
      const [day, month, year] = date.split('/'); // dd/mm/yyyy format
      let [hours, minutes, ampm] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1, 4);

      // Convert hours to 24-hour format
      hours = parseInt(hours);
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours == 12) hours = 0; // Handle midnight

      // Create a Date object with the converted values
      return new Date(year, month - 1, day, hours, minutes);
   }

   function sortByDateTime(tasks) {
      const now = new Date(); // Get the current date and time

      return tasks.sort((a, b) => {
         // Step 1: Convert task dates and times to comparable formats
         const dateA = convertToComparableDateTime(a.date, a.time);
         const dateB = convertToComparableDateTime(b.date, b.time);

         // Step 2: Compare by date (earlier date comes first)
         if (dateA < now && dateB >= now) return -1; // A has exceeded, comes first
         if (dateA >= now && dateB < now) return 1; // B has exceeded, comes first

         if (dateA < dateB) return -1;
         if (dateA > dateB) return 1;

         // Step 3: If dates are equal, compare by time
         return dateA - dateB;
      });
   }

   let sorted = [...tasks]; // Ensure this is always an array

   if (sortby === 'Task') {
      // Sort tasks alphabetically by task name
      sorted.sort((a, b) => a.task.localeCompare(b.task));
   } else if (sortby === 'Time') {
      // Now sorting tasks by time
      sortByDateTime(tasks);
   }

   let searched = sorted;
   if (searchtask) {
      searched = sorted.filter((el) => el.task.toLowerCase().includes(searchtask.toLowerCase()));
   }

   return (
      <>
         {!islogin ? (
            <LoginForm setlogin={setlogin} />
         ) : (
            <div className="min-h-screen bg-gradient-to-br from-[#0172af] to-[#74febd] flex justify-center items-center p-4">
               <div className="w-11/12  p-5 rounded-xl shadow-lg bg-gradient-to-br from-[#9406E6] to-[#00FFFF] grid grid-cols-1 md:grid-cols-[1.5fr,1fr] lg:grid-cols-[1.5fr,1fr] gap-4">
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
                     {!isAddFormVisible && !isDeleteFormVisible && <UserProfile setlogin={setlogin} />}
                  </div>
               </div>
            </div>
         )}
         <footer className="fixed bottom-0 left-0 w-full text-center py-2 bg-emerald-500 text-white">
            &copy; {new Date().getFullYear()} All rights reserved.
         </footer>
      </>
   );
}

export default App;
