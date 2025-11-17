import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ensureAssistantButton } from '../src/buttonInjector';
import { EditorContext } from '../src/promEditorDetector';

describe('buttonInjector', () => {
  let context: EditorContext;
  let toolbar: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="query-editor-row">
        <div class="query-ctrl-actions"></div>
      </div>`;
    toolbar = document.querySelector('.query-ctrl-actions') as HTMLElement;
    const textarea = document.createElement('textarea');
    context = {
      id: 'editor-1',
      root: document.querySelector('.query-editor-row') as HTMLElement,
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
  });

  it('injects a single assistant button with click handler', () => {
    const handler = vi.fn();
    const buttonA = ensureAssistantButton(context, handler);
    const buttonB = ensureAssistantButton(context, handler);

    expect(toolbar.querySelectorAll('button').length).toBe(1);
    expect(buttonA).toBe(buttonB);

    buttonA.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(context);
  });
});
