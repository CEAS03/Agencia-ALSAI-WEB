import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5183,
  },
  build: {
    target: 'es2021',
    chunkSizeWarningLimit: 900,
    /* scripts/prerender.mjs lo usa para precargar el chunk de cada ruta. */
    manifest: !isSsrBuild,
    rollupOptions: {
      /* El troceado manual es cosa del bundle de cliente: en SSR las
         dependencias quedan externas y Rollup no puede agruparlas. */
      output: isSsrBuild
        ? {}
        : {
            manualChunks: {
              three: ['three'],
              gsap: ['gsap'],
              router: ['react-router-dom'],
            },
          },
    },
  },
}));
