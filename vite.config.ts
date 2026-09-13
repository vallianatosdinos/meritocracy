import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base: './' keeps the build portable into Capacitor (mobile) and Tauri (desktop) shells.
  base: './',
  // Stamps the build into the title screen, so "am I looking at my change yet?"
  // is answerable at a glance instead of by guessing at browser caching.
  define: {
    __BUILD_ID__: JSON.stringify((process.env.GITHUB_SHA ?? 'dev').slice(0, 7)),
  },
  server: { host: true, port: 5173 },
})
