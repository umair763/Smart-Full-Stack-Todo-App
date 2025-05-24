'use client';

import { useState } from 'react';
import { FiEdit3, FiX, FiSave, FiFileText } from 'react-icons/fi';

function NoteModal({ isOpen, onClose, onSubmit }) {
   const [content, setContent] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();
      if (!content.trim()) return;
      onSubmit(content);
      setContent('');
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
                     <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FiEdit3 className="h-6 w-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Note</h2>
                        <p className="text-sm text-gray-600 mt-1">Capture your thoughts and ideas</p>
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
                  {/* Enhanced Text Area */}
                  <div className="space-y-4">
                     <div className="bg-gradient-to-r from-yellow-100/60 to-orange-100/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-yellow-200/50">
                        <div className="flex items-center space-x-3 mb-4">
                           <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                              <FiFileText className="h-5 w-5 text-white" />
                           </div>
                           <div>
                              <label className="block text-gray-900 text-lg font-semibold">
                                 Your Note
                              </label>
                              <p className="text-sm text-gray-600">Write down anything important</p>
                           </div>
                        </div>
                        
                        <div className="relative">
                  <textarea
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                              placeholder="Start typing your note here... You can write anything from quick reminders to detailed thoughts."
                              className="w-full h-40 sm:h-48 p-4 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                     required
                  />
                           
                           {/* Character count */}
                           <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-lg">
                              {content.length} characters
                           </div>
                        </div>

                        {/* Helpful tips */}
                        <div className="mt-4 p-3 bg-white/60 rounded-xl border border-yellow-200/50">
                           <div className="flex items-start space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                 <span className="text-white text-xs font-bold">💡</span>
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-gray-700 mb-1">Quick Tips:</p>
                                 <ul className="text-xs text-gray-600 space-y-1">
                                    <li>• Use notes for important details or context</li>
                                    <li>• Add links, references, or meeting notes</li>
                                    <li>• Notes are saved permanently with your task</li>
                                 </ul>
                              </div>
                           </div>
                        </div>
                     </div>
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
                        disabled={!content.trim()}
                        className={`
                           w-full sm:flex-1 px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2
                           ${content.trim() 
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                           }
                        `}
                     >
                        <FiSave className="h-5 w-5" />
                        <span>Save Note</span>
                  </button>
               </div>
            </form>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-orange-400/0 pointer-events-none"></div>
         </div>
      </div>
   );
}

export default NoteModal;
