import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function GoogleSignIn() {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [error, setError] = useState(null);

   const handleLoginSuccess = async (response) => {
      setError(null);

      try {
         // Decode Google token
         const { credential } = response;

         if (!credential) {
            setError('Google authentication failed: No credential received');
            return;
         }

         const tokenParts = credential.split('.');
         if (tokenParts.length !== 3) {
            setError('Invalid token format received from Google');
            return;
         }

         const decodedToken = JSON.parse(atob(tokenParts[1]));

         if (!decodedToken.email) {
            setError('Email missing from Google response');
            return;
         }

         // User data (matching backend schema)
         const userData = {
            name: decodedToken.name || 'Google User',
            email: decodedToken.email,
            picture: decodedToken.picture || null,
         };

         console.log('Sending Google auth data to backend:', {
            name: userData.name,
            email: userData.email,
            hasPicture: !!userData.picture,
         });

         // Send user data to backend to create user and generate JWT
         const backendResponse = await axios.post(
            'https://smart-full-stack-todo-app.vercel.app/api/users/google-signin',
            userData,
            {
               headers: {
                  'Content-Type': 'application/json',
               },
               timeout: 10000, // 10 second timeout
            }
         );

         // On success, set the login state to true using AuthContext
         if (backendResponse.data && backendResponse.data.token) {
            login(backendResponse.data.token);
            navigate('/dashboard');
         } else {
            setError('No token received from server');
         }
      } catch (error) {
         console.error('Error during Google login:', error);

         // Extract the most useful error message
         const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Server error during Google login';

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
         <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginFailure} useOneTap={false} />
      </div>
   );
}

export default GoogleSignIn;
