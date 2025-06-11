'use client';

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../layout/Layout';
import LandingPageLayout from '../layout/LandingPageLayout';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import Insights from '../pages/Insights';
import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/auth/AuthPage';

const AppRoutes = () => {
   const { isLoggedIn, loading } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const [navigationLock, setNavigationLock] = useState(false);
   const [lastNavigation, setLastNavigation] = useState('');
   const [navigationCount, setNavigationCount] = useState(0);

   // Handle navigation and prevent loops
   useEffect(() => {
      const currentPath = location.pathname;
      setNavigationCount((prev) => prev + 1);
      console.log(`Navigation ${navigationCount}: ${currentPath}`);

      // Prevent rapid navigation (potential loops)
      if (lastNavigation === currentPath && Date.now() - lastNavigation.timestamp < 1000) {
         console.log('Navigation debounced - too rapid');
         return;
      }

      // Update last navigation
      setLastNavigation({
         path: currentPath,
         timestamp: Date.now(),
      });

      // Handle auth-based redirects
      if (!loading) {
         if (isLoggedIn) {
            console.log('User logged in, redirecting to dashboard');
            if (currentPath === '/' || currentPath.startsWith('/auth')) {
               if (!navigationLock) {
                  setNavigationLock(true);
                  navigate('/dashboard');
                  setTimeout(() => setNavigationLock(false), 1000);
               }
            }
         } else {
            console.log('User not logged in, redirecting to login');
            if (currentPath !== '/' && !currentPath.startsWith('/auth') && !navigationLock) {
               setNavigationLock(true);
               navigate('/auth/login');
               setTimeout(() => setNavigationLock(false), 1000);
            }
         }
      }
   }, [location.pathname, isLoggedIn, loading, navigate, navigationLock]);

   // Show loading state while auth is being determined
   if (loading) {
      return (
         <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6]"></div>
         </div>
      );
   }

   return (
      <Routes>
         {/* Public routes */}
         <Route
            path="/"
            element={
               <LandingPageLayout>
                  <LandingPage />
               </LandingPageLayout>
            }
         />
         <Route path="/auth/:authType" element={isLoggedIn ? <Navigate to="/dashboard" /> : <AuthPage />} />

         {/* Protected routes */}
         <Route
            path="/dashboard"
            element={
               isLoggedIn ? (
                  <Layout>
                     <Dashboard />
                  </Layout>
               ) : (
                  <Navigate to="/auth/login" />
               )
            }
         />
         <Route
            path="/settings"
            element={
               isLoggedIn ? (
                  <Layout>
                     <Settings />
                  </Layout>
               ) : (
                  <Navigate to="/auth/login" />
               )
            }
         />
         <Route
            path="/insights"
            element={
               isLoggedIn ? (
                  <Layout>
                     <Insights />
                  </Layout>
               ) : (
                  <Navigate to="/auth/login" />
               )
            }
         />

         {/* Fallback route */}
         <Route path="*" element={<Navigate to="/" />} />
      </Routes>
   );
};

export default AppRoutes;
