import { vi } from 'vitest';

declare global {
  // eslint-disable-next-line no-var
  var chrome: typeof import('chrome');
}

beforeAll(() => {
  globalThis.chrome = {
    runtime: {
      getURL: vi.fn((path: string) => path)
    }
  } as unknown as typeof chrome;
});
