'use client';

import { useState, useEffect } from 'react';

function EditTaskModal({ task, onClose, onSave }) {
   const [color, setColor] = useState(task?.color || '');
   const [taskText, setTaskText] = useState(task?.task || '');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');

   useEffect(() => {
      if (task) {
         setColor(task.color || '');
         setTaskText(task.task || '');

         // Convert date from dd/mm/yyyy to yyyy-mm-dd for input
         if (task.date) {
            const [day, month, year] = task.date.split('/');
            setDate(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
         }

         // Convert time from h:mm AM/PM to HH:mm for input
         if (task.time) {
            const timeMatch = task.time.match(/(\d+):(\d+)\s(AM|PM)/);
            if (timeMatch) {
               let [_, hours, minutes, ampm] = timeMatch;
               hours = Number.parseInt(hours);

               // Convert to 24-hour format
               if (ampm === 'PM' && hours < 12) hours += 12;
               if (ampm === 'AM' && hours === 12) hours = 0;

               setTime(`${hours.toString().padStart(2, '0')}:${minutes}`);
            }
         }
      }
   }, [task]);

   function convertTo12HourFormat(time) {
      let [hours, minutes] = time.split(':');
      hours = Number.parseInt(hours);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
   }

   function convertToDateFormat(date) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
   }

   function handleSubmit(e) {
      e.preventDefault();

      if (!color || !taskText || !date || !time) {
         alert('All fields are required');
         return;
      }

      const updatedTask = {
         ...task,
         color,
         task: taskText,
         date: convertToDateFormat(date),
         time: convertTo12HourFormat(time),
      };

      onSave(updatedTask);
   }

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Task</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-gray-700 font-medium mb-2">Color</label>
                  <select
                     value={color}
                     onChange={(e) => setColor(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                  >
                     <option value="">Select color</option>
                     <option value="red">Red</option>
                     <option value="yellow">Yellow</option>
                     <option value="green">Green</option>
                  </select>
               </div>

               <div>
                  <label className="block text-gray-700 font-medium mb-2">Task</label>
                  <input
                     type="text"
                     value={taskText}
                     onChange={(e) => setTaskText(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                  />
               </div>

               <div>
                  <label className="block text-gray-700 font-medium mb-2">Date</label>
                  <input
                     type="date"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                  />
               </div>

               <div>
                  <label className="block text-gray-700 font-medium mb-2">Time</label>
                  <input
                     type="time"
                     value={time}
                     onChange={(e) => setTime(e.target.value)}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                  />
               </div>

               <div className="flex justify-end space-x-3 pt-4">
                  <button
                     type="button"
                     onClick={onClose}
                     className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                     Save Changes
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}

export default EditTaskModal;
