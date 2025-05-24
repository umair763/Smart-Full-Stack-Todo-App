import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
   if (!isOpen) return null;

   return (
      <div
         className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onClick={onClose}
      >
         <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {children}
         </div>
      </div>
   );
};

export default Modal;
