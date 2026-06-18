import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate Monaco into its own chunk
          if (id.includes('node_modules/@monaco-editor/react') || id.includes('node_modules/monaco-editor')) {
            return 'monaco-editor';
          }
          // Separate Prettier (Massive AST parsers)
          if (id.includes('node_modules/prettier')) {
            return 'prettier';
          }
          // Separate SignalR
          if (id.includes('node_modules/@microsoft/signalr')) {
            return 'signalr';
          }
          // Separate animation library
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // React core
          if (
            id.includes('node_modules/react/') || 
            id.includes('node_modules/react-dom/') || 
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'react-vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800,
  }
})