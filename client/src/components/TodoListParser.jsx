import { useState, useEffect } from 'react';
import './AllComponentsStyle.css';
import DisplayTodoList from './DisplayTodoList';

// Function to check if a task has exceeded its deadline
function isDeadlineExceeded(task) {
   const now = new Date(); // Current date and time
   const taskDateTime = convertToComparableDateTime(task.date, task.time);

   // Extract just the date part from the current time for comparison (ignoring the time part)
   const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

   // Extract just the date part from the task date for comparison (ignoring the time part)
   const taskDateOnly = new Date(taskDateTime.getFullYear(), taskDateTime.getMonth(), taskDateTime.getDate());

   // If the task date is before today, it's considered exceeded
   if (taskDateOnly < nowDateOnly) {
      return true;
   }

   // If the task date is today, check the time
   if (taskDateOnly.getTime() === nowDateOnly.getTime()) {
      // Compare times
      return taskDateTime < now; // If the task time is earlier than the current time, it's exceeded
   }

   // If the task is in the future, it's not exceeded
   return false;
}

// Convert date and time to comparable Date object
function convertToComparableDateTime(date, time) {
   const [day, month, year] = date.split('/');
   let [hours, minutes, ampm] = time.match(/(\d+):(\d+)\s(AM|PM)/).slice(1, 4);

   hours = parseInt(hours);
   if (ampm === 'PM' && hours < 12) hours += 12;
   if (ampm === 'AM' && hours === 12) hours = 0;

   return new Date(year, month - 1, day, hours, minutes);
}

function TodoListParser({ todolist, searched }) {
   const validTodoList = Array.isArray(todolist) ? todolist : [];
   const validSearchedList = Array.isArray(searched) ? searched : [];
   const displayList = validSearchedList.length > 0 ? validSearchedList : validTodoList;

   // Use state to store whether each task has exceeded the deadline
   const [exceededStatuses, setExceededStatuses] = useState([]);

   useEffect(() => {
      // Calculate exceeded statuses for all tasks and store them in state
      const statuses = displayList.map((task) => isDeadlineExceeded(task));
      setExceededStatuses(statuses);
   }, [displayList]); // Recalculate whenever the displayed list changes

   return (
      <>
         <div className="scrollableContainer">
            {displayList.length > 0 ? (
               displayList.map((list, i) => (
                  <DisplayTodoList
                     key={list._id || i}
                     list={list}
                     isexceeded={exceededStatuses[i]} // Pass the exceeded status for each task
                  />
               ))
            ) : (
               <NoTasksMessage />
            )}
         </div>
         <style jsx>{`
            .scrollableContainer {
               max-height: 45vh; /* Set height for the container, not tasks */
               overflow-y: auto; /* Enable scrolling for overflowing content */
            }

            .scrollableContainer::-webkit-scrollbar {
               width: 10px;
               margin-left: 2px;
            }
            .scrollableContainer::-webkit-scrollbar-thumb {
               background: rgba(5, 103, 189, 0.782);
               border-radius: 10px;
            }
            .scrollableContainer::-webkit-scrollbar-thumb:hover {
               background: rgba(3, 90, 166, 0.782);
            }
            .scrollableContainer::-webkit-scrollbar-track {
               background: rgb(133, 198, 255);
               border-radius: 10px;
            }
         `}</style>
      </>
   );
}

export default TodoListParser;

const NoTasksMessage = () => {
   return (
      <div className="flex flex-col items-center justify-center h-full w-full mt-3">
         <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 shadow-lg">
            <h2 className="text-2xl font-semibold text-center text-white">No Tasks Available</h2>
            <p className="text-center text-gray-200 mt-2">
               It seems you haven't added any tasks yet. Get started by adding a new task!
            </p>
         </div>
      </div>
   );
};
