'use client';

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { HiX, HiUpload, HiCloudUpload } from 'react-icons/hi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

function AttachmentModal({ isOpen, onClose, onSubmit }) {
   const [file, setFile] = useState(null);
   const [isDragging, setIsDragging] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!file) {
         setError('Please select a file');
         return;
      }

      setIsLoading(true);
      setError('');

      try {
         await onSubmit(file);
         setFile(null);
         onClose();
      } catch (error) {
         console.error('Error uploading file:', error);
         setError(error.message || 'Failed to upload file');
      } finally {
         setIsLoading(false);
      }
   };

   const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
   };

   const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
   };

   const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
         setFile(droppedFile);
         setError('');
      }
   };

   const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
         setFile(selectedFile);
         setError('');
      }
   };

   const handleClose = () => {
      if (!isLoading) {
         setFile(null);
         setError('');
         onClose();
      }
   };

   const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget && !isLoading) {
         handleClose();
      }
   };

   // Format file size
   const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            className="bg-gradient-to-br from-emerald-600/95 to-teal-600/95 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-sm mx-3 transform transition-all duration-300 ease-out"
            style={{
               animation: 'modalSlideIn 0.4s ease-out forwards',
            }}
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
               <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-1.5 rounded-full">
                     <HiCloudUpload className="h-4 w-4 text-white" />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-white font-proza">Upload File</h2>
                     <p className="text-xs text-white/80">Attach to your task</p>
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
                  {/* File Upload Area */}
                  <div>
                     <label className="block text-white text-xs font-medium mb-1">Select File *</label>
                     <div
                        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 cursor-pointer ${
                           isDragging
                              ? 'border-white/60 bg-white/10 scale-[1.02]'
                              : file
                              ? 'border-emerald-300/60 bg-emerald-300/10'
                              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload').click()}
                     >
                        {file ? (
                           <div className="space-y-2">
                              <div className="w-8 h-8 bg-emerald-400/30 rounded-lg flex items-center justify-center mx-auto">
                                 <HiUpload className="h-4 w-4 text-emerald-100" />
                              </div>
                              <div>
                                 <p className="text-white text-sm font-medium truncate">{file.name}</p>
                                 <p className="text-emerald-100/80 text-xs">{formatFileSize(file.size)}</p>
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-2">
                              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                                 <HiCloudUpload className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                 <p className="text-white text-sm font-medium">
                                    {isDragging ? 'Drop file here!' : 'Drag & drop or click'}
                                 </p>
                                 <p className="text-white/70 text-xs">Any file type supported</p>
                              </div>
                           </div>
                        )}

                        <input
                           type="file"
                           onChange={handleFileChange}
                           className="hidden"
                           id="file-upload"
                           accept="*/*"
                           disabled={isLoading}
                        />
                     </div>
                  </div>
               </form>
            </div>

            {/* Footer - Action Buttons */}
            <div className="p-4 border-t border-white/20 bg-white/5">
               <div className="flex flex-col space-y-2">
                  <button
                     onClick={handleSubmit}
                     disabled={isLoading || !file}
                     className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-sm touch-manipulation ${
                        !isLoading && file
                           ? 'bg-white text-emerald-600 hover:bg-white/90 shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]'
                           : 'bg-white/30 text-white/50 cursor-not-allowed'
                     }`}
                  >
                     {isLoading ? (
                        <span className="flex items-center justify-center">
                           <AiOutlineLoading3Quarters className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" />
                           Uploading...
                        </span>
                     ) : (
                        'Upload File'
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

export default AttachmentModal;
