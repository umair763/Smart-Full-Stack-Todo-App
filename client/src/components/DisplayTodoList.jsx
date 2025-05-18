'use client';

import { useState } from 'react';

function DisplayTodoList({ list, isexceeded, onEdit, onDelete }) {
   const [marked, setMarked] = useState(false);

   function handleMarked() {
      setMarked((show) => !show);
   }

   return (
      <div className="grid grid-cols-[30px,1fr,1fr] w-[98%] px-4 py-2 mb-2 mt-2 rounded-lg text-[#1D1D1D] bg-[#C8F0F3]/90 items-center max-[300px]:grid-cols-[20px,1fr,1fr] max-[300px]:text-[9px] min-[301px]:max-[340px]:grid-cols-[22px,1fr,1fr] min-[301px]:max-[340px]:text-[10px] min-[341px]:max-[600px]:grid-cols-[25px,1fr,1fr] min-[341px]:max-[600px]:text-[11px] min-[601px]:grid-cols-[28px,1fr,1fr] min-[601px]:text-[12px]">
         <input
            type="radio"
            className={`w-4 h-4 rounded-full cursor-pointer appearance-none ${
               list.color === 'red'
                  ? 'bg-red-600 border-red-600'
                  : list.color === 'yellow'
                  ? 'bg-yellow-400 border-yellow-400'
                  : 'bg-green-600 border-green-600'
            }`}
         />

         <p className={`${marked ? 'line-through' : ''} font-bold text-left sm:text-base lg:text-md`}>{list.task}</p>
         <div className="flex justify-between items-center">
            <div className="flex flex-col items-start">
               <p className={`${marked ? 'line-through' : ''} font-bold text-left sm:text-base lg:text-md`}>
                  {list.date}
               </p>
               <p className="font-bold text-left sm:text-base text-red-700 lg:text-md">
                  {isexceeded ? 'Deadline exceeded' : ''}
               </p>
            </div>
            <p className={`${marked ? 'line-through' : ''} font-bold text-left sm:text-base lg:text-md`}>{list.time}</p>

            <div className="flex items-center space-x-2">
               {/* Edit Icon */}
               <button
                  onClick={() => onEdit(list)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Edit Task"
               >
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     className="h-5 w-5"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                     />
                  </svg>
               </button>

               {/* Delete Icon */}
               <button
                  onClick={() => onDelete(list._id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Task"
               >
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     className="h-5 w-5"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                     />
                  </svg>
               </button>

               {/* Checkbox */}
               <input
                  type="checkbox"
                  className="w-4 h-4 rounded-full border-2 border-indigo-600 cursor-pointer appearance-none checked:bg-[#573fff] checked:border-[#573fff] relative 
                 after:checked:content-['✓'] after:checked:absolute after:checked:top-1/2 after:checked:left-1/2 after:checked:transform after:checked:-translate-x-1/2 after:checked:-translate-y-1/2 after:checked:text-white after:checked:opacity-70
                 max-[300px]:after:checked:text-[12px] min-[301px]:max-[340px]:after:checked:text-[10px] min-[341px]:max-[600px]:after:checked:text-[16px] min-[601px]:after:checked:text-[18px]"
                  onClick={handleMarked}
               />
            </div>
         </div>
      </div>
   );
}

export default DisplayTodoList;
