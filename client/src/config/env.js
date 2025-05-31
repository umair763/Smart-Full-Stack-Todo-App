// Environment configuration for the frontend
const isDevelopment = import.meta.env.MODE === 'development';

// API Base URLs (do NOT include /api at the end)
export const API_BASE_URL = isDevelopment
   ? 'http://localhost:5000' // Local development
   : 'https://smart-todo-task-management-backend.vercel.app'; // Production

// Socket.io URLs
export const SOCKET_URL = isDevelopment
   ? 'http://localhost:5000' // Local development
   : 'https://smart-todo-task-management-backend.vercel.app'; // Production

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID = '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com';

// Frontend URLs (for redirects and CORS)
export const FRONTEND_URL = isDevelopment
   ? 'http://localhost:5173' // Local development (adjust port if different)
   : 'https://smart-todo-task-management-frontend.vercel.app'; // Production

// Export default config object
export default {
   API_BASE_URL,
   SOCKET_URL,
   GOOGLE_CLIENT_ID,
   FRONTEND_URL,
   isDevelopment,
};

// Helper function to construct API URLs
export const getApiUrl = (endpoint) => {
   // Remove leading slash if present to avoid double slashes
   const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
   return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

// Log configuration in development
if (isDevelopment) {
   console.log('Environment Config:', {
      API_BASE_URL,
      SOCKET_URL,
      FRONTEND_URL,
      isDevelopment,
   });
}
