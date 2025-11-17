import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.ts'], // Only run tests in src directory
    exclude: ['node_modules', 'dist', 'public', 'packages', 'e2e', 'e2e-playwright'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/tests/**/*', 'src/ui/overlay.ts'],
    },
  },
});
