/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest';

// Mock Chrome extension APIs
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
  },
} as any;
