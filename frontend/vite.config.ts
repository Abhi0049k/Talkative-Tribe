import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  server: {
    // Listen on all network interfaces
    host: '0.0.0.0',
    port: 5173,
    // Allow connections from other devices on the network
    strictPort: true,
  }
})
