import { createContext, useState, useEffect, useMemo, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

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
   const [token, setToken] = useState(() => {
      // Initialize token from localStorage during component mount
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
         try {
            const tokenData = parseJwt(storedToken);
            if (tokenData && tokenData.exp && tokenData.exp > Math.floor(Date.now() / 1000)) {
               return storedToken;
            }
         } catch (e) {
            console.error('Error parsing stored token:', e);
         }
      }
      return null;
   });

   useEffect(() => {
      console.log('AuthContext initial useEffect running');
      if (token) {
         console.log('Token found in state');
         try {
            const tokenData = parseJwt(token);
            if (!tokenData) {
               console.warn('Invalid token format, logging out');
               handleLogout();
            } else if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
               console.warn('Token expired, logging out');
               handleLogout();
            } else {
               console.log('Valid token found, setting state');
               setIsLoggedIn(true);
               setUser({
                  id: tokenData.userId,
                  exp: tokenData.exp,
               });
            }
         } catch (e) {
            console.error('Error processing token:', e);
            handleLogout();
         }
      }
      console.log('AuthContext initial check complete, setting loading false');
      setLoading(false);
   }, [token]);

   const handleLogout = () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setToken(null);
      setUser(null);
   };

   const login = (newToken) => {
      console.log('AuthContext login function called');
      if (!newToken) {
         console.error('No token provided to login');
         return;
      }
      try {
         const tokenData = parseJwt(newToken);
         if (!tokenData) {
            throw new Error('Invalid token format');
         }
         localStorage.setItem('token', newToken);
         setToken(newToken);
         setIsLoggedIn(true);
         setUser({
            id: tokenData.userId,
            exp: tokenData.exp,
         });
      } catch (e) {
         console.error('Error processing token:', e);
         handleLogout();
      }
   };

   const logout = () => {
      handleLogout();
   };

   const value = useMemo(
      () => ({
         isLoggedIn,
         user,
         token,
         login,
         logout,
         loading,
      }),
      [isLoggedIn, user, token, login, logout, loading]
   );

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
