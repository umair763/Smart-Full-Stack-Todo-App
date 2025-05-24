'use client';

import { useState } from 'react';
import { 
   FiLink, 
   FiList, 
   FiCalendar, 
   FiChevronUp, 
   FiChevronDown, 
   FiStar,
   FiArrowUp,
   FiArrowDown
} from 'react-icons/fi';
import { 
   HiSortAscending, 
   HiSortDescending,
   HiSparkles,
   HiClock,
   HiViewGrid
} from 'react-icons/hi';

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
      <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 backdrop-blur-sm border border-white/30 p-2 sm:p-3 md:p-4 rounded-xl mb-3 sm:mb-4 shadow-lg">
         {/* Mobile Layout (< 640px) - Enhanced Grid */}
         <div className="sm:hidden">
            <div className="flex items-center justify-center mb-3">
               <div className="flex items-center space-x-2 text-gray-700">
                  <HiViewGrid className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-sm">Sort Tasks By</span>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
               <EnhancedSortTab
                  icon={<HiClock />}
                  label="Deadline"
                  isActive={activeSort === 'deadline'}
                  direction={activeSort === 'deadline' ? sortDirections.deadline : null}
                  onClick={() => handleSortChange('deadline')}
                  isMobile={true}
                  showArrow={true}
                  color="from-blue-500 to-indigo-600"
               />
               <EnhancedSortTab
                  icon={<HiSparkles />}
                  label="Priority"
                  isActive={activeSort === 'priority'}
                  direction={activeSort === 'priority' ? sortDirections.priority : null}
                  onClick={() => handleSortChange('priority')}
                  isMobile={true}
                  showArrow={true}
                  color="from-purple-500 to-pink-600"
               />
               <EnhancedSortTab
                  icon={<FiList />}
                  label="A-Z"
                  isActive={activeSort === 'alphabetical'}
                  onClick={() => handleSortChange('alphabetical')}
                  isMobile={true}
                  color="from-green-500 to-emerald-600"
               />
               <EnhancedSortTab
                  icon={<FiLink />}
                  label="Deps"
                  isActive={activeSort === 'dependencies'}
                  onClick={() => handleSortChange('dependencies')}
                  isMobile={true}
                  color="from-orange-500 to-red-600"
               />
            </div>
         </div>

         {/* Desktop Layout (>= 640px) - Enhanced Horizontal */}
         <div className="hidden sm:block">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
               <div className="flex items-center space-x-2 text-gray-700">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg shadow-md">
                     <HiViewGrid className="h-5 w-5 text-white" />
                  </div>
                  <div>
                     <h3 className="font-bold text-base lg:text-lg text-gray-800">Sort Tasks</h3>
                     <p className="text-xs lg:text-sm text-gray-600">Choose your preferred sorting method</p>
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-2 lg:gap-3">
                  <EnhancedSortTab
                     icon={<FiLink />}
                     label="Dependencies"
                     isActive={activeSort === 'dependencies'}
                     onClick={() => handleSortChange('dependencies')}
                     color="from-orange-500 to-red-600"
                  />
                  <EnhancedSortTab
                     icon={<FiList />}
                     label="Alphabetical"
                     isActive={activeSort === 'alphabetical'}
                     onClick={() => handleSortChange('alphabetical')}
                     color="from-green-500 to-emerald-600"
                  />
                  <EnhancedDeadlineSortTab
                     icon={<HiClock />}
                  label="Deadline"
                  isActive={activeSort === 'deadline'}
                     direction={sortDirections.deadline}
                  onClick={() => handleSortChange('deadline')}
                     color="from-blue-500 to-indigo-600"
               />
                  <EnhancedPrioritySortTab
                     icon={<HiSparkles />}
                  label="Priority"
                  isActive={activeSort === 'priority'}
                     direction={sortDirections.priority}
                  onClick={() => handleSortChange('priority')}
                     color="from-purple-500 to-pink-600"
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

const EnhancedSortTab = ({ icon, label, isActive, onClick, isMobile, direction, showArrow, color }) => {
   if (isMobile) {
      return (
         <button
            onClick={onClick}
            className={`group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
               isActive 
                  ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105` 
                  : 'bg-white/70 text-gray-700 hover:bg-white/90 hover:shadow-md'
            }`}
         >
            <div className="flex items-center justify-center mb-2">
               <span className={`text-lg transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
               }`}>
                  {icon}
               </span>
               {showArrow && isActive && direction && (
                  <span className="ml-2 animate-bounce">
                     {direction === 'asc' ? (
                        <FiArrowUp className="text-sm" />
                     ) : (
                        <FiArrowDown className="text-sm" />
                     )}
                  </span>
               )}
            </div>
            <span className="text-xs font-semibold leading-tight text-center">{label}</span>
            
            {/* Animated background effect */}
            {isActive && (
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-xl"></div>
            )}
         </button>
      );
   }

   return (
      <button
         onClick={onClick}
         className={`group relative overflow-hidden flex items-center space-x-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md ${
            isActive 
               ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105` 
               : 'bg-white/80 text-gray-700 hover:bg-white/95 hover:shadow-lg'
         }`}
      >
         <span className={`text-sm lg:text-base transition-transform duration-200 ${
            isActive ? 'scale-110' : 'group-hover:scale-110'
         }`}>
            {icon}
         </span>
         <span className="font-semibold text-sm lg:text-base">{label}</span>
         
         {/* Animated background effect */}
         {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-xl"></div>
         )}
      </button>
   );
};

const EnhancedDeadlineSortTab = ({ icon, label, isActive, direction, onClick, color }) => {
   return (
      <button
         onClick={onClick}
         className={`group relative overflow-hidden flex items-center space-x-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md ${
            isActive 
               ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105` 
               : 'bg-white/80 text-gray-700 hover:bg-white/95 hover:shadow-lg'
         }`}
         title={direction === 'asc' ? 'Sort by earliest deadline first' : 'Sort by latest deadline first'}
      >
         <span className={`text-sm lg:text-base transition-transform duration-200 ${
            isActive ? 'scale-110' : 'group-hover:scale-110'
         }`}>
            {icon}
         </span>
         <span className="font-semibold text-sm lg:text-base">{label}</span>
         {isActive && (
            <span className="ml-2 animate-bounce">
               {direction === 'asc' ? (
                  <HiSortAscending className="text-sm lg:text-base" />
               ) : (
                  <HiSortDescending className="text-sm lg:text-base" />
               )}
            </span>
         )}
         
         {/* Animated background effect */}
         {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-xl"></div>
         )}
      </button>
   );
};

const EnhancedPrioritySortTab = ({ icon, label, isActive, direction, onClick, color }) => {
   return (
      <button
         onClick={onClick}
         className={`group relative overflow-hidden flex items-center space-x-2 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md ${
            isActive 
               ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105` 
               : 'bg-white/80 text-gray-700 hover:bg-white/95 hover:shadow-lg'
         }`}
         title={direction === 'asc' ? 'Sort by highest priority first' : 'Sort by lowest priority first'}
      >
         <span className={`text-sm lg:text-base transition-transform duration-200 ${
            isActive ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-12'
         }`}>
         {icon}
         </span>
         <span className="font-semibold text-sm lg:text-base">{label}</span>
         {isActive && (
            <span className="ml-2 animate-bounce">
               {direction === 'asc' ? (
                  <HiSortAscending className="text-sm lg:text-base" />
               ) : (
                  <HiSortDescending className="text-sm lg:text-base" />
               )}
            </span>
         )}
         
         {/* Animated background effect */}
         {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-xl"></div>
         )}
      </button>
   );
};

export default ModernSortTabs;
