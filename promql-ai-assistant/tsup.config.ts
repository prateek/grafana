import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    contentScript: 'src/contentScript.ts',
    background: 'src/background.ts'
  },
  outDir: 'dist',
  format: ['esm'],
  target: 'es2020',
  splitting: false,
  sourcemap: false,
  minify: false,
  clean: false,
  platform: 'browser',
  treeshake: true,
  loader: {
    '.html': 'text'
  }
});
