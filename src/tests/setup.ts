/**
 * Test setup file for Vitest
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Mock Chrome API
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({
      version: '1.0.0',
    })),
  },
} as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

// Cleanup after each test
afterEach(() => {
  document.body.innerHTML = '';
});
