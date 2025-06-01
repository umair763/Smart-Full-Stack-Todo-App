import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
   const [socket, setSocket] = useState(null);
   const [isConnected, setIsConnected] = useState(false);

   useEffect(() => {
      const socketInstance = io(BACKEND_URL, {
         withCredentials: true,
         transports: ['websocket', 'polling'],
         path: '/socket.io/',
         reconnection: true,
         reconnectionAttempts: 5,
         reconnectionDelay: 1000,
         timeout: 20000,
         autoConnect: true,
         forceNew: true,
      });

      socketInstance.on('connect', () => {
         setIsConnected(true);
         console.log('Socket connected');
      });

      socketInstance.on('connect_error', (error) => {
         console.error('Socket connection error:', error);
         setIsConnected(false);
      });

      socketInstance.on('disconnect', (reason) => {
         setIsConnected(false);
         console.log('Socket disconnected:', reason);
      });

      socketInstance.on('db_change', (data) => {
         console.log('Database change:', data);
         if (data.type === 'task') {
            switch (data.operation) {
               case 'create':
                  toast.success(data.message);
                  break;
               case 'update':
                  toast.info(data.message);
                  break;
               case 'delete':
                  toast.error(data.message);
                  break;
               case 'status_change':
                  toast.success(data.message);
                  break;
               default:
                  toast(data.message);
            }
         }
      });

      setSocket(socketInstance);

      return () => {
         if (socketInstance) {
            socketInstance.disconnect();
         }
      };
   }, []);

   return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};
