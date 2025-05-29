'use client';

import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
   return (
      <div className="min-h-screen flex flex-col relative">
         {/* Subtle overlay to enhance readability while keeping background visible */}
         <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent dark:from-transparent dark:via-gray-900/20 dark:to-transparent pointer-events-none" />

         <div className="px-4 py-4 relative z-10 content-overlay">
            <Header />
         </div>
         <main className="flex-grow flex justify-center items-center p-4 relative z-10 content-overlay">
            <Outlet />
         </main>
         <Footer />
      </div>
   );
};

export default Layout;
