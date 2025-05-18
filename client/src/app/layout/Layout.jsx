import { Outlet } from 'react-router-dom';
import Footer from './Footer';

const Layout = () => {
   return (
      <div className="min-h-screen bg-gradient-to-br from-[#0172af] to-[#74febd] flex flex-col">
         {/* Remove the Header from here */}
         <main className="flex-grow flex justify-center items-center p-4">
            <Outlet />
         </main>
         <Footer />
      </div>
   );
};

export default Layout;
