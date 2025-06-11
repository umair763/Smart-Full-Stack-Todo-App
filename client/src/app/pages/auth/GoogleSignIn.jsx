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
   const buttonContainerRef = useRef(null);
   const initializationTimeoutRef = useRef(null);
   const scriptLoadTimeoutRef = useRef(null);
   const retryCountRef = useRef(0);
   const maxRetries = 5;

   // Clean up timeouts on unmount
   useEffect(() => {
      return () => {
         if (initializationTimeoutRef.current) {
            clearTimeout(initializationTimeoutRef.current);
         }
         if (scriptLoadTimeoutRef.current) {
            clearTimeout(scriptLoadTimeoutRef.current);
         }
      };
   }, []);

   // Load Google Sign-In script with extended timeouts and retry logic
   useEffect(() => {
      const loadGoogleScript = () => {
         // Check if script is already loaded
         const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
         if (existingScript) {
            if (window.google && window.google.accounts) {
               setIsScriptLoaded(true);
               return;
            }
            // Script exists but not loaded yet, wait longer for it
            existingScript.addEventListener('load', () => {
               setTimeout(() => {
                  if (window.google && window.google.accounts) {
                     setIsScriptLoaded(true);
                  } else {
                     // Retry loading after longer delay
                     setTimeout(() => {
                        if (retryCountRef.current < maxRetries) {
                           retryCountRef.current++;
                           loadGoogleScript();
                        }
                     }, 3000);
                  }
               }, 1000);
            });

            existingScript.addEventListener('error', () => {
               setTimeout(() => {
                  if (retryCountRef.current < maxRetries) {
                     retryCountRef.current++;
                     existingScript.remove();
                     loadGoogleScript();
                  }
               }, 2000);
            });
            return;
         }

         // Create and load new script
         const script = document.createElement('script');
         script.src = 'https://accounts.google.com/gsi/client';
         script.async = true;
         script.defer = true;

         script.onload = () => {
            // Extended delay to ensure Google API is fully ready for serverless
            setTimeout(() => {
               if (window.google && window.google.accounts) {
                  setIsScriptLoaded(true);
               } else {
                  // Wait even longer and retry if needed
                  setTimeout(() => {
                     if (window.google && window.google.accounts) {
                        setIsScriptLoaded(true);
                     } else if (retryCountRef.current < maxRetries) {
                        retryCountRef.current++;
                        script.remove();
                        loadGoogleScript();
                     }
                  }, 2000);
               }
            }, 1500); // Increased from 100ms to 1500ms
         };

         script.onerror = () => {
            // Silent retry instead of showing error
            setTimeout(() => {
               if (retryCountRef.current < maxRetries) {
                  retryCountRef.current++;
                  script.remove();
                  loadGoogleScript();
               }
            }, 2000);
         };

         document.head.appendChild(script);

         // Extended timeout for script loading
         scriptLoadTimeoutRef.current = setTimeout(() => {
            if (!isScriptLoaded && retryCountRef.current < maxRetries) {
               retryCountRef.current++;
               script.remove();
               loadGoogleScript();
            }
         }, 15000); // Increased from default to 15 seconds
      };

      loadGoogleScript();
   }, []);

   // Initialize Google Sign-In when script is loaded with extended timeout
   useEffect(() => {
      if (!isScriptLoaded || !window.google || isInitialized) return;

      const initializeGoogleSignIn = () => {
         try {
            // Add extra check to ensure API is ready
            if (!window.google.accounts || !window.google.accounts.id) {
               setTimeout(initializeGoogleSignIn, 1000);
               return;
            }

            window.google.accounts.id.initialize({
               client_id: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
               callback: handleGoogleResponse,
               auto_select: false,
               cancel_on_tap_outside: true,
            });

            setIsInitialized(true);
            setTimeout(renderCustomButton, 500); // Add delay before rendering
         } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
            // Retry initialization instead of showing error
            setTimeout(() => {
               if (retryCountRef.current < maxRetries) {
                  retryCountRef.current++;
                  initializeGoogleSignIn();
               }
            }, 2000);
         }
      };

      // Much longer timeout for initialization - suitable for serverless cold starts
      initializationTimeoutRef.current = setTimeout(() => {
         if (!isInitialized && retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            initializeGoogleSignIn();
         }
      }, 30000); // Increased from 10 seconds to 30 seconds

      // Initial delay before starting initialization
      setTimeout(initializeGoogleSignIn, 1000);
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

         if (isLoading) return;

         // More robust check for Google API availability
         if (!window.google || !window.google.accounts || !window.google.accounts.id) {
            // Silently try to reinitialize instead of showing error
            setTimeout(() => {
               if (window.google && window.google.accounts) {
                  setIsScriptLoaded(true);
               }
            }, 1000);
            return;
         }

         try {
            window.google.accounts.id.prompt((notification) => {
               if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                  console.log('Google Sign-In prompt was not displayed or skipped');
                  // Try alternative approach - silent fallback
                  setTimeout(() => {
                     try {
                        window.google.accounts.id.prompt();
                     } catch (err) {
                        console.log('Secondary prompt attempt failed:', err);
                     }
                  }, 1000);
               }
            });
         } catch (error) {
            console.error('Error showing Google Sign-In prompt:', error);
            // Silent retry instead of showing toast error
            setTimeout(() => {
               try {
                  window.google.accounts.id.prompt();
               } catch (err) {
                  console.log('Retry prompt failed:', err);
               }
            }, 2000);
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

            // Extended timeout for serverless backend
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const backendResponse = await fetch(`${BACKEND_URL}/api/users/google-signin`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({ token: response.credential }),
               signal: controller.signal,
            });

            clearTimeout(timeoutId);

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
            if (error.name === 'AbortError') {
               toast.error('Sign-in is taking longer than expected. Please try again.');
            } else {
               toast.error(`Google sign-in failed: ${error.message}`);
            }
         } finally {
            setIsLoading(false);
            // Re-render button to update disabled state with delay
            if (isInitialized) {
               setTimeout(renderCustomButton, 500);
            }
         }
      },
      [login, navigate, isInitialized]
   );

   // Re-render button when loading state changes
   useEffect(() => {
      if (isInitialized) {
         setTimeout(renderCustomButton, 200);
      }
   }, [isLoading, isInitialized]);

   // Always show the button container - no error states that replace the button
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

            {/* Button container - always present */}
            <div ref={buttonContainerRef} id="google-signin-button" className="w-full flex justify-center">
               {/* Loading state before script loads - more patient loading indicator */}
               {!isScriptLoaded && (
                  <div className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg min-h-[44px] sm:min-h-[48px]">
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
