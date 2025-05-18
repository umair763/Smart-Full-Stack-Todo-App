'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../app/context/SocketContext';

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
            return (
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
               </svg>
            );
         case 'error':
            return (
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
            );
         case 'warning':
            return (
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth="2"
                     d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
               </svg>
            );
         case 'info':
         default:
            return (
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth="2"
                     d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
               </svg>
            );
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
            <svg
               xmlns="http://www.w3.org/2000/svg"
               className="h-6 w-6"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
               />
            </svg>
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
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M6 18L18 6M6 6l12 12"
                                    />
                                 </svg>
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
