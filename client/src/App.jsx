import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './app/routes/routes';
import NotificationToast from './components/NotificationToast';

function App() {
   return (
      <>
         <ThemeProvider>
            <SocketProvider>
               <Toaster position="top-right" />
               <NotificationToast />
               <AppRoutes />
            </SocketProvider>
         </ThemeProvider>
      </>
   );
}

export default App;
