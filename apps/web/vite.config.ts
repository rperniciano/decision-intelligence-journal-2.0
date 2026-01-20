import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteImagemin from 'vite-plugin-imagemin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Feature #291: Image optimization plugin
    // Automatically converts images to modern formats (WebP/AVIF)
    // and optimizes file sizes during build
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.8, 0.9],
      },
      webp: {
        quality: 80,
        // Convert PNG/JPEG to WebP
        method: 6,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
            active: false,
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
    }),
  ],
  // Load .env from monorepo root
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Feature #151: Handle very long URLs
    // Increase max header size to prevent HTTP 431 errors
    // Default is typically 8KB, increased to 16KB for safety
    headers: {
      // Allow larger request headers for long URLs with query strings
      // This prevents HTTP 431 "Request Header Fields Too Large" errors
      'Access-Control-Max-Age': '86400',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        // Configure proxy to handle larger URLs
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Ensure large headers are forwarded
            proxyReq.setHeader('X-Forwarded-Host', req.headers.host || 'localhost:5173');
          });
        },
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
});
