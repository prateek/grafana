const extensionOrigin = 'chrome-extension://promql-assistant';

if (typeof globalThis.chrome === 'undefined') {
  (globalThis as any).chrome = {
    runtime: {
      getURL: (path = '') => `${extensionOrigin}/${path.replace(/^\//, '')}`,
    },
  };
}

if (typeof (globalThis as any).InputEvent === 'undefined') {
  class PolyfillInputEvent extends Event {
    data?: string;
    inputType?: string;
    constructor(type: string, params: InputEventInit = {}) {
      super(type, params);
      this.data = params.data;
      this.inputType = params.inputType;
    }
  }
  (globalThis as any).InputEvent = PolyfillInputEvent;
}

if (typeof (globalThis as any).ClipboardEvent === 'undefined') {
  class PolyfillClipboardEvent extends Event {
    clipboardData: DataTransfer | null;
    constructor(type: string, params: ClipboardEventInit = {}) {
      super(type, params);
      this.clipboardData = params.clipboardData ?? null;
    }
  }
  (globalThis as any).ClipboardEvent = PolyfillClipboardEvent;
}
