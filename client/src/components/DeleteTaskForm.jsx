import { useState } from 'react';
import './styles/DeleteTaskForm.css';

function DeleteTaskForm({ tasks, setisDeleteFormVisible, deleteTask }) {
   const [selectedTaskId, setSelectedTaskId] = useState(''); // Track the selected task ID

   function handleform(e) {
      e.preventDefault();
      if (selectedTaskId) {
         deleteTask(selectedTaskId); // Pass the task's MongoDB _id to the delete function
         setSelectedTaskId('');
      } else {
         console.error('No task selected for deletion.');
      }
   }

   return (
      <>
         <form
            className="grid gap-1 grid-cols-1 p-4 mx-auto mt-6 rounded-xl shadow-lg w-full max-w-sm bg-[#E65D41] text-white"
            onSubmit={handleform}
         >
            <div className="grid grid-cols-2 gap-1 items-center">
               <label className="text-sm">Select Task</label>
               <select
                  className="addentrysortby2 bg-#EB5D41 rounded-lg text-gray-900 text-sm xs:pl-1 sm:pl-1 md:pl-1"
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  value={selectedTaskId}
               >
                  <option value="">Select a task</option>
                  {tasks.map((task) => (
                     <option key={task._id} value={task._id}>
                        {task.task} ({task.date}) ({task.time})
                     </option>
                  ))}
               </select>
            </div>

            <div className="flex justify-between mt-2">
               <button className="confirmbtn2 bg-gradient-to-br from-red-500 to-red-700 text-white font-medium py-1 rounded-lg shadow hover:shadow-md transition duration-300 w-full mr-1">
                  Confirm
               </button>
               <button
                  type="button"
                  className="closebtnn bg-gradient-to-br from-gray-600 to-gray-800 text-white font-medium py-1 rounded-lg shadow hover:shadow-md transition duration-300 w-full"
                  onClick={setisDeleteFormVisible}
               >
                  Close
               </button>
            </div>
         </form>
      </>
   );
}

export default DeleteTaskForm;
