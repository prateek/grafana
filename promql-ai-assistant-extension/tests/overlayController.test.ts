import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OverlayController } from '../src/overlayController';
import { EditorContext } from '../src/promEditorDetector';

const stubContext = (): EditorContext => {
  const textarea = document.createElement('textarea');
  textarea.value = 'rate(foo[5m])';
  const root = document.createElement('div');
  const toolbar = document.createElement('div');
  root.appendChild(toolbar);
  return {
    id: 'editor-x',
    root,
    toolbar,
    strategy: {
      type: 'textarea',
      element: textarea,
      getValue: () => textarea.value,
      setValue: (value: string) => {
        textarea.value = value;
      },
    },
  };
};

describe('OverlayController', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates overlay container and toggles visibility', () => {
    const controller = new OverlayController();
    const context = stubContext();
    controller.openForEditor(context);

    const root = document.getElementById('prom-ai-overlay-root');
    expect(root).toBeTruthy();
    expect(root?.classList.contains('prom-ai-open')).toBe(true);

    controller.close();
    expect(root?.classList.contains('prom-ai-open')).toBe(false);
  });

  it('queues context until iframe is ready', () => {
    const controller = new OverlayController();
    const iframe = controller.getIframeElement();
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage, close: vi.fn() },
      configurable: true,
    });

    const context = stubContext();
    controller.openForEditor(context);
    controller.sendContext({
      editorId: context.id,
      datasource: 'prometheus',
      currentQuery: 'up',
    });

    expect(postMessage).not.toHaveBeenCalled();
    controller.markIframeReady();
    expect(postMessage).toHaveBeenCalled();
  });
});
