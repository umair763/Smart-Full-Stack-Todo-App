'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../app/context/AuthContext';
import { API_BASE_URL } from '../../config/env';

// Use the consistent API base URL
// const API_BASE_URL = API_URL || 'http://localhost:5000';

const ChangeUsername = () => {
   const [username, setUsername] = useState('');
   const [currentUsername, setCurrentUsername] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const { user } = useAuth();

   useEffect(() => {
      // Fetch current username
      const fetchUserProfile = async () => {
         try {
            const token = localStorage.getItem('token');
            if (!token) {
               throw new Error('Authentication required');
            }

            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
               method: 'GET',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
            });

            if (!response.ok) {
               throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();
            setCurrentUsername(data.username);
         } catch (err) {
            setError(err.message || 'Failed to fetch user profile');
         }
      };

      fetchUserProfile();
   }, []);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setSuccess('');

      if (!username.trim()) {
         setError('Username cannot be empty');
         setIsLoading(false);
         return;
      }

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/users/update-username`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update username');
         }

         setSuccess('Username updated successfully!');
         setCurrentUsername(username);
         setUsername('');
      } catch (err) {
         setError(err.message || 'Failed to update username');
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div>
         <h3 className="text-2xl font-bold text-white mb-6 font-proza">Change Username</h3>

         {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
         {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
         )}

         <div className="mb-6">
            <p className="text-white mb-2">
               Current Username: <span className="font-semibold">{currentUsername}</span>
            </p>
         </div>

         <form onSubmit={handleSubmit}>
            <div className="mb-6">
               <label htmlFor="username" className="block text-white font-medium mb-2">
                  New Username
               </label>
               <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter new username"
               />
            </div>

            <button
               type="submit"
               disabled={isLoading}
               className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
               }`}
            >
               {isLoading ? 'Updating...' : 'Update Username'}
            </button>
         </form>
      </div>
   );
};

export default ChangeUsername;
