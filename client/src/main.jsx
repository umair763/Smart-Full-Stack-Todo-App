import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { AuthProvider } from './app/context/AuthContext';

// Get Google Client ID from environment variable or use the hardcoded one as fallback
const CLIENT_ID =
   import.meta.env.VITE_GOOGLE_CLIENT_ID || '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
   <React.StrictMode>
      <BrowserRouter>
         <AuthProvider>
            <GoogleOAuthProvider
               clientId={CLIENT_ID}
               onScriptLoadError={(err) => console.error('Google OAuth script load error:', err)}
            >
               <App />
            </GoogleOAuthProvider>
         </AuthProvider>
      </BrowserRouter>
   </React.StrictMode>
);
