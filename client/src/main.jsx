import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

const CLIENT_ID = '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com';
createRoot(document.getElementById('root')).render(
   <StrictMode>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
         <App />
      </GoogleOAuthProvider>
   </StrictMode>
);
