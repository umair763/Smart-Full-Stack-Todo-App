'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

// Use the consistent API base URL
const API_BASE_URL = 'https://smart-todo-task-management-backend.vercel.app';

function GoogleSignIn({ onSuccess, onError }) {
   const [error, setError] = useState(null);
   const [isLoading, setIsLoading] = useState(false);

   const handleLoginSuccess = async (response) => {
      console.log('Google login success response:', response);
      setError(null);
      setIsLoading(true);

      try {
         const { credential } = response;

         if (!credential) {
            throw new Error('No credential received from Google');
         }

         console.log('Sending credential to backend...');

         // Send the credential token to backend
         const backendResponse = await fetch(`${API_BASE_URL}/api/users/google-signin`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: credential }),
         });

         const data = await backendResponse.json();
         console.log('Backend response:', data);

         if (!backendResponse.ok) {
            throw new Error(data.message || `Server returned ${backendResponse.status}`);
         }

         // On success, call the parent's onSuccess function
         if (data && data.token) {
            console.log('Google sign-in successful, calling onSuccess');
            onSuccess(data);
         } else {
            throw new Error('No token received from server');
         }
      } catch (error) {
         console.error('Error during Google login:', error);
         const errorMessage = error.message || 'Failed to login with Google. Please try again.';
         setError(errorMessage);
         if (onError) {
            onError(error);
         }
      } finally {
         setIsLoading(false);
      }
   };

   const handleLoginFailure = (error) => {
      console.error('Google Sign-In failed:', error);
      const errorMessage = 'Google Sign-In failed. Please try again.';
      setError(errorMessage);
      if (onError) {
         onError(new Error(errorMessage));
      }
   };

   return (
      <div className="pt-1">
         {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
         {isLoading ? (
            <div className="flex items-center justify-center py-2">
               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
               <span className="ml-2 text-sm text-gray-600">Signing in...</span>
            </div>
         ) : (
            <GoogleLogin
               onSuccess={handleLoginSuccess}
               onError={handleLoginFailure}
               useOneTap={false}
               auto_select={false}
               cancel_on_tap_outside={true}
            />
         )}
      </div>
   );
}

export default GoogleSignIn;
