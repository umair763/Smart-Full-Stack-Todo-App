'use client';
import { FiSearch, FiFilter } from 'react-icons/fi';

const SearchBar = ({ searchTerm, onSearchChange, onFilterToggle }) => {
   return (
      <div className="relative mb-4">
         <div className="flex items-center bg-white/30 rounded-full px-4 py-2 w-full max-w-md">
            <FiSearch className="text-white mr-2" />
            <input
               type="text"
               placeholder="Search tasks, comments, descriptions..."
               value={searchTerm}
               onChange={(e) => onSearchChange(e.target.value)}
               className="bg-transparent border-none outline-none flex-grow text-white placeholder-white/70"
            />
            <button
               onClick={onFilterToggle}
               className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
               title="Toggle filters"
            >
               <FiFilter className="text-white" />
            </button>
         </div>
      </div>
   );
};

export default SearchBar;
