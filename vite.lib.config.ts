import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'sarasti',
    },
    rollupOptions: {
      external: ['three', 'react', 'react-dom', 'zustand'],
    },
    outDir: 'dist',
    sourcemap: true,
  },
});
