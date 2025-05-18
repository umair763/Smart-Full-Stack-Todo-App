'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function GoogleSignIn() {
   const { login } = useAuth();
   const navigate = useNavigate();
   const [error, setError] = useState(null);

   const handleLoginSuccess = async (response) => {
      const { credential } = response;
      setError(null);

      try {
         // Decode Google token
         const decodedToken = JSON.parse(atob(credential.split('.')[1]));

         // User data (matching backend schema)
         const userData = {
            name: decodedToken.name,
            email: decodedToken.email,
            picture: decodedToken.picture,
         };

         console.log('Google login data:', userData);

         // Send to backend
         const backendResponse = await fetch(`${API_BASE_URL}/api/users/google-signin`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
            credentials: 'include',
         });

         if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(`Server returned ${backendResponse.status}: ${errorText}`);
         }

         const data = await backendResponse.json();

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
         setError('Failed to login with Google. Please check your network connection and try again.');
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
