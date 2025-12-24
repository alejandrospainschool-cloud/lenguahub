import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://olelearning.vip',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
