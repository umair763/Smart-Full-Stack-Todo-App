'use client';

import { useState } from 'react';
import { useAuth } from '../../app/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DeleteAccount = () => {
   const [isDeleting, setIsDeleting] = useState(false);
   const [error, setError] = useState('');
   const [confirmText, setConfirmText] = useState('');
   const { logout } = useAuth();
   const navigate = useNavigate();

   const handleDeleteAccount = async () => {
      if (confirmText !== 'DELETE') {
         setError('Please type "DELETE" to confirm');
         return;
      }

      setIsDeleting(true);
      setError('');

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/users/delete-account`, {
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

         // Logout and redirect to login page
         logout();
         navigate('/');
      } catch (err) {
         setError(err.message || 'Failed to delete account');
         setIsDeleting(false);
      }
   };

   return (
      <div>
         <h3 className="text-2xl font-bold text-white mb-6">Delete Account</h3>

         {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

         <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">Warning: This action cannot be undone.</p>
            <p className="text-red-700 mt-2">
               Deleting your account will permanently remove all your data, including tasks and profile information.
            </p>
         </div>

         <div className="mb-6">
            <label htmlFor="confirm" className="block text-white font-medium mb-2">
               Type "DELETE" to confirm
            </label>
            <input
               type="text"
               id="confirm"
               value={confirmText}
               onChange={(e) => setConfirmText(e.target.value)}
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
               placeholder='Type "DELETE" here'
            />
         </div>

         <button
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmText !== 'DELETE'}
            className={`w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors ${
               isDeleting || confirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
         >
            {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
         </button>
      </div>
   );
};

export default DeleteAccount;
