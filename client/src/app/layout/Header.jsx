'use client';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';
import { HiArrowLeft, HiChartBar, HiCog, HiMenu, HiX, HiHome, HiCheckCircle } from 'react-icons/hi';
import { RiListCheck3 } from 'react-icons/ri';

const Header = () => {
   const { isLoggedIn } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

   const isSettingsPage = location.pathname === '/settings';
   const isInsightsPage = location.pathname === '/insights';
   const isDashboardPage = location.pathname === '/dashboard';
   const isHomePage = location.pathname === '/home' || location.pathname === '/';

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
      <header className="mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-white rounded-xl shadow-lg border border-white/20 dark:border-white/10 backdrop-blur-sm">
         <div className="mx-auto px-4 sm:px-4 lg:px-4 py-1.5 sm:py-2 lg:py-3">
            <div className="flex justify-between items-center min-h-[40px] sm:min-h-[48px] lg:min-h-[56px]">
               {/* Left Section - Logo & Back Button - Always stays left */}
               <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 min-w-0">
                  {(isSettingsPage || isInsightsPage) && (
                     <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center justify-center p-1 sm:p-1.5 lg:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 transform hover:scale-105 flex-shrink-0"
                        title="Back to Dashboard"
                     >
                        <HiArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 group-hover:translate-x-[-2px] transition-transform duration-200" />
                     </button>
                  )}

                  <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                     <div className="bg-white/20 p-1 sm:p-1.5 lg:p-2 rounded-lg flex-shrink-0">
                        <HiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                     </div>
                     <div className="min-w-0 hidden xs:block">
                        <h1 className="font-extrabold text-sm sm:text-lg lg:text-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent truncate font-proza">
                           Smart Todo
                        </h1>
                        <p className="text-xs sm:text-sm text-white/70 hidden sm:block truncate">
                           To-Do lists help us break life into small steps.
                        </p>
                     </div>
                  </div>
               </div>

               {/* Desktop Navigation - Hidden on mobile */}
               {isLoggedIn && (
                  <nav className="hidden md:block flex-shrink-0">
                     <ul className="flex items-center space-x-2">
                        <li>
                           <Link
                              to="/home"
                              className={`group flex items-center space-x-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                 isHomePage
                                    ? 'bg-white/25 shadow-lg border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20'
                              }`}
                           >
                              <HiHome className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-sm font-medium">Home</span>
                              {isHomePage && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
                           </Link>
                        </li>
                        <li>
                           <Link
                              to="/dashboard"
                              className={`group flex items-center space-x-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                 isDashboardPage
                                    ? 'bg-white/25 shadow-lg border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20'
                              }`}
                           >
                              <RiListCheck3 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-sm font-medium">Dashboard</span>
                              {isDashboardPage && (
                                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              )}
                           </Link>
                        </li>
                        <li>
                           <Link
                              to="/insights"
                              className={`group flex items-center space-x-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                 isInsightsPage
                                    ? 'bg-white/25 shadow-lg border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20'
                              }`}
                           >
                              <HiChartBar className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                              <span className="text-sm font-medium">Insights</span>
                              {isInsightsPage && (
                                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              )}
                           </Link>
                        </li>
                        <li>
                           <Link
                              to="/settings"
                              className={`group flex items-center space-x-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                 isSettingsPage
                                    ? 'bg-white/25 shadow-lg border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20'
                              }`}
                           >
                              <HiCog className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                              <span className="text-sm font-medium">Settings</span>
                              {isSettingsPage && (
                                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              )}
                           </Link>
                        </li>

                        <li className="flex items-center ml-1">
                           <ThemeToggle variant="header" size="medium" />
                        </li>

                        <li className="flex items-center ml-1">
                           <div className="p-1.5 pb-0 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200">
                              <NotificationBell />
                           </div>
                        </li>
                     </ul>
                  </nav>
               )}

               {/* Tablet Navigation - Medium screens */}
               {isLoggedIn && (
                  <nav className="hidden sm:block md:hidden flex-shrink-0">
                     <ul className="flex items-center space-x-1">
                        <li>
                           <Link
                              to="/dashboard"
                              className={`group flex items-center space-x-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                 isDashboardPage
                                    ? 'bg-white/25 shadow-lg border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20'
                              }`}
                           >
                              <HiHome className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-sm font-medium">Dashboard</span>
                              {isDashboardPage && (
                                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              )}
                           </Link>
                        </li>
                        <li>
                           <Link
                              to="/insights"
                              className={`group flex items-center space-x-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                 isInsightsPage
                                    ? 'bg-white/25 shadow-lg border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20'
                              }`}
                           >
                              <HiChartBar className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                              <span className="text-sm font-medium">Insights</span>
                              {isInsightsPage && (
                                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              )}
                           </Link>
                        </li>
                        <li>
                           <Link
                              to="/settings"
                              className={`group flex items-center space-x-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                 isSettingsPage
                                    ? 'bg-white/25 shadow-lg border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20'
                              }`}
                           >
                              <HiCog className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                              <span className="text-sm font-medium">Settings</span>
                              {isSettingsPage && (
                                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              )}
                           </Link>
                        </li>

                        <li className="flex items-center ml-1">
                           <ThemeToggle variant="header" size="small" />
                        </li>

                        <li className="flex items-center ml-1">
                           <div className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200">
                              <NotificationBell />
                           </div>
                        </li>
                     </ul>
                  </nav>
               )}

               {/* Mobile Menu Button & Notification - Always stays right */}
               {isLoggedIn && (
                  <div className="flex items-center space-x-1 sm:hidden flex-shrink-0">
                     <div className="flex-shrink-0">
                        <ThemeToggle variant="header" size="small" />
                     </div>
                     <div className="flex-shrink-0">
                        <NotificationBell />
                     </div>
                     <button
                        onClick={toggleMobileMenu}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex-shrink-0"
                     >
                        {isMobileMenuOpen ? <HiX className="h-4 w-4" /> : <HiMenu className="h-4 w-4" />}
                     </button>
                  </div>
               )}
            </div>

            {/* Mobile Navigation Menu */}
            {isLoggedIn && isMobileMenuOpen && (
               <div className="md:hidden mt-2 pt-2 border-t border-white/20 dark:border-white/10">
                  <nav className="space-y-1">
                     <button
                        onClick={() => handleNavigation('/home')}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                           isHomePage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiHome className="h-4 w-4" />
                        <span className="font-medium">Home</span>
                     </button>

                     <button
                        onClick={() => handleNavigation('/dashboard')}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                           isDashboardPage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiHome className="h-4 w-4" />
                        <span className="font-medium">Dashboard</span>
                     </button>

                     <button
                        onClick={() => handleNavigation('/insights')}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                           isInsightsPage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiChartBar className="h-4 w-4" />
                        <span className="font-medium">Insights</span>
                     </button>

                     <button
                        onClick={() => handleNavigation('/settings')}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                           isSettingsPage ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
                        }`}
                     >
                        <HiCog className="h-4 w-4" />
                        <span className="font-medium">Settings</span>
                     </button>
                  </nav>
               </div>
            )}
         </div>
      </header>
   );
};

export default Header;
