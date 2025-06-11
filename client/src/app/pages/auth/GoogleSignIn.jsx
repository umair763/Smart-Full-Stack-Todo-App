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

         // Create custom button
         const buttonContainer = document.getElementById('google-signin-button');
         buttonContainer.innerHTML = `
            <button 
               id="custom-google-button"
               class="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
            >
               <img src="https://www.google.com/favicon.ico" alt="Google" class="w-5 h-5" />
               <span class="text-gray-700 font-medium">Sign in with Google</span>
            </button>
         `;

         // Add click handler
         document.getElementById('custom-google-button').addEventListener('click', () => {
            window.google.accounts.id.prompt();
         });
      } catch (error) {
         console.error('Error initializing Google Sign-In:', error);
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
      <div className="w-full flex justify-center items-center py-4">
         <div className="relative w-full max-w-sm">
            {isLoading && (
               <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9406E6]"></div>
               </div>
            )}
            <div id="google-signin-button" className="w-full flex justify-center"></div>
         </div>
      </div>
   );
};

export default GoogleSignIn;
