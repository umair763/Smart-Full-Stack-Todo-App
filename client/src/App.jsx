import React from 'react';
import AppRoutes from './app/routes/routes';
import NotificationToast from './components/NotificationToast';

function App() {
   return (
      <>
         <NotificationToast />
         <AppRoutes />
      </>
   );
}

export default App;
