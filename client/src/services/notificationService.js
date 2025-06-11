// Notification service that works in both serverless and serverfull environments
class NotificationService {
   constructor() {
      this.isServerless = true; // Default to serverless mode
      this.pollingInterval = null;
      this.lastNotificationCheck = new Date();
      this.callbacks = new Set();

      // Check if we're in serverless mode
      this.detectEnvironment();
   }

   detectEnvironment() {
      // For now, assume serverless (Vercel)
      // In the future, this could be determined by environment variables or API response
      this.isServerless = true;
      console.log('Notification service running in:', this.isServerless ? 'serverless' : 'serverfull', 'mode');
   }

   // Initialize the notification service
   initialize(token, socket = null) {
      this.token = token;
      this.socket = socket;

      if (this.isServerless) {
         this.startPolling();
      } else {
         this.setupSocketListeners();
      }
   }

   // Add callback for notification updates
   onNotification(callback) {
      this.callbacks.add(callback);
      return () => this.callbacks.delete(callback);
   }

   // Emit notification to all callbacks
   emitNotification(notification) {
      this.callbacks.forEach((callback) => {
         try {
            callback(notification);
         } catch (error) {
            console.error('Error in notification callback:', error);
         }
      });
   }

   // Start polling for notifications (serverless mode)
   startPolling() {
      if (this.pollingInterval) {
         clearInterval(this.pollingInterval);
      }

      // Poll every 10 seconds
      this.pollingInterval = setInterval(() => {
         this.pollNotifications();
      }, 10000);

      // Initial poll
      this.pollNotifications();
   }

   // Poll for new notifications
   async pollNotifications() {
      try {
         const response = await fetch(
            `https://smart-todo-task-management-backend.vercel.app/api/notifications?since=${this.lastNotificationCheck.toISOString()}`,
            {
               headers: {
                  Authorization: `Bearer ${this.token}`,
               },
            }
         );

         if (response.ok) {
            const notifications = await response.json();

            // Update last check time
            this.lastNotificationCheck = new Date();

            // Emit new notifications
            notifications.forEach((notification) => {
               this.emitNotification({
                  type: 'notificationCreated',
                  data: notification,
               });
            });
         }
      } catch (error) {
         console.error('Error polling notifications:', error);
      }
   }

   // Setup socket listeners (serverfull mode)
   setupSocketListeners() {
      if (!this.socket) return;

      this.socket.on('notificationCreated', (notification) => {
         this.emitNotification({
            type: 'notificationCreated',
            data: notification,
         });
      });

      this.socket.on('notificationUpdate', (update) => {
         this.emitNotification({
            type: 'notificationUpdate',
            data: update,
         });
      });
   }

   // Create a notification (works in both modes)
   async createNotification(notification) {
      try {
         const response = await fetch('https://smart-todo-task-management-backend.vercel.app/api/notifications', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify(notification),
         });

         if (response.ok) {
            const savedNotification = await response.json();

            // In serverless mode, emit immediately
            if (this.isServerless) {
               this.emitNotification({
                  type: 'notificationCreated',
                  data: savedNotification,
               });
            }

            return savedNotification;
         }
      } catch (error) {
         console.error('Error creating notification:', error);
      }
   }

   // Stop the service
   stop() {
      if (this.pollingInterval) {
         clearInterval(this.pollingInterval);
         this.pollingInterval = null;
      }

      if (this.socket) {
         this.socket.off('notificationCreated');
         this.socket.off('notificationUpdate');
      }

      this.callbacks.clear();
   }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
