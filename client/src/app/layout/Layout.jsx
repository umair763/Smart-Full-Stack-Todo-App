'use client';

import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
   return (
      <div className="min-h-screen bg-gradient-to-br from-[#9406E6] to-[#00FFFF] dark:from-gray-900 dark:to-gray-800 flex flex-col">
         <div className="container mx-auto px-4 py-4">
            <Header />
         </div>
         <main className="flex-grow flex justify-center items-center p-4">
            <Outlet />
         </main>
         <Footer />
      </div>
   );
};

export default Layout;
