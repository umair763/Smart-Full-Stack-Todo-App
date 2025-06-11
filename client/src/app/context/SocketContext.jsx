'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
   const { isLoggedIn, user } = useAuth();

   // Since the backend is serverless and doesn't support Socket.io,
   // we'll provide a mock socket context that always returns null
   // This prevents errors while maintaining the same API

   useEffect(() => {
      console.log('Socket.io disabled - running in serverless mode');
      // Don't attempt to connect to socket in serverless environment
      setSocket(null);
      setIsConnected(false);
   }, [isLoggedIn, user]);

   const value = {
      socket: null, // Always null in serverless mode
      isConnected: false, // Always false in serverless mode
      connectionAttempts: 0,
      maxReconnectAttempts: 0,
      reconnect: () => {
         console.log('Socket reconnection disabled in serverless mode');
      },
      disconnect: () => {
         console.log('Socket disconnection disabled in serverless mode');
      },
   };

   return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketContext;
