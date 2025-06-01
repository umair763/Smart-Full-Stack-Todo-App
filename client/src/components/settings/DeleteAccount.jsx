'use client';

import React, { useState } from 'react';
import { useAuth } from '../../app/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiExclamation } from 'react-icons/hi';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function DeleteAccount() {
   const [isDeleting, setIsDeleting] = useState(false);
   const [error, setError] = useState(null);
   const { token, logout } = useAuth();
   const navigate = useNavigate();

   const handleDeleteAccount = async () => {
      if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
         return;
      }

      setIsDeleting(true);
      setError(null);

      try {
         const response = await fetch(`${BACKEND_URL}/api/users/account`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete account');
         }

         await logout();
         navigate('/login');
      } catch (err) {
         setError(err.message);
      } finally {
         setIsDeleting(false);
      }
   };

   return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <div className="flex items-center space-x-3 mb-4">
            <HiExclamation className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Account</h2>
         </div>

         <p className="text-gray-600 dark:text-gray-300 mb-4">
            Once you delete your account, there is no going back. Please be certain.
         </p>

         {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

         <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
         >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
         </button>
      </div>
   );
}

export default DeleteAccount;
