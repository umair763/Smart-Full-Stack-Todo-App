import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './app/context/AuthContext';
import { ThemeProvider } from './app/context/ThemeContext';
import { NotificationProvider } from './app/context/NotificationContext';
import { SocketProvider } from './app/context/SocketContext';

// Hardcoded Google Client ID
const GOOGLE_CLIENT_ID = '1093100000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
   <React.StrictMode>
      <BrowserRouter>
         <ThemeProvider>
            <AuthProvider>
               <NotificationProvider>
                  <SocketProvider>
                     <App />
                  </SocketProvider>
               </NotificationProvider>
            </AuthProvider>
         </ThemeProvider>
      </BrowserRouter>
   </React.StrictMode>
);
