'use client';

import { useState } from 'react';
import { FiLink, FiList, FiCalendar, FiChevronUp, FiChevronDown, FiStar } from 'react-icons/fi';

const ModernSortTabs = ({ onSortChange }) => {
   const [activeSort, setActiveSort] = useState('deadline');
   const [sortDirections, setSortDirections] = useState({
      deadline: 'asc',
      priority: 'asc',
      alphabetical: 'asc',
      dependencies: 'asc',
   });

   const handleSortChange = (sortType) => {
      if (sortType === activeSort) {
         // Toggle direction if clicking the same tab
         const newDirection = sortDirections[sortType] === 'asc' ? 'desc' : 'asc';
         setSortDirections((prev) => ({
            ...prev,
            [sortType]: newDirection,
         }));
         onSortChange(sortType, newDirection);
      } else {
         // Set new sort type with its current direction
         setActiveSort(sortType);
         onSortChange(sortType, sortDirections[sortType]);
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
               <DeadlineSortTab
                  icon={<FiCalendar />}
                  label="Deadline"
                  isActive={activeSort === 'deadline'}
                  direction={sortDirections.deadline}
                  onClick={() => handleSortChange('deadline')}
               />
               <PrioritySortTab
                  icon={<FiStar />}
                  label="Priority"
                  isActive={activeSort === 'priority'}
                  direction={sortDirections.priority}
                  onClick={() => handleSortChange('priority')}
               />
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

const DeadlineSortTab = ({ icon, label, isActive, direction, onClick }) => {
   return (
      <button
         onClick={onClick}
         className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
            isActive ? 'bg-[#9406E6] text-white' : 'bg-white/50 text-gray-700 hover:bg-white/80'
         }`}
         title={direction === 'asc' ? 'Sort by earliest deadline first' : 'Sort by latest deadline first'}
      >
         {icon}
         <span>{label}</span>
         {isActive && (direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />)}
      </button>
   );
};

const PrioritySortTab = ({ icon, label, isActive, direction, onClick }) => {
   return (
      <button
         onClick={onClick}
         className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
            isActive ? 'bg-[#9406E6] text-white' : 'bg-white/50 text-gray-700 hover:bg-white/80'
         }`}
         title={direction === 'asc' ? 'Sort by highest priority first' : 'Sort by lowest priority first'}
      >
         {icon}
         <span>{label}</span>
         {isActive && (direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />)}
      </button>
   );
};

export default ModernSortTabs;
