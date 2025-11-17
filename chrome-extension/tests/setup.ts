/**
 * Test Setup
 * Global setup for Vitest tests
 */

import { vi } from 'vitest';

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
    getPlatformInfo: vi.fn((callback) => {
      callback?.({
        os: 'linux',
        arch: 'x86-64',
      });
    }),
  },
} as any;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
