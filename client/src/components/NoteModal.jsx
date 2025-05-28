'use client';

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { HiX, HiPencilAlt, HiDocumentText } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

function NoteModal({ isOpen, onClose, onSubmit }) {
   const [content, setContent] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!content.trim()) {
         setError('Note content is required');
         return;
      }

      setIsLoading(true);
      setError('');

      try {
         await onSubmit(content.trim());
         setContent('');
         onClose();
      } catch (error) {
         console.error('Error creating note:', error);
         setError(error.message || 'Failed to create note');
      } finally {
         setIsLoading(false);
      }
   };

   const handleChange = (e) => {
      setContent(e.target.value);
      // Clear error when user starts typing
      if (error) setError('');
   };

   const handleClose = () => {
      if (!isLoading) {
         setContent('');
         setError('');
         onClose();
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && !isLoading) {
         handleClose();
      }
   };

   if (!isOpen) return null;

   const modalContent = (
      <div
         className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-3 sm:p-4"
         style={{
            animation: 'modalBackdropFadeIn 0.3s ease-out forwards',
         }}
         onClick={handleBackdropClick}
      >
         <div
            className="bg-gradient-to-br from-amber-300/95 to-orange-600/95 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-sm mx-3 transform transition-all duration-300 ease-out"
            style={{
               animation: 'modalSlideIn 0.4s ease-out forwards',
            }}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
               <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-1.5 rounded-full">
                     <HiDocumentText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-white font-proza">Quick Note</h2>
                     <p className="text-xs text-white/80">Jot down your thoughts</p>
                  </div>
               </div>
               {!isLoading && (
                  <button
                     onClick={handleClose}
                     className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20 touch-manipulation"
                  >
                     <HiX className="h-5 w-5" />
                  </button>
               )}
            </div>

            {/* Content */}
            <div className="p-4">
               {/* Error Message */}
               {error && (
                  <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                     <p className="text-red-200 text-xs">{error}</p>
                  </div>
               )}

               {/* Form */}
               <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Note Content */}
                  <div>
                     <label className="block text-white text-xs font-medium mb-1">Your Note *</label>
                     <div className="relative">
                        <textarea
                           value={content}
                           onChange={handleChange}
                           rows="4"
                           className="w-full px-3 py-2 bg-gray/20 backdrop-blur-sm text-gray placeholder-gray/70 rounded-lg border border-gray/30 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-transparent resize-none text-sm touch-manipulation"
                           placeholder="Write your note here... 📝"
                           required
                           disabled={isLoading}
                           autoFocus
                        />
                        <div className="absolute bottom-2 right-2 text-white/50">
                           <HiPencilAlt className="h-3 w-3" />
                        </div>
                     </div>
                     <p className="text-white/60 text-xs mt-1">
                        {content.length} characters
                     </p>
                  </div>
               </form>
            </div>

            {/* Footer - Action Buttons */}
            <div className="p-4 border-t border-white/20 bg-white/5">
               <div className="flex flex-col space-y-2">
                  <button
                     onClick={handleSubmit}
                     disabled={isLoading || !content.trim()}
                     className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-sm touch-manipulation ${
                        !isLoading && content.trim()
                           ? 'bg-white text-amber-600 hover:bg-white/90 shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]'
                           : 'bg-white/30 text-white/50 cursor-not-allowed'
                     }`}
                  >
                     {isLoading ? (
                        <span className="flex items-center justify-center">
                           <AiOutlineLoading3Quarters className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" />
                           Saving...
                        </span>
                     ) : (
                        'Save Note'
                     )}
                  </button>
                  <button
                     type="button"
                     onClick={handleClose}
                     disabled={isLoading}
                     className={`w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] text-sm touch-manipulation ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
}

export default NoteModal;
