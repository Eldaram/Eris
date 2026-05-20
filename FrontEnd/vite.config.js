import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    watch: {
      usePolling: true,
    },
    host: true, // needed for the Docker container port mapping to work properly
    strictPort: true,
    hmr: {
        clientPort: 5173,
    },
  },
})
