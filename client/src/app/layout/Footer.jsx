import React from 'react';

const Footer = () => {
   return (
      <footer className="bg-emerald-500 text-white text-center py-2">
         &copy; {new Date().getFullYear()} All rights reserved.
      </footer>
   );
};

export default Footer;
