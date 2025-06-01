// Updated GoogleSignIn.jsx with better error handling and retry logic
'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://smart-todo-task-management-backend.vercel.app/api';
const GOOGLE_CLIENT_ID = '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com';

function GoogleSignIn() {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [error, setError] = useState(null);
   const [isLoading, setIsLoading] = useState(false);

   // Utility function to make API calls with retry logic
   const makeAPICall = async (url, options, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
         try {
            console.log(`API call attempt ${i + 1}...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(url, {
               ...options,
               signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response;
         } catch (error) {
            console.error(`API call attempt ${i + 1} failed:`, error.message);

            if (i === retries) {
               throw error;
            }

            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
         }
      }
   };

   const handleLoginSuccess = async (response) => {
      const { credential } = response;
      setError(null);
      setIsLoading(true);

      try {
         console.log('Processing Google login...');

         const backendResponse = await makeAPICall(`${API_URL}/users/google-signin`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Accept: 'application/json',
            },
            body: JSON.stringify({
               token: credential,
               clientId: GOOGLE_CLIENT_ID,
            }),
         });

         const data = await backendResponse.json();
         console.log('Backend response received:', data);

         if (!backendResponse.ok) {
            // Handle specific error codes
            if (data.code === 'DATABASE_TIMEOUT') {
               throw new Error('Service is temporarily unavailable. Please try again in a moment.');
            }
            if (data.code === 'TOKEN_EXPIRED') {
               throw new Error('Google login session expired. Please try signing in again.');
            }
            if (data.code === 'INVALID_CLIENT_ID') {
               throw new Error('Configuration error. Please contact support.');
            }

            throw new Error(data.message || 'Login failed. Please try again.');
         }

         if (data && data.token) {
            console.log('Login successful, redirecting to dashboard...');
            login(data.token);
            navigate('/dashboard');
         } else {
            throw new Error('Invalid response from server. Please try again.');
         }
      } catch (error) {
         console.error('Google login error:', error);

         let errorMessage = 'Failed to login with Google. Please try again.';

         // Handle specific error types
         if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
         } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
         } else if (error.message) {
            errorMessage = error.message;
         }

         setError(errorMessage);
      } finally {
         setIsLoading(false);
      }
   };

   const handleLoginFailure = (error) => {
      console.error('Google Sign-In failed:', error);
      setError('Google Sign-In failed. Please try again.');
      setIsLoading(false);
   };

   return (
      <div className="pt-1">
         {error && (
            <div className="text-red-500 text-sm mb-2 text-center p-2 bg-red-50 rounded border border-red-200">
               {error}
            </div>
         )}

         {isLoading && (
            <div className="text-blue-500 text-sm mb-2 text-center p-2 bg-blue-50 rounded border border-blue-200">
               Signing in... Please wait.
            </div>
         )}

         <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            <GoogleLogin
               onSuccess={handleLoginSuccess}
               onError={handleLoginFailure}
               useOneTap={false}
               width="100%"
               theme="outline"
               size="large"
               text="continue_with"
               shape="rectangular"
               logo_alignment="left"
               disabled={isLoading}
            />
         </div>
      </div>
   );
}

export default GoogleSignIn;
