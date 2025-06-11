'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

const GoogleSignIn = () => {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(false);
   const [isScriptLoaded, setIsScriptLoaded] = useState(false);
   const [isInitialized, setIsInitialized] = useState(false);
   const [scriptError, setScriptError] = useState(false);
   const buttonContainerRef = useRef(null);
   const initializationTimeoutRef = useRef(null);

   // Clean up timeouts on unmount
   useEffect(() => {
      return () => {
         if (initializationTimeoutRef.current) {
            clearTimeout(initializationTimeoutRef.current);
         }
      };
   }, []);

   // Load Google Sign-In script with better error handling
   useEffect(() => {
      const loadGoogleScript = () => {
         // Check if script is already loaded
         const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
         if (existingScript) {
            if (window.google && window.google.accounts) {
               setIsScriptLoaded(true);
               return;
            }
            // Script exists but not loaded yet, wait for it
            existingScript.addEventListener('load', () => setIsScriptLoaded(true));
            existingScript.addEventListener('error', () => setScriptError(true));
            return;
         }

         // Create and load new script
         const script = document.createElement('script');
         script.src = 'https://accounts.google.com/gsi/client';
         script.async = true;
         script.defer = true;

         script.onload = () => {
            // Add small delay to ensure Google API is fully ready
            setTimeout(() => {
               if (window.google && window.google.accounts) {
                  setIsScriptLoaded(true);
               } else {
                  console.error('Google API not available after script load');
                  setScriptError(true);
               }
            }, 100);
         };

         script.onerror = () => {
            console.error('Failed to load Google Sign-In script');
            setScriptError(true);
            toast.error('Failed to load Google Sign-In. Please check your internet connection.');
         };

         document.head.appendChild(script);
      };

      loadGoogleScript();
   }, []);

   // Initialize Google Sign-In when script is loaded
   useEffect(() => {
      if (!isScriptLoaded || !window.google || isInitialized) return;

      const initializeGoogleSignIn = () => {
         try {
            window.google.accounts.id.initialize({
               client_id: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
               callback: handleGoogleResponse,
               auto_select: false,
               cancel_on_tap_outside: true,
            });

            setIsInitialized(true);
            renderCustomButton();
         } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
            setScriptError(true);
            toast.error('Failed to initialize Google Sign-In');
         }
      };

      // Add timeout to prevent hanging
      initializationTimeoutRef.current = setTimeout(() => {
         if (!isInitialized) {
            console.error('Google Sign-In initialization timeout');
            setScriptError(true);
         }
      }, 10000); // 10 second timeout

      initializeGoogleSignIn();
   }, [isScriptLoaded, isInitialized]);

   const renderCustomButton = () => {
      const buttonContainer = buttonContainerRef.current;
      if (!buttonContainer) return;

      // Clear existing content
      buttonContainer.innerHTML = '';

      // Create button element
      const button = document.createElement('button');
      button.id = 'custom-google-button';
      button.type = 'button';
      button.disabled = isLoading;

      // Responsive classes with better mobile support
      button.className = `
         w-full flex items-center justify-center gap-2 sm:gap-3 
         px-3 sm:px-4 py-2.5 sm:py-3
         bg-white border border-gray-300 rounded-lg 
         hover:bg-gray-50 active:bg-gray-100
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
         transition-all duration-200 
         shadow-sm hover:shadow-md
         text-sm sm:text-base
         min-h-[44px] sm:min-h-[48px]
         disabled:opacity-50 disabled:cursor-not-allowed
         disabled:hover:bg-white disabled:hover:shadow-sm
      `
         .replace(/\s+/g, ' ')
         .trim();

      // Button content with responsive sizing
      button.innerHTML = `
         <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
         />
         <span class="text-gray-700 font-medium text-sm sm:text-base whitespace-nowrap">
            Sign in with Google
         </span>
      `;

      // Add click handler with proper event handling
      const handleClick = (e) => {
         e.preventDefault();
         e.stopPropagation();

         if (isLoading || !window.google) return;

         try {
            window.google.accounts.id.prompt((notification) => {
               if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                  console.log('Google Sign-In prompt was not displayed or skipped');
                  // Fallback: try to show popup directly
                  toast.error('Please enable popups and try again');
               }
            });
         } catch (error) {
            console.error('Error showing Google Sign-In prompt:', error);
            toast.error('Failed to show Google Sign-In. Please try again.');
         }
      };

      button.addEventListener('click', handleClick);
      buttonContainer.appendChild(button);
   };

   const handleGoogleResponse = useCallback(
      async (response) => {
         console.log('Google login success response: ', response);

         if (!response || !response.credential) {
            console.error('Invalid Google response');
            toast.error('Google sign-in failed - invalid response');
            return;
         }

         setIsLoading(true);

         try {
            console.log('Sending credential to backend...');

            const backendResponse = await fetch(`${BACKEND_URL}/api/users/google-signin`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({ token: response.credential }),
            });

            if (!backendResponse.ok) {
               const errorData = await backendResponse.json();
               throw new Error(errorData.message || `Server error: ${backendResponse.status}`);
            }

            const data = await backendResponse.json();
            console.log('Backend response: ', data);

            if (data.token && data.user) {
               console.log('Google sign-in successful, logging in user');
               login(data.token, data.user);
               toast.success('Signed in with Google successfully!');
               navigate('/dashboard');
            } else {
               console.error('Invalid backend response structure:', data);
               throw new Error('Invalid response from server - missing token or user data');
            }
         } catch (error) {
            console.error('Google sign-in failed:', error);
            toast.error(`Google sign-in failed: ${error.message}`);
         } finally {
            setIsLoading(false);
            // Re-render button to update disabled state
            if (isInitialized) {
               setTimeout(renderCustomButton, 100);
            }
         }
      },
      [login, navigate]
   );

   // Re-render button when loading state changes
   useEffect(() => {
      if (isInitialized) {
         renderCustomButton();
      }
   }, [isLoading, isInitialized]);

   // Handle script loading errors
   if (scriptError) {
      return (
         <div className="w-full flex justify-center items-center py-4">
            <div className="w-full max-w-sm p-4 bg-red-50 border border-red-200 rounded-lg">
               <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                     <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                     />
                  </svg>
                  <span className="text-sm font-medium">Google Sign-In Unavailable</span>
               </div>
               <p className="mt-1 text-sm text-red-600">Please refresh the page or check your internet connection.</p>
            </div>
         </div>
      );
   }

   return (
      <div className="w-full flex justify-center items-center py-4">
         <div className="relative w-full max-w-sm">
            {/* Loading overlay */}
            {isLoading && (
               <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                     <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-600"></div>
                     <span className="text-xs sm:text-sm text-gray-600 font-medium">Signing in...</span>
                  </div>
               </div>
            )}

            {/* Button container */}
            <div ref={buttonContainerRef} id="google-signin-button" className="w-full flex justify-center">
               {/* Loading state before script loads */}
               {!isScriptLoaded && !scriptError && (
                  <div className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border border-gray-300 rounded-lg min-h-[44px] sm:min-h-[48px]">
                     <div className="animate-pulse flex items-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded"></div>
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default GoogleSignIn;
