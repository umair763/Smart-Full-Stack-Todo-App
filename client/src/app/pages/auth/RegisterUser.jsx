import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterUser() {
   const [username, setUsername] = useState('');
   const [picture, setPicture] = useState(null);
   const [gender, setGender] = useState('');
   const [occupation, setOccupation] = useState('');
   const [organization, setOrganization] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [isPasswordVisible, setPasswordVisible] = useState(false);
   const navigate = useNavigate();

   const togglePasswordVisibility = () => {
      setPasswordVisible(!isPasswordVisible);
   };

   const handlePictureUpload = (e) => {
      if (e.target.files && e.target.files[0]) {
         setPicture(e.target.files[0]); // Set the uploaded picture file
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      // Prepare FormData for the multipart form submission
      const formData = new FormData();
      formData.append('username', username);
      formData.append('gender', gender);
      formData.append('occupation', occupation);
      formData.append('organization', organization);
      formData.append('email', email);
      formData.append('password', password);
      if (picture) {
         formData.append('picture', picture);
      }

      try {
         const response = await fetch('https://smart-full-stack-todo-app.vercel.app/api/users/register', {
            method: 'POST',
            body: formData, // Send the formData
         });

         const data = await response.json();

         if (response.ok) {
            setSuccess('Registration successful!');
            setTimeout(() => navigate('/'), 2000);
         } else {
            // Provide detailed error messages based on the response
            if (data.message) {
               setError(data.message);
            } else {
               setError('Registration failed. Please check your inputs.');
            }
         }
      } catch (err) {
         setError('An error occurred. Please try again.');
      }
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-[#0172af] to-[#74febd] flex justify-center items-center p-4">
         <div className="bg-gradient-to-br from-[#0700DE] to-[#c4faa5] p-5 rounded-xl text-gray-200 shadow-xl w-full max-w-sm md:max-w-lg lg:max-w-xl">
            <h2 className="text-center text-xl md:text-2xl lg:text-3xl font-extrabold">Register</h2>
            <form onSubmit={handleSubmit}>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">User name</label>
                  <input
                     type="text"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base"
                  />
               </div>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">Gender</label>
                  <input
                     type="text"
                     value={gender}
                     onChange={(e) => setGender(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base"
                  />
               </div>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">Occupation</label>
                  <input
                     type="text"
                     value={occupation}
                     onChange={(e) => setOccupation(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base"
                  />
               </div>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">Organization</label>
                  <input
                     type="text"
                     value={organization}
                     onChange={(e) => setOrganization(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base"
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
                     />
                     <div
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white text-sm"
                        onClick={togglePasswordVisibility}
                     >
                        {isPasswordVisible ? 'Hide' : 'Show'}
                     </div>
                  </div>
               </div>
               <div className="flex flex-col justify-center mb-4 font-bold">
                  <label className="pt-4 pb-2 text-sm md:text-base lg:text-lg">Profile Picture</label>
                  <input
                     type="file"
                     accept="image/*"
                     onChange={handlePictureUpload}
                     className="border-b border-white bg-transparent text-white placeholder-gray-300 focus:outline-none px-2 py-1 text-sm md:text-base"
                  />
               </div>

               {error && <p className="text-red-500 text-xs md:text-sm lg:text-base mb-4">{error}</p>}
               {success && <p className="text-green-500 text-xs md:text-sm lg:text-base mb-4">{success}</p>}

               <div className="flex flex-col md:flex-row gap-3 items-center justify-center">
                  <button
                     type="submit"
                     className="bg-[#9406e6] text-white rounded-lg p-2 px-4 md:px-6 font-bold hover:bg-[#8306ca] transition-all duration-300 w-full md:w-auto text-sm md:text-base lg:text-lg"
                  >
                     Register
                  </button>
                  <button
                     type="button"
                     onClick={() => navigate('/')}
                     className="bg-[#9406e6] text-white rounded-lg p-2 px-4 md:px-6 font-bold hover:bg-[#8306ca] transition-all duration-300 w-full md:w-auto text-sm md:text-base lg:text-lg"
                  >
                     Back to Login
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}

export default RegisterUser;
