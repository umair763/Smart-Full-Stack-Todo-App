import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
         setIsLoggedIn(true);
      }
      setLoading(false);
   }, []);

   const login = (token) => {
      localStorage.setItem('token', token);
      setIsLoggedIn(true);
   };

   const logout = () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
   };

   const value = {
      isLoggedIn,
      login,
      logout,
      loading,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
