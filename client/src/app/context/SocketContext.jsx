'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Use the consistent API base URL but replace http with ws
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = API_BASE_URL.replace(/^http/, 'ws');

// Create context
const SocketContext = createContext();

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const { user, isLoggedIn } = useAuth();

    // Connect to socket when user is authenticated
    useEffect(() => {
        if (!isLoggedIn || !user) {
            // Disconnect if exists
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Create socket connection
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        // Setup event listeners
        newSocket.on('connect', () => {
            console.log('Socket.io connected');
            // Authenticate with user ID
            if (user) {
                newSocket.emit('authenticate', user);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Setup notification listeners
        setupNotificationListeners(newSocket);

        // Cleanup on unmount
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [isLoggedIn, user]);

    // Setup notification listeners
    const setupNotificationListeners = (socket) => {
        if (!socket) return;

        // Task created notification
        socket.on('taskCreated', (data) => {
            addNotification({
                type: 'success',
                message: data.message || 'New task created',
                timestamp: new Date(),
                data: data.task
            });
        });

        // Task updated notification
        socket.on('taskUpdated', (data) => {
            addNotification({
                type: 'info',
                message: data.message || 'Task updated',
                timestamp: new Date(),
                data: data.task
            });
        });

        // Task deleted notification
        socket.on('taskDeleted', (data) => {
            addNotification({
                type: 'warning',
                message: data.message || 'Task deleted',
                timestamp: new Date(),
                data: { id: data.taskId }
            });
        });

        // Task status changed notification
        socket.on('taskStatusChanged', (data) => {
            addNotification({
                type: data.task.status ? 'success' : 'info',
                message: data.message || 'Task status changed',
                timestamp: new Date(),
                data: data.task
            });
        });
    };

    // Add a new notification
    const addNotification = (notification) => {
        setNotifications((prev) => [
            {
                id: Date.now(),
                ...notification
            },
            ...prev
        ].slice(0, 10)); // Keep only the last 10 notifications
    };

    // Remove a notification
    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    // Clear all notifications
    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <SocketContext.Provider
            value={{ socket, notifications, addNotification, removeNotification, clearNotifications }}
        >
            {children}
        </SocketContext.Provider>
    );
}

// Custom hook to use the socket context
export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
} 