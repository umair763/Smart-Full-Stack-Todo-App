import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../layout/Header';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Profile() {
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
   const navigate = useNavigate();
   const { user } = useAuth();

   useEffect(() => {
      const fetchUserProfile = async () => {
         try {
            const token = localStorage.getItem('token');
            if (!token) {
               throw new Error('No token found');
            }

            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
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
               gender: data.gender || '',
               occupation: data.occupation || '',
               organization: data.organization || '',
            });
         } catch (err) {
            setError(`Error fetching user profile: ${err.message}`);
         } finally {
            setTimeout(() => setLoading(false), 1000);
         }
      };

      fetchUserProfile();
   }, []);

   // Function to render profile image with improved handling
   const renderProfileImage = () => {
      if (userDetails.picture) {
         // If it's a base64 string
         if (userDetails.picture.startsWith('data:image')) {
            return (
               <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9406E6] to-[#00FFFF] rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative w-36 h-36 rounded-full overflow-hidden">
                     <img src={userDetails.picture} alt="Profile" className="w-full h-full object-cover" />
                  </div>
               </div>
            );
         }

         // For bcrypt-generated paths (which aren't valid images)
         if (userDetails.picture.startsWith('$2b$')) {
            return (
               <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9406E6] to-[#00FFFF] rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[#9406E6] to-[#00FFFF] flex items-center justify-center">
                     <span className="text-white text-2xl font-bold">
                        {userDetails.username ? userDetails.username.charAt(0).toUpperCase() : '?'}
                     </span>
                  </div>
               </div>
            );
         }

         // If it's a URL (for backward compatibility or Google profile picture)
         return (
            <div className="relative group">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9406E6] to-[#00FFFF] rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-500"></div>
               <div className="relative w-36 h-36 rounded-full overflow-hidden">
                  <img
                     src={userDetails.picture}
                     alt="Profile"
                     className="w-full h-full object-cover"
                     onError={(e) => {
                        e.target.onerror = null;
                        // Fall back to first letter avatar
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `
                           <div class="w-full h-full rounded-full bg-gradient-to-br from-[#9406E6] to-[#00FFFF] flex items-center justify-center">
                              <span class="text-white text-2xl font-bold">
                                 ${userDetails.username ? userDetails.username.charAt(0).toUpperCase() : '?'}
                              </span>
                           </div>
                        `;
                     }}
                  />
               </div>
            </div>
         );
      }

      // Default placeholder
      return (
         <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9406E6] to-[#00FFFF] rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[#9406E6] to-[#00FFFF] flex items-center justify-center">
               <span className="text-white text-2xl font-bold">
                  {userDetails.username ? userDetails.username.charAt(0).toUpperCase() : '?'}
               </span>
            </div>
         </div>
      );
   };

   if (loading) {
      return (
         <div className="w-11/12 -mt-10 bg-gradient-to-br from-[#9406E6] to-[#00FFFF] p-4">
            <Header />
            <div className="container mx-auto p-6">
               <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
               </div>
            </div>
         </div>
      );
   }

   if (error) {
      return (
         <div className="w-11/12 -mt-10 bg-gradient-to-br from-[#9406E6] to-[#00FFFF] p-4">
            <Header />
            <div className="container mx-auto p-6">
               <div className="bg-red-500/20 backdrop-blur-sm border border-red-500 text-red-100 px-6 py-4 rounded-xl flex items-center">
                  <svg className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                  </svg>
                  {error}
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="w-11/12 -mt-10 bg-gradient-to-br from-[#9406E6] to-[#00FFFF] p-4">
         <Header />
         <div className="w-11/12 p-5 mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
               {/* Profile content */}
               <div className="relative px-6 py-6">
                  {/* Profile image */}
                  <div className="flex justify-center mb-6">{renderProfileImage()}</div>

                  {/* User info card */}
                  <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                     <h2 className="text-2xl font-bold text-white text-center mb-6">{userDetails.username}</h2>

                     <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 transition-all hover:bg-white/10">
                           <div className="bg-[#9406E6]/20 p-2 rounded-full">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-5 w-5 text-[#9406E6]"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                 />
                              </svg>
                           </div>
                           <div className="flex-1">
                              <div className="text-xs text-white/60 font-medium">Username</div>
                              <div className="text-white">{userDetails.username}</div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 transition-all hover:bg-white/10">
                           <div className="bg-[#00FFFF]/20 p-2 rounded-full">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-5 w-5 text-[#00FFFF]"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                 />
                              </svg>
                           </div>
                           <div className="flex-1">
                              <div className="text-xs text-white/60 font-medium">Email</div>
                              <div className="text-white break-all">{userDetails.email}</div>
                           </div>
                        </div>

                        {userDetails.gender && (
                           <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 transition-all hover:bg-white/10">
                              <div className="bg-purple-500/20 p-2 rounded-full">
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-purple-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                 </svg>
                              </div>
                              <div className="flex-1">
                                 <div className="text-xs text-white/60 font-medium">Gender</div>
                                 <div className="text-white">{userDetails.gender}</div>
                              </div>
                           </div>
                        )}

                        {userDetails.occupation && (
                           <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 transition-all hover:bg-white/10">
                              <div className="bg-blue-500/20 p-2 rounded-full">
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-blue-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                 </svg>
                              </div>
                              <div className="flex-1">
                                 <div className="text-xs text-white/60 font-medium">Occupation</div>
                                 <div className="text-white">{userDetails.occupation}</div>
                              </div>
                           </div>
                        )}

                        {userDetails.organization && (
                           <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 transition-all hover:bg-white/10">
                              <div className="bg-green-500/20 p-2 rounded-full">
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-green-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                 </svg>
                              </div>
                              <div className="flex-1">
                                 <div className="text-xs text-white/60 font-medium">Organization</div>
                                 <div className="text-white">{userDetails.organization}</div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

export default Profile;
