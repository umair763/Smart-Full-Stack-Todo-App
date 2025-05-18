import { useState } from 'react';
// import './styles/AddTaskForm.css';

function AddTaskForm({ SetisAddFormVisible, addTask }) {
   const [color, setColor] = useState('');
   const [task, setTask] = useState('');
   const [date, setDate] = useState('');
   const [time, setTime] = useState('');

   function convertTo12HourFormat(time) {
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
   }

   function convertToDateFormat(date) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
   }

   function handleform(e) {
      e.preventDefault();

      const newTaskobj = {
         color,
         task,
         date,
         time,
         status: false,
      };
      console.log(newTaskobj);
      addTask(newTaskobj);
   }

   return (
      <>
         <form
            className="addtask-form grid gap-1 p-2 mx-auto mt-6 rounded-xl shadow-lg w-full max-w-sm bg-teal-500 text-white"
            onSubmit={handleform}
         >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
               <label className="text-sm md:text-base">Choose color</label>
               <select
                  className="addentrysortby bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={(e) => setColor(e.target.value)}
               >
                  <option>set color</option>
                  <option>red</option>
                  <option>yellow</option>
                  <option>green</option>
               </select>

               <label className="text-sm md:text-base">Write task</label>
               <input
                  type="text"
                  className="writeTask bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={(e) => setTask(e.target.value)}
               />

               <label className="text-sm md:text-base">Set Date</label>
               <input
                  type="date"
                  className="settime bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={(e) => setDate(convertToDateFormat(e.target.value))}
               />

               <label className="text-sm md:text-base">Set time</label>
               <input
                  type="time"
                  className="settime bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={(e) => setTime(convertTo12HourFormat(e.target.value))}
               />
            </div>

            <div className="flex justify-between mt-2">
               <button className="confirmbtn bg-gradient-to-br from-green-300 to-green-700 text-white font-medium py-1 rounded-lg shadow hover:shadow-md transition duration-300 w-full mr-1">
                  Confirm
               </button>
               <button
                  type="button"
                  className="closebtn bg-gradient-to-br from-gray-600 to-gray-800 text-white font-medium py-1 rounded-lg shadow hover:shadow-md transition duration-300 w-full"
                  onClick={SetisAddFormVisible}
               >
                  Close
               </button>
            </div>
         </form>
      </>
   );
}

export default AddTaskForm;
