'use client';

import { createContext, useState, useEffect, useContext, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Helper function to safely parse JWT tokens
const parseJwt = (token) => {
   try {
      return JSON.parse(atob(token.split('.')[1]));
   } catch (e) {
      console.error('Error parsing token:', e);
      return null;
   }
};

export const AuthProvider = ({ children }) => {
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [loading, setLoading] = useState(true);
   const [user, setUser] = useState(null);
   const authCheckComplete = useRef(false);
   const isProcessingAuth = useRef(false);

   useEffect(() => {
      // Prevent multiple simultaneous auth checks
      if (isProcessingAuth.current) {
         return;
      }

      isProcessingAuth.current = true;

      const checkAuth = () => {
         console.log('AuthContext: Checking authentication state');

         const token = localStorage.getItem('token');

         if (token) {
            try {
               const tokenData = parseJwt(token);

               if (!tokenData) {
                  console.warn('Invalid token format, clearing auth');
                  localStorage.removeItem('token');
                  localStorage.removeItem('userId');
                  setIsLoggedIn(false);
                  setUser(null);
               } else if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
                  console.warn('Token expired, clearing auth');
                  localStorage.removeItem('token');
                  localStorage.removeItem('userId');
                  setIsLoggedIn(false);
                  setUser(null);
               } else {
                  console.log('Valid token found, user is authenticated');
                  setIsLoggedIn(true);
                  setUser({
                     id: tokenData.userId,
                     exp: tokenData.exp,
                  });
                  // Store userId for socket authentication
                  localStorage.setItem('userId', tokenData.userId);
               }
            } catch (e) {
               console.error('Error processing token:', e);
               localStorage.removeItem('token');
               localStorage.removeItem('userId');
               setIsLoggedIn(false);
               setUser(null);
            }
         } else {
            console.log('No token found, user is not authenticated');
            setIsLoggedIn(false);
            setUser(null);
            localStorage.removeItem('userId');
         }

         setLoading(false);
         authCheckComplete.current = true;
         isProcessingAuth.current = false;
      };

      checkAuth();
   }, []);

   const login = (token) => {
      console.log('AuthContext: Login called with token');

      if (!token) {
         console.error('No token provided to login function');
         return;
      }

      try {
         localStorage.setItem('token', token);

         const tokenData = parseJwt(token);
         if (tokenData) {
            console.log('Token parsed successfully, setting user state');
            setUser({
               id: tokenData.userId,
               exp: tokenData.exp,
            });
            localStorage.setItem('userId', tokenData.userId);
            setIsLoggedIn(true);
         } else {
            console.error('Failed to parse token during login');
            localStorage.removeItem('token');
         }
      } catch (e) {
         console.error('Error during login:', e);
         localStorage.removeItem('token');
      }
   };

   const logout = () => {
      console.log('AuthContext: Logout called');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setIsLoggedIn(false);
      setUser(null);
   };

   const value = {
      isLoggedIn,
      user,
      login,
      logout,
      loading,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
