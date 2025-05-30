// Environment configuration
const isProduction = import.meta.env.PROD;

export const API_URL = import.meta.env.VITE_API_URL;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const BASE_URL = isProduction ? 'https://smart-full-stack-todo-app.vercel.app' : 'http://localhost:5173';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
