import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
   const { isLoggedIn, logout } = useAuth();

   return (
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4">
         <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Todo App</h1>
            {isLoggedIn && (
               <nav>
                  <ul className="flex space-x-4">
                     <li>
                        <Link to="/dashboard" className="hover:text-blue-200 transition-colors">
                           Dashboard
                        </Link>
                     </li>
                     <li>
                        <button
                           onClick={logout}
                           className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition-colors"
                        >
                           Logout
                        </button>
                     </li>
                  </ul>
               </nav>
            )}
         </div>
      </header>
   );
};

export default Header;
