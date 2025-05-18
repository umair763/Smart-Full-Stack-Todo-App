'use client';

import { useState, useEffect } from 'react';

function Notification({ message, type = 'success', onClose, duration = 3000 }) {
   const [isVisible, setIsVisible] = useState(true);

   useEffect(() => {
      // Reset visibility on new notification
      setIsVisible(true);

      // Auto-close after duration
      const timer = setTimeout(() => {
         setIsVisible(false);
         setTimeout(() => {
            if (onClose) onClose();
         }, 300); // Wait for transition to complete before calling onClose
      }, duration);

      return () => clearTimeout(timer);
   }, [message, duration, onClose]);

   // Define colors based on type
   const getStyles = () => {
      switch (type) {
         case 'success':
            return {
               container: 'bg-green-500/80 border-green-600',
               icon: 'text-green-200',
               iconPath: 'M5 13l4 4L19 7',
            };
         case 'error':
            return {
               container: 'bg-red-500/80 border-red-600',
               icon: 'text-red-200',
               iconPath: 'M6 18L18 6M6 6l12 12',
            };
         case 'warning':
            return {
               container: 'bg-yellow-500/80 border-yellow-600',
               icon: 'text-yellow-200',
               iconPath:
                  'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            };
         case 'info':
         default:
            return {
               container: 'bg-blue-500/80 border-blue-600',
               icon: 'text-blue-200',
               iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            };
      }
   };

   const styles = getStyles();

   return (
      <div
         className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
         }`}
      >
         <div
            className={`rounded-lg shadow-lg backdrop-blur-sm border px-4 py-3 max-w-sm flex items-center ${styles.container}`}
         >
            <div className={`mr-3 ${styles.icon}`}>
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styles.iconPath} />
               </svg>
            </div>
            <div className="flex-1 text-white">{message}</div>
            <button
               onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => {
                     if (onClose) onClose();
                  }, 300);
               }}
               className="text-white/80 hover:text-white focus:outline-none ml-2"
            >
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         </div>
      </div>
   );
}

export default Notification;
