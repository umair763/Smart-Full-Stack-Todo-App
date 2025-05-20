'use client';

import React from 'react';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useNotification } from '../app/context/NotificationContext';

function NotificationToast() {
   const { tempNotifications, removeTempNotification } = useNotification();

   // If no notifications, don't render anything
   if (tempNotifications.length === 0) return null;

   return (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
         {tempNotifications.map((notification) => (
            <div
               key={notification.id}
               className={`flex items-start p-3 rounded-lg shadow-lg animate-slideIn
                        ${
                           notification.type === 'error'
                              ? 'bg-red-50 text-red-800 border-l-4 border-red-500'
                              : notification.type === 'success'
                              ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
                              : 'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
                        }`}
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
               <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
               </div>
               <button
                  onClick={() => removeTempNotification(notification.id)}
                  className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
               >
                  <FiX className="h-5 w-5" />
               </button>
            </div>
         ))}
      </div>
   );
}

export default NotificationToast;
