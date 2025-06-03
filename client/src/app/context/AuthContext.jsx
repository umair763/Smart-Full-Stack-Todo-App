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
   const [token, setToken] = useState(null);

   useEffect(() => {
      console.log('AuthContext initial useEffect running');
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
         console.log('Token found in localStorage');
         try {
            const tokenData = parseJwt(storedToken);

            if (!tokenData) {
               console.warn('Invalid token format in localStorage, logging out');
               localStorage.removeItem('token');
               setIsLoggedIn(false);
               setToken(null);
            } else if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
               console.warn('Token expired in localStorage, logging out');
               localStorage.removeItem('token');
               setIsLoggedIn(false);
               setToken(null);
            } else {
               console.log('Valid token found, setting state');
               setIsLoggedIn(true);
               setToken(storedToken);
               setUser({
                  id: tokenData.userId,
                  exp: tokenData.exp,
               });
            }
         } catch (e) {
            console.error('Error processing token from localStorage:', e);
            localStorage.removeItem('token');
            setIsLoggedIn(false);
            setToken(null);
         }
      }
      console.log('AuthContext initial check complete, setting loading false');
      setLoading(false);
   }, []);

   const login = (newToken) => {
      console.log('AuthContext login function called');
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setIsLoggedIn(true);
      try {
         const tokenData = parseJwt(newToken);
         if (tokenData) {
            setUser({
               id: tokenData.userId,
               exp: tokenData.exp,
            });
         }
      } catch (e) {
         console.error('Error processing token:', e);
         localStorage.removeItem('token');
         setIsLoggedIn(false);
         setToken(null);
      }
   };

   const logout = () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setToken(null);
      setUser(null);
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
