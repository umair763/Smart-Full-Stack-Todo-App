'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/context/AuthContext';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function UserProfile({ onLogout }) {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const { token } = useAuth();
   const navigate = useNavigate();

   useEffect(() => {
      if (!token) {
         navigate('/login');
         return;
      }

      fetchUserProfile();
   }, [token]);

   const fetchUserProfile = async () => {
      try {
         const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch user profile');
         }

         const data = await response.json();
         setUser(data);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   if (loading) {
      return <div>Loading...</div>;
   }

   if (error) {
      return <div>Error: {error}</div>;
   }

   return (
      <div className="relative">
         <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
         >
            {user?.profileImage ? (
               <img src={user.profileImage} alt={user.username} className="w-8 h-8 rounded-full" />
            ) : (
               <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                     {user?.username?.charAt(0).toUpperCase()}
                  </span>
               </div>
            )}
            <span className="text-sm font-medium">{user?.username}</span>
         </button>

         {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
               <button
                  onClick={() => {
                     navigate('/settings');
                     setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
               >
                  Settings
               </button>
               <button
                  onClick={() => {
                     onLogout();
                     setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
               >
                  Logout
               </button>
            </div>
         )}
      </div>
   );
}

export default UserProfile;
