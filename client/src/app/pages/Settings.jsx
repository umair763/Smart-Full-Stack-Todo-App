'use client';

import { useState } from 'react';
import Header from '../layout/Header';
import ChangeProfileImage from '../../components/settings/ChangeProfileImage';
import ChangeUsername from '../../components/settings/ChangeUsername';
import DeleteAccount from '../../components/settings/DeleteAccount';

const Settings = () => {
   const [activeTab, setActiveTab] = useState('profile-image');

   const renderContent = () => {
      switch (activeTab) {
         case 'profile-image':
            return <ChangeProfileImage />;
         case 'username':
            return <ChangeUsername />;
         case 'delete-account':
            return <DeleteAccount />;
         default:
            return <ChangeProfileImage />;
      }
   };

   return (
      <div className="w-11/12 p-5 rounded-xl shadow-lg bg-gradient-to-br from-[#9406E6] to-[#00FFFF] grid grid-cols-1 gap-4">
         {/* Header */}
         <div className="col-span-1 mb-4">
            <Header />
         </div>

         {/* Settings Content */}
         <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-6 grid grid-cols-1 md:grid-cols-[250px,1fr] gap-6">
            {/* Sidebar */}
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
               <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
               <ul className="space-y-2">
                  <li>
                     <button
                        onClick={() => setActiveTab('profile-image')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                           activeTab === 'profile-image'
                              ? 'bg-white bg-opacity-30 text-white'
                              : 'text-white hover:bg-white hover:bg-opacity-10'
                        }`}
                     >
                        Change Profile Image
                     </button>
                  </li>
                  <li>
                     <button
                        onClick={() => setActiveTab('username')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                           activeTab === 'username'
                              ? 'bg-white bg-opacity-30 text-white'
                              : 'text-white hover:bg-white hover:bg-opacity-10'
                        }`}
                     >
                        Change Username
                     </button>
                  </li>
                  <li>
                     <button
                        onClick={() => setActiveTab('delete-account')}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                           activeTab === 'delete-account'
                              ? 'bg-white bg-opacity-30 text-white'
                              : 'text-white hover:bg-white hover:bg-opacity-10'
                        }`}
                     >
                        Delete Account
                     </button>
                  </li>
               </ul>
            </div>

            {/* Content */}
            <div className="bg-white bg-opacity-20 rounded-xl p-6">{renderContent()}</div>
         </div>
      </div>
   );
};

export default Settings;
