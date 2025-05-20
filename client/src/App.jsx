import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './app/routes/routes';
import NotificationToast from './components/NotificationToast';

function App() {
   return (
      <>
         <SocketProvider>
            <Toaster position="top-right" />
            <NotificationToast />
            <AppRoutes />
         </SocketProvider>
      </>
   );
}

export default App;
