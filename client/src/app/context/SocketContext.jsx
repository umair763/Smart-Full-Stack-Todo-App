'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
   const [socket, setSocket] = useState(null);
   const [isConnected, setIsConnected] = useState(false);
   const [isServerless, setIsServerless] = useState(true);

   useEffect(() => {
      // Check if we're running in a serverless environment
      // Vercel functions have limited execution time, so we need to detect this
      const checkServerlessMode = async () => {
         try {
            const response = await fetch(`${BACKEND_URL}/api/socket-status`, {
               method: 'GET',
               headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
               const data = await response.json();
               setIsServerless(!data.socketEnabled);
               return !data.socketEnabled;
            }
            return true; // Default to serverless mode if check fails
         } catch (error) {
            console.log('Socket status check failed, assuming serverless mode');
            return true;
         }
      };

      const initializeSocket = async () => {
         const serverlessMode = await checkServerlessMode();

         if (serverlessMode) {
            console.log('Socket.io disabled - running in serverless mode');
            setIsServerless(true);
            setIsConnected(false);
            return;
         }

         try {
            const socketInstance = io(BACKEND_URL, {
               withCredentials: true,
               transports: ['websocket', 'polling'],
               reconnectionAttempts: 5,
               reconnectionDelay: 1000,
               timeout: 10000,
            });

            socketInstance.on('connect', () => {
               setIsConnected(true);
               console.log('Socket connected');
            });

            socketInstance.on('disconnect', () => {
               setIsConnected(false);
               console.log('Socket disconnected');
            });

            socketInstance.on('connect_error', (error) => {
               console.error('Socket connection error:', error);
               setIsConnected(false);
            });

            setSocket(socketInstance);

            return () => {
               socketInstance.disconnect();
            };
         } catch (error) {
            console.error('Socket initialization error:', error);
            setIsServerless(true);
         }
      };

      initializeSocket();
   }, []);

   return <SocketContext.Provider value={{ socket, isConnected, isServerless }}>{children}</SocketContext.Provider>;
};
