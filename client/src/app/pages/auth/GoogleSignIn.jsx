import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function GoogleSignIn() {
   const { login } = useAuth();
   const navigate = useNavigate();

   const handleLoginSuccess = async (response) => {
      const { credential } = response;

      try {
         // Decode Google token
         const decodedToken = JSON.parse(atob(credential.split('.')[1]));

         // User data (matching backend schema)
         const userData = {
            name: decodedToken.name,
            email: decodedToken.email,
            picture: decodedToken.picture,
         };

         // Send user data to backend to create user and generate JWT
         const backendResponse = await axios.post(
            'https://smart-full-stack-todo-app.vercel.app/api/users/google-signin',
            userData
         );

         // On success, set the login state to true using AuthContext
         login(backendResponse.data.token);

         // Navigate to dashboard
         navigate('/dashboard');
      } catch (error) {
         console.error('Error during Google login:', error);
      }
   };

   const handleLoginFailure = (error) => {
      console.error('Google Sign-In failed:', error);
   };

   return (
      <div className="pt-1">
         <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginFailure} />
      </div>
   );
}

export default GoogleSignIn;
