'use client';

import { useState } from 'react';
import { useAuth } from '../../app/context/AuthContext';
import { HiUser } from 'react-icons/hi';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function ChangeUsername() {
   const [newUsername, setNewUsername] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [success, setSuccess] = useState(false);
   const { token, updateUser, refreshUserData } = useAuth();

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
         const response = await fetch(`${BACKEND_URL}/api/users/update-username`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username: newUsername }),
         });

         if (!response.ok) {
            throw new Error('Failed to update username');
         }

         const data = await response.json();

         // Update the user context with new username
         updateUser({ username: newUsername });

         // Refresh user data from server
         await refreshUserData();

         setSuccess(true);
         setNewUsername('');
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <div className="flex items-center space-x-3 mb-4">
            <HiUser className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change Username</h2>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Username
               </label>
               <input
                  type="text"
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
               />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {success && <div className="text-green-500 text-sm">Username updated successfully!</div>}

            <button
               type="submit"
               disabled={loading}
               className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
               {loading ? 'Updating...' : 'Update Username'}
            </button>
         </form>
      </div>
   );
}

export default ChangeUsername;
