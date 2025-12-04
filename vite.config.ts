import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify(process.env.VITE_RECAPTCHA_SITE_KEY || '6LesKB0sAAAAAJLdCi4ZO6CcBg9rzPxccGD9zu0M'),
  },
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    target: 'ES2020',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: (id) => {
          // Core React runtime
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          // Firebase - lazy load
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          // Charts - lazy load
          if (id.includes('node_modules/chart.js') || id.includes('react-chartjs-2')) {
            return 'chart-vendor';
          }
          // UI libraries
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/clsx')) {
            return 'ui-vendor';
          }
          // DnD Kit - page-specific
          if (id.includes('@dnd-kit')) {
            return 'dnd-vendor';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'utils-vendor';
          }
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'clsx'],
    exclude: ['chart.js', '@dnd-kit/core'],
  },
})
