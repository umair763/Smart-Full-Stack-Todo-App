'use client';

import { useState } from 'react';
import { FiLink, FiList, FiCalendar, FiChevronUp, FiChevronDown, FiStar } from 'react-icons/fi';

const ModernSortTabs = ({ onSortChange }) => {
   const [activeSort, setActiveSort] = useState('deadline');
   const [sortDirection, setSortDirection] = useState('asc');

   const handleSortChange = (sortType) => {
      if (sortType === activeSort) {
         // Toggle direction if clicking the same tab
         const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
         setSortDirection(newDirection);
         onSortChange(sortType, newDirection);
      } else {
         // Set new sort type with default direction
         setActiveSort(sortType);
         setSortDirection('asc');
         onSortChange(sortType, 'asc');
      }
   };

   return (
      <div className="bg-gradient-to-r from-purple-200 to-blue-200 p-2 rounded-lg mb-4">
         <div className="flex justify-between items-center">
            <div className="text-gray-700 font-medium">Sort Tasks By:</div>
            <div className="flex space-x-2">
               <SortTab
                  icon={<FiLink />}
                  label="Dependencies"
                  isActive={activeSort === 'dependencies'}
                  onClick={() => handleSortChange('dependencies')}
               />
               <SortTab
                  icon={<FiList />}
                  label="A-Z"
                  isActive={activeSort === 'alphabetical'}
                  onClick={() => handleSortChange('alphabetical')}
               />
               <SortTab
                  icon={<FiCalendar />}
                  label="Deadline"
                  isActive={activeSort === 'deadline'}
                  onClick={() => handleSortChange('deadline')}
               />
               <SortTab
                  icon={<FiStar />}
                  label="Priority"
                  isActive={activeSort === 'priority'}
                  onClick={() => handleSortChange('priority')}
               />
               <button
                  onClick={() => {
                     const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                     setSortDirection(newDirection);
                     onSortChange(activeSort, newDirection);
                  }}
                  className="p-2 bg-white/50 hover:bg-white/80 rounded-md transition-colors"
                  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
               >
                  {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
               </button>
            </div>
         </div>
      </div>
   );
};

const SortTab = ({ icon, label, isActive, onClick }) => {
   return (
      <button
         onClick={onClick}
         className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
            isActive ? 'bg-[#9406E6] text-white' : 'bg-white/50 text-gray-700 hover:bg-white/80'
         }`}
      >
         {icon}
         <span>{label}</span>
      </button>
   );
};

export default ModernSortTabs;
