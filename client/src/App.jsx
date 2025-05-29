import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './app/routes/routes';
import NotificationToast from './components/NotificationToast';
import EnhancedBackground from './components/EnhancedBackground';
import './styles/background.css';

function App() {
   return (
      <>
         <ThemeProvider>
            <SocketProvider>
               <EnhancedBackground />
               <Toaster position="top-right" />
               <NotificationToast />
               <AppRoutes />
            </SocketProvider>
         </ThemeProvider>
      </>
   );
}

export default App;
