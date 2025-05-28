'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../../app/context/AuthContext';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChangeProfileImage = () => {
   const [selectedFile, setSelectedFile] = useState(null);
   const [previewUrl, setPreviewUrl] = useState(null);
   const [isUploading, setIsUploading] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const fileInputRef = useRef(null);
   const { user } = useAuth();

   const handleFileChange = (e) => {
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

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
   };

   const handleUpload = async () => {
      if (!selectedFile) {
         setError('Please select an image first');
         return;
      }

      setIsUploading(true);
      setError('');
      setSuccess('');

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const formData = new FormData();
         formData.append('picture', selectedFile);

         const response = await fetch(`${API_BASE_URL}/api/users/update-profile-image`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile image');
         }

         setSuccess('Profile image updated successfully!');
         // Clear the selected file
         setSelectedFile(null);
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
         }
      } catch (err) {
         setError(err.message || 'Failed to update profile image');
      } finally {
         setIsUploading(false);
      }
   };

   return (
      <div>
         <h3 className="text-2xl font-bold text-white mb-6 font-proza">Change Profile Image</h3>

         {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
         {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
         )}

         <div className="mb-6 flex justify-center">
            {previewUrl ? (
               <img
                  src={previewUrl || '/placeholder.svg'}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white"
               />
            ) : (
               <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white">
                  <span className="text-gray-500">No Image</span>
               </div>
            )}
         </div>

         <div className="mb-6">
            <label className="block text-white font-medium mb-2">Select Image</label>
            <input
               type="file"
               ref={fileInputRef}
               onChange={handleFileChange}
               accept="image/*"
               className="block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
         </div>

         <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors ${
               isUploading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
            }`}
         >
            {isUploading ? 'Uploading...' : 'Upload Image'}
         </button>
      </div>
   );
};

export default ChangeProfileImage;
