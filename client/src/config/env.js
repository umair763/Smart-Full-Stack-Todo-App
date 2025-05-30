// Environment configuration
const isProduction = import.meta.env.PROD;

export const config = {
   // API Configuration
   API_URL: isProduction
      ? 'https://smart-full-stack-todo-app.vercel.app/api' 
      : import.meta.env.VITE_API_URL || 'http://localhost:5000',

   // Base URL for the application
   BASE_URL: isProduction ? 'https://smart-full-stack-todo-app.vercel.app' : 'http://localhost:5173',

   // Google OAuth Configuration
   GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,

   // Socket.io Configuration
   SOCKET_URL: isProduction
      ? 'https://smart-full-stack-todo-app.vercel.app'
      : import.meta.env.VITE_API_URL || 'http://localhost:5000',
};
