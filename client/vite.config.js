import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
   plugins: [react()],
   server: {
      port: 5174,
      strictPort: true,
   },
   build: {
      outDir: '../dist', // Changed to output directly to dist
      emptyOutDir: true,
      assetsDir: 'assets',
      rollupOptions: {
         output: {
            manualChunks: undefined,
         },
      },
   },
   base: '/', // Changed back to root
});
