'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPaperclip, FiDownload, FiTrash2, FiFile, FiImage, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../app/context/AuthContext';
import { HiPaperClip, HiTrash } from 'react-icons/hi';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function AttachmentsList({ taskId }) {
   const [attachments, setAttachments] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [uploading, setUploading] = useState(false);
   const fileInputRef = useRef(null);
   const [initialLoadComplete, setInitialLoadComplete] = useState(false);
   const { token } = useAuth();

   // Fetch attachments when component mounts or taskId changes
   useEffect(() => {
      if (taskId) {
         fetchAttachments();
      }
   }, [taskId]);

   const fetchAttachments = async () => {
      try {
         setLoading(true);
         const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/attachments`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch attachments');
         }

         const data = await response.json();
         setAttachments(data);
         setError(null);
         setInitialLoadComplete(true);
      } catch (err) {
         console.error('Error fetching attachments:', err);
         setError('Failed to load attachments. Please try again.');
      } finally {
         setLoading(false);
      }
   };

   const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
         toast.error('File size exceeds 10MB limit');
         return;
      }

      // Check file type
      const allowedTypes = [
         'application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'text/plain',
         'image/jpeg',
         'image/png',
         'image/gif',
      ];

      if (!allowedTypes.includes(file.type)) {
         toast.error('Invalid file type. Only PDF, Word, Excel, TXT, and images are allowed.');
         return;
      }

      try {
         setUploading(true);
         const formData = new FormData();
         formData.append('file', file);

         const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/attachments`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload attachment');
         }

         const data = await response.json();
         setAttachments((prev) => [data, ...prev]);
         toast.success('File uploaded successfully');
      } catch (err) {
         console.error('Error uploading file:', err);
         toast.error(err.message || 'Failed to upload file');
      } finally {
         setUploading(false);
         // Reset file input
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
         }
      }
   };

   const handleDownload = async (attachmentId, filename) => {
      try {
         const downloadUrl = `${BACKEND_URL}/api/attachments/${attachmentId}/download`;
         const link = document.createElement('a');
         link.href = downloadUrl;
         link.setAttribute('download', filename);
         link.setAttribute('Authorization', `Bearer ${token}`);
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      } catch (err) {
         console.error('Error initiating download:', err);
         toast.error(err.message || 'Failed to download file');
      }
   };

   const handleDelete = async (attachmentId) => {
      if (!window.confirm('Are you sure you want to delete this attachment?')) {
         return;
      }

      try {
         const response = await fetch(`${BACKEND_URL}/api/attachments/${attachmentId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to delete attachment');
         }

         // Remove the attachment from the local state
         setAttachments((prev) => prev.filter((attachment) => attachment._id !== attachmentId));
         toast.success('Attachment deleted successfully');
      } catch (err) {
         console.error('Error deleting attachment:', err);
         toast.error(err.message || 'Failed to delete attachment');
      }
   };

   // Get appropriate icon based on file type
   const getFileIcon = (mimetype) => {
      if (mimetype.startsWith('image/')) {
         return <FiImage className="h-5 w-5" />;
      } else if (mimetype.includes('pdf')) {
         return <FiFile className="h-5 w-5" />;
      } else if (mimetype.includes('word') || mimetype.includes('document')) {
         return <FiFileText className="h-5 w-5" />;
      } else if (mimetype.includes('excel') || mimetype.includes('sheet')) {
         return <FiFileText className="h-5 w-5" />;
      } else {
         return <FiFile className="h-5 w-5" />;
      }
   };

   // Format file size for display
   const formatFileSize = (bytes) => {
      if (bytes < 1024) {
         return bytes + ' B';
      } else if (bytes < 1024 * 1024) {
         return (bytes / 1024).toFixed(1) + ' KB';
      } else {
         return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      }
   };

   return (
      <div className="mt-4">
         <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Attachments</h3>
            <div className="relative">
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
               />
               <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="flex items-center text-sm bg-[#9406E6] text-white px-3 py-1 rounded-md hover:bg-[#7D05C3] transition-colors"
               >
                  <FiPaperclip className="mr-1" />
                  {uploading ? 'Uploading...' : 'Add File'}
               </button>
            </div>
         </div>

         {loading && !initialLoadComplete ? (
            <div className="text-center py-4 text-gray-500">Loading attachments...</div>
         ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
         ) : attachments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 italic">No attachments yet. Add one to get started!</div>
         ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
               {attachments.map((attachment) => (
                  <div
                     key={attachment._id}
                     className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                  >
                     <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="text-gray-500">{getFileIcon(attachment.mimetype)}</div>
                        <div className="truncate">
                           <div className="font-medium text-gray-800 truncate" title={attachment.originalname}>
                              {attachment.originalname}
                           </div>
                           <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                        </div>
                     </div>
                     <div className="flex space-x-2 ml-2">
                        <button
                           onClick={() => handleDownload(attachment._id, attachment.originalname)}
                           className="text-blue-600 hover:text-blue-800"
                           title="Download file"
                        >
                           <FiDownload className="h-5 w-5" />
                        </button>
                        <button
                           onClick={() => handleDelete(attachment._id)}
                           className="text-red-600 hover:text-red-800"
                           title="Delete file"
                        >
                           <FiTrash2 className="h-5 w-5" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}

export default AttachmentsList;
