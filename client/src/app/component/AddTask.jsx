import { useState } from 'react';

function AddTask({ SetisAddFormVisible, setisDeleteFormVisible, setSort, setSearch }) {
   return (
      <>
         {/* Add Task Container */}
         <div className="grid grid-cols-[80px,2fr,1fr] gap-1 items-center px-3 py-2 w-full bg-[#C8F0F3]/90 rounded-xl max-[350px]:grid-cols-[40px,1fr,1fr] max-[300px]:grid-cols-[1fr] max-[300px]:text-center">
            <p className="col-span-1 text-center text-base md:text-lg sm:text-base">
               <span className="inline-flex justify-center">
                  <span className="animate-[waveFloat_1.5s_ease-in-out_infinite]">🔴</span>
                  <span className="animate-[waveFloat_1.5s_ease-in-out_infinite_0.25s] mx-0">🟡</span>
                  <span className="animate-[waveFloat_1.5s_ease-in-out_infinite_0.5s]">🟢</span>
               </span>
            </p>
            <input
               type="search"
               className="col-span-1 text-xs md:text-sm bg-transparent outline-none placeholder:text-gray-400 w-full max-[300px]:w-full"
               placeholder="Search..."
               onChange={(e) => setSearch(e.target.value)}
            />

            <select
               className="col-span-1 h-8 text-xs md:text-sm bg-[#C8F0F3]/90 border-2 border-[#19D9E7]/90 rounded-md ml-2 max-[350px]:ml-0 max-[300px]:w-full"
               onChange={(e) => setSort(e.target.value)}
            >
               <option>Sort by</option>
               <option>Task</option>
               <option>Time</option>
            </select>
         </div>

         {/* Button Container */}
         <div className="flex justify-end px-2 py-1 mt-1 w-full pb-3">
            <button
               className="px-3 py-1 mr-2 bg-gradient-to-r from-[#56ccf2] to-[#2f80ed] text-white rounded-md shadow-md font-bold text-xs md:text-sm"
               onClick={SetisAddFormVisible}
            >
               Add Task
            </button>

            <button
               className="px-3 py-1 bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white rounded-md shadow-md font-bold text-xs md:text-sm"
               onClick={setisDeleteFormVisible}
            >
               Delete Task
            </button>
         </div>
      </>
   );
}

export default AddTask;
