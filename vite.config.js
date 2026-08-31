import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  // relative paths so the build can be hosted from any sub-directory
  // (github pages, a local file, a browser "new tab" extension, ...)
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src')
    },
    // the components import each other without the .vue extension
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
