import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './app/routes/routes';
import NotificationToast from './components/NotificationToast';
import EnhancedBackground from './components/EnhancedBackground';
import './styles/background.css';

function App() {
   return (
      <>
         <EnhancedBackground />
         <Toaster position="top-right" />
         <NotificationToast />
         <AppRoutes />
      </>
   );
}

export default App;
