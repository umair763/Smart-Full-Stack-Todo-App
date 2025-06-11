'use client';

import { useEffect, useState } from 'react';
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
   const [scriptError, setScriptError] = useState(false);

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
            setScriptError(false);
         };
         script.onerror = () => {
            console.error('Failed to load Google Sign-In script');
            setScriptError(true);
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
      if (!isScriptLoaded || !window.google || scriptError) return;

      try {
         window.google.accounts.id.initialize({
            client_id: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
         });

         // Render button with responsive configuration
         const renderGoogleButton = () => {
            const buttonElement = document.getElementById('google-signin-button');
            if (buttonElement) {
               buttonElement.innerHTML = ''; // Clear existing content
               window.google.accounts.id.renderButton(buttonElement, {
                  theme: 'outline',
                  size: 'large',
                  text: 'continue_with',
                  shape: 'rectangular',
                  logo_alignment: 'left',
                  width: '100%',
               });
            }
         };

         renderGoogleButton();
      } catch (error) {
         console.error('Error initializing Google Sign-In:', error);
         setScriptError(true);
      }
   }, [isScriptLoaded]);

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

   // Fallback custom button if Google script fails
   const CustomGoogleButton = () => (
      <button
         onClick={() => toast.error('Google Sign-In is temporarily unavailable')}
         disabled={isLoading}
         className="
        w-full flex items-center justify-center gap-3 px-4 py-3
        bg-white border border-gray-300 rounded-lg
        text-gray-700 font-medium text-sm
        hover:bg-gray-50 hover:border-gray-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md
      "
      >
         <svg className="w-5 h-5" viewBox="0 0 24 24">
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
         <span>Continue with Google</span>
      </button>
   );

   return (
      <div className="w-full max-w-md mx-auto">
         {/* Loading Overlay */}
         {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
               <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 text-sm">Signing you in...</p>
               </div>
            </div>
         )}

         {/* Google Sign-In Button Container */}
         <div className="relative">
            {scriptError ? (
               <CustomGoogleButton />
            ) : (
               <div className="w-full">
                  {/* Loading State */}
                  {!isScriptLoaded && (
                     <div className="w-full flex items-center justify-center py-3 bg-gray-100 rounded-lg animate-pulse">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                           <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                           Loading Google Sign-In...
                        </div>
                     </div>
                  )}

                  {/* Google Button Container */}
                  <div
                     id="google-signin-button"
                     className={`
                w-full transition-opacity duration-300
                ${isScriptLoaded ? 'opacity-100' : 'opacity-0 absolute'}
                
                /* Responsive button styling */
                [&>div]:!w-full 
                [&>div]:!max-w-none 
                [&>div]:!min-w-0
                [&>div]:!flex 
                [&>div]:!justify-center 
                [&>div]:!items-center
                
                /* Height responsive */
                [&>div]:!h-[44px] 
                [&>div]:!min-h-[44px] 
                [&>div]:!max-h-[44px]
                
                /* Mobile specific adjustments */
                [&>div]:!text-sm
                [&>div]:!px-4
                
                /* Tablet and up */
                sm:[&>div]:!h-[48px] 
                sm:[&>div]:!min-h-[48px] 
                sm:[&>div]:!max-h-[48px]
                sm:[&>div]:!text-base
                
                /* Desktop */
                lg:[&>div]:!h-[52px] 
                lg:[&>div]:!min-h-[52px] 
                lg:[&>div]:!max-h-[52px]
                
                /* Ensure proper overflow handling */
                [&>div]:!overflow-hidden
                [&>div]:!box-border
                
                /* Button text and icon adjustments */
                [&>div>div]:!w-full
                [&>div>div]:!justify-center
                [&>div>div]:!items-center
                [&>div>div]:!gap-2
                
                /* Responsive font sizing */
                [&_span]:!text-sm
                sm:[&_span]:!text-base
                
                /* Icon sizing */
                [&_svg]:!w-5 
                [&_svg]:!h-5
                sm:[&_svg]:!w-6 
                sm:[&_svg]:!h-6
              `}
                  ></div>
               </div>
            )}
         </div>

         {/* Alternative Sign-In Methods */}
         <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">By continuing, you agree to our Terms of Service and Privacy Policy</p>
         </div>
      </div>
   );
};

export default GoogleSignIn;
