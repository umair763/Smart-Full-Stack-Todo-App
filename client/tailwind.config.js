/** @type {import('tailwindcss').Config} */
export default {
   content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
   darkMode: 'class',
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
         colors: {
            primary: {
               50: '#f0f9ff',
               100: '#e0f2fe',
               200: '#bae6fd',
               300: '#7dd3fc',
               400: '#38bdf8',
               500: '#0ea5e9',
               600: '#0284c7',
               700: '#0369a1',
               800: '#075985',
               900: '#0c4a6e',
            },
            dark: {
               50: '#f8fafc',
               100: '#f1f5f9',
               200: '#e2e8f0',
               300: '#cbd5e1',
               400: '#94a3b8',
               500: '#64748b',
               600: '#475569',
               700: '#334155',
               800: '#1e293b',
               900: '#0f172a',
               950: '#020617',
            },
         },
         backgroundColor: {
            light: '#ffffff',
            lightSecondary: '#f8fafc',
            dark: '#0f172a',
            darkSecondary: '#1e293b',
         },
         textColor: {
            light: '#0f172a',
            lightSecondary: '#475569',
            dark: '#f8fafc',
            darkSecondary: '#cbd5e1',
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
