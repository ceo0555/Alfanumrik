import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Babel options for better performance
        babel: {
          plugins: []
        }
      })
    ],
    
    // Define environment variables
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-window',
        'react-virtualized-auto-sizer',
        '@google/genai'
      ]
    },
    
    // Build optimizations
    build: {
      target: 'esnext',
      minify: 'esbuild', // Using esbuild (faster than terser, built-in)
      cssMinify: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'gemini-vendor': ['@google/genai'],
            'virtualization': ['react-window', 'react-virtualized-auto-sizer']
          }
        }
      }
    },
    
    // Development server
    server: {
      port: 5173,
      strictPort: false,
      host: true,
      open: false
    },
    
    // Preview server
    preview: {
      port: 4173,
      strictPort: false,
      host: true
    }
  }
})
