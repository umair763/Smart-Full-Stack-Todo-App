'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../../components/ThemeToggle';
import GoogleSignIn from './GoogleSignIn';
import { API_URL } from '../../../config/env';

// Use the consistent API base URL
const API_BASE_URL = API_URL || 'http://localhost:5000';

function LoginForm() {
   const [formData, setFormData] = useState({
      email: '',
      password: '',
   });
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(true);
   const [isLoggingIn, setIsLoggingIn] = useState(false);
   const [isPasswordVisible, setPasswordVisible] = useState(false);
   const navigate = useNavigate();
   const { login } = useAuth();

   const togglePasswordVisibility = () => {
      setPasswordVisible(!isPasswordVisible);
   };

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({
         ...formData,
         [name]: value,
      });
   };

   // Check for token in local storage on component mount and validate it
   useEffect(() => {
      const checkToken = async () => {
         const token = localStorage.getItem('token');
         if (token) {
            try {
               // Validate the token with the backend
               const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                  method: 'GET',
                  headers: {
                     'Content-Type': 'application/json',
                     Authorization: `Bearer ${token}`,
                  },
               });

               if (response.ok) {
                  login(token); // Use the login function from AuthContext
                  navigate('/dashboard');
               } else {
                  localStorage.removeItem('token'); // Token is invalid, remove it
               }
            } catch (err) {
               setError('Error validating token. Please log in again.');
            }
         }
         setLoading(false); // Stop loading after validation
      };

      checkToken();
   }, [login, navigate]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoggingIn(true);

      if (!formData.email || !formData.password) {
         setError('Email and password are required');
         setIsLoggingIn(false);
         return;
      }

      try {
         console.log('Attempting login for:', formData.email);

         const response = await fetch(`${API_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               email: formData.email,
               password: formData.password,
            }),
            credentials: 'include',
         });

         // Try to parse the response
         let data;
         try {
            data = await response.json();
         } catch (err) {
            console.error('Error parsing login response:', err);
            throw new Error('Unable to parse server response');
         }

         // Handle response based on status
         if (response.ok) {
            console.log('Login successful');

            if (data.token) {
               login(data.token);
               navigate('/dashboard');
            } else {
               setError('No token received from server');
            }
         } else {
            setError(data.message || 'Invalid credentials');
         }
      } catch (err) {
         console.error('Login error:', err);
         setError('Unable to connect to the server. Please check your network connection and try again.');
      } finally {
         setIsLoggingIn(false);
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-gradient-to-br from-[#9406E6] to-[#00FFFF] dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md">
               <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6] dark:border-purple-400"></div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-[#9406E6] to-[#00FFFF] dark:from-gray-900 dark:to-gray-800 flex justify-center items-center p-4">
         {/* Theme Toggle in top-right corner */}
         <div className="absolute top-4 right-4 z-10">
            <ThemeToggle variant="floating" size="medium" />
         </div>

         {/* Back to Home link */}
         <div className="absolute top-4 left-4 z-10">
            <Link
               to="/"
               className="text-white hover:text-gray-200 transition-colors flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg"
            >
               <span>← Back to Home</span>
            </Link>
         </div>

         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-center text-[#9406E6] dark:text-purple-400 mb-6">Welcome Back</h2>

            {error && (
               <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                  {error}
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                     Email
                  </label>
                  <input
                     type="email"
                     id="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] dark:focus:ring-purple-400"
                     placeholder="Enter your email"
                  />
               </div>

               <div>
                  <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
                     Password
                  </label>
                  <div className="relative">
                     <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6] dark:focus:ring-purple-400"
                        placeholder="Enter your password"
                     />
                     <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                     >
                        {isPasswordVisible ? 'Hide' : 'Show'}
                     </button>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <button
                     type="submit"
                     disabled={isLoggingIn}
                     className={`w-full bg-[#9406E6] dark:bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-[#7d05c3] dark:hover:bg-purple-700 transition-colors ${
                        isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''
                     }`}
                  >
                     {isLoggingIn ? 'Logging in...' : 'Login'}
                  </button>

                  <div className="text-center">
                     <p className="text-gray-600 dark:text-gray-400">Or sign in with</p>
                     <div className="flex justify-center mt-2">
                        <GoogleSignIn />
                     </div>
                  </div>

                  <div className="text-center mt-4">
                     <p className="text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link
                           to="/auth/register"
                           className="text-[#9406E6] dark:text-purple-400 font-medium hover:underline"
                        >
                           Register
                        </Link>
                     </p>
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
}

export default LoginForm;
