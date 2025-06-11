'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

// Google Icon Component using React/SVG
const GoogleIcon = ({ className = 'w-5 h-5' }) => (
   <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
);

const GoogleSignIn = () => {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [isLoading, setIsLoading] = useState(false);
   const [isScriptLoaded, setIsScriptLoaded] = useState(false);

   useEffect(() => {
      // Load Google Sign-In script
      const loadGoogleScript = () => {
         // Check if script is already loaded
         if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            setIsScriptLoaded(true);
            return;
         }

         const script = document.createElement('script');
         script.src = 'https://accounts.google.com/gsi/client';
         script.async = true;
         script.defer = true;
         script.onload = () => {
            setIsScriptLoaded(true);
         };
         script.onerror = () => {
            console.error('Failed to load Google Sign-In script');
            toast.error('Failed to load Google Sign-In');
         };
         document.body.appendChild(script);
      };

      loadGoogleScript();

      return () => {
         // Cleanup if needed
      };
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
      } catch (error) {
         console.error('Error initializing Google Sign-In:', error);
      }
   }, [isScriptLoaded]);

   const handleGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
         window.google.accounts.id.prompt();
      } else {
         toast.error('Google Sign-In not available');
      }
   };

   const handleGoogleResponse = async (response) => {
      console.log('Google login success response: ', response);

      if (!response || !response.credential) {
         console.error('Invalid Google response');
         toast.error('Google sign-in failed');
         return;
      }

      setIsLoading(true);

      try {
         console.log('Sending credential to backend...');

         // Use the correct endpoint that matches your backend
         const backendResponse = await fetch(`${BACKEND_URL}/api/users/google-signin`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: response.credential }),
         });

         const data = await backendResponse.json();
         console.log('Backend response: ', data);

         if (!backendResponse.ok) {
            throw new Error(data.message || 'Google sign-in failed');
         }

         console.log('Google sign-in successful, calling onSuccess');

         // Handle successful login
         if (data.token) {
            console.log('Google sign-in response received: ', data);
            login(data.token, data.user);
            toast.success('Signed in with Google successfully!');
            navigate('/dashboard');
         } else {
            console.error('Google sign-in backend response: ', data);
            throw new Error('Invalid response from server');
         }
      } catch (error) {
         console.error('Google sign-in failed:', error.message);
         toast.error(`Google sign-in failed: ${error.message}`);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="w-full px-4 sm:px-0">
         <div className="relative w-full max-w-sm mx-auto">
            {/* Google Sign-In Button */}
            <button
               onClick={handleGoogleSignIn}
               disabled={!isScriptLoaded || isLoading}
               className="
                  relative w-full 
                  flex items-center justify-center 
                  gap-2 sm:gap-3 
                  px-3 sm:px-4 
                  py-2.5 sm:py-3
                  bg-white 
                  border border-gray-300 
                  rounded-lg 
                  hover:bg-gray-50 
                  hover:border-gray-400
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-blue-500 
                  focus:ring-offset-2
                  transition-all duration-200 
                  shadow-sm hover:shadow-md
                  disabled:opacity-50 
                  disabled:cursor-not-allowed
                  text-sm sm:text-base
                  min-h-[44px] sm:min-h-[48px]
                  touch-manipulation
                  font-medium
               "
               type="button"
            >
               {/* Loading State */}
               {isLoading ? (
                  <>
                     <AiOutlineLoading3Quarters className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                     <span className="text-gray-600">Signing in...</span>
                  </>
               ) : (
                  <>
                     {/* Google Icon */}
                     <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                     {/* Button Text */}
                     <span className="text-gray-700 whitespace-nowrap">Sign in with Google</span>
                  </>
               )}
            </button>

            {/* Loading State Text */}
            {!isScriptLoaded && !isLoading && (
               <div className="mt-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
                  <span>Loading Google Sign-In...</span>
               </div>
            )}
         </div>
      </div>
   );
};

export default GoogleSignIn;
