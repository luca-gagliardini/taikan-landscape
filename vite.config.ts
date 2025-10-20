import { defineConfig } from 'vite'

export default defineConfig({
  base: '/taikan-landscape/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  }
})
