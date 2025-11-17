import { describe, expect, it, vi } from 'vitest';
import { ensureAssistantButton } from '../src/ui/injectButton';
import type { EditorContext } from '../src/types/editor';

function buildEditor(): EditorContext {
  const root = document.createElement('div');
  const toolbar = document.createElement('div');
  root.append(toolbar);
  document.body.append(root);

  return {
    id: 'test-editor',
    root,
    toolbar,
    datasource: 'Prometheus',
    getQuery: () => '',
    setQuery: () => void 0
  };
}

describe('ensureAssistantButton', () => {
  it('creates a single assistant button with click behavior', () => {
    const editor = buildEditor();
    const handler = vi.fn();
    const button = ensureAssistantButton(editor, { onClick: handler });
    expect(button.textContent).toContain('AI Assistant');
    button.click();
    expect(handler).toHaveBeenCalledTimes(1);

    const second = ensureAssistantButton(editor, { onClick: handler });
    expect(second).toBe(button);
  });
});
