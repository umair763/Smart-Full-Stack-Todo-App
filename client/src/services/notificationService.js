class NotificationService {
   constructor() {
      this.isServerless = true; // Assume serverless by default
      this.pollingInterval = null;
      this.lastFetchTime = Date.now();
      this.callbacks = new Set();
      this.isPolling = false;
   }

   // Initialize the service
   init() {
      // Check if we're in serverless environment
      this.detectEnvironment();

      if (this.isServerless) {
         this.startPolling();
      }
   }

   // Detect if we're in serverless environment
   detectEnvironment() {
      // For now, assume serverless. In the future, we can detect Socket.io availability
      this.isServerless = true;
   }

   // Start polling for notifications (serverless mode)
   startPolling() {
      if (this.isPolling) return;

      this.isPolling = true;
      this.pollingInterval = setInterval(() => {
         this.fetchNewNotifications();
      }, 10000); // Poll every 10 seconds
   }

   // Stop polling
   stopPolling() {
      if (this.pollingInterval) {
         clearInterval(this.pollingInterval);
         this.pollingInterval = null;
      }
      this.isPolling = false;
   }

   // Fetch new notifications since last check
   async fetchNewNotifications() {
      try {
         const token = localStorage.getItem('token');
         if (!token) return;

         const response = await fetch(
            `${
               import.meta.env.VITE_BACKEND_URL || 'https://smart-todo-task-management-backend.vercel.app'
            }/api/notifications/since/${this.lastFetchTime}`,
            {
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
            }
         );

         if (response.ok) {
            const newNotifications = await response.json();

            if (newNotifications.length > 0) {
               // Update last fetch time
               this.lastFetchTime = Date.now();

               // Notify all callbacks
               this.callbacks.forEach((callback) => {
                  try {
                     callback(newNotifications);
                  } catch (error) {
                     console.error('Error in notification callback:', error);
                  }
               });
            }
         }
      } catch (error) {
         console.error('Error fetching new notifications:', error);
      }
   }

   // Subscribe to notification updates
   subscribe(callback) {
      this.callbacks.add(callback);

      // Return unsubscribe function
      return () => {
         this.callbacks.delete(callback);
      };
   }

   // Manually trigger notification fetch
   async refresh() {
      await this.fetchNewNotifications();
   }

   // Cleanup
   destroy() {
      this.stopPolling();
      this.callbacks.clear();
   }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
