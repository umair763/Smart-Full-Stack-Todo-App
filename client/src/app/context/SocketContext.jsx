import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

// Get the API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create context
const SocketContext = createContext(null);

// Socket provider component
export const SocketProvider = ({ children }) => {
   const [socket, setSocket] = useState(null);
   const [connected, setConnected] = useState(false);

   // Initialize socket connection
   useEffect(() => {
      // Create socket instance
      const newSocket = io(API_BASE_URL, {
         path: '/socket.io',
         transports: ['websocket', 'polling'],
         reconnection: true,
         reconnectionAttempts: 5,
         reconnectionDelay: 1000,
      });

      // Handle connection events
      newSocket.on('connect', () => {
         console.log('Socket connected:', newSocket.id);
         setConnected(true);

         // Try to authenticate if token exists
         const token = localStorage.getItem('token');
         const userId = localStorage.getItem('userId');

         if (userId) {
            newSocket.emit('authenticate', userId);
         }
      });

      newSocket.on('disconnect', () => {
         console.log('Socket disconnected');
         setConnected(false);
      });

      // Handle notification events
      newSocket.on('db_change', (data) => {
         const { operation, message, type } = data;

         // Customize notification based on operation type
         switch (operation) {
            case 'create':
            case 'update':
            case 'delete':
            case 'status_change':
               toast(message, {
                  duration: 3000,
                  style: {
                     background: 'white',
                     color: '#333',
                     border: '1px solid #ddd',
                     padding: '12px 20px',
                     borderRadius: '8px',
                     fontSize: '14px',
                     fontWeight: '500',
                  },
               });
               break;
            case 'reminder_set':
               toast(message, {
                  icon: '⏰',
                  duration: 5000,
                  style: {
                     background: '#4CAF50',
                     color: 'white',
                     border: '1px solid #45a049',
                     padding: '12px 20px',
                     borderRadius: '8px',
                     fontSize: '14px',
                     fontWeight: '500',
                  },
               });
               break;
            case 'reminder':
               toast(message, {
                  icon: '🔔',
                  duration: 60000, // 1 minute
                  style: {
                     background: '#FFD700',
                     color: 'black',
                     border: '1px solid #DAA520',
                     padding: '12px 20px',
                     borderRadius: '8px',
                     fontSize: '14px',
                     fontWeight: '500',
                  },
                  iconTheme: {
                     primary: '#DAA520',
                     secondary: 'black',
                  },
               });
               break;
            default:
               toast(message, {
                  duration: 3000,
               });
         }
      });

      // Cleanup on unmount
      setSocket(newSocket);
      return () => {
         newSocket.disconnect();
      };
   }, []);

   return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
};

// Hook to use the socket context
export const useSocket = () => {
   const context = useContext(SocketContext);
   if (context === null) {
      throw new Error('useSocket must be used within a SocketProvider');
   }
   return context;
};
