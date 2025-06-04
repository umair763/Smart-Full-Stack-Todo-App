'use client';

import { createContext, useState, useEffect, useContext } from 'react';

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

   useEffect(() => {
      const token = localStorage.getItem('token');
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
      }
      setLoading(false);
   }, []);

   const login = (token) => {
      localStorage.setItem('token', token);
      setIsLoggedIn(true);
      try {
         const tokenData = parseJwt(token);
         if (tokenData) {
            setUser({
               id: tokenData.userId,
               exp: tokenData.exp,
            });
         }
      } catch (e) {
         console.error('Error parsing token data:', e);
      }
   };

   const logout = () => {
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
