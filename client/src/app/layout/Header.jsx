'use client';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import { HiArrowLeft, HiChartBar, HiCog, HiUser, HiMenu, HiX, HiHome, HiCheckCircle } from 'react-icons/hi';

const Header = () => {
   const { isLoggedIn } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

   const isSettingsPage = location.pathname === '/settings';
   const isInsightsPage = location.pathname === '/insights';
   const isDashboardPage = location.pathname === '/dashboard';
   const isProfilePage = location.pathname === '/profile';

   const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen);
   };

   const closeMobileMenu = () => {
      setIsMobileMenuOpen(false);
   };

   const handleNavigation = (path) => {
      navigate(path);
      closeMobileMenu();
   };

   return (
      <header className="bg-gradient-to-r -mt-16 from-purple-600 via-blue-600 to-indigo-700 text-white rounded-xl shadow-lg border border-white/20 backdrop-blur-sm">
         <div className="container mx-auto px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4">
            <div className="flex justify-between items-center min-h-[48px] sm:min-h-[56px]">
               {/* Left Section - Logo & Back Button - Always stays left */}
               <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
               {(isSettingsPage || isInsightsPage || isProfilePage) && (
                     <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 transform hover:scale-105 flex-shrink-0"
                        title="Back to Dashboard"
                     >
                        <HiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-[-2px] transition-transform duration-200" />
                  </button>
               )}

                  <div className="flex items-center space-x-2 min-w-0">
                     <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                        <HiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                     </div>
                     <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl lg:text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent truncate">
                           Todo App
                        </h1>
                        <p className="text-sm sm:text-md text-white/70 hidden sm:block truncate">
                           To-Do lists help us break life into small steps.
                        </p>
                     </div>
                  </div>
            </div>

               {/* Desktop Navigation - Hidden on mobile */}
            {isLoggedIn && (
                  <nav className="hidden md:block flex-shrink-0">
                     <ul className="flex items-center space-x-1 lg:space-x-2">
                     {isDashboardPage && (
                        <>
                           <li>
                                 <Link
                                    to="/insights"
                                    className="group flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                                 >
                                    <HiChartBar className="h-4 w-4 lg:h-5 lg:w-5 group-hover:rotate-12 transition-transform duration-200" />
                                    <span className="text-sm lg:text-base font-medium">Insights</span>
                              </Link>
                           </li>
                           <li>
                                 <Link
                                    to="/settings"
                                    className="group flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                                 >
                                    <HiCog className="h-4 w-4 lg:h-5 lg:w-5 group-hover:rotate-180 transition-transform duration-300" />
                                    <span className="text-sm lg:text-base font-medium">Settings</span>
                              </Link>
                           </li>
                        </>
                     )}

                        <li className="flex items-center">
                           <NotificationBell />
                        </li>

                        <li>
                           <Link
                              to="/profile"
                              className="group flex items-center justify-center p-2 lg:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                              title="Profile"
                           >
                              <HiUser className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform duration-200" />
                        </Link>
                     </li>
                  </ul>
               </nav>
               )}

               {/* Mobile Menu Button & Notification - Always stays right */}
               {isLoggedIn && (
                  <div className="flex items-center space-x-2 md:hidden flex-shrink-0">
                     <div className="flex-shrink-0">
                        <NotificationBell />
                     </div>
                     <button
                        onClick={toggleMobileMenu}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex-shrink-0"
                     >
                        {isMobileMenuOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
                     </button>
                  </div>
               )}
            </div>

            {/* Mobile Navigation Menu */}
            {isLoggedIn && isMobileMenuOpen && (
               <div className="md:hidden mt-4 pt-4 border-t border-white/20">
                  <nav className="space-y-2">
                     <button
                        onClick={() => handleNavigation('/dashboard')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                           isDashboardPage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiHome className="h-5 w-5" />
                        <span className="font-medium">Dashboard</span>
                     </button>

                     <button
                        onClick={() => handleNavigation('/insights')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                           isInsightsPage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiChartBar className="h-5 w-5" />
                        <span className="font-medium">Insights</span>
                     </button>

                     <button
                        onClick={() => handleNavigation('/settings')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                           isSettingsPage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiCog className="h-5 w-5" />
                        <span className="font-medium">Settings</span>
                     </button>

                     <button
                        onClick={() => handleNavigation('/profile')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                           isProfilePage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiUser className="h-5 w-5" />
                        <span className="font-medium">Profile</span>
                     </button>
                  </nav>
               </div>
            )}
         </div>
      </header>
   );
};

export default Header;
