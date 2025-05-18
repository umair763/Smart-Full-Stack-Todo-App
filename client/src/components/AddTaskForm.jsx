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

   function handleForm(e) {
      e.preventDefault();

      const newTaskObj = {
         color,
         task,
         date,
         time,
         status: false,
      };
      addTask(newTaskObj);
      SetisAddFormVisible();
   }

   return (
      <form
         className="grid gap-1 p-2 mx-auto mt-6 rounded-xl shadow-lg w-full max-w-sm bg-teal-500 text-white"
         onSubmit={handleForm}
      >
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <label className="text-sm md:text-base">Choose color</label>
            <select
               className="bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
               onChange={(e) => setColor(e.target.value)}
               required
            >
               <option value="">set color</option>
               <option value="red">red</option>
               <option value="yellow">yellow</option>
               <option value="green">green</option>
            </select>

            <label className="text-sm md:text-base">Write task</label>
            <input
               type="text"
               className="bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
               onChange={(e) => setTask(e.target.value)}
               required
            />

            <label className="text-sm md:text-base">Set Date</label>
            <input
               type="date"
               className="bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
               onChange={(e) => setDate(convertToDateFormat(e.target.value))}
               required
            />

            <label className="text-sm md:text-base">Set time</label>
            <input
               type="time"
               className="bg-teal-200 border-2 border-teal-600 rounded-lg text-gray-900 text-sm md:text-base p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
               onChange={(e) => setTime(convertTo12HourFormat(e.target.value))}
               required
            />
         </div>

         <div className="flex justify-between mt-2">
            <button
               type="submit"
               className="bg-gradient-to-br from-green-300 to-green-700 text-white font-medium py-1 rounded-lg shadow hover:shadow-md transition duration-300 w-full mr-1"
            >
               Confirm
            </button>
            <button
               type="button"
               className="bg-gradient-to-br from-gray-600 to-gray-800 text-white font-medium py-1 rounded-lg shadow hover:shadow-md transition duration-300 w-full"
               onClick={SetisAddFormVisible}
            >
               Close
            </button>
         </div>
      </form>
   );
}

export default AddTaskForm;
