'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [token, setToken] = useState(null);
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [authError, setAuthError] = useState(null);

   // Check for token in localStorage on initial load
   useEffect(() => {
      console.log('AuthContext: Initial authentication check');
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
         try {
            // Verify token is valid
            const decodedToken = jwtDecode(storedToken);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp && decodedToken.exp > currentTime) {
               console.log('Valid token found, user is authenticated');
               setToken(storedToken);
               setUser({
                  id: decodedToken.userId,
                  username: decodedToken.username,
                  email: decodedToken.email,
                  profileImage: decodedToken.profileImage,
               });
               setIsLoggedIn(true);
            } else {
               console.log('Token expired, logging out');
               localStorage.removeItem('token');
            }
         } catch (error) {
            console.error('Invalid token:', error);
            localStorage.removeItem('token');
         }
      }

      setLoading(false);
   }, []);

   // Login function
   const login = (newToken, userData = null) => {
      console.log('AuthContext: Login called with token');

      if (!newToken) {
         console.error('No token provided for login');
         return;
      }

      try {
         // Store token in localStorage
         localStorage.setItem('token', newToken);
         setToken(newToken);

         // Parse user data from token if not provided
         if (!userData) {
            const decodedToken = jwtDecode(newToken);
            console.log('Token parsed successfully, setting user state');
            setUser({
               id: decodedToken.userId,
               username: decodedToken.username,
               email: decodedToken.email,
               profileImage: decodedToken.profileImage,
            });
         } else {
            setUser(userData);
         }

         setIsLoggedIn(true);
         setAuthError(null);
      } catch (error) {
         console.error('Login error:', error);
         setAuthError('Failed to log in. Please try again.');
         logout();
      }
   };

   // Logout function
   const logout = () => {
      console.log('AuthContext: Logout called');
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
   };

   // Update user data function
   const updateUser = (updatedUserData) => {
      console.log('AuthContext: Updating user data', updatedUserData);
      setUser((prev) => ({ ...prev, ...updatedUserData }));

      // If we have a token, update it with new user data
      if (token) {
         try {
            const decodedToken = jwtDecode(token);
            const newTokenData = { ...decodedToken, ...updatedUserData };

            // Note: In a real app, you'd get a new token from the server
            // For now, we'll just update the local state
            console.log('User data updated successfully');
         } catch (error) {
            console.error('Error updating user data:', error);
         }
      }
   };

   // Refresh user data from server
   const refreshUserData = async () => {
      if (!token) return;

      try {
         const response = await fetch('https://smart-todo-task-management-backend.vercel.app/api/users/profile', {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (response.ok) {
            const userData = await response.json();
            setUser((prev) => ({ ...prev, ...userData }));
         }
      } catch (error) {
         console.error('Error refreshing user data:', error);
      }
   };

   // Context value
   const value = {
      isLoggedIn,
      token,
      user,
      login,
      logout,
      updateUser,
      refreshUserData,
      loading,
      authError,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
