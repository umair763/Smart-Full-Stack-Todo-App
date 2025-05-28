import { useState } from 'react';
import { HiExclamation, HiX } from 'react-icons/hi';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
   const [confirmText, setConfirmText] = useState('');
   const [isConfirmValid, setIsConfirmValid] = useState(false);

   const handleConfirmTextChange = (e) => {
      const value = e.target.value;
      setConfirmText(value);
      setIsConfirmValid(value === 'DELETE');
   };

   const handleConfirm = () => {
      if (isConfirmValid) {
         onConfirm();
      }
   };

   const handleClose = () => {
      if (!isDeleting) {
         setConfirmText('');
         setIsConfirmValid(false);
         onClose();
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                     <HiExclamation className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 font-proza">Delete Account</h3>
               </div>
               {!isDeleting && (
                  <button
                     onClick={handleClose}
                     className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                     <HiX className="h-5 w-5" />
                  </button>
               )}
            </div>

            {/* Content */}
            <div className="p-6">
               <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 font-proza">Are you absolutely sure?</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                     <p className="text-red-800 text-sm font-medium mb-2">
                        This action cannot be undone. This will permanently delete:
                     </p>
                     <ul className="text-red-700 text-sm space-y-1 ml-4">
                        <li>• Your account and profile information</li>
                        <li>• All your tasks and subtasks</li>
                        <li>• All notes and attachments</li>
                        <li>• All dependencies and reminders</li>
                        <li>• All notifications and settings</li>
                        <li>• All productivity data and streaks</li>
                     </ul>
                  </div>
                  <p className="text-gray-600 text-sm">
                     Please type <span className="font-semibold text-red-600">DELETE</span> to confirm:
                  </p>
               </div>

               {/* Confirmation Input */}
               <div className="mb-6">
                  <input
                     type="text"
                     value={confirmText}
                     onChange={handleConfirmTextChange}
                     placeholder="Type DELETE to confirm"
                     disabled={isDeleting}
                     className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        isConfirmValid
                           ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                           : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                     } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {confirmText && !isConfirmValid && (
                     <p className="text-red-500 text-sm mt-2">Please type "DELETE" exactly as shown</p>
                  )}
               </div>

               {/* Action Buttons */}
               <div className="flex flex-col space-y-3">
                  <button
                     onClick={handleConfirm}
                     disabled={!isConfirmValid || isDeleting}
                     className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        isConfirmValid && !isDeleting
                           ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25 active:scale-[0.98]'
                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                           Deleting Account...
                        </span>
                     ) : (
                        'Delete My Account Permanently'
                     )}
                  </button>
                  <button
                     onClick={handleClose}
                     disabled={isDeleting}
                     className={`w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] ${
                        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                     }`}
                  >
                     Cancel
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default DeleteAccountModal;
