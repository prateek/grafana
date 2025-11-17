import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ensureAssistantButton } from '../src/ui/buttonInjector';
import type { RegisteredEditor } from '../src/registry/editorRegistry';

describe('buttonInjector', () => {
  let root: HTMLElement;
  let editor: RegisteredEditor;

  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    root = document.getElementById('host') as HTMLElement;
    editor = {
      id: 'test-editor',
      datasource: 'prometheus',
      root,
      buttonHost: root,
      getQuery: () => '',
      setQuery: () => true,
      runQuery: () => true
    };
  });

  it('injects a single assistant button and wires click handler', () => {
    const handler = vi.fn();
    const button = ensureAssistantButton(editor, handler);

    expect(root.querySelectorAll('.prom-ai-assistant-button')).toHaveLength(1);

    button.click();
    expect(handler).toHaveBeenCalledTimes(1);

    const sameButton = ensureAssistantButton(editor, handler);
    expect(sameButton).toBe(button);
    expect(root.querySelectorAll('.prom-ai-assistant-button')).toHaveLength(1);
  });
});
