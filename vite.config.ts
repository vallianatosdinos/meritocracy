import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base: './' keeps the build portable into Capacitor (mobile) and Tauri (desktop) shells.
  base: './',
  server: { host: true, port: 5173 },
})
