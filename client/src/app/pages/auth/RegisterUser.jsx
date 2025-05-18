import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GoogleSignIn from './GoogleSignIn';

function RegisterUser() {
   const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
   });
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isPasswordVisible, setPasswordVisible] = useState(false);
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

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setIsLoading(true);

      // Basic validation
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

      // Prepare form data
      const submitData = new FormData();
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);

      try {
         const response = await fetch('https://smart-full-stack-todo-app.vercel.app/api/users/register', {
            method: 'POST',
            body: submitData,
         });

         const data = await response.json();

         if (response.ok) {
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/'), 2000);
         } else {
            setError(data.message || 'Registration failed. Please try again.');
         }
      } catch (err) {
         setError('Server error. Please try again later.');
         console.error('Registration error:', err);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-[#9406E6] to-[#00FFFF] flex justify-center items-center p-4">
         <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-3xl font-bold text-center text-[#9406E6] mb-6">Create Account</h2>

            {error && (
               <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}

            {success && (
               <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label htmlFor="username" className="block text-gray-700 font-medium mb-1">
                     Username
                  </label>
                  <input
                     type="text"
                     id="username"
                     name="username"
                     value={formData.username}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6]"
                     placeholder="Enter your username"
                  />
               </div>

               <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                     Email
                  </label>
                  <input
                     type="email"
                     id="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6]"
                     placeholder="Enter your email"
                  />
               </div>

               <div>
                  <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
                     Password
                  </label>
                  <div className="relative">
                     <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6]"
                        placeholder="Enter your password"
                     />
                     <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                     >
                        {isPasswordVisible ? 'Hide' : 'Show'}
                     </button>
                  </div>
               </div>

               <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
                     Confirm Password
                  </label>
                  <input
                     type={isPasswordVisible ? 'text' : 'password'}
                     id="confirmPassword"
                     name="confirmPassword"
                     value={formData.confirmPassword}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9406E6]"
                     placeholder="Confirm your password"
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
