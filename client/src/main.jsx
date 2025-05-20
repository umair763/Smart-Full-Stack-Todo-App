import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { AuthProvider } from './app/context/AuthContext';
import { SocketProvider } from './app/context/SocketContext';
import { NotificationProvider } from './app/context/NotificationContext';

// Get Google Client ID from environment variable or use the hardcoded one as fallback
const CLIENT_ID =
   import.meta.env.VITE_GOOGLE_CLIENT_ID || '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
   <React.StrictMode>
      <BrowserRouter>
         <AuthProvider>
            <SocketProvider>
               <NotificationProvider>
                  <GoogleOAuthProvider clientId={CLIENT_ID}>
                     <App />
                  </GoogleOAuthProvider>
               </NotificationProvider>
            </SocketProvider>
         </AuthProvider>
      </BrowserRouter>
   </React.StrictMode>
);
