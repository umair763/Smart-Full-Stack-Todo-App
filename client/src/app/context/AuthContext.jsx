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

   useEffect(() => {
      // Prevent multiple auth checks on initial load
      if (authCheckComplete.current) return;

      const token = localStorage.getItem('token');
      console.log('AuthContext: Checking token on initial load');

      if (token) {
         // Validate token format and expiration
         try {
            const tokenData = parseJwt(token);

            if (!tokenData) {
               console.warn('Invalid token format, logging out');
               localStorage.removeItem('token');
               setIsLoggedIn(false);
            } else if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
               console.warn('Token expired, logging out');
               localStorage.removeItem('token');
               setIsLoggedIn(false);
            } else {
               console.log('Valid token found, setting logged in state');
               setIsLoggedIn(true);
               setUser({
                  id: tokenData.userId,
                  exp: tokenData.exp,
               });
            }
         } catch (e) {
            console.error('Error processing token:', e);
            localStorage.removeItem('token');
            setIsLoggedIn(false);
         }
      } else {
         console.log('No token found, user is not logged in');
      }

      setLoading(false);
      authCheckComplete.current = true;
   }, []);

   // Monitor for excessive auth state changes that might indicate a loop
   useEffect(() => {
      authStateChangeCount.current += 1;

      const count = authStateChangeCount.current;
      console.log(`Auth state changed (${count}): isLoggedIn=${isLoggedIn}`);

      if (count > 5 && count < 10) {
         console.warn(`Detected ${count} auth state changes - possible auth loop`);
      } else if (count >= 10) {
         console.error(`Detected ${count} auth state changes - auth loop detected!`);
         // Reset counter after warning to avoid console spam
         authStateChangeCount.current = 0;
      }

      // Reset counter after 5 seconds of stability
      const timer = setTimeout(() => {
         authStateChangeCount.current = 0;
      }, 5000);

      return () => clearTimeout(timer);
   }, [isLoggedIn]);

   const login = (token) => {
      console.log('AuthContext: Login called with token');
      localStorage.setItem('token', token);

      try {
         const tokenData = parseJwt(token);
         if (tokenData) {
            setUser({
               id: tokenData.userId,
               exp: tokenData.exp,
            });
            setIsLoggedIn(true);
         }
      } catch (e) {
         console.error('Error parsing token data:', e);
      }
   };

   const logout = () => {
      console.log('AuthContext: Logout called');
      localStorage.removeItem('token');
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
