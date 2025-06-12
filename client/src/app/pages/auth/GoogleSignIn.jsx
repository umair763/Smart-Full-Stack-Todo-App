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
      // Add comprehensive CSS to ensure Google button is visible on all devices
      const style = document.createElement('style');
      style.textContent = `
      #google-signin-button {
        width: 100% !important;
        min-height: 44px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 1 !important;
      }
      
      #google-signin-button > div {
        width: 100% !important;
        max-width: 320px !important;
        min-width: 200px !important;
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
      }
      
      #google-signin-button iframe {
        width: 100% !important;
        min-width: 200px !important;
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
      }
      
      /* Tablet and mobile specific styles */
      @media (max-width: 1024px) {
        #google-signin-button {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
          background: white !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          transition: transform 0.2s ease !important;
        }
        
        #google-signin-button:hover {
          transform: scale(1.05) !important;
        }
        
        #google-signin-button > div {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
        }
        
        #google-signin-button iframe {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
        }
      }
      
      @media (max-width: 768px) {
        #google-signin-button {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          min-height: 40px !important;
        }
        
        #google-signin-button > div {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          min-height: 40px !important;
        }
        
        #google-signin-button iframe {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          min-height: 40px !important;
        }
      }
      
      @media (max-width: 480px) {
        #google-signin-button {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          min-height: 36px !important;
        }
        
        #google-signin-button > div {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          min-height: 36px !important;
        }
        
        #google-signin-button iframe {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          min-height: 36px !important;
        }
      }
    `;
      document.head.appendChild(style);

      return () => {
         if (document.head.contains(style)) {
            document.head.removeChild(style);
         }
      };
   }, []);

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
            console.log('Google Sign-In script loaded successfully');
            setIsScriptLoaded(true);
         };
         script.onerror = () => {
            console.error('Failed to load Google Sign-In script');
            toast.error('Failed to load Google Sign-In');
         };
         document.body.appendChild(script);
      };

      loadGoogleScript();
   }, []);

   useEffect(() => {
      if (!isScriptLoaded || !window.google) {
         console.log('Google script not ready yet');
         return;
      }

      try {
         console.log('Initializing Google Sign-In');

         window.google.accounts.id.initialize({
            client_id: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
         });

         // Ensure the button container exists before rendering
         const buttonContainer = document.getElementById('google-signin-button');
         if (buttonContainer) {
            console.log('Rendering Google Sign-In button');

            // Clear any existing content
            buttonContainer.innerHTML = '';

            // Get the current window width
            const width = window.innerWidth;

            window.google.accounts.id.renderButton(buttonContainer, {
               theme: 'outline',
               size: 'large',
               width: width <= 1024 ? '44' : '100%',
               text: width <= 1024 ? 'icon' : 'continue_with',
               shape: width <= 1024 ? 'circle' : 'rectangular',
               logo_alignment: 'center',
            });

            console.log('Google Sign-In button rendered successfully');
         } else {
            console.error('Google Sign-In button container not found');
         }
      } catch (error) {
         console.error('Error initializing Google Sign-In:', error);
      }
   }, [isScriptLoaded]);

   // Add window resize listener to update button
   useEffect(() => {
      const handleResize = () => {
         if (!isScriptLoaded || !window.google) return;

         const buttonContainer = document.getElementById('google-signin-button');
         if (buttonContainer) {
            buttonContainer.innerHTML = '';
            const width = window.innerWidth;

            window.google.accounts.id.renderButton(buttonContainer, {
               theme: 'outline',
               size: 'large',
               width: width <= 1024 ? '44' : '100%',
               text: width <= 1024 ? 'icon' : 'continue_with',
               shape: width <= 1024 ? 'circle' : 'rectangular',
               logo_alignment: 'center',
            });
         }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
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
         <div className="relative w-full max-w-sm min-w-[200px]">
            {isLoading && (
               <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9406E6]"></div>
               </div>
            )}
            <div
               id="google-signin-button"
               className="w-full flex justify-center items-center min-h-[44px] bg-transparent"
               style={{
                  minWidth: '200px',
                  visibility: 'visible',
                  opacity: 1,
                  display: 'flex',
               }}
            >
               {/* Fallback content while Google button loads */}
               {!isScriptLoaded && (
                  <div className="w-full h-11 bg-gray-100 rounded-md flex items-center justify-center">
                     <span className="text-gray-500 text-sm">Loading Google Sign-In...</span>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default GoogleSignIn;
