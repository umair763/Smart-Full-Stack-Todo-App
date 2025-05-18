'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../layout/Header';
import ChangeProfileImage from '../../components/settings/ChangeProfileImage';
import ChangeUsername from '../../components/settings/ChangeUsername';
import DeleteAccount from '../../components/settings/DeleteAccount';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Settings() {
   const navigate = useNavigate();
   const { logout } = useAuth();
   const [activeTab, setActiveTab] = useState('profile');
   const [username, setUsername] = useState('');
   const [profileImage, setProfileImage] = useState(null);
   const [userDetails, setUserDetails] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   // Fetch user details
   useState(() => {
      const fetchUserProfile = async () => {
         try {
            const token = localStorage.getItem('token');
            if (!token) {
               navigate('/');
               return;
            }

            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
               method: 'GET',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               credentials: 'include',
            });

            if (!response.ok) {
               throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            setUserDetails(data);
            setUsername(data.username);
         } catch (err) {
            setError('Error loading profile. Please try again.');
            console.error(err);
         } finally {
            setLoading(false);
         }
      };

      fetchUserProfile();
   }, []);

   // Handle profile image upload
   const handleImageUpload = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      if (!profileImage) {
         setError('Please select an image');
         return;
      }

      const formData = new FormData();
      formData.append('picture', profileImage);

      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/users/update-profile-image`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
            credentials: 'include',
         });

         if (!response.ok) {
            throw new Error('Failed to update profile image');
         }

         setSuccess('Profile image updated successfully');
         // Refresh page after successful update
         setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
         setError('Error updating profile image. Please try again.');
         console.error(err);
      }
   };

   // Handle username update
   const handleUsernameUpdate = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      if (!username) {
         setError('Username cannot be empty');
         return;
      }

      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/users/update-username`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username }),
            credentials: 'include',
         });

         if (!response.ok) {
            throw new Error('Failed to update username');
         }

         setSuccess('Username updated successfully');
      } catch (err) {
         setError('Error updating username. Please try again.');
         console.error(err);
      }
   };

   // Handle account deletion
   const handleDeleteAccount = async () => {
      if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
         return;
      }

      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_BASE_URL}/api/users/delete-account`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            credentials: 'include',
         });

         if (!response.ok) {
            throw new Error('Failed to delete account');
         }

         logout();
         navigate('/');
      } catch (err) {
         setError('Error deleting account. Please try again.');
         console.error(err);
      }
   };

   // Return to dashboard
   const handleBackToDashboard = () => {
      navigate('/dashboard');
   };

   if (loading) {
      return (
         <div className="w-11/12 p-5 rounded-xl shadow-lg bg-gradient-to-br from-[#9406E6] to-[#00FFFF] grid grid-cols-1 gap-4">
            <div className="flex items-center justify-center h-96">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
         </div>
      );
   }

   return (
      <div className="w-full max-w-screen-xl p-4 mx-auto rounded-xl shadow-lg bg-gradient-to-br from-[#9406E6] to-[#00FFFF] flex flex-col gap-6">
         {/* Header with back button */}
         <div className="flex items-center mb-6">
            <button
               onClick={handleBackToDashboard}
               className="flex items-center text-white hover:text-gray-200 transition-colors"
            >
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
               Back to Dashboard
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-[250px,1fr] gap-6">
            {/* Sidebar */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 max-w-xs w-full">
               <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
               <ul className="space-y-2">
                  <li>
                     <button
                        className={`w-full text-left px-4 py-2 rounded-lg text-white ${
                           activeTab === 'profile' ? 'bg-white/30' : 'hover:bg-white/10'
                        }`}
                        onClick={() => setActiveTab('profile')}
                     >
                        Change Profile Image
                     </button>
                  </li>
                  <li>
                     <button
                        className={`w-full text-left px-4 py-2 rounded-lg text-white ${
                           activeTab === 'username' ? 'bg-white/30' : 'hover:bg-white/10'
                        }`}
                        onClick={() => setActiveTab('username')}
                     >
                        Change Username
                     </button>
                  </li>
                  <li>
                     <button
                        className={`w-full text-left px-4 py-2 rounded-lg text-white ${
                           activeTab === 'delete' ? 'bg-white/30' : 'hover:bg-white/10'
                        }`}
                        onClick={() => setActiveTab('delete')}
                     >
                        Delete Account
                     </button>
                  </li>
               </ul>
            </div>

            {/* Content Area */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 flex-1">
               {error && <div className="bg-red-500/80 text-white p-3 rounded-lg mb-4">{error}</div>}
               {success && <div className="bg-green-500/80 text-white p-3 rounded-lg mb-4">{success}</div>}

               {activeTab === 'profile' && (
                  <div>
                     <h3 className="text-xl font-bold text-white mb-4">Change Profile Image</h3>
                     <div className="flex flex-col items-center mb-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-white/30 mb-4">
                           {userDetails?.picture ? (
                              <img src={userDetails.picture} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                                 {userDetails?.username?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                           )}
                        </div>
                     </div>
                     <form onSubmit={handleImageUpload} className="space-y-4">
                        <div>
                           <label className="block text-white mb-2">Select new image</label>
                           <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setProfileImage(e.target.files[0])}
                              className="bg-white/20 text-white p-2 rounded-lg w-full"
                           />
                        </div>
                        <button
                           type="submit"
                           className="px-4 py-2 bg-[#9406E6] text-white rounded-lg hover:bg-[#7d05c3] transition-colors"
                        >
                           Update Profile Image
                        </button>
                     </form>
                  </div>
               )}

               {activeTab === 'username' && (
                  <div>
                     <h3 className="text-xl font-bold text-white mb-4">Change Username</h3>
                     <form onSubmit={handleUsernameUpdate} className="space-y-4">
                        <div>
                           <label className="block text-white mb-2">New Username</label>
                           <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="bg-white/20 text-white p-2 rounded-lg w-full"
                              placeholder="Enter new username"
                           />
                        </div>
                        <button
                           type="submit"
                           className="px-4 py-2 bg-[#9406E6] text-white rounded-lg hover:bg-[#7d05c3] transition-colors"
                        >
                           Update Username
                        </button>
                     </form>
                  </div>
               )}

               {activeTab === 'delete' && (
                  <div>
                     <h3 className="text-xl font-bold text-white mb-4">Delete Account</h3>
                     <p className="text-white mb-6">
                        Warning: This action will permanently delete your account and all your data. This cannot be
                        undone.
                     </p>
                     <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                     >
                        Delete My Account
                     </button>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
    
}

export default Settings;
