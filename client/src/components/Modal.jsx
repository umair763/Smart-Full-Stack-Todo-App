import React from 'react';

const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
   if (!isOpen) return null;

   // Size variants for different modal types
   const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-7xl',
   };

   return (
      <div
         className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6"
         onClick={onClose}
         style={{
            animation: 'modalBackdropFadeIn 0.3s ease-out forwards',
            overflowY: 'hidden',
         }}
      >
         <div
            className={`
               w-full ${sizeClasses[size]} 
               max-h-[95vh] sm:max-h-[90vh] lg:max-h-[85vh]
               bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30
               backdrop-blur-xl border border-white/20
               rounded-2xl sm:rounded-3xl shadow-2xl
               transform transition-all duration-300 ease-out
               relative overflow-hidden
               flex flex-col
            `}
            onClick={(e) => e.stopPropagation()}
            style={{
               animation: 'modalSlideIn 0.4s ease-out forwards',
               boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
         >
            {/* Elegant background pattern */}
            <div className="absolute inset-0 opacity-5">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600"></div>
               <div
                  className="absolute inset-0"
                  style={{
                     backgroundImage: `
                        radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), 
                        radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)
                     `,
                  }}
               ></div>
            </div>

            {/* Content container with scroll */}
            <div className="relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar">{children}</div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-400/0 via-purple-400/5 to-indigo-400/0 pointer-events-none"></div>
         </div>
      </div>
   );
};

export default Modal;
