import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // three.js + R3F form one ~930 kB (≈250 kB gzip) chunk. It is lazy-loaded
    // after the typography paints, so its size doesn't block first render.
    chunkSizeWarningLimit: 1000,
  },
});
