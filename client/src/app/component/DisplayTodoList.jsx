import { useState } from 'react';

function DisplayTodoList({ list, isexceeded }) {
   const [marked, setMarked] = useState(false);

   function handleMarked() {
      setMarked((show) => !show);
   }

   return (
      <div className="grid grid-cols-[30px,1fr,1fr] w-[98%] px-4 py-2 mb-2 mt-2 rounded-lg text-[#1D1D1D] bg-[#C8F0F3]/90 items-center xs:grid-cols-[20px,1fr,1fr] xs:text-[9px] sm:grid-cols-[22px,1fr,1fr] sm:text-[10px] md:grid-cols-[25px,1fr,1fr] md:text-[11px] lg:grid-cols-[28px,1fr,1fr] lg:text-[12px]">
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
            <input
               type="checkbox"
               className="w-4 h-4 rounded-full border-2 border-indigo-600 cursor-pointer appearance-none checked:bg-[#573fff] checked:border-[#573fff] relative 
               after:checked:content-['✓'] after:checked:absolute after:checked:top-1/2 after:checked:left-1/2 after:checked:transform after:checked:-translate-x-1/2 after:checked:-translate-y-1/2 after:checked:text-white after:checked:opacity-70
               after:checked:text-[12px] sm:after:checked:text-[10px] md:after:checked:text-[16px] lg:after:checked:text-[18px]"
               onClick={handleMarked}
            />
         </div>
      </div>
   );
}

export default DisplayTodoList;
