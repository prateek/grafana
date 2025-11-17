import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        contentScript: resolve(__dirname, 'src/contentScript.ts'),
        background: resolve(__dirname, 'src/background.ts'),
        overlay: resolve(__dirname, 'src/ui/overlay.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    sourcemap: process.env.NODE_ENV === 'development',
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/manifest.json',
          dest: '.',
        },
        {
          src: 'src/ui/overlay.html',
          dest: 'ui',
        },
        {
          src: 'src/styles/*.css',
          dest: 'styles',
        },
      ],
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
