import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react()],
   server: {
      port: 5174,
      strictPort: true,
   },
   build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
      rollupOptions: {
         output: {
            manualChunks: undefined,
         },
         external: [],
      },
      commonjsOptions: {
         include: [/node_modules/],
         transformMixedEsModules: true,
      },
   },
   resolve: {
      alias: {
         '@': '/src',
      },
   },
   optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
   },
   base: '/',
});
