'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ChangeProfileImage from '../../components/settings/ChangeProfileImage';
import ChangeUsername from '../../components/settings/ChangeUsername';
import DeleteAccount from '../../components/settings/DeleteAccount';
import {
   FiUser,
   FiEdit3,
   FiTrash2,
   FiBell,
   FiMoon,
   FiSun,
   FiDatabase,
   FiLogOut,
   FiChevronRight,
   FiCheck,
   FiDownload,
   FiUpload,
   FiMonitor,
} from 'react-icons/fi';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import { API_URL } from '../../config/env';

// Tab configuration with icons and colors
const tabs = [
   {
      id: 'account',
      label: 'Account Details',
      icon: FiUser,
      gradient: 'from-purple-500 to-indigo-600',
      description: 'Profile image, username and personal info',
   },
   {
      id: 'theme',
      label: 'Appearance',
      icon: FiMoon,
      gradient: 'from-orange-500 to-red-600',
      description: 'Customize theme and visual preferences',
   },
   {
      id: 'data',
      label: 'Data Management',
      icon: FiDatabase,
      gradient: 'from-indigo-500 to-purple-600',
      description: 'Export, import, and manage your data',
   },
   {
      id: 'delete',
      label: 'Danger Zone',
      icon: FiTrash2,
      gradient: 'from-red-500 to-pink-600',
      description: 'Delete account and sensitive operations',
   },
];

function Settings() {
   const { logout } = useAuth();
   const { theme, changeTheme, themes, isDark, actualTheme } = useTheme();
   const [activeTab, setActiveTab] = useState('account');
   const [tabAnimating, setTabAnimating] = useState(false);
   const [username, setUsername] = useState('');
   const [profileImage, setProfileImage] = useState(null);
   const [userDetails, setUserDetails] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   // Settings states
   const [exportLoading, setExportLoading] = useState(false);
   const [importLoading, setImportLoading] = useState(false);

   // Delete account modal states
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);

   // Smooth tab transition handler
   const handleTabChange = (newTab) => {
      if (newTab === activeTab) return;

      setTabAnimating(true);
      setTimeout(() => {
         setActiveTab(newTab);
         setTimeout(() => setTabAnimating(false), 50);
      }, 150);
   };

   // Fetch user details
   useEffect(() => {
      const fetchUserProfile = async () => {
         try {
            const token = localStorage.getItem('token');
            if (!token) {
               return;
            }

            const response = await fetch(`${API_URL}/api/users/profile`, {
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
         const response = await fetch(`${API_URL}/api/users/profile-image`, {
            method: 'PUT',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
            credentials: 'include',
         });

         if (!response.ok) {
            throw new Error('Failed to update profile image');
         }

         const data = await response.json();
         setSuccess('Profile image updated successfully');

         // Update user details with new image
         setUserDetails(data.user);

         // Clear the file input
         setProfileImage(null);

         // Reset the file input field
         const fileInput = e.target.form.querySelector('input[type="file"]');
         if (fileInput) {
            fileInput.value = '';
         }
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
         const response = await fetch(`${API_URL}/api/users/username`, {
            method: 'PUT',
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

         const data = await response.json();
         setSuccess('Username updated successfully');

         // Update user details with new username
         setUserDetails(data.user);
      } catch (err) {
         setError('Error updating username. Please try again.');
         console.error(err);
      }
   };

   // Handle theme change
   const handleThemeChange = (newTheme) => {
      changeTheme(newTheme);
      setSuccess('Theme updated successfully');
      setTimeout(() => setSuccess(''), 2000);
   };

   // Handle data export
   const handleDataExport = async () => {
      setExportLoading(true);
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_URL}/api/users/export-data`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to export data');
         }

         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `todo-data-${new Date().toISOString().split('T')[0]}.json`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         window.URL.revokeObjectURL(url);

         setSuccess('Data exported successfully');
      } catch (err) {
         setError('Failed to export data');
      } finally {
         setExportLoading(false);
      }
   };

   // Handle account deletion
   const handleOpenDeleteModal = () => {
      setIsDeleteModalOpen(true);
      setError('');
   };

   const handleCloseDeleteModal = () => {
      if (!isDeleting) {
         setIsDeleteModalOpen(false);
         setError('');
      }
   };

   const handleDeleteAccount = async () => {
      setIsDeleting(true);
      setError('');

      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${API_URL}/api/users/account`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete account');
         }

         const result = await response.json();
         console.log('Account deletion successful:', result);

         // Successfully deleted account, now logout and redirect to landing page
         logout();

         // Clear all local storage
         localStorage.clear();

         // Redirect to landing page
         window.location.href = '/';
      } catch (err) {
         console.error('Delete account error:', err);
         setError(err.message || 'An error occurred while deleting your account');
         setIsDeleting(false);
      }
   };

   if (loading) {
      return (
         <div className="w-full h-screen mx-auto p-4 rounded-xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
            <div className="relative">
               <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20"></div>
               <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white absolute top-0 left-0"></div>
               <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-lg opacity-30 animate-pulse"></div>
            </div>
         </div>
      );
   }

   return (
      <div className="w-11/12 h-[90vh] p-6 mx-auto bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-pink-900/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 flex flex-col overflow-hidden rounded-xl">
         <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Enhanced Sidebar */}
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-white/10 flex flex-col overflow-hidden">
               <div className="mb-4 flex-shrink-0">
                  <h2 className="text-lg font-bold text-white mb-1">Settings</h2>
                  <p className="text-white/70 text-sm">Customize your experience</p>
               </div>

               <div className="space-y-2 flex-shrink-0">
                  {tabs.map((tab) => {
                     const Icon = tab.icon;
                     const isActive = activeTab === tab.id;

                     return (
                        <button
                           key={tab.id}
                           onClick={() => handleTabChange(tab.id)}
                           className={`group w-full text-left p-3 rounded-lg transition-all duration-300 ${
                              isActive
                                 ? `bg-gradient-to-r ${tab.gradient} shadow-lg`
                                 : 'hover:bg-white/10 dark:hover:bg-white/5'
                           }`}
                        >
                           <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-white/20">
                                 <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                 <div className="font-medium text-sm text-white">{tab.label}</div>
                                 <div className="text-xs text-white/70 line-clamp-1 leading-relaxed">
                                    {tab.description}
                                 </div>
                              </div>
                           </div>
                        </button>
                     );
                  })}
               </div>

               {/* Enhanced Logout */}
               <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/10 flex-shrink-0">
                  <button
                     onClick={logout}
                     className="group w-full text-left p-3 rounded-lg text-white bg-red-500/20 hover:bg-red-500/30 transition-all duration-300 flex items-center space-x-3"
                  >
                     <div className="p-2 rounded-lg bg-red-500/20">
                        <FiLogOut className="h-4 w-4" />
                     </div>
                     <span className="font-medium text-sm">Logout</span>
                  </button>
               </div>
            </div>

            {/* Enhanced Content Area */}
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/10 flex flex-col overflow-hidden min-h-0">
               {/* Enhanced Notifications */}
               {(error || success) && (
                  <div className="p-4 flex-shrink-0">
                     {error && (
                        <div className="bg-red-500/90 text-white p-3 rounded-lg text-sm border border-red-400/50">
                           {error}
                        </div>
                     )}
                     {success && (
                        <div className="bg-green-500/90 text-white p-3 rounded-lg text-sm border border-green-400/50">
                           {success}
                        </div>
                     )}
                  </div>
               )}

               {/* Enhanced Tab Content */}
               <div className="flex-1 p-6 overflow-hidden min-h-0">
                  <div className={`transition-all duration-300 h-full ${tabAnimating ? 'opacity-0' : 'opacity-100'}`}>
                     {/* Enhanced Account Details Tab */}
                     {activeTab === 'account' && (
                        <div className="h-full flex flex-col">
                           <div className="flex items-center space-x-3 mb-0 flex-shrink-0">
                              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600">
                                 <FiUser className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-white">Account Details</h3>
                                 <p className="text-white/70 text-sm">Manage your profile image and username</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                              {/* Enhanced Profile Section */}
                              <div className="bg-white/5 dark:bg-white/3 rounded-xl p-6 border border-white/10 dark:border-white/5">
                                 <div className="flex flex-col items-center mb-6">
                                    <div className="relative group">
                                       <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-600 mb-4 border-4 border-white/20 group-hover:border-white/40 transition-all duration-300">
                                          {userDetails?.picture || userDetails?.profileImage ? (
                                             <img
                                                src={userDetails.picture || userDetails.profileImage}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                             />
                                          ) : (
                                             <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                                {userDetails?.username?.charAt(0)?.toUpperCase() || '?'}
                                             </div>
                                          )}
                                       </div>
                                       <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/20 to-indigo-600/20 blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                    </div>
                                    <h4 className="text-lg font-semibold text-white mb-2">{userDetails?.username}</h4>
                                    <p className="text-white/60 text-sm">{userDetails?.email}</p>
                                 </div>

                                 <form onSubmit={handleImageUpload} className="space-y-4">
                                    <div>
                                       <label className="block text-white font-medium mb-3 text-sm">
                                          Select new profile image
                                       </label>
                                       <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => setProfileImage(e.target.files[0])}
                                          className="bg-white/10 dark:bg-white/5 text-white p-3 rounded-lg w-full border border-white/20 dark:border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-purple-500 file:text-white text-sm"
                                       />
                                    </div>
                                    <button
                                       type="submit"
                                       className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 font-medium text-sm"
                                    >
                                       <FiUpload className="h-4 w-4 inline mr-2" />
                                       Update Profile Image
                                    </button>
                                 </form>
                              </div>

                              {/* Enhanced Username Section */}
                              <div className="bg-white/5 dark:bg-white/3 rounded-xl p-6 border border-white/10 dark:border-white/5">
                                 <h4 className="text-white font-semibold mb-6 text-lg">Username Settings</h4>
                                 <form onSubmit={handleUsernameUpdate} className="space-y-4">
                                    <div>
                                       <label className="block text-white font-medium mb-3 text-sm">Username</label>
                                       <input
                                          type="text"
                                          value={username}
                                          onChange={(e) => setUsername(e.target.value)}
                                          className="bg-white/10 dark:bg-white/5 text-white p-3 rounded-lg w-full border border-white/20 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 placeholder-white/50 text-sm"
                                          placeholder="Enter new username"
                                       />
                                    </div>
                                    <button
                                       type="submit"
                                       className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 font-medium text-sm"
                                    >
                                       <FiCheck className="h-4 w-4 inline mr-2" />
                                       Update Username
                                    </button>
                                 </form>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Enhanced Theme Tab */}
                     {activeTab === 'theme' && (
                        <div className="h-full flex flex-col">
                           <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
                              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600">
                                 <FiMoon className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-white">Appearance</h3>
                                 <p className="text-white/70 text-sm">Customize your theme preferences</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0">
                              {[
                                 {
                                    id: themes.LIGHT,
                                    label: 'Light Mode',
                                    icon: FiSun,
                                    gradient: 'from-yellow-400 to-orange-500',
                                    description: 'Clean bright interface',
                                 },
                                 {
                                    id: themes.DARK,
                                    label: 'Dark Mode',
                                    icon: FiMoon,
                                    gradient: 'from-gray-700 to-gray-900',
                                    description: 'Easy on the eyes',
                                 },
                                 {
                                    id: themes.SYSTEM,
                                    label: 'System',
                                    icon: FiMonitor,
                                    gradient: 'from-blue-500 to-purple-600',
                                    description: 'Match system preference',
                                 },
                              ].map((themeOption) => {
                                 const Icon = themeOption.icon;
                                 const isSelected = theme === themeOption.id;

                                 return (
                                    <button
                                       key={themeOption.id}
                                       onClick={() => handleThemeChange(themeOption.id)}
                                       className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                                          isSelected
                                             ? `border-white/50 bg-gradient-to-br ${themeOption.gradient}`
                                             : 'border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/3 hover:border-white/30'
                                       }`}
                                    >
                                       <div className="flex flex-col items-center space-y-3">
                                          <div className="p-3 rounded-lg bg-white/20">
                                             <Icon className="h-6 w-6 text-white" />
                                          </div>
                                          <div className="text-center">
                                             <span className="text-white font-medium text-sm block">
                                                {themeOption.label}
                                             </span>
                                             <span className="text-white/60 text-xs">{themeOption.description}</span>
                                          </div>
                                          {isSelected && (
                                             <div className="absolute top-3 right-3">
                                                <FiCheck className="h-5 w-5 text-white" />
                                             </div>
                                          )}
                                       </div>
                                    </button>
                                 );
                              })}
                           </div>

                           {/* Current Theme Info */}
                           <div className="mt-6 p-4 bg-white/5 dark:bg-white/3 rounded-lg border border-white/10 dark:border-white/5 flex-shrink-0">
                              <div className="flex items-center space-x-3">
                                 <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                                    {actualTheme === 'dark' ? (
                                       <FiMoon className="h-4 w-4 text-white" />
                                    ) : (
                                       <FiSun className="h-4 w-4 text-white" />
                                    )}
                                 </div>
                                 <div>
                                    <p className="text-white font-medium text-sm">
                                       Current Theme: <span className="capitalize">{actualTheme}</span>
                                    </p>
                                    <p className="text-white/60 text-xs">
                                       {theme === themes.SYSTEM
                                          ? `Following system preference (${actualTheme})`
                                          : `Manually selected ${theme} theme`}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Enhanced Data Management Tab */}
                     {activeTab === 'data' && (
                        <div className="h-full flex flex-col">
                           <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
                              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">
                                 <FiDatabase className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-white">Data Management</h3>
                                 <p className="text-white/70 text-sm">Export and import your data</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                              <div className="bg-white/5 dark:bg-white/3 rounded-xl p-6 border border-white/10 dark:border-white/5">
                                 <h4 className="text-white font-semibold mb-3 text-lg">Export Data</h4>
                                 <p className="text-white/70 text-sm mb-6">
                                    Download all your tasks, notes, and settings as a JSON file
                                 </p>
                                 <button
                                    onClick={handleDataExport}
                                    disabled={exportLoading}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 font-medium text-sm"
                                 >
                                    <FiDownload className="h-4 w-4 inline mr-2" />
                                    {exportLoading ? 'Exporting...' : 'Export Data'}
                                 </button>
                              </div>

                              <div className="bg-white/5 dark:bg-white/3 rounded-xl p-6 border border-white/10 dark:border-white/5">
                                 <h4 className="text-white font-semibold mb-3 text-lg">Import Data</h4>
                                 <p className="text-white/70 text-sm mb-6">
                                    Upload a previously exported JSON file to restore your data
                                 </p>
                                 <div className="space-y-3">
                                    <input
                                       type="file"
                                       accept=".json"
                                       className="bg-white/10 dark:bg-white/5 text-white p-3 rounded-lg w-full border border-white/20 dark:border-white/10 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-purple-500 file:text-white text-sm"
                                    />
                                    <button
                                       disabled={importLoading}
                                       className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 font-medium text-sm"
                                    >
                                       <FiUpload className="h-4 w-4 inline mr-2" />
                                       {importLoading ? 'Importing...' : 'Import Data'}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Enhanced Delete Account Tab */}
                     {activeTab === 'delete' && (
                        <div className="h-full flex flex-col">
                           <div className="flex items-center space-x-3 mb-0 flex-shrink-0">
                              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600">
                                 <FiTrash2 className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-white">Danger Zone</h3>
                                 <p className="text-white/70 text-sm">Permanent account deletion</p>
                              </div>
                           </div>

                           <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30 flex-shrink-0">
                              <div className="flex items-start space-x-4 mb-6">
                                 <FiTrash2 className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                                 <div className="flex-1 min-w-0">
                                    <h4 className="text-red-300 font-semibold mb-3 text-lg">Delete Account</h4>
                                    <p className="text-red-200/80 text-sm mb-4">
                                       This action will permanently delete your account and all associated data
                                       including:
                                    </p>
                                    <ul className="text-red-200/70 text-sm space-y-1 mb-6 list-disc list-inside">
                                       <li>All tasks and subtasks</li>
                                       <li>Notes and attachments</li>
                                       <li>Reminders and notifications</li>
                                       <li>Dependencies and relationships</li>
                                       <li>Profile information and settings</li>
                                    </ul>
                                    <div className="bg-red-600/20 p-4 rounded-lg border border-red-500/30 mb-2">
                                       <p className="text-red-200 text-sm font-medium">
                                          ⚠️ This action cannot be undone. Please export your data first if you want to
                                          keep it.
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              <button
                                 onClick={handleOpenDeleteModal}
                                 className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-medium text-sm"
                              >
                                 <FiTrash2 className="h-4 w-4 inline mr-2" />
                                 Delete My Account Forever
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
         {/* Custom Delete Account Modal */}
         <DeleteAccountModal
            isOpen={isDeleteModalOpen}
            onClose={handleCloseDeleteModal}
            onConfirm={handleDeleteAccount}
            isDeleting={isDeleting}
         />
      </div>
   );
}

export default Settings;
