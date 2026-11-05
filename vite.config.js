import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/recharts/')) return 'charts';
          if (id.includes('/framer-motion/')) return 'motion';
          if (id.includes('/lucide-react/')) return 'icons';
          if (id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('/react/')) return 'react-vendor';
          if (id.includes('/react-router/')) return 'router';
          return undefined;
        },
      },
    },
  },
});
