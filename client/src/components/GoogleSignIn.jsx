import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function GoogleSignIn({ setlogin }) {
   const handleLoginSuccess = async (response) => {
      const { credential } = response;

      try {
         // Decode Google token
         const decodedToken = JSON.parse(atob(credential.split('.')[1]));

         // console.log('Decoded Google Token:', decodedToken);

         // User data (matching backend schema)
         const userData = {
            name: decodedToken.name, // Mapping name from Google to 'username'
            email: decodedToken.email,
            picture: decodedToken.picture,
         };

         // console.log('Sending User Data:', userData);

         // Send user data to backend to create user and generate JWT
         const backendResponse = await axios.post('http://localhost:5000/api/users/google-signin', userData);


         // console.log('User saved successfully:', backendResponse.data);

         // On success, set the login state to true
         setlogin(true); // Ensure the app state is updated with login status

         // Store the token in localStorage for future requests
         localStorage.setItem('token', backendResponse.data.token);
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
