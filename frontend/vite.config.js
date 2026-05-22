import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api';
  const socketUrl = env.VITE_SOCKET_URL || 'http://localhost:5000';
  const backendUrl = apiUrl.replace(/\/api$/, '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/thumbnails': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: socketUrl.replace(/^http/, 'ws'),
          ws: true,
        },
      },
    },
  };
});
