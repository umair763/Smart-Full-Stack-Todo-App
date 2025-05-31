// Environment configuration
const isProduction = import.meta.env.PROD;

// Get the current domain for production (frontend only)
const getDomain = () => {
   if (typeof window !== 'undefined') {
      return window.location.origin;
   }
   return '';
};

export const API_URL = isProduction
   ? import.meta.env.VITE_API_URL
   : import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const SOCKET_URL = isProduction
   ? import.meta.env.VITE_SOCKET_URL
   : import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const BASE_URL = isProduction ? import.meta.env.VITE_BASE_URL : 'http://localhost:5173';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
