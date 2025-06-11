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
   const authStateChangeCount = useRef(0);
   const lastAuthCheck = useRef(0);

   useEffect(() => {
      // Prevent multiple auth checks within a short time frame
      const now = Date.now();
      if (authCheckComplete.current && now - lastAuthCheck.current < 1000) {
         return;
      }

      lastAuthCheck.current = now;

      const checkAuth = () => {
         const token = localStorage.getItem('token');
         console.log('AuthContext: Checking authentication state');

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
      };

      checkAuth();
   }, []);

   // Monitor for excessive auth state changes
   useEffect(() => {
      authStateChangeCount.current += 1;
      const count = authStateChangeCount.current;

      if (count > 3 && count < 8) {
         console.warn(`Detected ${count} auth state changes - monitoring for loops`);
      } else if (count >= 8) {
         console.error(`Detected ${count} auth state changes - possible auth loop!`);
         // Reset counter to prevent console spam
         authStateChangeCount.current = 0;
      }

      // Reset counter after 10 seconds of stability
      const timer = setTimeout(() => {
         authStateChangeCount.current = 0;
      }, 10000);

      return () => clearTimeout(timer);
   }, [isLoggedIn]);

   const login = (token) => {
      console.log('AuthContext: Login called');
      localStorage.setItem('token', token);

      try {
         const tokenData = parseJwt(token);
         if (tokenData) {
            setUser({
               id: tokenData.userId,
               exp: tokenData.exp,
            });
            localStorage.setItem('userId', tokenData.userId);
            setIsLoggedIn(true);
         }
      } catch (e) {
         console.error('Error parsing token during login:', e);
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
