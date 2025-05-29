import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/background.css';

// CSS-only fallback background component
function FallbackBackground() {
   const { isDark } = useTheme();

   useEffect(() => {
      console.log('FallbackBackground mounted with isDark:', isDark);
   }, [isDark]);

   return (
      <div className="dynamic-background-container">
         {/* Debug indicator */}
         <div
            style={{
               position: 'fixed',
               top: '10px',
               right: '10px',
               background: 'rgba(0,255,0,0.8)',
               color: 'white',
               padding: '5px',
               borderRadius: '3px',
               fontSize: '12px',
               zIndex: 1000,
            }}
         >
            BG: CSS Fallback
         </div>

         {/* CSS-based glow effects */}
         <div className="background-glow" />

         {/* Animated CSS background */}
         <div className={`absolute inset-0 ${isDark ? 'dark-fallback-bg' : 'light-fallback-bg'}`}>
            {/* Diamond shapes using CSS */}
            <div className="css-diamond diamond-1"></div>
            <div className="css-diamond diamond-2"></div>
            <div className="css-diamond diamond-3"></div>
            <div className="css-diamond diamond-4"></div>

            {/* Spider web patterns using CSS */}
            <div className="css-web web-1"></div>
            <div className="css-web web-2"></div>

            {/* Floating particles using CSS */}
            <div className="css-particles">
               {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className={`css-particle particle-${i + 1}`}></div>
               ))}
            </div>
         </div>

         {/* Subtle overlay for better content readability */}
         <div
            className={`absolute inset-0 pointer-events-none ${
               isDark
                  ? 'bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/15'
                  : 'bg-gradient-to-br from-white/10 via-transparent to-gray-50/5'
            }`}
         />
      </div>
   );
}

export default FallbackBackground;
