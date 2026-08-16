import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative asset paths for GitHub Pages hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
