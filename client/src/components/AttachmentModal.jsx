import { useState } from 'react';
import { FiX, FiUpload, FiFile, FiImage, FiFileText, FiMusic, FiVideo } from 'react-icons/fi';

function AttachmentModal({ isOpen, onClose, onSubmit }) {
   const [file, setFile] = useState(null);
   const [isDragging, setIsDragging] = useState(false);

   const handleSubmit = (e) => {
      e.preventDefault();
      if (!file) return;
      onSubmit(file);
      setFile(null);
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
      }
   };

   const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
         setFile(selectedFile);
      }
   };

   // Get file icon based on type
   const getFileIcon = (file) => {
      if (!file) return <FiFile className="h-8 w-8" />;
      
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      if (fileType.startsWith('image/')) {
         return <FiImage className="h-8 w-8 text-green-500" />;
      } else if (fileType.startsWith('video/')) {
         return <FiVideo className="h-8 w-8 text-red-500" />;
      } else if (fileType.startsWith('audio/')) {
         return <FiMusic className="h-8 w-8 text-purple-500" />;
      } else if (fileType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
         return <FiFileText className="h-8 w-8 text-blue-500" />;
      } else {
         return <FiFile className="h-8 w-8 text-gray-500" />;
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

   return (
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6">
         <div 
            className="w-full max-w-2xl bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl transform transition-all duration-300 ease-out relative overflow-hidden"
            style={{ 
               animation: 'modalSlideIn 0.4s ease-out forwards',
               boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
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

            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
               {/* Modern Header */}
               <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center space-x-3">
                     <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FiUpload className="h-6 w-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Upload Attachment</h2>
                        <p className="text-sm text-gray-600 mt-1">Attach files to your task</p>
                     </div>
                  </div>
                  <button 
                     onClick={onClose} 
                     className="p-2 hover:bg-red-100 rounded-xl transition-all duration-200 group"
                  >
                     <FiX className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
                  </button>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Enhanced Drop Zone */}
                  <div className="space-y-4">
               <div
                        className={`
                           relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer group
                           ${isDragging 
                              ? 'border-green-400 bg-green-50/80 scale-[1.02]' 
                              : file 
                              ? 'border-green-400 bg-green-50/60'
                              : 'border-gray-300 hover:border-green-400 hover:bg-green-50/30'
                           }
                        `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload').click()}
                     >
                        {/* Upload icon or file preview */}
                        <div className="mb-4">
                           {file ? (
                              <div className="flex flex-col items-center">
                                 <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                                    {getFileIcon(file)}
                                 </div>
                                 <div className="text-center">
                                    <p className="font-semibold text-gray-900 mb-1">{file.name}</p>
                                    <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex flex-col items-center">
                                 <div className={`
                                    w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-4 transition-all duration-300
                                    ${isDragging 
                                       ? 'bg-green-500 text-white scale-110' 
                                       : 'bg-gradient-to-br from-green-500 to-teal-600 text-white group-hover:scale-105'
                                    }
                                 `}>
                                    <FiUpload className="h-8 w-8" />
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-lg font-semibold text-gray-900">
                                       {isDragging ? 'Drop your file here!' : 'Drag & drop your file here'}
                                    </p>
                                    <p className="text-gray-600">or click to browse files</p>
                                 </div>
                              </div>
                           )}
                        </div>

                        <input 
                           type="file" 
                           onChange={handleFileChange} 
                           className="hidden" 
                           id="file-upload" 
                           accept="*/*"
                        />

                        {!file && (
                           <div className="mt-6 pt-6 border-t border-gray-200">
                              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                                 <div className="flex items-center space-x-1">
                                    <FiImage className="h-4 w-4" />
                                    <span>Images</span>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                    <FiFileText className="h-4 w-4" />
                                    <span>Documents</span>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                    <FiVideo className="h-4 w-4" />
                                    <span>Videos</span>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                    <FiMusic className="h-4 w-4" />
                                    <span>Audio</span>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Drag overlay */}
                        {isDragging && (
                           <div className="absolute inset-0 bg-green-500/10 rounded-2xl flex items-center justify-center">
                              <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                                 Release to upload
                              </div>
                           </div>
                        )}
                     </div>

                     {/* File info and tips */}
                     {file && (
                        <div className="bg-gradient-to-r from-green-100/60 to-teal-100/60 backdrop-blur-sm rounded-2xl p-4 border border-green-200/50">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                 <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                                    <FiFile className="h-5 w-5 text-white" />
                                 </div>
                                 <div>
                                    <p className="font-medium text-gray-900">File Ready</p>
                                    <p className="text-sm text-gray-600">Ready to upload to your task</p>
                                 </div>
                              </div>
                              <button
                                 type="button"
                                 onClick={() => setFile(null)}
                                 className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                 <FiX className="h-4 w-4 text-gray-400 hover:text-red-500" />
                              </button>
                           </div>
                        </div>
                     )}

                     {/* Tips section */}
                     {!file && (
                        <div className="bg-gradient-to-r from-blue-100/60 to-indigo-100/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
                           <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                 <span className="text-white text-sm font-bold">💡</span>
                              </div>
                              <div>
                                 <p className="font-medium text-gray-900 mb-2">Tips for better attachments:</p>
                                 <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Supported: Images, documents, videos, audio files</li>
                                    <li>• Max file size: 10MB per file</li>
                                    <li>• Files are securely stored with your task</li>
                                 </ul>
                              </div>
                           </div>
                        </div>
                     )}
               </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                     <button 
                        type="button" 
                        onClick={onClose} 
                        className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
                     >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={!file}
                        className={`
                           w-full sm:flex-1 px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2
                           ${file
                              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700'
                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                           }
                        `}
                  >
                        <FiUpload className="h-5 w-5" />
                        <span>{file ? 'Upload File' : 'Select a file first'}</span>
                  </button>
               </div>
            </form>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-green-400/0 via-green-400/5 to-teal-400/0 pointer-events-none"></div>
         </div>
      </div>
   );
}

export default AttachmentModal;
