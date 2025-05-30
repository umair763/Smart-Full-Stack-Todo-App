import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { AuthProvider } from './app/context/AuthContext';
import { SocketProvider } from './app/context/SocketContext';
import { NotificationProvider } from './app/context/NotificationContext';
import { config } from './config/env';

createRoot(document.getElementById('root')).render(
   <React.StrictMode>
      <BrowserRouter>
         <AuthProvider>
            <SocketProvider>
               <NotificationProvider>
                  <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
                     <App />
                  </GoogleOAuthProvider>
               </NotificationProvider>
            </SocketProvider>
         </AuthProvider>
      </BrowserRouter>
   </React.StrictMode>
);
