// Notification service for handling real-time notifications
// This service works with both Socket.io and REST API fallback

class NotificationService {
   constructor() {
      this.token = null;
      this.socket = null;
      this.listeners = [];
      this.isInitialized = false;
      this.pollingInterval = null;
      this.BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';
   }

   // Initialize the service with authentication token and optional socket
   initialize(token, socket = null) {
      if (!token) {
         console.error('Token is required to initialize notification service');
         return;
      }

      this.token = token;
      this.socket = socket;
      this.isInitialized = true;

      // If socket is available, set up socket listeners
      if (this.socket && this.socket.connected) {
         console.log('Setting up socket notification listeners');
         this.setupSocketListeners();
      } else {
         console.log('Socket not available, falling back to polling');
         this.startPolling();
      }

      return this;
   }

   // Set up socket event listeners
   setupSocketListeners() {
      if (!this.socket) return;

      this.socket.on('notification', (data) => {
         console.log('Socket notification received:', data);
         this.notifyListeners({ type: 'notificationCreated', data });
      });

      this.socket.on('task_update', (data) => {
         console.log('Task update notification received:', data);
         this.notifyListeners({ type: 'taskUpdated', data });
      });
   }

   // Start polling for notifications as fallback
   startPolling() {
      if (this.pollingInterval) return;

      // Poll every 30 seconds
      this.pollingInterval = setInterval(() => {
         this.fetchNotifications();
      }, 30000);

      // Initial fetch
      this.fetchNotifications();
   }

   // Fetch notifications from REST API
   async fetchNotifications() {
      if (!this.token || !this.isInitialized) return;

      try {
         const response = await fetch(`${this.BACKEND_URL}/api/notifications`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${this.token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to fetch notifications: ${response.status}`);
         }

         const notifications = await response.json();

         if (notifications && notifications.length > 0) {
            notifications.forEach((notification) => {
               this.notifyListeners({
                  type: 'notificationCreated',
                  data: notification,
               });
            });
         }
      } catch (error) {
         console.error('Error fetching notifications:', error);
      }
   }

   // Register a listener for notifications
   onNotification(callback) {
      if (typeof callback !== 'function') {
         throw new Error('Callback must be a function');
      }

      this.listeners.push(callback);

      // Return unsubscribe function
      return () => {
         this.listeners = this.listeners.filter((listener) => listener !== callback);
      };
   }

   // Notify all listeners
   notifyListeners(notification) {
      this.listeners.forEach((listener) => {
         try {
            listener(notification);
         } catch (error) {
            console.error('Error in notification listener:', error);
         }
      });
   }

   // Stop the service
   stop() {
      if (this.pollingInterval) {
         clearInterval(this.pollingInterval);
         this.pollingInterval = null;
      }

      if (this.socket) {
         this.socket.off('notification');
         this.socket.off('task_update');
      }

      this.isInitialized = false;
   }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
