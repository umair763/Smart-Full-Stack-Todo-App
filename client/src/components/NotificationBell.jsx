'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useNotification } from '../app/context/NotificationContext';

function NotificationBell() {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef(null);
   const { persistentNotifications, unreadCount, removePersistentNotification, markAllAsRead } = useNotification();

   // Close dropdown when clicking outside
   useEffect(() => {
      function handleClickOutside(event) {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
         }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, []);

   // Format timestamp
   const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
      }).format(date);
   };

   // Toggle dropdown
   const toggleDropdown = () => {
      setIsOpen(!isOpen);
      if (!isOpen && unreadCount > 0) {
         markAllAsRead();
      }
   };

   return (
      <div className="relative" ref={dropdownRef}>
         {/* Bell icon with badge */}
         <button
            onClick={toggleDropdown}
            className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Notifications"
         >
            <FiBell className="h-6 w-6" />

            {/* Notification badge */}
            {unreadCount > 0 && (
               <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
               </span>
            )}
         </button>

         {/* Dropdown menu */}
         {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-[80vh] overflow-y-auto">
               <div className="px-4 py-2 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                     <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                     {persistentNotifications.length > 0 && (
                        <button onClick={() => markAllAsRead()} className="text-xs text-blue-600 hover:text-blue-800">
                           Mark all as read
                        </button>
                     )}
                  </div>
               </div>

               {/* Notification list */}
               <div className="divide-y divide-gray-200">
                  {persistentNotifications.length === 0 ? (
                     <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                     persistentNotifications.map((notification) => (
                        <div
                           key={notification._id}
                           className={`px-4 py-3 flex items-start ${!notification.read ? 'bg-blue-50' : ''}`}
                        >
                           <div className="flex-shrink-0 mt-0.5">
                              {notification.type === 'error' ? (
                                 <FiAlertCircle className="h-5 w-5 text-red-500" />
                              ) : notification.type === 'success' ? (
                                 <FiCheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                 <FiInfo className="h-5 w-5 text-blue-500" />
                              )}
                           </div>
                           <div className="ml-3 w-0 flex-1">
                              <p className="text-sm text-gray-800">{notification.message}</p>
                              <p className="mt-1 text-xs text-gray-500">{formatTime(notification.timestamp)}</p>
                           </div>
                           <button
                              onClick={() => removePersistentNotification(notification._id)}
                              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                           >
                              <FiX className="h-4 w-4" />
                           </button>
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}
      </div>
   );
}

export default NotificationBell;
