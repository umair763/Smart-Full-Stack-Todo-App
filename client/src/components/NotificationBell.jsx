'use client';

import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiBell, FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiTrash2, FiCheck } from 'react-icons/fi';
import { useNotification } from '../app/context/NotificationContext';
import { useSocket } from '../app/context/SocketContext';

function NotificationBell() {
   const [isOpen, setIsOpen] = useState(false);
   const [isProcessing, setIsProcessing] = useState(false);
   const dropdownRef = useRef(null);
   const {
      persistentNotifications,
      unreadCount,
      removeNotification,
      removeReminderNotification,
      clearNotifications,
      markAllAsRead,
      markAsRead,
      fetchNotifications,
   } = useNotification();
   const { socket } = useSocket();

   // Close dropdown when clicking outside
   useEffect(() => {
      function handleClickOutside(event) {
         // Since we're using a portal, we need to check if the click is outside the notification tray
         // by checking if the clicked element has the notification tray ID or is contained within it
         const notificationTray = document.querySelector('[data-notification-tray="true"]');
         const bellButton = dropdownRef.current;

         if (
            notificationTray &&
            !notificationTray.contains(event.target) &&
            bellButton &&
            !bellButton.contains(event.target)
         ) {
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
      socket.on('notificationRefresh', handleRefreshNotifications);

      // Clean up socket listeners
      return () => {
         socket.off('notification', handleRefreshNotifications);
         socket.off('notificationCreated', handleRefreshNotifications);
         socket.off('notificationUpdate', handleRefreshNotifications);
         socket.off('notificationRefresh', handleRefreshNotifications);
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
         handleMarkAllAsRead();
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
         case 'dependency':
            return <FiInfo className="h-5 w-5 text-indigo-500" />;
         default:
            return <FiInfo className="h-5 w-5 text-blue-500" />;
      }
   };

   const handleRemoveNotification = async (notification) => {
      if (isProcessing) return;

      setIsProcessing(true);
      try {
         if (notification.type === 'reminder') {
            await removeReminderNotification(notification.reminderId);
         } else {
            await removeNotification(notification._id);
         }
      } finally {
         setIsProcessing(false);
      }
   };

   // Handle delete all notifications
   const handleDeleteAll = async () => {
      if (isProcessing) return;

      setIsProcessing(true);
      try {
         await clearNotifications();
      } finally {
         setIsProcessing(false);
      }
   };

   // Handle mark all as read
   const handleMarkAllAsRead = async () => {
      if (isProcessing) return;

      setIsProcessing(true);
      try {
         await markAllAsRead();
      } finally {
         setIsProcessing(false);
      }
   };

   const renderNotification = (notification) => {
      const isReminder = notification.type === 'reminder';
      const isPastDeadline =
         isReminder && notification.data?.deadline && new Date(notification.data.deadline) < new Date();

      // Don't render past deadline reminders
      if (isReminder && isPastDeadline) {
         return null;
      }

      // Use createdAt if available, otherwise fall back to timestamp
      const notificationTime = notification.createdAt || notification.timestamp;

      return (
         <div
            key={notification._id || notification.id}
            className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
               notification.read ? '' : 'bg-blue-50/50 border-l-4 border-l-blue-500'
            }`}
            onClick={(e) => {
               e.stopPropagation();
               if (!notification.read) {
                  markAsRead(notification._id);
               }
            }}
         >
            <div className="flex items-start space-x-2 sm:space-x-3">
               {/* Icon with enhanced styling */}
               <div className="flex-shrink-0 mt-1">
                  <div className="bg-gray-100 p-1.5 sm:p-2 rounded-lg">{getIcon(notification.type)}</div>
               </div>

               {/* Content */}
               <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 leading-relaxed">{notification.message}</p>
                  <div className="flex items-center justify-between mt-2">
                     <p className="text-xs text-gray-500 flex items-center">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-3 w-3 mr-1 flex-shrink-0"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                           />
                        </svg>
                        <span className="truncate">{formatTime(notificationTime)}</span>
                     </p>
                     {!notification.read && <span className="bg-blue-500 h-2 w-2 rounded-full flex-shrink-0"></span>}
                  </div>
               </div>

               {/* Remove button */}
               <button
                  onClick={(e) => {
                     e.stopPropagation();
                     handleRemoveNotification(notification);
                  }}
                  disabled={isProcessing}
                  className={`flex-shrink-0 p-1 sm:p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group ${
                     isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Remove notification"
               >
                  <FiX className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform duration-200" />
               </button>
            </div>
         </div>
      );
   };

   return (
      <div className="relative" ref={dropdownRef}>
         {/* Bell icon with badge - Enhanced for header */}
         <button
            onClick={toggleDropdown}
            className="relative text-white hover:text-white/80 focus:outline-none transition-all duration-200 group"
            aria-label="Notifications"
         >
            <FiBell className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform duration-200" />
            {unreadCount > 0 && (
               <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
               </span>
            )}
         </button>

         {/* Enhanced Modern Dropdown menu */}
         {isOpen &&
            ReactDOM.createPortal(
               <div
                  data-notification-tray="true"
                  className="fixed top-12 sm:top-16 right-2 sm:right-4 w-72 sm:w-80 lg:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-hidden"
                  style={{ zIndex: 2147483647 }}
               >
                  {/* Header Section */}
                  <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                           <div className="bg-white/20 p-1 sm:p-1.5 rounded-lg">
                              <FiBell className="h-4 w-4 sm:h-5 sm:w-5" />
                           </div>
                           <div>
                              <h3 className="text-sm sm:text-base font-semibold">Notifications</h3>
                              <p className="text-xs text-white/80">
                                 {persistentNotifications.length === 0
                                    ? 'All caught up!'
                                    : `${persistentNotifications.length} notification${
                                         persistentNotifications.length !== 1 ? 's' : ''
                                      }`}
                              </p>
                           </div>
                        </div>
                        {persistentNotifications.length > 0 && (
                           <div className="flex items-center space-x-2">
                              <button
                                 onClick={handleMarkAllAsRead}
                                 disabled={isProcessing}
                                 className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200 ${
                                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                 }`}
                                 title="Mark all as read"
                              >
                                 <FiCheck className="h-4 w-4" />
                              </button>
                              <button
                                 onClick={handleDeleteAll}
                                 disabled={isProcessing}
                                 className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200 ${
                                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                 }`}
                                 title="Delete all notifications"
                              >
                                 <FiTrash2 className="h-4 w-4" />
                              </button>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Notification list */}
                  <div className="max-h-[60vh] overflow-y-auto">
                     {persistentNotifications.length === 0 ? (
                        <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                           <div className="bg-gray-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                              <FiBell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                           </div>
                           <h4 className="text-sm font-medium text-gray-900 mb-1">No notifications</h4>
                           <p className="text-xs text-gray-500">
                              You're all caught up! New notifications will appear here.
                           </p>
                        </div>
                     ) : (
                        <div className="divide-y divide-gray-100">
                           {persistentNotifications.map(renderNotification)}
                        </div>
                     )}
                  </div>
               </div>,
               document.body
            )}
      </div>
   );
}

export default NotificationBell;
