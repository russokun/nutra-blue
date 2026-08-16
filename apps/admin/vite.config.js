import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    // Mismo criterio que la tienda: 3002 por defecto, y si está ocupado toma el
    // siguiente libre en vez de fallar.
    port: Number(process.env.PORT) || 3002,
    strictPort: false,
    cors: true,
    proxy: {
      '/hcgi/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hcgi\/api/, '')
      }
    }
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
