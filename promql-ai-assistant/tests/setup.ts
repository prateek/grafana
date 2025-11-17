import { beforeAll } from 'vitest';

declare global {
  interface Window {
    CodeMirror?: any;
    monaco?: any;
  }
}

beforeAll(() => {
  if (typeof window !== 'undefined') {
    if (!window.crypto?.randomUUID) {
      window.crypto = window.crypto || ({} as Crypto);
      window.crypto.randomUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
    }

    if (!('ResizeObserver' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      class ResizeObserverPolyfill {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
        ResizeObserverPolyfill as unknown as typeof ResizeObserver;
    }
  }
});
