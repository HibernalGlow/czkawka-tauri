import path from 'node:path';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
);

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '18' }]],
      },
    }),
  ],
  clearScreen: false,
  server: {
    port: 5000,
    strictPort: false,
    host: false,
    hmr: {
      protocol: 'ws',
      port: 5001,
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    PKG_NAME: JSON.stringify(''),
    PKG_VERSION: JSON.stringify(pkg.version || ''),
    REPOSITORY_URL: JSON.stringify(pkg.repository?.url || ''),
    PLATFORM: JSON.stringify(process.platform),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: [
            '@radix-ui/react-icons',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
          ],
        },
      },
    },
  },
  base: './',
  esbuild: {
    legalComments: 'none',
    target: 'esnext',
  },
});
