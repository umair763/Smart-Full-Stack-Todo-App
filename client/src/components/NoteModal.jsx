'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold">Add Note</h2>
               <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <FiX className="h-6 w-6" />
               </button>
            </div>

            <form onSubmit={handleSubmit}>
               <div className="mb-4">
                  <textarea
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     placeholder="Enter your note here..."
                     className="w-full h-32 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     required
                  />
               </div>

               <div className="flex justify-end space-x-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                     Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                     Add Note
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}

export default NoteModal;
