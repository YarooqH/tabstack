import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // Ensures relative asset paths for GitHub Pages hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html')
      }
    }
  }
});
