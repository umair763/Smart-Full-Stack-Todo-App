'use client';

import { useState } from 'react';
import { useAuth } from '../../app/context/AuthContext';
import { HiCamera } from 'react-icons/hi';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function ChangeProfileImage() {
   const [selectedFile, setSelectedFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [success, setSuccess] = useState(false);
   const { token, updateUser, refreshUserData } = useAuth();

   const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
         setSelectedFile(file);
         setPreviewUrl(URL.createObjectURL(file));
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedFile) return;

      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('profileImage', selectedFile);

      try {
         const response = await fetch(`${BACKEND_URL}/api/users/update-profile-image`, {
            method: 'PUT',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
         });

         if (!response.ok) {
            throw new Error('Failed to update profile image');
         }

         const data = await response.json();

         // Update the user context with new profile image
         updateUser({ profileImage: data.profileImage });

         // Refresh user data from server
         await refreshUserData();

         setSuccess(true);
         setSelectedFile(null);
         setPreviewUrl(null);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <div className="flex items-center space-x-3 mb-4">
            <HiCamera className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change Profile Image</h2>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Image
               </label>
               <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     dark:file:bg-blue-900 dark:file:text-blue-300
                     hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
               />
            </div>

            {previewUrl && (
               <div className="mt-2">
                  <img
                     src={previewUrl || '/placeholder.svg'}
                     alt="Preview"
                     className="w-32 h-32 object-cover rounded-full"
                  />
               </div>
            )}

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {success && <div className="text-green-500 text-sm">Profile image updated successfully!</div>}

            <button
               type="submit"
               disabled={loading || !selectedFile}
               className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
               {loading ? 'Updating...' : 'Update Profile Image'}
            </button>
         </form>
      </div>
   );
}

export default ChangeProfileImage;
