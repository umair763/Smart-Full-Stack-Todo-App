'use client';

import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function GoogleSignIn() {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [error, setError] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
         setError('Google Sign-In is not configured');
         setLoading(false);
         return;
      }
      setLoading(false);
   }, []);

   const handleLoginSuccess = async (response) => {
      const { credential } = response;
      setError(null);

      try {
         console.log('Sending token to backend...');
         const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/google-signin`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Accept: 'application/json',
            },
            body: JSON.stringify({
               token: credential,
            }),
         });

         const data = await backendResponse.json();
         console.log('Backend response:', data);

         if (!backendResponse.ok) {
            throw new Error(`Server returned ${backendResponse.status}: ${JSON.stringify(data)}`);
         }

         if (data && data.token) {
            login(data.token);
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
            console.error('Error parsing error message:', e);
         }

         setError(errorMessage);
      }
   };

   const handleLoginFailure = (error) => {
      console.error('Google Sign-In failed:', error);
      setError('Google Sign-In failed. Please try again.');
   };

   if (loading) {
      return <div className="text-center">Loading...</div>;
   }

   return (
      <div className="pt-1">
         {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
         <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginFailure}
            useOneTap={false}
            flow="implicit"
            context="signin"
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
         />
      </div>
   );
}

export default GoogleSignIn;
