import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react()],
   server: {
      port: 5174, // Set the specific port
      strictPort: true, // Fail if port is already in use
   },
   build: {
      outDir: 'dist', // Output to the client/dist directory
      emptyOutDir: true,
      assetsDir: 'assets',
      rollupOptions: {
         output: {
            manualChunks: undefined,
            assetFileNames: 'assets/[name].[ext]',
            chunkFileNames: 'assets/[name].js',
            entryFileNames: 'assets/[name].js',
         },
      },
      sourcemap: true,
   },
   base: '/', // Changed from '/' to './' for better path resolution
   resolve: {
      alias: {
         '@': '/src',
      },
   },
});
