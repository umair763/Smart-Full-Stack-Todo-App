'use client';

import { HiCheckCircle } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const Footer = () => {
   const { isDarkMode } = useTheme();

   return (
      <>
         {/* Footer */}
         <footer className={`py-8 mt-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid md:grid-cols-4 gap-8">
                  <div>
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                           <HiCheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">Smart Todo</span>
                     </div>
                     <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                        The intelligent task manager that transforms chaos into clarity.
                     </p>
                     <div className="flex space-x-4">{/* Social media icons would go here */}</div>
                  </div>

                  {/* product */}
                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                        <li>
                           <a
                              href="#features"
                              className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-white'}`}
                           >
                              Features
                           </a>
                        </li>
                        <li className="relative group">
                           <a
                              href="#"
                              className={`transition-colors cursor-pointer flex items-center ${
                                 isDarkMode ? 'hover:text-white' : 'hover:text-white'
                              }`}
                           >
                              Updates
                              {/* Down arrow icon */}
                              <svg
                                 className="ml-1 w-4 h-4 fill-current"
                                 viewBox="0 0 20 20"
                                 xmlns="http://www.w3.org/2000/svg"
                              >
                                 <path d="M5.25 7.5l4.5 4.5 4.5-4.5H5.25z" />
                              </svg>
                           </a>

                           {/* Dropdown menu */}
                           <ul
                              className={`absolute left-0 mt-2 w-40 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-10 ${
                                 isDarkMode ? 'bg-gray-800' : 'bg-slate-900'
                              }`}
                           >
                              <li>
                                 <a
                                    href="#"
                                    className={`block px-4 py-2 rounded-md transition-colors ${
                                       isDarkMode ? 'hover:bg-purple-600' : 'hover:bg-purple-700'
                                    }`}
                                 >
                                    Version 2.0
                                 </a>
                              </li>
                              <li>
                                 <a
                                    href="#"
                                    className={`block px-4 py-2 rounded-md transition-colors ${
                                       isDarkMode ? 'hover:bg-purple-600' : 'hover:bg-purple-700'
                                    }`}
                                 >
                                    Version 3.1 mega
                                 </a>
                              </li>
                           </ul>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                        <li>
                           <a
                              href="#pricing"
                              className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-white'}`}
                           >
                              Pricing
                           </a>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                        <li>
                           <a
                              href="#security"
                              className={`transition-colors ${isDarkMode ? 'hover:text-white' : 'hover:text-white'}`}
                           >
                              Security
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>

               <div
                  className={`border-t mt-4 pt-8 flex flex-col md:flex-row justify-between items-center ${
                     isDarkMode ? 'border-gray-700' : 'border-gray-800'
                  }`}
               >
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                     © 2024 Smart Todo. All rights reserved.
                  </p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                     <Link
                        to="/privacy"
                        className={`text-sm transition-colors ${
                           isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-white'
                        }`}
                     >
                        Privacy Policy
                     </Link>
                  </div>
               </div>
            </div>
         </footer>
      </>
   );
};

export default Footer;
