import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
   plugins: [react()],
   build: {
      outDir: 'dist', // this is default, but keep explicit for clarity
   },
   server: {
      port: 5173,
      historyApiFallback: true,
   },
});
