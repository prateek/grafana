import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
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
    minify: false,
    sourcemap: true,
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
    setupFiles: ['./src/tests/setup.ts'],
  },
});
