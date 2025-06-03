'use client';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import AuthPage from '../pages/auth/AuthPage';
import Layout from '../layout/Layout';
import LandingPageLayout from '../layout/LandingPageLayout';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import Insights from '../pages/Insights';
import { useAuth } from '../context/AuthContext';

// Loading component
const LoadingSpinner = () => (
   <div className="min-h-screen bg-gradient-to-br from-[#9406E6] to-[#00FFFF] dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
         <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6] dark:border-purple-400"></div>
         </div>
      </div>
   </div>
);

const AppRoutes = () => {
   const { isLoggedIn, loading } = useAuth();

   // Show loading spinner while checking authentication
   if (loading) {
      return <LoadingSpinner />;
   }

   return (
      <Suspense fallback={<LoadingSpinner />}>
         <Routes>
            {/* Public routes - Landing Page */}
            <Route element={<LandingPageLayout />}>
               <Route path="/home" element={<LandingPage />} />
               <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Authentication routes - only show when not logged in */}
            {!isLoggedIn && (
               <>
                  <Route path="/auth/login" element={<AuthPage />} />
                  <Route path="/auth/register" element={<AuthPage />} />
               </>
            )}

            {/* Protected routes - only show when logged in */}
            {isLoggedIn && (
               <>
                  <Route element={<Layout />}>
                     <Route path="/dashboard" element={<Dashboard />} />
                     <Route path="/settings" element={<Settings />} />
                     <Route path="/insights" element={<Insights />} />
                  </Route>
                  {/* Simplified redirect for authenticated users */}
                  {/* Redirect any unhandled authenticated route to dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
               </>
            )}
         </Routes>
      </Suspense>
   );
};

export default AppRoutes;
