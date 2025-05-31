// Environment configuration
const isProduction = import.meta.env.PROD;

// Get the current domain for production
const getDomain = () => {
   if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}`;
   }
   return 'https://smart-full-stack-todo-app.vercel.app';
};

// API and Socket URLs
export const API_URL = isProduction
   ? `${getDomain()}/api`
   : import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const SOCKET_URL = isProduction ? getDomain() : import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const BASE_URL = isProduction ? getDomain() : 'http://localhost:5173';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
