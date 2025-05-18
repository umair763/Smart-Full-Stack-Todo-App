'use client';

import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GoogleSignIn from './GoogleSignIn';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function RegisterUser() {
   const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
   });
   const [profileImage, setProfileImage] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isPasswordVisible, setPasswordVisible] = useState(false);
   const fileInputRef = useRef(null);
   const navigate = useNavigate();

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

   const handleImageClick = () => {
      fileInputRef.current.click();
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

      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setIsLoading(true);

      // Validate form data
      if (!formData.username || !formData.email || !formData.password) {
         setError('All fields are required');
         setIsLoading(false);
         return;
      }

      if (formData.password !== formData.confirmPassword) {
         setError('Passwords do not match');
         setIsLoading(false);
         return;
      }

      // Create form data for submission
      const submitData = new FormData();
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      if (profileImage) {
         submitData.append('picture', profileImage);
      }

      try {
         // Send registration request
         const response = await fetch(`${API_BASE_URL}/api/users/register`, {
            method: 'POST',
            body: submitData,
            // Don't set Content-Type header as FormData sets it automatically with boundary
         });

         // Handle response
         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
         }

         const data = await response.json();
         setSuccess('Registration successful!');
         setError('');

         // If token is provided, store it and navigate to dashboard
         if (data.token) {
            localStorage.setItem('token', data.token);
            setTimeout(() => {
               navigate('/dashboard');
            }, 1000);
         } else {
            setTimeout(() => {
               navigate('/');
            }, 1000);
         }
      } catch (error) {
         setError(error.message || 'Registration failed. Please try again.');
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#9406E6] to-[#00FFFF] p-4">
         <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Account</h2>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
            {success && (
               <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               {/* Profile Image Selector - Centered at the top */}
               <div className="flex justify-center mb-6">
                  <div
                     onClick={handleImageClick}
                     className="w-24 h-24 rounded-full cursor-pointer border-2 border-dashed border-purple-400 flex items-center justify-center overflow-hidden hover:border-purple-600 transition-colors"
                  >
                     {previewUrl ? (
                        <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                     ) : (
                        <div className="text-center text-gray-500">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 mx-auto"
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
                           <span className="text-xs">Add Photo</span>
                        </div>
                     )}
                  </div>
                  <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/*"
                     onChange={handleImageChange}
                     className="hidden"
                  />
               </div>

               {/* Rest of the form */}
               <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Username</label>
                  <input
                     type="text"
                     name="username"
                     value={formData.username}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                     placeholder="Enter your username"
                     required
                  />
               </div>

               <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                  <input
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                     placeholder="Enter your email"
                     required
                  />
               </div>

               <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                     <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        placeholder="Create a password"
                        required
                     />
                     <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                     >
                        {isPasswordVisible ? (
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                           </svg>
                        ) : (
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                           </svg>
                        )}
                     </button>
                  </div>
               </div>

               <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
                  <input
                     type={isPasswordVisible ? 'text' : 'password'}
                     name="confirmPassword"
                     value={formData.confirmPassword}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                     placeholder="Confirm your password"
                     required
                  />
               </div>

               <div className="flex flex-col gap-4">
                  <button
                     type="submit"
                     disabled={isLoading}
                     className={`w-full bg-[#9406E6] text-white font-bold py-3 rounded-lg hover:bg-[#7d05c3] transition-colors ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                     }`}
                  >
                     {isLoading ? 'Registering...' : 'Register'}
                  </button>

                  <div className="text-center">
                     <p className="text-gray-600">Or sign up with</p>
                     <div className="flex justify-center mt-2">
                        <GoogleSignIn />
                     </div>
                  </div>

                  <div className="text-center mt-4">
                     <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link to="/" className="text-[#9406E6] font-medium hover:underline">
                           Login
                        </Link>
                     </p>
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
}

export default RegisterUser;
