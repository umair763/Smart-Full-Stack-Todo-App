'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DeleteAccount() {
   const [error, setError] = useState('');
   const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const navigate = useNavigate();
   const { logout } = useAuth();

   const handleOpenConfirmModal = () => {
      setIsConfirmModalOpen(true);
   };

   const handleCloseConfirmModal = () => {
      setIsConfirmModalOpen(false);
   };

   const handleDeleteAccount = async () => {
      setIsDeleting(true);
      setError('');

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('No authentication token found');
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

         // Successfully deleted account, now logout and redirect
         logout();
         navigate('/auth/login', { replace: true });
      } catch (err) {
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
            <h3 className="text-xl font-bold text-white">Delete Account</h3>
         </div>

         {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4">{error}</div>}

         <p className="text-white/80 mb-6">
            Deleting your account will permanently remove all your data, including tasks and personal information. This
            action cannot be undone.
         </p>

         <button
            onClick={handleOpenConfirmModal}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98] transition-all"
         >
            Delete Account
         </button>

         {/* Confirmation Modal */}
         {isConfirmModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
               <div className="bg-white rounded-xl p-6 max-w-md mx-4 animate-fadeIn">
                  <div className="text-center mb-6">
                     <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-8 w-8 text-red-600"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                           />
                        </svg>
                     </div>
                     <h3 className="text-xl font-bold text-gray-800">Confirm Account Deletion</h3>
                     <p className="text-gray-600 mt-2">
                        This will permanently delete your account and all associated data. This action cannot be undone.
                     </p>
                  </div>

                  <div className="flex flex-col space-y-3">
                     <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className={`py-3 bg-red-600 text-white font-semibold rounded-lg transition-all ${
                           isDeleting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-700 active:scale-[0.98]'
                        }`}
                     >
                        {isDeleting ? (
                           <span className="flex items-center justify-center">
                              <svg
                                 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                 xmlns="http://www.w3.org/2000/svg"
                                 fill="none"
                                 viewBox="0 0 24 24"
                              >
                                 <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                 ></circle>
                                 <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                 ></path>
                              </svg>
                              Deleting...
                           </span>
                        ) : (
                           'Yes, Delete My Account'
                        )}
                     </button>
                     <button
                        onClick={handleCloseConfirmModal}
                        disabled={isDeleting}
                        className={`py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg transition-all ${
                           isDeleting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-300 active:scale-[0.98]'
                        }`}
                     >
                        Cancel
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

export default DeleteAccount;
