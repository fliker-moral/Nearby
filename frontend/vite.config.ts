import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mini App часто раздаётся из под-пути, поэтому base оставляем относительным.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173,
    // Прокси на FastAPI-бэкенд, чтобы в dev не ловить CORS.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
