import { HiCheckCircle } from 'react-icons/hi';

const Footer = () => {
   return (
      <>
         {/* Footer */}
         <footer className="bg-gray-800 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid md:grid-cols-4 gap-8">
                  <div>
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                           <HiCheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">Smart Todo</span>
                     </div>
                     <p className="text-gray-400 mb-4">
                        The intelligent task manager that transforms chaos into clarity.
                     </p>
                     <div className="flex space-x-4">{/* Social media icons would go here */}</div>
                  </div>

                  {/* product */}
                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className="space-y-2 text-gray-400">
                        <li>
                           <a href="#features" className="hover:text-white transition-colors">
                              Features
                           </a>
                        </li>
                        <li className="relative group">
                           <a href="#" className="hover:text-white transition-colors cursor-pointer flex items-center">
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
                           <ul className="absolute left-0 mt-2 w-40 bg-slate-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-10">
                              <li>
                                 <a
                                    href="#"
                                    className="block px-4 py-2 hover:bg-purple-700 rounded-md transition-colors"
                                 >
                                    Version 1.0
                                 </a>
                              </li>
                              <li>
                                 <a
                                    href="#"
                                    className="block px-4 py-2 hover:bg-purple-700 rounded-md transition-colors"
                                 >
                                    Version 1.2
                                 </a>
                              </li>
                              <li>
                                 <a
                                    href="#"
                                    className="block px-4 py-2 hover:bg-purple-700 rounded-md transition-colors"
                                 >
                                    Version 1.3
                                 </a>
                              </li>
                              <li>
                                 <a
                                    href="#"
                                    className="block px-4 py-2 hover:bg-purple-700 rounded-md transition-colors"
                                 >
                                    Version 1.4
                                 </a>
                              </li>
                              <li>
                                 <a
                                    href="#"
                                    className="block px-4 py-2 hover:bg-purple-700 rounded-md transition-colors"
                                 >
                                    Version 1.5 mega
                                 </a>
                              </li>
                           </ul>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className="space-y-2 text-gray-400">
                        <li>
                           <a href="#pricing" className="hover:text-white transition-colors">
                              Pricing
                           </a>
                        </li>
                        {/* <li>
                           <a href="#" className="hover:text-white transition-colors">
                              Help Center
                           </a>
                        </li>
                        <li>
                           <a href="#" className="hover:text-white transition-colors">
                              API Docs
                           </a>
                        </li>
                        <li>
                           <a href="#" className="hover:text-white transition-colors">
                              Blog
                           </a>
                        </li>
                        <li>
                           <a href="#" className="hover:text-white transition-colors">
                              Templates
                           </a>
                        </li> */}
                     </ul>
                  </div>

                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className="space-y-2 text-gray-400">
                        <li>
                           <a href="#security" className="hover:text-white transition-colors">
                              Security
                           </a>
                        </li>
                        {/* <li>
                           <a href="#" className="hover:text-white transition-colors">
                              About
                           </a>
                        </li>
                        <li>
                           <a href="#" className="hover:text-white transition-colors">
                              Careers
                           </a>
                        </li>
                        <li>
                           <a href="#" className="hover:text-white transition-colors">
                              Contact
                           </a>
                        </li>
                        <li>
                           <a href="#" className="hover:text-white transition-colors">
                              Press
                           </a>
                        </li> */}
                     </ul>
                  </div>
               </div>

               <div className="border-t border-gray-800 mt-4 pt-8 flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 text-sm">© 2024 Smart Todo. All rights reserved.</p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                     <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                        Privacy Policy
                     </a>
                     <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                        Terms of Service
                     </a>
                     <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                        Cookie Policy
                     </a>
                  </div>
               </div>
            </div>
         </footer>
      </>
   );
};

export default Footer;
