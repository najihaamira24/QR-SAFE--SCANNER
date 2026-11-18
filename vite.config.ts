import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // @ts-expect-error vite 6 plugin type mismatch with vitest 2
    react(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
