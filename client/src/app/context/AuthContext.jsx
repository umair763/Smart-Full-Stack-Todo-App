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
   const [authState, setAuthState] = useState({
      isLoggedIn: false,
      user: null,
      loading: true,
   });

   useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
         try {
            const tokenData = parseJwt(token);
            if (!tokenData) {
               console.warn('Invalid token format, logging out');
               localStorage.removeItem('token');
               setAuthState({ isLoggedIn: false, user: null, loading: false });
            } else if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
               console.warn('Token expired, logging out');
               localStorage.removeItem('token');
               setAuthState({ isLoggedIn: false, user: null, loading: false });
            } else {
               setAuthState({
                  isLoggedIn: true,
                  user: { id: tokenData.userId, exp: tokenData.exp },
                  loading: false,
               });
            }
         } catch (e) {
            console.error('Error processing token:', e);
            localStorage.removeItem('token');
            setAuthState({ isLoggedIn: false, user: null, loading: false });
         }
      } else {
         setAuthState({ isLoggedIn: false, user: null, loading: false });
      }
   }, []);

   const login = (token) => {
      localStorage.setItem('token', token);
      const tokenData = parseJwt(token);
      if (tokenData) {
         setAuthState({
            isLoggedIn: true,
            user: { id: tokenData.userId, exp: tokenData.exp },
            loading: false,
         });
      }
   };

   const logout = () => {
      localStorage.removeItem('token');
      setAuthState({ isLoggedIn: false, user: null, loading: false });
   };

   const value = useMemo(
      () => ({
         isLoggedIn: authState.isLoggedIn,
         user: authState.user,
         login,
         logout,
         loading: authState.loading,
      }),
      [authState]
   );

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
