'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import DeleteAccountModal from '../DeleteAccountModal';
import { API_BASE_URL } from '../../config/env';

function DeleteAccount() {
   const [error, setError] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const navigate = useNavigate();
   const { logout } = useAuth();

   const handleOpenModal = () => {
      setIsModalOpen(true);
      setError('');
   };

   const handleCloseModal = () => {
      if (!isDeleting) {
         setIsModalOpen(false);
         setError('');
      }
   };

   const handleDeleteAccount = async () => {
      setIsDeleting(true);
      setError('');

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('No authentication token found');
         }

         const response = await fetch(`${API_BASE_URL}/api/users/account`, {
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

         // Redirect to landing page using React Router
         navigate('/', { replace: true });

         // Also force a page reload to ensure complete cleanup
         setTimeout(() => {
            window.location.href = '/';
         }, 100);
      } catch (err) {
         console.error('Delete account error:', err);
         setError(err.message || 'An error occurred while deleting your account');
         setIsDeleting(false);
      }
   };

   return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
         <div className="flex items-center mb-4">
            <div className="bg-red-500/20 p-3 rounded-full mr-4">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
               </svg>
            </div>
            <h3 className="text-xl font-bold text-white font-proza">Delete Account</h3>
         </div>

         {error && (
            <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 border border-red-500/30">
               <p className="text-sm font-medium">Error:</p>
               <p className="text-sm">{error}</p>
            </div>
         )}

         <div className="mb-6">
            <p className="text-white/80 mb-4">
               Deleting your account will permanently remove all your data, including:
            </p>
            <ul className="text-white/70 text-sm space-y-1 ml-4 mb-4">
               <li>• Your account and profile information</li>
               <li>• All tasks, subtasks, and dependencies</li>
               <li>• All notes and file attachments</li>
               <li>• All reminders and notifications</li>
               <li>• All productivity data and streak records</li>
            </ul>
            <p className="text-red-300 text-sm font-medium">
               ⚠️ This action cannot be undone and all data will be permanently lost.
            </p>
         </div>

         <button
            onClick={handleOpenModal}
            disabled={isDeleting}
            className={`w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 ${
               isDeleting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98] hover:from-red-700 hover:to-pink-700'
            }`}
         >
            {isDeleting ? 'Processing...' : 'Delete Account'}
         </button>

         {/* Custom Delete Account Modal */}
         <DeleteAccountModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onConfirm={handleDeleteAccount}
            isDeleting={isDeleting}
         />
      </div>
   );
}

export default DeleteAccount;
