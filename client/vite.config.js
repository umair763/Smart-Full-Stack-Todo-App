export default defineConfig({
   plugins: [react()],
   build: {
      outDir: 'dist',
      emptyOutDir: true,
   },
   server: {
      port: 5174,
      historyApiFallback: true,
   },
   base: '/',
});
