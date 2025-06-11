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

         // Render the button with responsive settings
         window.google.accounts.id.renderButton(document.getElementById('google-signin-button'), {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%',
            height: '40px',
            locale: 'en',
            type: 'standard',
            context: 'signin',
            ux_mode: 'popup',
            itp_support: true,
         });
      } catch (error) {
         console.error('Error initializing Google Sign-In:', error);
         toast.error('Failed to initialize Google Sign-In');
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

   return (
      <div className="w-full flex justify-center items-center py-4 px-4">
         <div className="relative w-full max-w-sm mx-auto">
            {isLoading && (
               <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9406E6]"></div>
               </div>
            )}
            <div
               id="google-signin-button"
               className="w-full flex justify-center [&>div]:!w-full [&>div]:!max-w-none [&>div]:!justify-center [&>div]:!h-[40px] [&>div]:!min-h-[40px] [&>div]:!max-h-[40px] [&>div]:!scale-[0.9] sm:[&>div]:!scale-100 [&>div]:!flex [&>div]:!items-center [&>div]:!justify-center [&>div]:!rounded-lg [&>div]:!shadow-sm [&>div]:!border [&>div]:!border-gray-300 [&>div]:!hover:shadow-md [&>div]:!transition-all [&>div]:!duration-200 [&>div]:!bg-white [&>div]:!hover:bg-gray-50 [&>div]:!active:scale-[0.98] [&>div]:!touch-manipulation [&>div]:!min-w-[240px] [&>div]:!max-w-[400px] [&>div]:!mx-auto [&>div]:!block [&>div]:!visible [&>div]:!opacity-100"
            ></div>
         </div>
      </div>
   );
};

export default GoogleSignIn;
