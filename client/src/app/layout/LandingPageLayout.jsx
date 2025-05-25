'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
   HiCheckCircle,
   HiUsers,
   HiBell,
   HiDocumentText,
   HiChartBar,
   HiDevicePhoneMobile,
   HiArrowRight,
   HiPlay,
   HiStar,
   HiShieldCheck,
   HiGlobeAlt,
   HiClock,
   HiLightBulb,
} from 'react-icons/hi2';

import { HiMenu, HiX } from 'react-icons/hi';

const LandingPageLayout = () => {
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) {
      return null; // Prevent hydration mismatch
   }

   return (
      <motion.div
         className="min-h-screen bg-white dark:bg-gray-900"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ duration: 0.5 }}
      >
         <Outlet />
      </motion.div>
   );
};

export default LandingPageLayout;
