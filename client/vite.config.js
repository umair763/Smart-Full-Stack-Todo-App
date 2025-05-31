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
      outDir: 'dist',
      emptyOutDir: true,
   },
});
