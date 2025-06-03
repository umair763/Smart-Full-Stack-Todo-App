'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Hardcoded API URL for production
const API_URL = 'https://smart-todo-task-management-backend.vercel.app/api';
const GOOGLE_CLIENT_ID = '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com';

function GoogleSignIn() {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [error, setError] = useState(null);
   const [isLoading, setIsLoading] = useState(false);

   const handleLoginSuccess = async (response) => {
      const { credential } = response;
      setError(null);
      setIsLoading(true);

      try {
         console.log('Starting Google sign-in process...');

         // Send the credential token to backend
         const backendResponse = await fetch(`${API_URL}/users/google-signin`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Accept: 'application/json',
            },
            body: JSON.stringify({ token: credential }),
         });

         const data = await backendResponse.json();
         console.log('Backend response:', {
            success: data.success,
            code: data.code,
            message: data.message,
         });

         if (!backendResponse.ok) {
            // Handle specific error codes from backend
            switch (data.code) {
               case 'TOKEN_EXPIRED':
                  throw new Error('Your Google session has expired. Please try signing in again.');
               case 'INVALID_CLIENT_ID':
                  throw new Error('Authentication configuration error. Please contact support.');
               case 'INVALID_TOKEN_SIGNATURE':
                  throw new Error('Invalid Google token. Please try signing in again.');
               case 'GOOGLE_VERIFICATION_FAILED':
                  throw new Error('Failed to verify Google credentials. Please try again.');
               default:
                  throw new Error(data.message || 'Failed to sign in with Google');
            }
         }

         if (!data.success || !data.token) {
            throw new Error('Authentication failed. Please try again.');
         }

         // On success, set the login state and navigate
         login(data.token);
         navigate('/dashboard');
      } catch (error) {
         console.error('Google sign-in error:', error);
         setError(error.message || 'Failed to sign in with Google. Please try again.');
      } finally {
         setIsLoading(false);
      }
   };

   const handleLoginFailure = (error) => {
      console.error('Google Sign-In failed:', error);
      setError('Google Sign-In failed. Please try again.');
   };

   return (
      <div className="pt-1">
         {error && (
            <div className="text-red-500 text-sm mb-2 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
               {error}
            </div>
         )}
         <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginFailure}
            useOneTap={false}
            flow="implicit"
            context="signin"
            disabled={isLoading}
            theme="filled_blue"
            shape="rectangular"
            text="signin_with"
            locale="en"
         />
      </div>
   );
}

export default GoogleSignIn;
