import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

const ThemeToggle = ({ variant = 'default', size = 'medium' }) => {
   const { theme, changeTheme, themes, actualTheme } = useTheme();

   const handleThemeChange = () => {
      // Cycle through themes: light -> dark -> system -> light
      switch (theme) {
         case themes.LIGHT:
            changeTheme(themes.DARK);
            break;
         case themes.DARK:
            changeTheme(themes.SYSTEM);
            break;
         case themes.SYSTEM:
         default:
            changeTheme(themes.LIGHT);
            break;
      }
   };

   const getIcon = () => {
      switch (theme) {
         case themes.LIGHT:
            return <FiSun className={getIconSize()} />;
         case themes.DARK:
            return <FiMoon className={getIconSize()} />;
         case themes.SYSTEM:
         default:
            return <FiMonitor className={getIconSize()} />;
      }
   };

   const getIconSize = () => {
      switch (size) {
         case 'small':
            return 'h-3 w-3';
         case 'large':
            return 'h-6 w-6';
         case 'medium':
         default:
            return 'h-4 w-4';
      }
   };

   const getButtonSize = () => {
      switch (size) {
         case 'small':
            return 'p-1.5';
         case 'large':
            return 'p-3';
         case 'medium':
         default:
            return 'p-2';
      }
   };

   const getVariantStyles = () => {
      switch (variant) {
         case 'header':
            return 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-white border border-white/20 dark:border-white/10';
         case 'sidebar':
            return 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600';
         case 'floating':
            return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-lg';
         case 'minimal':
            return 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100';
         case 'default':
         default:
            return 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600';
      }
   };

   const getTooltipText = () => {
      switch (theme) {
         case themes.LIGHT:
            return 'Switch to Dark Mode';
         case themes.DARK:
            return 'Switch to System Mode';
         case themes.SYSTEM:
         default:
            return `Switch to Light Mode (Currently: ${actualTheme})`;
      }
   };

   return (
      <button
         onClick={handleThemeChange}
         className={`
        ${getButtonSize()}
        ${getVariantStyles()}
        rounded-lg
        transition-all
        duration-300
        hover:scale-105
        active:scale-95
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500/50
        relative
        group
      `}
         title={getTooltipText()}
         aria-label={getTooltipText()}
      >
         <div className="relative flex items-center justify-center">
            {getIcon()}

            {/* Tooltip */}
            <div
               className="
          absolute
          bottom-full
          left-1/2
          transform
          -translate-x-1/2
          mb-2
          px-2
          py-1
          text-xs
          text-white
          bg-gray-900
          dark:bg-gray-700
          rounded
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-200
          pointer-events-none
          whitespace-nowrap
          z-50
        "
            >
               {getTooltipText()}
               <div
                  className="
            absolute
            top-full
            left-1/2
            transform
            -translate-x-1/2
            w-0
            h-0
            border-l-2
            border-r-2
            border-t-2
            border-transparent
            border-t-gray-900
            dark:border-t-gray-700
          "
               ></div>
            </div>
         </div>
      </button>
   );
};

export default ThemeToggle;
