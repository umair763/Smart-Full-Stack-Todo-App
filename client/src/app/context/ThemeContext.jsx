import React, { createContext, useContext, useEffect, useState } from 'react';

// Create Theme Context
const ThemeContext = createContext();

// Theme modes
export const THEME_MODES = {
   LIGHT: 'light',
   DARK: 'dark',
   SYSTEM: 'system',
};

// Custom hook to use theme context
export const useTheme = () => {
   const context = useContext(ThemeContext);
   if (!context) {
      throw new Error('useTheme must be used within a ThemeProvider');
   }
   return context;
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
   const [theme, setTheme] = useState(THEME_MODES.SYSTEM);
   const [systemTheme, setSystemTheme] = useState('light');
   const [actualTheme, setActualTheme] = useState('light');

   // Get system theme preference
   const getSystemTheme = () => {
      if (typeof window !== 'undefined') {
         return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
   };

   // Get theme from localStorage or default to system
   const getStoredTheme = () => {
      if (typeof window !== 'undefined') {
         const stored = localStorage.getItem('theme');
         return stored && Object.values(THEME_MODES).includes(stored) ? stored : THEME_MODES.SYSTEM;
      }
      return THEME_MODES.SYSTEM;
   };

   // Apply theme to document
   const applyTheme = (themeToApply) => {
      if (typeof window !== 'undefined') {
         const root = window.document.documentElement;
         const isDark = themeToApply === 'dark';

         if (isDark) {
            root.classList.add('dark');
         } else {
            root.classList.remove('dark');
         }

         setActualTheme(themeToApply);
      }
   };

   // Determine actual theme based on user preference and system theme
   const resolveTheme = (userTheme, systemTheme) => {
      switch (userTheme) {
         case THEME_MODES.LIGHT:
            return 'light';
         case THEME_MODES.DARK:
            return 'dark';
         case THEME_MODES.SYSTEM:
         default:
            return systemTheme;
      }
   };

   // Change theme function
   const changeTheme = (newTheme) => {
      if (Object.values(THEME_MODES).includes(newTheme)) {
         setTheme(newTheme);
         localStorage.setItem('theme', newTheme);

         const resolvedTheme = resolveTheme(newTheme, systemTheme);
         applyTheme(resolvedTheme);
      }
   };

   // Toggle between light and dark (skips system)
   const toggleTheme = () => {
      const newTheme = actualTheme === 'light' ? THEME_MODES.DARK : THEME_MODES.LIGHT;
      changeTheme(newTheme);
   };

   // Initialize theme on mount
   useEffect(() => {
      const storedTheme = getStoredTheme();
      const currentSystemTheme = getSystemTheme();

      setTheme(storedTheme);
      setSystemTheme(currentSystemTheme);

      const resolvedTheme = resolveTheme(storedTheme, currentSystemTheme);
      applyTheme(resolvedTheme);
   }, []);

   // Listen for system theme changes
   useEffect(() => {
      if (typeof window !== 'undefined') {
         const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

         const handleSystemThemeChange = (e) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            setSystemTheme(newSystemTheme);

            // Only apply if user is using system theme
            if (theme === THEME_MODES.SYSTEM) {
               applyTheme(newSystemTheme);
            }
         };

         mediaQuery.addEventListener('change', handleSystemThemeChange);

         return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
   }, [theme]);

   // Update actual theme when theme or system theme changes
   useEffect(() => {
      const resolvedTheme = resolveTheme(theme, systemTheme);
      applyTheme(resolvedTheme);
   }, [theme, systemTheme]);

   // Context value
   const value = {
      theme,
      actualTheme,
      systemTheme,
      changeTheme,
      toggleTheme,
      isDark: actualTheme === 'dark',
      isLight: actualTheme === 'light',
      isSystem: theme === THEME_MODES.SYSTEM,
      themes: THEME_MODES,
   };

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
