'use client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

const Header = () => {
   const { isLoggedIn, logout } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const isSettingsPage = location.pathname === '/settings';
   const isInsightsPage = location.pathname === '/insights';
   const isDashboardPage = location.pathname === '/dashboard';

   return (
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 rounded-lg shadow-md">
         <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
               {(isSettingsPage || isInsightsPage) && (
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
                     {isDashboardPage && (
                        <>
                           <li>
                              <Link to="/insights" className="flex items-center hover:text-blue-200 transition-colors">
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                 </svg>
                                 Insights
                              </Link>
                           </li>
                           <li>
                              <Link to="/settings" className="flex items-center hover:text-blue-200 transition-colors">
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                 </svg>
                                 Settings
                              </Link>
                           </li>
                        </>
                     )}
                     {isLoggedIn && (
                        <li>
                           <NotificationBell />
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
