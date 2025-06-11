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
      <div className="w-full flex justify-center items-center py-6 px-4">
         {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
         )}

         <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <div id="google-signin-button" className="w-full h-[40px] flex items-center justify-center"></div>
         </div>
      </div>
   );
};

export default GoogleSignIn;
