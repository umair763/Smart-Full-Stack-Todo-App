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
   const [isReady, setIsReady] = useState(false);

   useEffect(() => {
      // Load Google Script
      const loadScript = () => {
         if (window.google) {
            setIsReady(true);
            return;
         }

         const script = document.createElement('script');
         script.src = 'https://accounts.google.com/gsi/client';
         script.async = true;
         script.onload = () => setIsReady(true);
         document.head.appendChild(script);
      };

      loadScript();
   }, []);

   useEffect(() => {
      if (!isReady || !window.google) return;

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
         client_id: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
         callback: handleGoogleResponse,
      });
   }, [isReady]);

   const handleGoogleResponse = async (response) => {
      setIsLoading(true);

      try {
         const res = await fetch(`${BACKEND_URL}/api/users/google-signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }),
         });

         const data = await res.json();

         if (res.ok && data.token) {
            login(data.token, data.user);
            toast.success('Signed in successfully!');
            navigate('/dashboard');
         } else {
            throw new Error(data.message || 'Sign-in failed');
         }
      } catch (error) {
         toast.error(error.message);
      } finally {
         setIsLoading(false);
      }
   };

   const handleSignIn = () => {
      if (window.google && !isLoading) {
         window.google.accounts.id.prompt();
      }
   };

   return (
      <div className="w-full max-w-sm mx-auto">
         <button
            onClick={handleSignIn}
            disabled={!isReady || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] text-sm sm:text-base"
         >
            {isLoading ? (
               <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                  <span>Signing in...</span>
               </>
            ) : (
               <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  <span className="text-gray-700 font-medium">Sign in with Google</span>
               </>
            )}
         </button>
      </div>
   );
};

export default GoogleSignIn;
