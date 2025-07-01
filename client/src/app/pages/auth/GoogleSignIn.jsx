'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

const GoogleSignIn = () => {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(false);
   const [isScriptLoaded, setIsScriptLoaded] = useState(false);
   const [scriptError, setScriptError] = useState(false);
   const buttonRef = useRef(null);
   const containerRef = useRef(null);

   useEffect(() => {
      const loadGoogleScript = () => {
         // Check if script already exists
         const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
         if (existingScript) {
            if (window.google && window.google.accounts) {
               setIsScriptLoaded(true);
            } else {
               // Script exists but not loaded yet
               existingScript.onload = () => setIsScriptLoaded(true);
               existingScript.onerror = () => setScriptError(true);
            }
            return;
         }

         const script = document.createElement('script');
         script.src = 'https://accounts.google.com/gsi/client';
         script.async = true;
         script.defer = true;
         script.onload = () => {
            console.log('Google script loaded successfully');
            setIsScriptLoaded(true);
            setScriptError(false);
         };
         script.onerror = () => {
            console.error('Failed to load Google Sign-In script');
            setScriptError(true);
            setIsScriptLoaded(false);
         };

         document.head.appendChild(script);
      };

      loadGoogleScript();
   }, []);

   useEffect(() => {
      if (!isScriptLoaded || !window.google || !window.google.accounts || !buttonRef.current) {
         return;
      }

      try {
         console.log('Initializing Google Sign-In');

         // Clear any existing content
         if (buttonRef.current) {
            buttonRef.current.innerHTML = '';
         }

         window.google.accounts.id.initialize({
            client_id: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
         });

         // Get container width for responsive button
         const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 300;

         window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: Math.min(containerWidth, 400),
         });

         console.log('Google button rendered successfully');
      } catch (error) {
         console.error('Error initializing Google Sign-In:', error);
         setScriptError(true);
      }
   }, [isScriptLoaded]);

   const handleGoogleResponse = async (response) => {
      console.log('Google response received');

      if (!response?.credential) {
         toast.error('Google sign-in failed - no credential received');
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
         console.log('Backend response:', data);

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
         console.error('Google sign-in error:', error);
         toast.error(`Google sign-in failed: ${error.message}`);
      } finally {
         setIsLoading(false);
      }
   };

   const handleFallbackGoogleSignIn = () => {
      toast.error('Google Sign-In is temporarily unavailable. Please try again later or contact support.');
   };

   return (
      <div ref={containerRef} className="w-full relative">
         {/* Loading Overlay */}
         {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
               <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-xs font-medium text-gray-600">Signing you in...</p>
               </div>
            </div>
         )}

         {/* Google Sign-in Button Container */}
         <div className="w-full space-y-4">
            {/* Main Google Button Container */}
            <div className="w-full min-h-[44px] flex items-center justify-center">
               {isScriptLoaded && !scriptError ? (
                  <div ref={buttonRef} className="w-full max-w-sm"></div>
               ) : (
                  /* Fallback Custom Button */
                  <button
                     onClick={handleFallbackGoogleSignIn}
                     disabled={isLoading}
                     className="w-full max-w-sm h-11 bg-white border border-gray-300 rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                           fill="#4285F4"
                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                           fill="#34A853"
                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                           fill="#FBBC05"
                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                           fill="#EA4335"
                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                     </svg>
                     <span className="text-gray-700 font-medium text-sm">Continue with Google</span>
                  </button>
               )}
            </div>

            {/* Loading State for Script */}
            {!isScriptLoaded && !scriptError && (
               <div className="w-full max-w-sm mx-auto h-11 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
                  <div className="flex items-center space-x-2">
                     <div className="w-4 h-4 bg-gray-300 rounded flex-shrink-0"></div>
                     <div className="h-4 bg-gray-300 rounded w-32"></div>
                  </div>
               </div>
            )}

            {/* Terms & Privacy */}
            <div className="px-2">
               <p className="text-xs text-gray-500 text-center leading-relaxed">
                  By continuing, you agree to our
                  <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                     Privacy Policy
                  </a>
               </p>
            </div>

            {/* Contact Support */}
            <div className="px-2">
               <p className="text-sm text-gray-500 text-center">
                  Need help?{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                     Contact Support
                  </a>
               </p>
            </div>
         </div>
      </div>
   );
};

export default GoogleSignIn;
