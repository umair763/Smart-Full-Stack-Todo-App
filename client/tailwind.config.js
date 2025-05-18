/** @type {import('tailwindcss').Config} */
export default {
   content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
   theme: {
      screens: {
         xs: '300px',
         sm: '640px',
         md: '768px',
         lg: '1024px',
         xl: '1280px',
         '2xl': '1536px',
      },
      extend: {
         fontFamily: {
            'caros-light': ['"Caros Light"', 'sans-serif'],
         },
         keyframes: {
            scan: {
               '0%': {
                  transform: 'translateY(-100%)',
               },
               '100%': {
                  transform: 'translateY(100%)',
               },
            },
            glow: {
               '0%, 100%': {
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
               },
               '50%': {
                  boxShadow: '0 10px 10px rgb(255, 255, 255)',
               },
            },
            waveFloat: {
               '0%': {
                  transform: 'translateY(0)',
               },
               '50%': {
                  transform: 'translateY(-10px)',
               },
               '100%': {
                  transform: 'translateY(0)',
               },
            },
         },
         animation: {
            scan: 'scan 2s infinite linear',
            glow: 'glow 3s infinite ease-in-out',
            waveRed: 'waveFloat 1.5s ease-in-out infinite',
            waveYellow: 'waveFloat 1.5s ease-in-out infinite 0.25s',
            waveGreen: 'waveFloat 1.5s ease-in-out infinite 0.5s',
         },
      },
   },
   plugins: [],
};
