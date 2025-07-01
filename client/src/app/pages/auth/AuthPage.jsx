'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../../components/ThemeToggle';
import GoogleSignIn from './GoogleSignIn';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function AuthPage() {
   const location = useLocation();
   const navigate = useNavigate();
   const { login } = useAuth();

   // Determine initial mode based on route
   const [isLogin, setIsLogin] = useState(location.pathname.includes('login'));
   const [loading, setLoading] = useState(true);

   // Login form state
   const [loginData, setLoginData] = useState({
      email: '',
      password: '',
   });

   // Register form state
   const [registerData, setRegisterData] = useState({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
   });

   const [profileImage, setProfileImage] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isPasswordVisible, setPasswordVisible] = useState(false);

   // Update mode when route changes
   useEffect(() => {
      setIsLogin(location.pathname.includes('login'));
      setError('');
      setSuccess('');
   }, [location.pathname]);

   // Check for existing token
   useEffect(() => {
      const checkToken = async () => {
         const token = localStorage.getItem('token');
         if (token) {
            try {
               const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
                  method: 'GET',
                  headers: {
                     'Content-Type': 'application/json',
                     Authorization: `Bearer ${token}`,
                  },
               });

               if (response.ok) {
                  login(token);
                  navigate('/dashboard');
               } else {
                  localStorage.removeItem('token');
               }
            } catch (err) {
               console.error('Token validation error:', err);
               localStorage.removeItem('token');
            }
         }
         setLoading(false);
      };

      checkToken();
   }, [login, navigate]);

   const togglePasswordVisibility = () => {
      setPasswordVisible(!isPasswordVisible);
   };

   const handleLoginChange = (e) => {
      const { name, value } = e.target;
      setLoginData((prev) => ({ ...prev, [name]: value }));
   };

   const handleRegisterChange = (e) => {
      const { name, value } = e.target;
      setRegisterData((prev) => ({ ...prev, [name]: value }));
   };

   const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.match('image.*')) {
         setError('Please select an image file');
         return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
         setError('File size should not exceed 5MB');
         return;
      }

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
         const base64String = reader.result;
         console.log('Image converted to base64:', base64String.substring(0, 100) + '...'); // Log first 100 chars
         setProfileImage(base64String);
         setPreviewUrl(base64String);
      };
      reader.readAsDataURL(file);
      setError('');
   };

   const handleLoginSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      console.log('Login form submitted with data:', loginData);

      if (!loginData.email || !loginData.password) {
         setError('Email and password are required');
         setIsSubmitting(false);
         return;
      }

      try {
         const response = await fetch(`${BACKEND_URL}/api/users/login`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               email: loginData.email.trim(),
               password: loginData.password,
            }),
         });

         const data = await response.json();
         console.log('Login response:', data);

         if (response.ok) {
            if (data.token) {
               console.log('Login successful, setting token');
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
         setIsSubmitting(false);
      }
   };

   const handleRegisterSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setIsSubmitting(true);

      console.log('Register form submitted with data:', registerData);

      // Validation
      if (!registerData.username || !registerData.email || !registerData.password) {
         setError('All fields are required');
         setIsSubmitting(false);
         return;
      }

      if (registerData.password !== registerData.confirmPassword) {
         setError('Passwords do not match');
         setIsSubmitting(false);
         return;
      }

      if (registerData.password.length < 3) {
         setError('Password must be at least 3 characters long');
         setIsSubmitting(false);
         return;
      }

      try {
         // Prepare the request data
         const requestData = {
            username: registerData.username.trim(),
            email: registerData.email.trim(),
            password: registerData.password,
         };

         // Only add profileImage if it exists
         if (profileImage) {
            requestData.profileImage = profileImage;
            console.log('Including profile image in request');
         }

         console.log('Sending registration request with data:', {
            ...requestData,
            profileImage: requestData.profileImage ? 'Base64 image data present' : 'No image',
         });

         const response = await fetch(`${BACKEND_URL}/api/users/register`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
         });

         const data = await response.json();
         console.log('Registration response:', data);

         if (response.ok) {
            setSuccess('Registration successful!');
            setError('');

            if (data.token) {
               console.log('Registration successful, setting token');
               login(data.token);
               setTimeout(() => {
                  navigate('/dashboard');
               }, 1000);
            } else {
               setTimeout(() => {
                  navigate('/auth/login');
               }, 1000);
            }
         } else {
            setError(data.message || 'Registration failed. Please try again.');
         }
      } catch (error) {
         console.error('Registration error:', error);
         setError('Registration failed. Please check your network connection and try again.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const switchMode = () => {
      const newPath = isLogin ? '/auth/register' : '/auth/login';
      navigate(newPath);
   };

   // Animation variants
   const containerVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
   };

   const slideVariants = {
      loginToRegister: {
         initial: { x: '-100%' },
         animate: { x: 0 },
         exit: { x: '100%' },
      },
      registerToLogin: {
         initial: { x: '100%' },
         animate: { x: 0 },
         exit: { x: '-100%' },
      },
   };

   const infoVariants = {
      loginToRegister: {
         initial: { x: '100%' },
         animate: { x: 0 },
         exit: { x: '-100%' },
      },
      registerToLogin: {
         initial: { x: '-100%' },
         animate: { x: 0 },
         exit: { x: '100%' },
      },
   };

   if (loading) {
      return (
         <div className="fixed inset-0 w-full h-full flex justify-center items-center bg-gradient-to-br from-[#9406E6] to-[#00FFFF] dark:from-gray-900 dark:to-gray-800">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
               <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9406E6] dark:border-purple-400"></div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
         {/* Theme Toggle */}
         <div className="absolute top-6 right-6 z-20">
            <ThemeToggle variant="floating" size="medium" />
         </div>

         {/* Back to Home link - Fixed visibility with subtle background */}
         <div className="absolute top-4 left-4 z-20">
            <Link
               to="/"
               className="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md text-white hover:text-purple-200 transition-all duration-300 rounded-full border border-slate-600/50 hover:border-slate-500/70 shadow-lg hover:shadow-xl transform hover:scale-110"
            >
               <motion.svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{
                     x: [-2, -6, -2],
                     transition: {
                        duration: 0.6,
                        ease: 'easeInOut',
                        times: [0, 0.5, 1],
                     },
                  }}
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </motion.svg>
            </Link>
         </div>

         {/* Desktop Layout */}
         <div className="hidden lg:flex w-full h-full">
            <AnimatePresence mode="wait">
               {isLogin ? (
                  <motion.div
                     key="login-layout"
                     variants={containerVariants}
                     initial="initial"
                     animate="animate"
                     exit="exit"
                     transition={{ duration: 0.4, ease: 'easeInOut' }}
                     className="flex w-full h-full"
                  >
                     {/* Login Form - Left Side */}
                     <motion.div
                        variants={slideVariants.registerToLogin}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="w-1/2 flex items-center justify-center p-12 bg-white"
                     >
                        <div className="w-full max-w-md">
                           <div className="text-center mb-8">
                              <h2 className="text-4xl font-bold text-slate-800 mb-2 font-proza">Welcome Back</h2>
                              <p className="text-slate-600">Sign in to your account to continue</p>
                           </div>

                           {error && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                 {error}
                              </div>
                           )}

                           <form onSubmit={handleLoginSubmit} className="space-y-6">
                              <div>
                                 <label className="block text-slate-700 font-semibold mb-2">Email Address</label>
                                 <input
                                    type="email"
                                    name="email"
                                    value={loginData.email}
                                    onChange={handleLoginChange}
                                    className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Enter your email"
                                    required
                                 />
                              </div>

                              <div>
                                 <label className="block text-slate-700 font-semibold mb-2">Password</label>
                                 <div className="relative">
                                    <input
                                       type={isPasswordVisible ? 'text' : 'password'}
                                       name="password"
                                       value={loginData.password}
                                       onChange={handleLoginChange}
                                       className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                       placeholder="Enter your password"
                                       required
                                    />
                                    <button
                                       type="button"
                                       onClick={togglePasswordVisibility}
                                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                       {isPasswordVisible ? 'Hide' : 'Show'}
                                    </button>
                                 </div>
                              </div>

                              <button
                                 type="submit"
                                 disabled={isSubmitting}
                                 className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-lg ${
                                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                 }`}
                              >
                                 {isSubmitting ? 'Signing in...' : 'Sign In'}
                              </button>

                              <div className="relative my-6">
                                 <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-300"></div>
                                 </div>
                                 <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                                 </div>
                              </div>

                              {/* Dedicated Google Sign-In Container */}
                              <div className="w-full">
                                 <GoogleSignIn />
                              </div>
                           </form>
                        </div>
                     </motion.div>

                     {/* Info Panel - Right Side */}
                     <motion.div
                        variants={infoVariants.registerToLogin}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="w-1/2 flex items-center justify-center p-12 bg-gradient-to-br from-purple-600 to-purple-800"
                     >
                        <div className="text-center text-white max-w-md">
                           <h1 className="text-5xl font-bold mb-6 font-proza">Smart Todo</h1>
                           <p className="text-xl mb-8 text-purple-100">
                              Organize your life with intelligent task management, dependencies, and real-time
                              collaboration.
                           </p>
                           <div className="space-y-4 text-left mb-8">
                              <div className="flex items-center space-x-3">
                                 <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                 <span className="text-purple-100">Smart task dependencies</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                 <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                 <span className="text-purple-100">Real-time notifications</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                 <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                 <span className="text-purple-100">Advanced analytics</span>
                              </div>
                           </div>
                           <button
                              onClick={switchMode}
                              className="px-8 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-all duration-300 shadow-lg"
                           >
                              New here? Create Account
                           </button>
                        </div>
                     </motion.div>
                  </motion.div>
               ) : (
                  <motion.div
                     key="register-layout"
                     variants={containerVariants}
                     initial="initial"
                     animate="animate"
                     exit="exit"
                     transition={{ duration: 0.4, ease: 'easeInOut' }}
                     className="flex w-full h-full"
                  >
                     {/* Info Panel - Left Side */}
                     <motion.div
                        variants={infoVariants.loginToRegister}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="w-1/2 flex items-center justify-center p-12 bg-gradient-to-br from-purple-600 to-purple-800"
                     >
                        <div className="text-center text-white max-w-md">
                           <h1 className="text-5xl font-bold mb-6 font-proza">Join Smart Todo</h1>
                           <p className="text-xl mb-8 text-purple-100">
                              Start your journey to better productivity. Create an account and experience the future of
                              task management.
                           </p>
                           <div className="space-y-4 text-left mb-8">
                              <div className="flex items-center space-x-3">
                                 <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                 <span className="text-purple-100">Free forever plan</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                 <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                 <span className="text-purple-100">Unlimited tasks</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                 <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                 <span className="text-purple-100">Cloud synchronization</span>
                              </div>
                           </div>
                           <button
                              onClick={switchMode}
                              className="px-8 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-all duration-300 shadow-lg"
                           >
                              Already have an account? Sign In
                           </button>
                        </div>
                     </motion.div>

                     {/* Register Form - Right Side */}
                     <motion.div
                        variants={slideVariants.loginToRegister}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="w-1/2 flex items-center justify-center p-8 bg-white"
                     >
                        <div className="w-full max-w-md">
                           <div className="text-center mb-4">
                              <h2 className="text-3xl font-bold text-slate-800 mb-1 font-proza">Create Account</h2>
                              <p className="text-slate-600 text-sm">Join thousands of productive users</p>
                           </div>

                           {error && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                                 {error}
                              </div>
                           )}
                           {success && (
                              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm">
                                 {success}
                              </div>
                           )}

                           <form onSubmit={handleRegisterSubmit} className="space-y-3">
                              {/* Profile Image */}
                              <div className="flex justify-center mb-3">
                                 <div
                                    onClick={() => document.getElementById('profile-image').click()}
                                    className="w-16 h-16 rounded-full cursor-pointer border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-purple-400 transition-colors bg-slate-50"
                                 >
                                    {previewUrl ? (
                                       <img
                                          src={previewUrl || '/placeholder.svg'}
                                          alt="Profile Preview"
                                          className="w-full h-full object-cover"
                                       />
                                    ) : (
                                       <div className="text-center text-slate-400">
                                          <svg
                                             className="h-6 w-6 mx-auto"
                                             fill="none"
                                             viewBox="0 0 24 24"
                                             stroke="currentColor"
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                             />
                                          </svg>
                                          <span className="text-xs">Photo</span>
                                       </div>
                                    )}
                                 </div>
                                 <input
                                    id="profile-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                 />
                              </div>

                              <div>
                                 <label className="block text-slate-700 font-semibold mb-1 text-sm">Username</label>
                                 <input
                                    type="text"
                                    name="username"
                                    value={registerData.username}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Enter your username"
                                    required
                                 />
                              </div>

                              <div>
                                 <label className="block text-slate-700 font-semibold mb-1 text-sm">
                                    Email Address
                                 </label>
                                 <input
                                    type="email"
                                    name="email"
                                    value={registerData.email}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Enter your email"
                                    required
                                 />
                              </div>

                              <div>
                                 <label className="block text-slate-700 font-semibold mb-1 text-sm">Password</label>
                                 <div className="relative">
                                    <input
                                       type={isPasswordVisible ? 'text' : 'password'}
                                       name="password"
                                       value={registerData.password}
                                       onChange={handleRegisterChange}
                                       className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                       placeholder="Create a password"
                                       required
                                    />
                                    <button
                                       type="button"
                                       onClick={togglePasswordVisibility}
                                       className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          {isPasswordVisible ? (
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                             />
                                          ) : (
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                             />
                                          )}
                                       </svg>
                                    </button>
                                 </div>
                              </div>

                              <div>
                                 <label className="block text-slate-700 font-semibold mb-1 text-sm">
                                    Confirm Password
                                 </label>
                                 <input
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={registerData.confirmPassword}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Confirm your password"
                                    required
                                 />
                              </div>

                              <div className="pt-1">
                                 <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-300 shadow-lg ${
                                       isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                                 >
                                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                 </button>

                                 <div className="relative my-3">
                                    <div className="absolute inset-0 flex items-center">
                                       <div className="w-full border-t border-slate-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                       <span className="px-2 bg-white text-slate-500 text-xs">Or continue with</span>
                                    </div>
                                 </div>

                                 {/* Dedicated Google Sign-In Container */}
                                 <div className="w-full">
                                    <GoogleSignIn />
                                 </div>

                                 <div className="text-center mt-3">
                                    <button
                                       type="button"
                                       onClick={switchMode}
                                       className="text-purple-600 hover:text-purple-700 font-semibold transition-colors text-sm"
                                    >
                                       Already have an account? <span className="underline">Sign in</span>
                                    </button>
                                 </div>
                              </div>
                           </form>
                        </div>
                     </motion.div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Mobile Layout */}
         <div className="lg:hidden flex flex-col w-full h-full bg-white">
            <div className="flex-1 flex items-center justify-center p-6">
               <AnimatePresence mode="wait">
                  {isLogin ? (
                     <motion.div
                        key="mobile-login"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-sm"
                     >
                        <div className="text-center mb-8">
                           <h2 className="text-3xl font-bold text-slate-800 mb-2 font-proza">Welcome Back</h2>
                           <p className="text-slate-600">Sign in to your account</p>
                        </div>

                        {error && (
                           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                              {error}
                           </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                           <div>
                              <label className="block text-slate-700 font-semibold mb-2">Email</label>
                              <input
                                 type="email"
                                 name="email"
                                 value={loginData.email}
                                 onChange={handleLoginChange}
                                 className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                 placeholder="Enter your email"
                                 required
                              />
                           </div>

                           <div>
                              <label className="block text-slate-700 font-semibold mb-2">Password</label>
                              <div className="relative">
                                 <input
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    name="password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                    required
                                 />
                                 <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                 >
                                    {isPasswordVisible ? 'Hide' : 'Show'}
                                 </button>
                              </div>
                           </div>

                           <button
                              type="submit"
                              disabled={isSubmitting}
                              className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-lg ${
                                 isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                           >
                              {isSubmitting ? 'Signing in...' : 'Sign In'}
                           </button>

                           <div className="relative my-6">
                              <div className="absolute inset-0 flex items-center">
                                 <div className="w-full border-t border-slate-300"></div>
                              </div>
                              <div className="relative flex justify-center text-sm">
                                 <span className="px-2 bg-white text-slate-500">Or continue with</span>
                              </div>
                           </div>

                           {/* Dedicated Google Sign-In Container for Mobile */}
                           <div className="w-full">
                              <GoogleSignIn />
                           </div>

                           <div className="text-center">
                              <button
                                 type="button"
                                 onClick={switchMode}
                                 className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                              >
                                 Don't have an account? <span className="underline">Create one</span>
                              </button>
                           </div>
                        </form>
                     </motion.div>
                  ) : (
                     <motion.div
                        key="mobile-register"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-sm"
                     >
                        <div className="text-center mb-4">
                           <h2 className="text-2xl font-bold text-slate-800 mb-1 font-proza">Create Account</h2>
                           <p className="text-slate-600 text-sm">Join Smart Todo today</p>
                        </div>

                        {error && (
                           <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                              {error}
                           </div>
                        )}
                        {success && (
                           <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm">
                              {success}
                           </div>
                        )}

                        <form onSubmit={handleRegisterSubmit} className="space-y-3">
                           {/* Profile Image */}
                           <div className="flex justify-center mb-3">
                              <div
                                 onClick={() => document.getElementById('mobile-profile-image').click()}
                                 className="w-14 h-14 rounded-full cursor-pointer border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-purple-400 transition-colors bg-slate-50"
                              >
                                 {previewUrl ? (
                                    <img
                                       src={previewUrl || '/placeholder.svg'}
                                       alt="Profile Preview"
                                       className="w-full h-full object-cover"
                                    />
                                 ) : (
                                    <div className="text-center text-slate-400">
                                       <svg
                                          className="h-5 w-5 mx-auto"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                       >
                                          <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                          />
                                       </svg>
                                       <span className="text-xs">Photo</span>
                                    </div>
                                 )}
                              </div>
                              <input
                                 id="mobile-profile-image"
                                 type="file"
                                 accept="image/*"
                                 onChange={handleImageChange}
                                 className="hidden"
                              />
                           </div>

                           <div>
                              <label className="block text-slate-700 font-semibold mb-1 text-sm">Username</label>
                              <input
                                 type="text"
                                 name="username"
                                 value={registerData.username}
                                 onChange={handleRegisterChange}
                                 className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                 placeholder="Enter your username"
                                 required
                              />
                           </div>

                           <div>
                              <label className="block text-slate-700 font-semibold mb-1 text-sm">Email</label>
                              <input
                                 type="email"
                                 name="email"
                                 value={registerData.email}
                                 onChange={handleRegisterChange}
                                 className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                 placeholder="Enter your email"
                                 required
                              />
                           </div>

                           <div>
                              <label className="block text-slate-700 font-semibold mb-1 text-sm">Password</label>
                              <div className="relative">
                                 <input
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    name="password"
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Create a password"
                                    required
                                 />
                                 <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                 >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       {isPasswordVisible ? (
                                          <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                          />
                                       ) : (
                                          <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                          />
                                       )}
                                    </svg>
                                 </button>
                              </div>
                           </div>

                           <div>
                              <label className="block text-slate-700 font-semibold mb-1 text-sm">
                                 Confirm Password
                              </label>
                              <input
                                 type={isPasswordVisible ? 'text' : 'password'}
                                 name="confirmPassword"
                                 value={registerData.confirmPassword}
                                 onChange={handleRegisterChange}
                                 className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                 placeholder="Confirm your password"
                                 required
                              />
                           </div>

                           <div className="pt-1">
                              <button
                                 type="submit"
                                 disabled={isSubmitting}
                                 className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-300 shadow-lg ${
                                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                 }`}
                              >
                                 {isSubmitting ? 'Creating Account...' : 'Create Account'}
                              </button>

                              <div className="relative my-3">
                                 <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-300"></div>
                                 </div>
                                 <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500 text-xs">Or continue with</span>
                                 </div>
                              </div>

                              {/* Dedicated Google Sign-In Container for Mobile */}
                              <div className="w-full">
                                 <GoogleSignIn />
                              </div>

                              <div className="text-center mt-3">
                                 <button
                                    type="button"
                                    onClick={switchMode}
                                    className="text-purple-600 hover:text-purple-700 font-semibold transition-colors text-sm"
                                 >
                                    Already have an account? <span className="underline">Sign in</span>
                                 </button>
                              </div>
                           </div>
                        </form>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </div>
   );
}

export default AuthPage;
