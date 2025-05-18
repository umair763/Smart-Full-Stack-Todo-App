'use client';

function ConfirmationModal({ message, onConfirm, onCancel }) {
   return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Action</h2>

            <p className="text-gray-700 mb-6">{message}</p>

            <div className="flex justify-end space-x-3">
               <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
               >
                  Cancel
               </button>
               <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
               >
                  Confirm
               </button>
            </div>
         </div>
      </div>
   );
}

export default ConfirmationModal;
