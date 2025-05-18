import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleSignIn from './GoogleSignIn';

function LoginForm() {
   const [showRegister, setShowRegister] = useState(false);
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(true);
   const [isPasswordVisible, setPasswordVisible] = useState(false);
   const navigate = useNavigate();
   const { login } = useAuth();

   const togglePasswordVisibility = () => {
      setPasswordVisible(!isPasswordVisible);
   };

   // Check for token in local storage on component mount and validate it
   useEffect(() => {
      const checkToken = async () => {
         const token = localStorage.getItem('token');
         if (token) {
            try {
               // Validate the token with the backend
               const response = await fetch('https://smart-full-stack-todo-app.vercel.app/api/users/profile', {
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

      try {
         const response = await fetch('https://smart-full-stack-todo-app.vercel.app/api/users/login', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
         });

         const data = await response.json();

         if (response.ok) {
            login(data.token); // Use the login function from AuthContext
            navigate('/dashboard');
         } else {
            setError(data.message || 'Login failed');
         }
      } catch (err) {
         setError('An error occurred during login.');
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen w-full bg-gradient-to-br from-[#0172af] to-[#74febd] flex justify-center items-center">
            <div className="relative w-full h-[300px] flex items-center justify-center rounded-md overflow-hidden">
               {/* Scan line */}
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-[scan_2s_infinite_linear]"></div>

               {/* Glowing border */}
               <div className="absolute top-0 left-0 w-full h-full border-2 border-transparent rounded-md animate-[glow_3s_infinite_ease-in-out]"></div>

               {/* Loading text */}
               <div className="relative z-10 text-white text-lg font-semibold">Please wait...</div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-[#0172af] to-[#74febd] flex justify-center items-center p-4">
         <div className="bg-gradient-to-br from-[#5d53e7] to-[#ea26fb] p-5 rounded-xl text-gray-200 shadow-xl w-full max-w-sm md:max-w-lg lg:max-w-xl">
            <h2 className="text-center text-xl md:text-2xl lg:text-3xl font-extrabold">Login Form</h2>
            <form onSubmit={handleSubmit}>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">User name</label>
                  <input
                     type="text"
                     required
                     className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base"
                     placeholder="Enter your username"
                  />
               </div>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">Email</label>
                  <input
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base"
                     placeholder="Enter your email"
                  />
               </div>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">Password</label>
                  <div className="relative">
                     <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base pr-16 w-full"
                        placeholder="Enter your password"
                     />
                     <div
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white text-sm"
                        onClick={togglePasswordVisibility}
                     >
                        {isPasswordVisible ? 'Hide' : 'Show'}
                     </div>
                  </div>
               </div>
               {error && <p className="text-red-500 text-xs md:text-sm lg:text-base mb-4">{error}</p>}
               <div className="flex flex-col md:flex-row gap-3 items-center justify-center">
                  <button
                     type="submit"
                     className="bg-[#9406e6] text-white rounded-lg p-2 px-4 md:px-6 font-bold hover:bg-[#8306ca] transition-all duration-300 w-full md:w-auto text-sm md:text-base lg:text-lg"
                  >
                     Login
                  </button>
                  <Link
                     to="/register"
                     className="bg-[#9406e6] text-white rounded-lg p-2 px-4 md:px-6 font-bold hover:bg-[#8306ca] transition-all duration-300 w-full md:w-auto text-sm md:text-base lg:text-lg text-center"
                  >
                     Register
                  </Link>
                  <GoogleSignIn />
               </div>
            </form>
         </div>
      </div>
   );
}

export default LoginForm;
