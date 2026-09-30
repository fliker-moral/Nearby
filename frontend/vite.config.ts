import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Mini App часто раздаётся из под-пути, поэтому base оставляем относительным.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  return {
    plugins: [react()],
    base: './',
    server: {
      host: true,
      port: 5173,
      // Прокси на FastAPI-бэкенд, чтобы в dev не ловить CORS.
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
