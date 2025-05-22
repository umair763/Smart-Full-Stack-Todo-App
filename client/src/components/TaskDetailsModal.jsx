'use client';

import { useState } from 'react';
import { FiX, FiClipboard, FiPaperclip } from 'react-icons/fi';
import NotesList from './NotesList';
import AttachmentsList from './AttachmentsList';

function TaskDetailsModal({ isOpen, onClose, task }) {
   const [activeTab, setActiveTab] = useState('notes');

   if (!isOpen || !task) return null;

   return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out">
         <div className="bg-gradient-to-br from-[#9406E6]/90 to-[#00FFFF]/90 backdrop-blur-lg p-6 rounded-xl shadow-2xl w-full max-w-2xl mx-3 transform transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-white truncate">{task.task}</h2>
               <button onClick={onClose} className="text-white hover:text-red-300 transition-colors">
                  <FiX className="h-6 w-6" />
               </button>
            </div>

            <div className="bg-white/90 rounded-lg p-4 mb-4">
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                     <p className="text-sm text-gray-500">Date</p>
                     <p className="font-medium">{task.date}</p>
                  </div>
                  <div>
                     <p className="text-sm text-gray-500">Time</p>
                     <p className="font-medium">{task.time}</p>
                  </div>
                  <div>
                     <p className="text-sm text-gray-500">Priority</p>
                     <p className="font-medium">{task.priority}</p>
                  </div>
                  <div>
                     <p className="text-sm text-gray-500">Status</p>
                     <p className="font-medium">{task.completed ? 'Completed' : 'Pending'}</p>
                  </div>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/30 mb-4">
               <button
                  className={`flex items-center px-4 py-2 text-sm font-medium ${
                     activeTab === 'notes' ? 'text-white border-b-2 border-white' : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('notes')}
               >
                  <FiClipboard className="mr-2" />
                  Notes
               </button>
               <button
                  className={`flex items-center px-4 py-2 text-sm font-medium ${
                     activeTab === 'attachments'
                        ? 'text-white border-b-2 border-white'
                        : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('attachments')}
               >
                  <FiPaperclip className="mr-2" />
                  Attachments
               </button>
            </div>

            {/* Tab content */}
            <div className="bg-gray-100 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
               {activeTab === 'notes' ? <NotesList taskId={task._id} /> : <AttachmentsList taskId={task._id} />}
            </div>

            <div className="mt-4 flex justify-end">
               <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-[#9406E6] font-medium rounded-lg hover:shadow-lg transition-colors"
               >
                  Close
               </button>
            </div>
         </div>
      </div>
   );
}

export default TaskDetailsModal;
