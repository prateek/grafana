import { describe, expect, it, vi } from 'vitest';
import { EditorRegistry } from '../src/editorRegistry';
import { EditorContext } from '../src/promEditorDetector';

function buildContext(id: string): EditorContext {
  const textarea = document.createElement('textarea');
  const root = document.createElement('div');
  const toolbar = document.createElement('div');
  root.appendChild(toolbar);
  return {
    id,
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
}

describe('EditorRegistry', () => {
  it('adds, updates, and prunes editors', () => {
    const registry = new EditorRegistry();
    const createSpy = vi.fn();
    const updateSpy = vi.fn();
    const removalSpy = vi.fn();

    const contextA = buildContext('a');
    registry.upsert(contextA, { onCreate: createSpy });
    expect(createSpy).toHaveBeenCalledTimes(1);

    const updatedContextA = { ...contextA, toolbar: document.createElement('div') };
    registry.upsert(updatedContextA, { onUpdate: updateSpy });
    expect(updateSpy).toHaveBeenCalledTimes(1);

    registry.pruneUnused(() => false, removalSpy);
    expect(removalSpy).toHaveBeenCalledTimes(1);
    expect(registry.list()).toHaveLength(0);
  });
});
