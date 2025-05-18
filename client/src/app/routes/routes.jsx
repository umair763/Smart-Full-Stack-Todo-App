import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from '../pages/auth/LoginForm';
import RegisterUser from '../pages/auth/RegisterUser';
import Layout from '../layout/Layout';
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
   const { isLoggedIn } = useAuth();

   return (
      <Routes>
         {!isLoggedIn ? (
            <>
               <Route path="/" element={<LoginForm />} />
               <Route path="/register" element={<RegisterUser />} />
               <Route path="*" element={<Navigate to="/" />} />
            </>
         ) : (
            <>
               <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
               </Route>
               <Route path="/" element={<Navigate to="/dashboard" />} />
               <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
         )}
      </Routes>
   );
};

export default AppRoutes;
