import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './app/context/AuthContext';
import { ThemeProvider } from './app/context/ThemeContext';
import { NotificationProvider } from './app/context/NotificationContext';
import { SocketProvider } from './app/context/SocketContext';

// Google Client ID
const GOOGLE_CLIENT_ID = '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
   <React.StrictMode>
      <BrowserRouter>
         <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ThemeProvider>
               <AuthProvider>
                  <SocketProvider>
                     <NotificationProvider>
                        <App />
                     </NotificationProvider>
                  </SocketProvider>
               </AuthProvider>
            </ThemeProvider>
         </GoogleOAuthProvider>
      </BrowserRouter>
   </React.StrictMode>
);
