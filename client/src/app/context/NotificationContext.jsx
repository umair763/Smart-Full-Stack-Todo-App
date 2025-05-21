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
         fetchNotifications();
      } else {
         setPersistentNotifications([]);
         setUnreadCount(0);
      }
   }, [isLoggedIn, user]);

   // Set up socket listeners for notifications
   useEffect(() => {
      if (!socket) return;

      // Listen for new notifications
      const handleNewNotification = (notification) => {
         // Add to temporary notifications
         addTempNotification(notification);

         // If it should be persistent, save to persistent notifications
         if (notification.persistent) {
            setPersistentNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
         }
      };

      // Listen for notification updates (read status, deletion, etc.)
      const handleNotificationUpdate = (data) => {
         if (data.type === 'delete') {
            // Remove notification and update count
            setPersistentNotifications((prev) => {
               const filtered = prev.filter((n) => n._id !== data.notificationId);
               const unreadCount = filtered.filter((n) => !n.read).length;
               setUnreadCount(unreadCount);
               return filtered;
            });
         } else if (data.type === 'markAllRead') {
            // Mark all as read and reset count
            setPersistentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
         } else if (data.type === 'clearAll') {
            // Clear all notifications and reset count
            setPersistentNotifications([]);
            setUnreadCount(0);
         }
      };

      // Listen for notification count updates
      const handleNotificationCount = (count) => {
         setUnreadCount(count);
      };

      // Set up socket event listeners
      socket.on('notification', handleNewNotification);
      socket.on('notificationUpdate', handleNotificationUpdate);
      socket.on('notificationCount', handleNotificationCount);

      // Clean up socket listeners
      return () => {
         socket.off('notification', handleNewNotification);
         socket.off('notificationUpdate', handleNotificationUpdate);
         socket.off('notificationCount', handleNotificationCount);
      };
   }, [socket]);

   // Fetch all notifications
   const fetchNotifications = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;
         const response = await fetch(`${API_BASE_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
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
               read: false, // Ensure new notifications are marked as unread
            }),
         });

         if (response.ok) {
            const savedNotification = await response.json();
            setPersistentNotifications((prev) => [savedNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Emit socket event for real-time update
            if (socket) {
               socket.emit('notificationCreated', savedNotification);
            }
         }
      } catch (error) {
         console.error('Error saving notification:', error);
      }
   };

   // Remove a temporary notification
   const removeTempNotification = (id) => {
      setTempNotifications((prev) => prev.filter((n) => n.id !== id));
   };

   // Remove a notification
   const removeNotification = async (id) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;
         const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
         });
         if (response.ok) {
            setPersistentNotifications((prev) => prev.filter((n) => n._id !== id));
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Emit socket event for real-time update
            if (socket) {
               socket.emit('notificationDeleted', id);
            }
         }
      } catch (error) {
         console.error('Error removing notification:', error);
      }
   };

   // Clear all notifications
   const clearNotifications = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;
         const response = await fetch(`${API_BASE_URL}/api/notifications`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
         });
         if (response.ok) {
            setPersistentNotifications([]);
            setUnreadCount(0);

            // Emit socket event for real-time update
            if (socket) {
               socket.emit('notificationsCleared');
            }
         }
      } catch (error) {
         console.error('Error clearing notifications:', error);
      }
   };

   // Mark all as read
   const markAllAsRead = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;
         const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
         });
         if (response.ok) {
            setPersistentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);

            // Emit socket event for real-time update
            if (socket) {
               socket.emit('notificationsMarkedAsRead');
            }
         }
      } catch (error) {
         console.error('Error marking all as read:', error);
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

   // Add a scheduled reminder notification
   const addScheduledReminder = (reminder) => {
      const now = new Date();
      const reminderTime = new Date(reminder.scheduledTime);

      // Only schedule if the reminder time is in the future
      if (reminderTime > now) {
         const timeUntilReminder = reminderTime.getTime() - now.getTime();

         // Schedule the notification
         setTimeout(() => {
            // Create and show the reminder notification
            const notification = {
               type: 'reminder',
               message: `⏰ 🔔 Reminder: "${reminder.data?.taskTitle || 'Task'}" is due now!`,
               data: {
                  ...reminder.data,
                  isDue: true,
               },
               timestamp: new Date(),
               persistent: true,
               reminderId: reminder._id,
               taskId: reminder.data?.taskId,
            };

            // Add to persistent notifications
            setPersistentNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Emit socket event for real-time update
            if (socket) {
               socket.emit('notificationCreated', notification);
            }

            // Schedule automatic removal when deadline passes
            if (reminder.deadline) {
               const deadlineTime = new Date(reminder.deadline);
               const timeUntilDeadline = deadlineTime.getTime() - now.getTime();

               if (timeUntilDeadline > 0) {
                  setTimeout(() => {
                     // Remove the reminder notification when deadline passes
                     setPersistentNotifications((prev) => prev.filter((n) => n.reminderId !== reminder._id));
                     setUnreadCount((prev) => Math.max(0, prev - 1));

                     // Emit socket event for removal
                     if (socket) {
                        socket.emit('notificationDeleted', reminder._id);
                     }
                  }, timeUntilDeadline);
               }
            }
         }, timeUntilReminder);
      }
   };

   // Remove a reminder notification
   const removeReminderNotification = async (reminderId) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;

         // Remove from UI immediately
         setPersistentNotifications((prev) => prev.filter((n) => n.reminderId !== reminderId));
         setUnreadCount((prev) => Math.max(0, prev - 1));

         // Emit socket event for real-time update
         if (socket) {
            socket.emit('notificationDeleted', reminderId);
         }

         // Delete from backend
         const response = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
         });

         if (!response.ok) {
            throw new Error('Failed to delete reminder');
         }
      } catch (error) {
         console.error('Error removing reminder notification:', error);
         // Revert UI changes if backend deletion fails
         fetchNotifications();
      }
   };

   // Value provided to consumers
   const contextValue = {
      tempNotifications,
      persistentNotifications,
      unreadCount,
      removeTempNotification,
      removeNotification,
      clearNotifications,
      markAllAsRead,
      createErrorNotification,
      createSuccessNotification,
      createInfoNotification,
      fetchNotifications,
      addScheduledReminder,
      removeReminderNotification,
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
