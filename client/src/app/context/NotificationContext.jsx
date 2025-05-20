'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create the notification context
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
   // Temporary notifications (top-right corner)
   const [tempNotifications, setTempNotifications] = useState([]);

   // Persistent notifications (bell icon)
   const [persistentNotifications, setPersistentNotifications] = useState([]);

   // Notification count badge
   const [unreadCount, setUnreadCount] = useState(0);

   const { socket } = useSocket();
   const { isLoggedIn, user } = useAuth();

   // Auto-remove temporary notifications after delay
   useEffect(() => {
      const timer = setTimeout(() => {
         if (tempNotifications.length > 0) {
            setTempNotifications((prev) => {
               const newNotifications = [...prev];
               newNotifications.shift(); // Remove the oldest notification
               return newNotifications;
            });
         }
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
   }, [tempNotifications]);

   // Load persistent notifications from MongoDB when user logs in
   useEffect(() => {
      if (isLoggedIn && user) {
         fetchPersistentNotifications();
      } else {
         setPersistentNotifications([]);
         setUnreadCount(0);
      }
   }, [isLoggedIn, user]);

   // Set up socket listeners for notifications
   useEffect(() => {
      if (!socket) return;

      // Listen for new notifications
      socket.on('notification', (data) => {
         // Add to temporary notifications
         addTempNotification(data);

         // If it should be persistent, save to persistent notifications
         if (data.persistent) {
            addPersistentNotification(data);
         }
      });

      return () => {
         socket.off('notification');
      };
   }, [socket]);

   // Fetch persistent notifications from API
   const fetchPersistentNotifications = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;

         const response = await fetch(`${API_BASE_URL}/api/notifications`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (response.ok) {
            const data = await response.json();
            setPersistentNotifications(data);
            setUnreadCount(data.filter((n) => !n.read).length);
         }
      } catch (error) {
         console.error('Error fetching notifications:', error);
      }
   };

   // Add a temporary notification
   const addTempNotification = (notification) => {
      const id = Date.now();
      setTempNotifications((prev) => [
         ...prev,
         {
            id,
            ...notification,
            timestamp: notification.timestamp || new Date(),
         },
      ]);
   };

   // Add a persistent notification (saved to MongoDB)
   const addPersistentNotification = async (notification) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;

         const response = await fetch(`${API_BASE_URL}/api/notifications`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               message: notification.message,
               type: notification.type,
               data: notification.data,
               timestamp: notification.timestamp || new Date(),
            }),
         });

         if (response.ok) {
            const savedNotification = await response.json();
            setPersistentNotifications((prev) => [savedNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
         }
      } catch (error) {
         console.error('Error saving notification:', error);
      }
   };

   // Remove a temporary notification
   const removeTempNotification = (id) => {
      setTempNotifications((prev) => prev.filter((n) => n.id !== id));
   };

   // Remove a persistent notification
   const removePersistentNotification = async (id) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;

         const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (response.ok) {
            setPersistentNotifications((prev) => prev.filter((n) => n._id !== id));
            setUnreadCount((prev) => Math.max(0, prev - 1));
         }
      } catch (error) {
         console.error('Error removing notification:', error);
      }
   };

   // Mark all notifications as read
   const markAllAsRead = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;

         const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (response.ok) {
            setPersistentNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
            setUnreadCount(0);
         }
      } catch (error) {
         console.error('Error marking notifications as read:', error);
      }
   };

   // Create an error notification (temp and persistent)
   const createErrorNotification = (message, isPersistent = false) => {
      const notification = {
         type: 'error',
         message,
         timestamp: new Date(),
         persistent: isPersistent,
      };

      addTempNotification(notification);

      if (isPersistent) {
         addPersistentNotification(notification);
      }
   };

   // Create a success notification (temp and optional persistent)
   const createSuccessNotification = (message, isPersistent = false) => {
      const notification = {
         type: 'success',
         message,
         timestamp: new Date(),
         persistent: isPersistent,
      };

      addTempNotification(notification);

      if (isPersistent) {
         addPersistentNotification(notification);
      }
   };

   // Create an info notification (temp and optional persistent)
   const createInfoNotification = (message, isPersistent = false) => {
      const notification = {
         type: 'info',
         message,
         timestamp: new Date(),
         persistent: isPersistent,
      };

      addTempNotification(notification);

      if (isPersistent) {
         addPersistentNotification(notification);
      }
   };

   // Value provided to consumers
   const contextValue = {
      tempNotifications,
      persistentNotifications,
      unreadCount,
      removeTempNotification,
      removePersistentNotification,
      markAllAsRead,
      createErrorNotification,
      createSuccessNotification,
      createInfoNotification,
   };

   return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;
}

// Custom hook to use the notification context
export function useNotification() {
   const context = useContext(NotificationContext);
   if (context === undefined) {
      throw new Error('useNotification must be used within a NotificationProvider');
   }
   return context;
}
