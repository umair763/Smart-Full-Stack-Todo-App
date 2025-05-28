'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../app/context/SocketContext';
import { HiBell, HiX, HiCheck, HiExclamation, HiInformationCircle } from 'react-icons/hi';

function NotificationCenter() {
   const { notifications, removeNotification } = useSocket();
   const [isOpen, setIsOpen] = useState(false);
   const [unreadCount, setUnreadCount] = useState(0);

   // Update unread count when notifications change
   useEffect(() => {
      setUnreadCount(notifications.length);
   }, [notifications]);

   // Reset unread count when opening the notification center
   const handleToggle = () => {
      setIsOpen(!isOpen);
      if (!isOpen) {
         setUnreadCount(0);
      }
   };

   const getNotificationColor = (type) => {
      switch (type) {
         case 'success':
            return 'bg-green-500';
         case 'error':
            return 'bg-red-500';
         case 'warning':
            return 'bg-yellow-500';
         case 'info':
         default:
            return 'bg-blue-500';
      }
   };

   const getNotificationIcon = (type) => {
      switch (type) {
         case 'success':
            return <HiCheck className="h-5 w-5" />;
         case 'error':
            return <HiX className="h-5 w-5" />;
         case 'warning':
            return <HiExclamation className="h-5 w-5" />;
         case 'info':
         default:
            return <HiInformationCircle className="h-5 w-5" />;
      }
   };

   const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   };

   return (
      <div className="relative z-50">
         {/* Notification Bell */}
         <button
            onClick={handleToggle}
            className="p-2 text-white rounded-full hover:bg-white/10 focus:outline-none relative"
            aria-label="Notifications"
         >
            <HiBell className="h-6 w-6" />
            {unreadCount > 0 && (
               <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
               </span>
            )}
         </button>

         {/* Notification Panel */}
         {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg overflow-hidden">
               <div className="p-3 border-b border-white/20 flex justify-between items-center">
                  <h3 className="text-white font-medium">Notifications</h3>
                  <button
                     onClick={() => setIsOpen(false)}
                     className="text-white/70 hover:text-white"
                     aria-label="Close notifications"
                  >
                     <HiX className="h-5 w-5" />
                  </button>
               </div>

               <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                     <div className="p-4 text-center text-white/70">No notifications</div>
                  ) : (
                     notifications.map((notification) => (
                        <div
                           key={notification.id}
                           className="p-3 border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                           <div className="flex items-start">
                              <div
                                 className={`p-2 rounded-full ${getNotificationColor(
                                    notification.type
                                 )} text-white mr-3`}
                              >
                                 {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                 <div className="text-white font-medium">{notification.message}</div>
                                 <div className="text-white/60 text-xs mt-1">{formatTime(notification.timestamp)}</div>
                              </div>
                              <button
                                 onClick={() => removeNotification(notification.id)}
                                 className="text-white/40 hover:text-white"
                                 aria-label="Dismiss notification"
                              >
                                 <HiX className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}
      </div>
   );
}

export default NotificationCenter;
