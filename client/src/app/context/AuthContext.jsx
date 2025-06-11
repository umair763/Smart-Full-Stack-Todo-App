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
   const [token, setToken] = useState(null);
   const authCheckComplete = useRef(false);
   const isProcessingAuth = useRef(false);
   const initialCheckDone = useRef(false);

   // Initial auth check on mount
   useEffect(() => {
      if (initialCheckDone.current) return;

      const checkAuth = async () => {
         isProcessingAuth.current = true;
         console.log('AuthContext: Initial authentication check');

         try {
            const storedToken = localStorage.getItem('token');

            if (storedToken) {
               const tokenData = parseJwt(storedToken);

               if (!tokenData) {
                  console.warn('Invalid token format, clearing auth');
                  localStorage.removeItem('token');
                  localStorage.removeItem('userId');
                  setIsLoggedIn(false);
                  setUser(null);
                  setToken(null);
               } else if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
                  console.warn('Token expired, clearing auth');
                  localStorage.removeItem('token');
                  localStorage.removeItem('userId');
                  setIsLoggedIn(false);
                  setUser(null);
                  setToken(null);
               } else {
                  console.log('Valid token found, user is authenticated');
                  setToken(storedToken);
                  setIsLoggedIn(true);
                  setUser({
                     id: tokenData.userId,
                     exp: tokenData.exp,
                  });
                  // Store userId for socket authentication
                  localStorage.setItem('userId', tokenData.userId);
               }
            } else {
               console.log('No token found, user is not authenticated');
               setIsLoggedIn(false);
               setUser(null);
               setToken(null);
               localStorage.removeItem('userId');
            }
         } catch (e) {
            console.error('Error during auth check:', e);
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setIsLoggedIn(false);
            setUser(null);
            setToken(null);
         } finally {
            setLoading(false);
            isProcessingAuth.current = false;
            initialCheckDone.current = true;
            authCheckComplete.current = true;
         }
      };

      checkAuth();
   }, []);

   const login = (newToken) => {
      if (isProcessingAuth.current) {
         console.log('AuthContext: Login called while processing, deferring');
         setTimeout(() => login(newToken), 100);
         return;
      }

      console.log('AuthContext: Login called with token');
      isProcessingAuth.current = true;

      if (!newToken) {
         console.error('No token provided to login function');
         isProcessingAuth.current = false;
         return;
      }

      try {
         localStorage.setItem('token', newToken);
         setToken(newToken);

         const tokenData = parseJwt(newToken);
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
            setToken(null);
         }
      } catch (e) {
         console.error('Error during login:', e);
         localStorage.removeItem('token');
         setToken(null);
      } finally {
         isProcessingAuth.current = false;
      }
   };

   const logout = () => {
      if (isProcessingAuth.current) {
         console.log('AuthContext: Logout called while processing, deferring');
         setTimeout(() => logout(), 100);
         return;
      }

      console.log('AuthContext: Logout called');
      isProcessingAuth.current = true;

      try {
         localStorage.removeItem('token');
         localStorage.removeItem('userId');
         setIsLoggedIn(false);
         setUser(null);
         setToken(null);
      } catch (e) {
         console.error('Error during logout:', e);
      } finally {
         isProcessingAuth.current = false;
      }
   };

   const value = {
      isLoggedIn,
      user,
      token,
      login,
      logout,
      loading,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
