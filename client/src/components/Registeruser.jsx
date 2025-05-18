import { useState } from 'react';
import LoginForm from './LoginForm';

function Registeruser() {
   const [username, setUsername] = useState('');
   const [picture, setpicture] = useState(null);
   const [gender, setGender] = useState('');
   const [occupation, setOccupation] = useState('');
   const [organization, setOrganization] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [isPasswordVisible, setPasswordVisible] = useState(false);

   const togglePasswordVisibility = () => {
      setPasswordVisible(!isPasswordVisible);
   };

   const handlepictureUpload = (e) => {
      if (e.target.files && e.target.files[0]) {
         setpicture(e.target.files[0]); // Set the uploaded picture file
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
      formData.append('picture', picture);

      try {
         const response = await fetch('https://smart-full-stack-todo-app.vercel.app/api/users/register', {
            method: 'POST',
            body: formData, // Send the formData
         });

         const data = await response.json();

         if (response.ok) {
            setSuccess('Registration successful!');
            setTimeout(() => (window.location.href = '/'), 2000);
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
      <>
         <div className="bg-gradient-to-br from-[#0700DE] to-[#c4faa5] justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-5 rounded-lg font-caros-light text-gray-200 min-w-[250px] shadow-lg md:min-w-[400px]">
            <h2 className="text-center text-xl font-extrabold">Register</h2>
            <form onSubmit={handleSubmit}>
               <div className="flex flex-col justify-center mb-2 font-bold">
                  <label className="pt-4">User name</label>
                  <input
                     type="text"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white-100 font-caros-light focus:outline-none"
                  />
               </div>
               <div className="flex flex-col justify-center mb-2 font-bold">
                  <label className="pt-4">Gender</label>
                  <input
                     type="text"
                     value={gender}
                     onChange={(e) => setGender(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white-100 font-caros-light focus:outline-none"
                  />
               </div>
               <div className="flex flex-col justify-center mb-2 font-bold">
                  <label className="pt-4">Occupation</label>
                  <input
                     type="text"
                     value={occupation}
                     onChange={(e) => setOccupation(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white-100 font-caros-light focus:outline-none"
                  />
               </div>
               <div className="flex flex-col justify-center mb-2 font-bold">
                  <label className="pt-4">Organization</label>
                  <input
                     type="text"
                     value={organization}
                     onChange={(e) => setOrganization(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white-100 font-caros-light focus:outline-none"
                  />
               </div>
               <div className="flex flex-col justify-center mb-2 font-bold">
                  <label className="pt-4">Email</label>
                  <input
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     className="border-b border-white bg-transparent text-white-100 font-caros-light focus:outline-none"
                  />
               </div>
               <div className="flex flex-col justify-center mb-2 font-bold">
                  <label className="pt-5 pb-3">Password</label>
                  <div className="relative">
                     <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-b border-white bg-transparent text-white-100 font-caros-light focus:outline-none pr-20"
                        style={{ width: '25rem' }} // Set a custom width using inline style
                     />
                     <div
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white " // Adjusted the position of the text
                        onClick={togglePasswordVisibility}
                     >
                        {isPasswordVisible ? 'Hide' : 'Show'}
                     </div>
                  </div>
               </div>
               <div className="flex flex-col justify-center mb-2 font-bold">
                  <label className="pt-4 ">Profile Picture</label>
                  <input
                     type="file"
                     accept="image/*"
                     onChange={handlepictureUpload}
                     required
                     className="border-b border-white bg-transparent text-white-100 font-caros-light focus:outline-none"
                  />
               </div>

               {error && <p className="text-black">{error}</p>}
               {success && <p className="text-black">{success}</p>}

               <div className="flex flex-row gap-3 mt-6">
                  <button
                     type="submit"
                     className="bg-[#9406e6] text-white rounded-lg p-2 px-6 font-bold hover:bg-[#8306ca] cursor-pointer"
                  >
                     Register
                  </button>
               </div>
            </form>
         </div>
      </>
   );
}

export default Registeruser;

// const response = await fetch(' http://localhost:5000/api/users/register ', {
// const response = await fetch('https://todo-app-full-stack-opal.vercel.app/api/users/register ', {
