'use client';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import AuthPage from '../pages/auth/AuthPage';
import Layout from '../layout/Layout';
import LandingPageLayout from '../layout/LandingPageLayout';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import Insights from '../pages/Insights';
import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
   const { isLoggedIn, loading } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const [isNavigating, setIsNavigating] = useState(false);
   const lastNavigationTime = useRef(0);
   const navigationCount = useRef(0);
   const lastAuthState = useRef(null);
   const lastPath = useRef('');

   useEffect(() => {
      // Prevent rapid navigation (debounce)
      const now = Date.now();
      if (now - lastNavigationTime.current < 500) {
         console.log('Navigation debounced - too rapid');
         return;
      }

      // Track navigation count to detect loops
      if (lastPath.current !== location.pathname) {
         navigationCount.current += 1;
         lastPath.current = location.pathname;
         lastNavigationTime.current = now;

         console.log(`Navigation ${navigationCount.current}: ${location.pathname}`);

         // Reset navigation count after 5 seconds
         setTimeout(() => {
            navigationCount.current = 0;
         }, 5000);

         // If too many navigations, stop redirecting
         if (navigationCount.current > 10) {
            console.error('Too many navigations detected, stopping auto-redirects');
            return;
         }
      }

      // Only handle redirects if auth state actually changed and we're not already navigating
      if (loading || isNavigating || lastAuthState.current === isLoggedIn) {
         return;
      }

      lastAuthState.current = isLoggedIn;
      console.log(`Auth state changed to: ${isLoggedIn}`);

      const currentPath = location.pathname;

      // Handle auth-based redirects with proper checks
      if (isLoggedIn) {
         // User is logged in
         if (currentPath === '/auth/login' || currentPath === '/auth/register' || currentPath === '/') {
            console.log('User logged in, redirecting to dashboard');
            setIsNavigating(true);
            setTimeout(() => {
               navigate('/dashboard', { replace: true });
               setIsNavigating(false);
            }, 100);
         }
      } else {
         // User is not logged in
         if (currentPath === '/dashboard' || currentPath === '/settings' || currentPath === '/insights') {
            console.log('User not logged in, redirecting to login');
            setIsNavigating(true);
            setTimeout(() => {
               navigate('/auth/login', { replace: true });
               setIsNavigating(false);
            }, 100);
         }
      }
   }, [isLoggedIn, loading, location.pathname, navigate, isNavigating]);

   // Show loading spinner while checking authentication
   if (loading) {
      return (
         <div className="min-h-screen bg-gradient-to-br from-[#9406E6] to-[#00FFFF] dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
               <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6] dark:border-purple-400"></div>
               </div>
               <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
            </div>
         </div>
      );
   }

   return (
      <Routes>
         {/* Landing Page - accessible to both authenticated and unauthenticated users */}
         <Route element={<LandingPageLayout />}>
            <Route path="/home" element={<LandingPage />} />
            <Route path="/" element={<LandingPage />} />
         </Route>

         {!isLoggedIn ? (
            <>
               {/* Authentication routes */}
               <Route path="/auth/login" element={<AuthPage />} />
               <Route path="/auth/register" element={<AuthPage />} />
               {/* Redirect all other routes to login when not logged in */}
               <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </>
         ) : (
            <>
               {/* Protected routes */}
               <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/insights" element={<Insights />} />
               </Route>
               <Route path="/app" element={<Navigate to="/dashboard" replace />} />
               {/* Redirect all other routes to dashboard when logged in */}
               <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
         )}
      </Routes>
   );
};

export default AppRoutes;
