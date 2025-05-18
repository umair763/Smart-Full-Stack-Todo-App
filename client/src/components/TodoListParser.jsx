'use client';

import { useState, useEffect } from 'react';
import DisplayTodoList from './DisplayTodoList';
import EditTaskModal from './EditTaskModal';
import ConfirmationModal from './ConfirmationModal';

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

   hours = Number.parseInt(hours);
   if (ampm === 'PM' && hours < 12) hours += 12;
   if (ampm === 'AM' && hours === 12) hours = 0;

   return new Date(year, month - 1, day, hours, minutes);
}

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TodoListParser({ todolist, searched }) {
   const validTodoList = Array.isArray(todolist) ? todolist : [];
   const validSearchedList = Array.isArray(searched) ? searched : [];
   const displayList = validSearchedList.length > 0 ? validSearchedList : validTodoList;

   // Use state to store whether each task has exceeded the deadline
   const [exceededStatuses, setExceededStatuses] = useState([]);

   // State for edit modal
   const [editModalOpen, setEditModalOpen] = useState(false);
   const [taskToEdit, setTaskToEdit] = useState(null);

   // State for delete confirmation modal
   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
   const [taskIdToDelete, setTaskIdToDelete] = useState(null);

   // State for API errors
   const [apiError, setApiError] = useState(null);

   useEffect(() => {
      // Calculate exceeded statuses for all tasks and store them in state
      const statuses = displayList.map((task) => isDeadlineExceeded(task));
      setExceededStatuses(statuses);
   }, [displayList]); // Recalculate whenever the displayed list changes

   // Handle edit task
   const handleEditTask = (task) => {
      setTaskToEdit(task);
      setEditModalOpen(true);
   };

   // Handle save edited task
   const handleSaveTask = async (updatedTask) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${updatedTask._id}`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedTask),
         });

         if (!response.ok) {
            throw new Error('Failed to update task');
         }

         // Close modal and refresh tasks
         setEditModalOpen(false);

         // Update the task in the local state
         // Note: In a real app, you might want to trigger a refresh of the tasks from the parent component
         window.location.reload();
      } catch (error) {
         setApiError(error.message);
      }
   };

   // Handle delete task
   const handleDeleteClick = (taskId) => {
      setTaskIdToDelete(taskId);
      setDeleteModalOpen(true);
   };

   // Handle confirm delete
   const handleConfirmDelete = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/${taskIdToDelete}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete task');
         }

         // Close modal and refresh tasks
         setDeleteModalOpen(false);

         // Update the task list in the local state
         // Note: In a real app, you might want to trigger a refresh of the tasks from the parent component
         window.location.reload();
      } catch (error) {
         setApiError(error.message);
         setDeleteModalOpen(false);
      }
   };

   return (
      <div className="max-h-[45vh] overflow-y-auto [&::-webkit-scrollbar]:w-[10px] [&::-webkit-scrollbar]:ml-[2px] [&::-webkit-scrollbar-thumb]:bg-[rgba(5,103,189,0.782)] [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(3,90,166,0.782)] [&::-webkit-scrollbar-track]:bg-[rgb(133,198,255)] [&::-webkit-scrollbar-track]:rounded-[10px]">
         {apiError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{apiError}</div>
         )}

         {displayList.length > 0 ? (
            displayList.map((list, i) => (
               <DisplayTodoList
                  key={list._id || i}
                  list={list}
                  isexceeded={exceededStatuses[i]} // Pass the exceeded status for each task
                  onEdit={handleEditTask}
                  onDelete={handleDeleteClick}
               />
            ))
         ) : (
            <NoTasksMessage />
         )}

         {/* Edit Task Modal */}
         {editModalOpen && (
            <EditTaskModal task={taskToEdit} onClose={() => setEditModalOpen(false)} onSave={handleSaveTask} />
         )}

         {/* Delete Confirmation Modal */}
         {deleteModalOpen && (
            <ConfirmationModal
               message="Are you sure you want to delete this task? This action cannot be undone."
               onConfirm={handleConfirmDelete}
               onCancel={() => setDeleteModalOpen(false)}
            />
         )}
      </div>
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
