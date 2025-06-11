'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
   const [socket, setSocket] = useState(null);
   const [isConnected, setIsConnected] = useState(false);
   const [connectionAttempts, setConnectionAttempts] = useState(0);
   const { isLoggedIn, user } = useAuth();
   const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';
   const MAX_RECONNECT_ATTEMPTS = 3;

   useEffect(() => {
      let socketInstance = null;

      // Only attempt to connect if the user is logged in
      if (isLoggedIn && user && !socket) {
         try {
            console.log('Attempting to connect to socket server...');

            // Create socket connection with error handling
            socketInstance = io(BACKEND_URL, {
               transports: ['polling', 'websocket'], // Try polling first, then websocket
               reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
               reconnectionDelay: 1000,
               timeout: 10000,
               auth: {
                  token: localStorage.getItem('token'),
               },
               query: {
                  userId: user.id,
               },
            });

            // Connection event handlers
            socketInstance.on('connect', () => {
               console.log('Socket connected successfully');
               setIsConnected(true);
               setConnectionAttempts(0);
            });

            socketInstance.on('connect_error', (err) => {
               console.error('Socket connection error:', err.message);
               setConnectionAttempts((prev) => prev + 1);

               if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
                  console.warn('Max reconnection attempts reached, continuing without socket connection');
                  socketInstance.disconnect();
                  // Don't show error toast to users - just continue without real-time features
               }
            });

            socketInstance.on('disconnect', (reason) => {
               console.log('Socket disconnected:', reason);
               setIsConnected(false);
            });

            setSocket(socketInstance);
         } catch (error) {
            console.error('Error initializing socket:', error);
         }
      }

      // Cleanup function
      return () => {
         if (socketInstance) {
            console.log('Cleaning up socket connection');
            socketInstance.disconnect();
         }
      };
   }, [isLoggedIn, user, connectionAttempts]);

   // Provide a way to manually reconnect
   const reconnect = () => {
      if (socket) {
         socket.disconnect();
         setSocket(null);
      }
      setConnectionAttempts(0);
   };

   return <SocketContext.Provider value={{ socket, isConnected, reconnect }}>{children}</SocketContext.Provider>;
};

export default SocketContext;
