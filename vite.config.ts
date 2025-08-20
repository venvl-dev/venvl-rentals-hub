import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendors (always needed)
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // UI vendors (commonly used)
          'vendor-ui': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select'
          ],
          
          // Feature-specific chunks (lazy loaded)
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-motion': ['framer-motion'],
          'vendor-date': ['date-fns', 'react-day-picker'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
  },
}));
