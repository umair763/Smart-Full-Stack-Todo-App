'use client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
   const { isLoggedIn, logout } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const isSettingsPage = location.pathname === '/settings';

   return (
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 rounded-lg shadow-md">
         <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
               {isSettingsPage && (
                  <button onClick={() => navigate('/dashboard')} className="mr-4 hover:text-blue-200 transition-colors">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                     </svg>
                  </button>
               )}
               <h1 className="text-xl font-bold">Todo App</h1>
            </div>
            {isLoggedIn && (
               <nav>
                  <ul className="flex space-x-4 items-center">
                     {!isSettingsPage && (
                        <li>
                           <Link to="/settings" className="hover:text-blue-200 transition-colors">
                              Settings
                           </Link>
                        </li>
                     )}
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
