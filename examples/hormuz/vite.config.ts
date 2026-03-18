import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      'sarasti': path.resolve(__dirname, '../../src/index.ts'),
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  publicDir: path.resolve(__dirname, '../../public'),
  server: {
    port: 3001,
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist-hormuz'),
    sourcemap: true,
  },
  assetsInclude: ['**/*.bin'],
});
