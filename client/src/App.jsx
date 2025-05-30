import React from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './app/context/ThemeContext';
import AppRoutes from './app/routes/routes';
import NotificationToast from './app/components/NotificationToast';
import EnhancedBackground from './app/components/EnhancedBackground';
import './app/styles/background.css';

function App() {
   return (
      <>
         <ThemeProvider>
            <EnhancedBackground />
            <Toaster position="top-right" />
            <NotificationToast />
            <AppRoutes />
         </ThemeProvider>
      </>
   );
}

export default App;
