'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../../config/env';

function GoogleSignIn() {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [error, setError] = useState(null);

   const handleLoginSuccess = async (response) => {
      const { credential } = response;
      setError(null);

      try {
         console.log('Sending token to backend...');
         // Send the credential token to backend
         const backendResponse = await fetch(getApiUrl('users/google-signin'), {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Accept: 'application/json',
            },
            body: JSON.stringify({
               token: credential,
               clientId: '726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com',
            }),
         });

         const data = await backendResponse.json();
         console.log('Backend response:', data);

         if (!backendResponse.ok) {
            throw new Error(`Server returned ${backendResponse.status}: ${JSON.stringify(data)}`);
         }

         // On success, set the login state to true using AuthContext
         if (data && data.token) {
            login(data.token);
            // Navigate to dashboard
            navigate('/dashboard');
         } else {
            setError('No token received from server');
         }
      } catch (error) {
         console.error('Error during Google login:', error);
         let errorMessage = 'Failed to login with Google. Please try again.';

         try {
            const errorData = JSON.parse(error.message.split(': ')[1]);
            if (errorData.details) {
               errorMessage = errorData.details;
            } else if (errorData.message) {
               errorMessage = errorData.message;
            }
         } catch (e) {
            // If parsing fails, use the original error message
            console.error('Error parsing error message:', e);
         }

         setError(errorMessage);
      }
   };

   const handleLoginFailure = (error) => {
      console.error('Google Sign-In failed:', error);
      setError('Google Sign-In failed. Please try again.');
   };

   return (
      <div className="pt-1">
         {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
         <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginFailure}
            useOneTap={false}
            flow="implicit"
            context="signin"
         />
      </div>
   );
}

export default GoogleSignIn;
