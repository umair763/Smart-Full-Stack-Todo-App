'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiTrash2 } from 'react-icons/fi';
import { useNotification } from '../app/context/NotificationContext';
import { useSocket } from '../app/context/SocketContext';

function NotificationBell() {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef(null);
   const {
      persistentNotifications,
      unreadCount,
      removeNotification,
      removeReminderNotification,
      clearNotifications,
      markAllAsRead,
      fetchNotifications,
   } = useNotification();
   const { socket } = useSocket();

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

   // Listen for real-time notification updates
   useEffect(() => {
      if (!socket) return;

      // Refresh notifications when a new one is added or when updates happen
      const handleRefreshNotifications = () => {
         fetchNotifications();
      };

      // Set up socket event listeners
      socket.on('notification', handleRefreshNotifications);
      socket.on('notificationCreated', handleRefreshNotifications);
      socket.on('notificationUpdate', handleRefreshNotifications);

      // Clean up socket listeners
      return () => {
         socket.off('notification', handleRefreshNotifications);
         socket.off('notificationCreated', handleRefreshNotifications);
         socket.off('notificationUpdate', handleRefreshNotifications);
      };
   }, [socket, fetchNotifications]);

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

   // Get icon for notification type
   const getIcon = (type) => {
      switch (type) {
         case 'error':
            return <FiAlertCircle className="h-5 w-5 text-red-500" />;
         case 'success':
            return <FiCheckCircle className="h-5 w-5 text-green-500" />;
         case 'reminder':
            return <span className="h-5 w-5 text-yellow-500">🔔</span>;
         case 'delete':
            return <FiTrash2 className="h-5 w-5 text-red-500" />;
         default:
            return <FiInfo className="h-5 w-5 text-blue-500" />;
      }
   };

   const handleRemoveNotification = async (notification) => {
      if (notification.type === 'reminder') {
         await removeReminderNotification(notification.reminderId);
      } else {
         await removeNotification(notification._id);
      }
   };

   const renderNotification = (notification) => {
      const isReminder = notification.type === 'reminder';
      const isPastDeadline =
         isReminder && notification.data?.deadline && new Date(notification.data.deadline) < new Date();

      if (isReminder && isPastDeadline) {
         return null; // Don't render past deadline reminders
      }

      return (
         <div key={notification._id} className={`px-4 py-3 flex items-start ${notification.read ? '' : 'bg-blue-50'}`}>
            <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
            <div className="ml-3 w-0 flex-1">
               <p className="text-sm text-gray-800">{notification.message}</p>
               <p className="mt-1 text-xs text-gray-500">
                  {formatTime(notification.createdAt || notification.timestamp)}
               </p>
            </div>
            <button
               onClick={() => handleRemoveNotification(notification)}
               className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
               title="Remove notification"
            >
               <FiX className="h-4 w-4" />
            </button>
         </div>
      );
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
            {unreadCount > 0 && (
               <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
               </span>
            )}
         </button>

         {/* Dropdown menu */}
         {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-[80vh] overflow-y-auto">
               <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                  <div className="flex gap-2">
                     {persistentNotifications.length > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800">
                           Mark all as read
                        </button>
                     )}
                     {persistentNotifications.length > 0 && (
                        <button onClick={clearNotifications} className="text-xs text-red-600 hover:text-red-800">
                           Clear all
                        </button>
                     )}
                  </div>
               </div>
               {/* Notification list */}
               <div className="divide-y divide-gray-200">
                  {persistentNotifications.length === 0 ? (
                     <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                     persistentNotifications.map(renderNotification)
                  )}
               </div>
            </div>
         )}
      </div>
   );
}

export default NotificationBell;
