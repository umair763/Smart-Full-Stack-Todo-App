'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
   const context = useContext(SocketContext);
   if (!context) {
      throw new Error('useSocket must be used within a SocketProvider');
   }
   return context;
};

export const SocketProvider = ({ children }) => {
   const [socket, setSocket] = useState(null);
   const [isConnected, setIsConnected] = useState(false);
   const [connectionAttempts, setConnectionAttempts] = useState(0);
   const { isLoggedIn, user } = useAuth();
   const reconnectTimeoutRef = useRef(null);
   const maxReconnectAttempts = 5;

   // Backend URL for socket connection
   const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

   useEffect(() => {
      if (isLoggedIn && user) {
         connectSocket();
      } else {
         disconnectSocket();
      }

      return () => {
         disconnectSocket();
      };
   }, [isLoggedIn, user]);

   const connectSocket = () => {
      // Don't create multiple connections
      if (socket?.connected) {
         console.log('Socket already connected');
         return;
      }

      // Limit reconnection attempts
      if (connectionAttempts >= maxReconnectAttempts) {
         console.log('Max reconnection attempts reached, giving up');
         return;
      }

      try {
         console.log('Attempting to connect to socket...');

         const newSocket = io(BACKEND_URL, {
            transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket if available
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
            forceNew: true,
            autoConnect: true,
         });

         newSocket.on('connect', () => {
            console.log('Socket connected successfully');
            setIsConnected(true);
            setConnectionAttempts(0);

            // Authenticate the socket connection
            if (user?.id) {
               newSocket.emit('authenticate', user.id);
               console.log('Socket authenticated for user:', user.id);
            }
         });

         newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);

            // Only attempt reconnection for certain disconnect reasons
            if (reason === 'io server disconnect' || reason === 'transport close') {
               scheduleReconnect();
            }
         });

         newSocket.on('connect_error', (error) => {
            console.warn('Socket connection error:', error.message);
            setIsConnected(false);
            setConnectionAttempts((prev) => prev + 1);

            // Schedule reconnection with exponential backoff
            scheduleReconnect();
         });

         newSocket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            setIsConnected(true);
            setConnectionAttempts(0);
         });

         newSocket.on('reconnect_error', (error) => {
            console.warn('Socket reconnection error:', error.message);
            setConnectionAttempts((prev) => prev + 1);
         });

         newSocket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed after all attempts');
            setIsConnected(false);
         });

         setSocket(newSocket);
      } catch (error) {
         console.error('Error creating socket connection:', error);
         setConnectionAttempts((prev) => prev + 1);
         scheduleReconnect();
      }
   };

   const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) {
         clearTimeout(reconnectTimeoutRef.current);
      }

      if (connectionAttempts < maxReconnectAttempts) {
         const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000); // Exponential backoff, max 30s
         console.log(
            `Scheduling reconnection in ${delay}ms (attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`
         );

         reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
         }, delay);
      }
   };

   const disconnectSocket = () => {
      if (reconnectTimeoutRef.current) {
         clearTimeout(reconnectTimeoutRef.current);
         reconnectTimeoutRef.current = null;
      }

      if (socket) {
         console.log('Disconnecting socket...');
         socket.disconnect();
         setSocket(null);
         setIsConnected(false);
         setConnectionAttempts(0);
      }
   };

   const value = {
      socket,
      isConnected,
      connectionAttempts,
      maxReconnectAttempts,
      reconnect: connectSocket,
      disconnect: disconnectSocket,
   };

   return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketContext;
