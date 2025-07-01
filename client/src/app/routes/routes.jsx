'use client';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import AuthPage from '../pages/auth/AuthPage';
import Layout from '../layout/Layout';
import LandingPageLayout from '../layout/LandingPageLayout';
import LandingPage from '../pages/LandingPage';
import PrivacyPolicy from '../pages/PrivacyPolicy';
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
   const navigationLock = useRef(false);

   useEffect(() => {
      // Prevent navigation during initial load
      if (loading) return;

      // Prevent navigation lock
      if (navigationLock.current) {
         console.log('Navigation locked, skipping redirect');
         return;
      }

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
         if (navigationCount.current > 5) {
            console.error('Too many navigations detected, locking redirects for 3 seconds');
            navigationLock.current = true;
            setTimeout(() => {
               navigationLock.current = false;
               navigationCount.current = 0;
            }, 3000);
            return;
         }
      }

      // Only handle redirects if auth state actually changed and we're not already navigating
      if (isNavigating || lastAuthState.current === isLoggedIn) {
         return;
      }

      lastAuthState.current = isLoggedIn;
      console.log(`Auth state changed to: ${isLoggedIn}`);

      const currentPath = location.pathname;

      // Handle auth-based redirects with proper checks
      if (isLoggedIn) {
         // User is logged in - only redirect from auth pages
         if (currentPath === '/auth/login' || currentPath === '/auth/register') {
            console.log('User logged in, redirecting from auth to dashboard');
            setIsNavigating(true);
            setTimeout(() => {
               navigate('/dashboard', { replace: true });
               setIsNavigating(false);
            }, 100);
         }
      } else {
         // User is not logged in - redirect protected routes to login
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
         {/* Public routes with LandingPageLayout */}
         <Route path="/" element={<LandingPageLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="home" element={<LandingPage />} />
         </Route>

         {/* Authentication routes */}
         <Route path="/auth/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
         <Route path="/auth/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

         {/* Protected routes with Layout */}
         <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/auth/login" replace />} />
            <Route path="settings" element={isLoggedIn ? <Settings /> : <Navigate to="/auth/login" replace />} />
            <Route path="insights" element={isLoggedIn ? <Insights /> : <Navigate to="/auth/login" replace />} />
         </Route>

         {/* Public route for Privacy Policy */}
         <Route path="/privacy" element={<PrivacyPolicy />} />

         {/* Fallback routes */}
         <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
   );
};

export default AppRoutes;
