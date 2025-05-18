import React, { useEffect, useState } from 'react';

function UserProfile({ setlogin }) {
   const [userDetails, setUserDetails] = useState({
      username: '',
      email: '',
      picture: null,
      gender: '',
      occupation: '',
      organization: '',
   });

   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   useEffect(() => {
      const fetchUserProfile = async () => {
         try {
            const token = localStorage.getItem('token');
            if (!token) {
               throw new Error('No token found');
            }

            const response = await fetch('http://localhost:5000/api/users/profile', {
               method: 'GET',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
            });

            if (!response.ok) {
               const errorData = await response.json();
               throw new Error(`Error fetching profile: ${errorData.message}`);
            }

            const data = await response.json();
            setUserDetails({
               username: data.username,
               email: data.email,
               picture: data.picture,
               gender: data.gender,
               occupation: data.occupation,
               organization: data.organization,
            });
         } catch (err) {
            setError(`Error fetching user profile: ${err.message}`);
         } finally {
            // setLoading(false);
            setTimeout(() => setLoading(false), 1000);
         }
      };

      fetchUserProfile();
   }, []);

   const handleLogout = () => {
      localStorage.removeItem('token');
      setlogin(false);
   };
   const handleDeleteAccount = async () => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('No token found');
         }

         const response = await fetch('http://localhost:5000/api/users/delete-account', {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
         }

         // Clear local storage and logout user
         localStorage.removeItem('token');
         setlogin(false);

         alert('Account deleted successfully!');
      } catch (err) {
         console.log(`Failed to delete account: ${err.message}`);
      }
   };
   if (loading) {
      return (
         <>
            <div class="relative w-full h-[300px] flex items-center justify-center rounded-md overflow-hidden">
               {/* <!-- Scan line --> */}
               <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/30 to-transparent animate-scan"></div>

               {/* <!-- Glowing border --> */}
               <div class="absolute top-0 left-0 w-full h-full border-2 border-transparent rounded-md animate-glow"></div>

               {/* <!-- Loading text --> */}
               <div class="relative z-10 text-white text-lg font-semibold">Fetching Profile...</div>
            </div>
            <style jsx>
               {`
                  @layer utilities {
                     @keyframes scan {
                        0% {
                           transform: translateY(-100%);
                        }
                        100% {
                           transform: translateY(100%);
                        }
                     }

                     @keyframes glow {
                        0%,
                        100% {
                           box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
                        }
                        50% {
                           box-shadow: 0 10px 10px rgb(255, 255, 255);
                        }
                     }

                     .animate-scan {
                        animation: scan 2s infinite linear;
                     }

                     .animate-glow {
                        animation: glow 3s infinite ease-in-out;
                     }
                  }
               `}
            </style>
         </>
      );
   }

   if (error) {
      return <div>{error}</div>;
   }

   return (
      <div className="container mx-auto p-3 max-w-6xl">
         <div className="flex justify-center mb-8">
            <div className="rounded-full bg-[#9df7f7] p-2 shadow-md">
               {userDetails.picture ? (
                  <img src={userDetails.picture} alt="Profile" className="w-36 h-36 rounded-full object-cover" />
               ) : (
                  <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center">No Image</div>
               )}
            </div>
         </div>

         <div className="bg-[#9df7f7] p-3 rounded-xl shadow-lg">
            <p className="font-caros-light text-sm md:text-base sm:text-base lg:text-md mb-2 rounded-lg text-[#1D1D1D] bg-white p-2 break-words">
               Name: {userDetails.username}
            </p>
            <p className="font-caros-light text-sm md:text-base sm:text-base lg:text-md mb-2 rounded-lg text-[#1D1D1D] bg-white p-2 break-words">
               Email: {userDetails.email}
            </p>
            {userDetails.gender && (
               <p className="font-caros-light text-sm md:text-base sm:text-base lg:text-md mb-2 rounded-lg text-[#1D1D1D] bg-white p-2 break-words">
                  Gender: {userDetails.gender}
               </p>
            )}
            {userDetails.occupation && (
               <p className="font-caros-light text-sm md:text-base sm:text-base lg:text-md mb-2 rounded-lg text-[#1D1D1D] bg-white p-2 break-words">
                  Occupation: {userDetails.occupation}
               </p>
            )}
            {userDetails.organization && (
               <p className="font-caros-light text-sm md:text-base sm:text-base lg:text-md mb-2 rounded-lg text-[#1D1D1D] bg-white p-2 break-words">
                  Organization: {userDetails.organization}
               </p>
            )}

            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-6 mt-4">
               <button
                  onClick={handleLogout}
                  className="font-caros-light bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-full transition-colors duration-300 text-sm md:text-base"
               >
                  Logout
               </button>
               <button
                  onClick={handleDeleteAccount}
                  className="font-caros-light bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-full transition-colors duration-300 text-sm md:text-base"
               >
                  Delete Account
               </button>
            </div>
         </div>
      </div>
   );
}

export default UserProfile;
