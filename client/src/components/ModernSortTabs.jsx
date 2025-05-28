'use client';

import { useState } from 'react';
import { FiLink, FiList, FiCalendar, FiChevronUp, FiChevronDown, FiStar, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { HiSortAscending, HiSortDescending, HiSparkles, HiClock, HiViewGrid } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';

const ModernSortTabs = ({ onSortChange }) => {
   const { isDark } = useTheme();
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
      <div className={`p-1 sm:p-1 md:p-2 rounded-xl mb-3 sm:mb-4 ${isDark ? 'bg-gray-800 ' : 'bg-gray-100 '}`}>
         {/* Mobile Layout (< 640px) - Enhanced Grid */}
         <div className="sm:hidden">
            <div className="flex items-center justify-center mb-3">
               <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
                  isDark={isDark}
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
                  isDark={isDark}
               />
               <EnhancedSortTab
                  icon={<FiList />}
                  label="A-Z"
                  isActive={activeSort === 'alphabetical'}
                  onClick={() => handleSortChange('alphabetical')}
                  isMobile={true}
                  color="from-green-500 to-emerald-600"
                  isDark={isDark}
               />
               <EnhancedSortTab
                  icon={<FiLink />}
                  label="Deps"
                  isActive={activeSort === 'dependencies'}
                  onClick={() => handleSortChange('dependencies')}
                  isMobile={true}
                  color="from-orange-500 to-red-600"
                  isDark={isDark}
               />
            </div>
         </div>

         {/* Desktop Layout (>= 640px) - Enhanced Horizontal */}
         <div className="hidden sm:block">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
               <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg shadow-md">
                     <HiViewGrid className="h-5 w-5 text-white" />
                  </div>
                  <div>
                     <h3 className={`font-bold text-base lg:text-lg ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        Sort Tasks
                     </h3>
                     <p className={`text-xs lg:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Choose your preferred sorting method
                     </p>
                  </div>
               </div>

               <div className="flex flex-wrap gap-2 lg:gap-3">
                  <EnhancedSortTab
                     icon={<FiLink />}
                     label="Dependencies"
                     isActive={activeSort === 'dependencies'}
                     onClick={() => handleSortChange('dependencies')}
                     color="from-orange-500 to-red-600"
                     isDark={isDark}
                  />
                  <EnhancedSortTab
                     icon={<FiList />}
                     label="Alphabetical"
                     isActive={activeSort === 'alphabetical'}
                     onClick={() => handleSortChange('alphabetical')}
                     color="from-green-500 to-emerald-600"
                     isDark={isDark}
                  />
                  <EnhancedDeadlineSortTab
                     icon={<HiClock />}
                     label="Deadline"
                     isActive={activeSort === 'deadline'}
                     direction={sortDirections.deadline}
                     onClick={() => handleSortChange('deadline')}
                     color="from-blue-500 to-indigo-600"
                     isDark={isDark}
                  />
                  <EnhancedPrioritySortTab
                     icon={<HiSparkles />}
                     label="Priority"
                     isActive={activeSort === 'priority'}
                     direction={sortDirections.priority}
                     onClick={() => handleSortChange('priority')}
                     color="from-purple-500 to-pink-600"
                     isDark={isDark}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

const EnhancedSortTab = ({ icon, label, isActive, onClick, isMobile, direction, showArrow, color, isDark }) => {
   if (isMobile) {
      return (
         <button
            onClick={onClick}
            className={`group relative overflow-hidden flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
               isActive
                  ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                  : isDark
                  ? 'bg-gray-600/80 text-gray-200 hover:bg-gray-500/90 hover:shadow-md border border-gray-500/30'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-lg border border-gray-200'
            }`}
         >
            <div className="flex items-center justify-center mb-1">
               <span
                  className={`text-sm transition-transform duration-200 ${
                     isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`}
               >
                  {icon}
               </span>
               {showArrow && isActive && direction && (
                  <span className="ml-1 animate-bounce">
                     {direction === 'asc' ? <FiArrowUp className="text-xs" /> : <FiArrowDown className="text-xs" />}
                  </span>
               )}
            </div>
            <span className="text-xs font-semibold leading-tight text-center">{label}</span>

            {/* Animated background effect */}
            {isActive && (
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-lg"></div>
            )}
         </button>
      );
   }

   return (
      <button
         onClick={onClick}
         className={`group relative overflow-hidden flex items-center space-x-1.5 px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md ${
            isActive
               ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
               : isDark
               ? 'bg-gray-600/80 text-gray-200 hover:bg-gray-500/95 hover:shadow-lg border border-gray-500/30'
               : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-lg border border-gray-200'
         }`}
      >
         <span
            className={`text-sm transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
         >
            {icon}
         </span>
         <span className="font-semibold text-sm">{label}</span>

         {/* Animated background effect */}
         {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-lg"></div>
         )}
      </button>
   );
};

const EnhancedDeadlineSortTab = ({ icon, label, isActive, direction, onClick, color, isDark }) => {
   return (
      <button
         onClick={onClick}
         className={`group relative overflow-hidden flex items-center space-x-1.5 px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md ${
            isActive
               ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
               : isDark
               ? 'bg-gray-600/80 text-gray-200 hover:bg-gray-500/95 hover:shadow-lg border border-gray-500/30'
               : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-lg border border-gray-200'
         }`}
         title={direction === 'asc' ? 'Sort by earliest deadline first' : 'Sort by latest deadline first'}
      >
         <span
            className={`text-sm transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
         >
            {icon}
         </span>
         <span className="font-semibold text-sm">{label}</span>
         {isActive && (
            <span className="ml-1 animate-bounce">
               {direction === 'asc' ? <FiArrowUp className="text-xs" /> : <FiArrowDown className="text-xs" />}
            </span>
         )}

         {/* Animated background effect */}
         {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-lg"></div>
         )}
      </button>
   );
};

const EnhancedPrioritySortTab = ({ icon, label, isActive, direction, onClick, color, isDark }) => {
   return (
      <button
         onClick={onClick}
         className={`group relative overflow-hidden flex items-center space-x-1.5 px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md ${
            isActive
               ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
               : isDark
               ? 'bg-gray-600/80 text-gray-200 hover:bg-gray-500/95 hover:shadow-lg border border-gray-500/30'
               : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-lg border border-gray-200'
         }`}
         title={direction === 'asc' ? 'Sort by highest priority first' : 'Sort by lowest priority first'}
      >
         <span
            className={`text-sm transition-transform duration-200 ${
               isActive ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-12'
            }`}
         >
            {icon}
         </span>
         <span className="font-semibold text-sm">{label}</span>
         {isActive && (
            <span className="ml-1 animate-bounce">
               {direction === 'asc' ? <FiArrowUp className="text-xs" /> : <FiArrowDown className="text-xs" />}
            </span>
         )}

         {/* Animated background effect */}
         {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-lg"></div>
         )}
      </button>
   );
};

export default ModernSortTabs;
