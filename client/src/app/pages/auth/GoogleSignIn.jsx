'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

const GoogleSignIn = () => {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(false);
   const [isScriptLoaded, setIsScriptLoaded] = useState(false);

   useEffect(() => {
      const loadGoogleScript = () => {
         if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            setIsScriptLoaded(true);
            return;
         }

         const script = document.createElement('script');
         script.src = 'https://accounts.google.com/gsi/client';
         script.async = true;
         script.defer = true;
         script.onload = () => setIsScriptLoaded(true);
         script.onerror = () => {
            toast.error('Failed to load Google Sign-In');
            console.error('Failed to load Google Sign-In script');
         };

         document.body.appendChild(script);
      };

      loadGoogleScript();
   }, []);

   useEffect(() => {
      if (!isScriptLoaded || !window.google) return;

      try {
         window.google.accounts.id.initialize({
            client_id: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
         });

         window.google.accounts.id.renderButton(document.getElementById('google-signin-button'), {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%',
         });
      } catch (error) {
         console.error('Error initializing Google Sign-In:', error);
      }
   }, [isScriptLoaded]);

   const handleGoogleResponse = async (response) => {
      if (!response?.credential) {
         toast.error('Google sign-in failed');
         return;
      }

      setIsLoading(true);

      try {
         const backendResponse = await fetch(`${BACKEND_URL}/api/users/google-signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }),
         });

         const data = await backendResponse.json();

         if (!backendResponse.ok) {
            throw new Error(data.message || 'Google sign-in failed');
         }

         if (data.token) {
            login(data.token, data.user);
            toast.success('Signed in with Google successfully!');
            navigate('/dashboard');
         } else {
            throw new Error('Invalid response from server');
         }
      } catch (error) {
         toast.error(`Google sign-in failed: ${error.message}`);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="flex flex-col items-center space-y-4">
         {/* Loading Overlay */}
         {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
               <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-gray-600">Signing you in...</p>
               </div>
            </div>
         )}

         {/* Google Sign-in Button */}
         <div className="relative">
            <div id="google-signin-button" className="flex justify-center" style={{ minHeight: '44px' }}></div>

            {/* Loading State for Button */}
            {!isScriptLoaded && (
               <div className="w-60 h-11 bg-gray-100 rounded border border-gray-300 flex items-center justify-center animate-pulse">
                  <div className="flex items-center space-x-2">
                     <div className="w-4 h-4 bg-gray-300 rounded"></div>
                     <div className="h-4 bg-gray-300 rounded w-32"></div>
                  </div>
               </div>
            )}
         </div>

         {/* Terms & Privacy */}
         <p className="text-xs text-gray-500 text-center leading-relaxed max-w-xs">
            By continuing, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
               Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
               Privacy Policy
            </a>
         </p>

         {/* Contact Support */}
         <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
               Contact Support
            </a>
         </p>
      </div>
   );
};

export default GoogleSignIn;
