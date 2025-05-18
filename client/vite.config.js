import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react()],
   build: {
      outDir: '../dist', // Output to the root dist directory
      emptyOutDir: true,
   },
});
