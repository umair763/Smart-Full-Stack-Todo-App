import { createPortal } from 'react-dom';
import { HiExclamation, HiX } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const DeleteTaskModal = ({ isOpen, onClose, onConfirm, isDeleting, taskName }) => {
   if (!isOpen) return null;

   const handleConfirm = () => {
      onConfirm();
   };

   const handleClose = () => {
      if (!isDeleting) {
         onClose();
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && !isDeleting) {
         onClose();
      }
   };

   const modalContent = (
      <div
         className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4"
         style={{
            animation: 'modalBackdropFadeIn 0.3s ease-out forwards',
         }}
         onClick={handleBackdropClick}
      >
         <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out"
            style={{
               animation: 'modalSlideIn 0.4s ease-out forwards',
            }}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                     <HiExclamation className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 font-proza">Delete Task</h3>
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
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 font-proza">Are you sure?</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                     <p className="text-red-800 text-sm font-medium mb-2">
                        You are about to delete the following task:
                     </p>
                     <div className="bg-white border border-red-200 rounded p-3">
                        <p className="text-gray-900 text-sm font-medium">"{taskName}"</p>
                     </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                     This action cannot be undone. The task will be permanently removed from your list.
                  </p>
               </div>

               {/* Action Buttons */}
               <div className="flex flex-col space-y-3">
                  <button
                     onClick={handleConfirm}
                     disabled={isDeleting}
                     className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        !isDeleting
                           ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25 active:scale-[0.98]'
                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                     }`}
                  >
                     {isDeleting ? (
                        <span className="flex items-center justify-center">
                           <AiOutlineLoading3Quarters className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                           Deleting Task...
                        </span>
                     ) : (
                        'Yes, Delete Task'
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

   // Use React Portal to render the modal at the document body level
   return createPortal(modalContent, document.body);
};

export default DeleteTaskModal;
