import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-white/10 backdrop-blur-md rounded-xl w-full max-w-md relative">
            <button
               onClick={onClose}
               className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
            >
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
            <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
               <div className="p-6">{children}</div>
            </div>
         </div>
      </div>
   );
};

export default Modal;
