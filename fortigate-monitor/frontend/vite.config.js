import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// Use the Tailwind Vite plugin so Tailwind is processed by Vite directly.
export default defineConfig({
    plugins: [react(), tailwind()],
    server: {
        // Use Vite default dev port commonly 5173 to match other tools
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
})