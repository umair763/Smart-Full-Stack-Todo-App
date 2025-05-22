import { useState } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';

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

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold">Upload Attachment</h2>
               <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <FiX className="h-6 w-6" />
               </button>
            </div>

            <form onSubmit={handleSubmit}>
               <div
                  className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center ${
                     isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
               >
                  <FiUpload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 mb-2">Drag and drop a file here, or click to select</p>
                  <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer text-blue-500 hover:text-blue-600">
                     Select File
                  </label>
                  {file && <p className="mt-2 text-sm text-gray-500">Selected file: {file.name}</p>}
               </div>

               <div className="flex justify-end space-x-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={!file}
                     className={`px-4 py-2 rounded-lg ${
                        file
                           ? 'bg-blue-500 text-white hover:bg-blue-600'
                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                     }`}
                  >
                     Upload
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}

export default AttachmentModal;
