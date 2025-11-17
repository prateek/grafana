import { describe, expect, it } from 'vitest';
import { EditorRegistry } from '../src/editorRegistry';
import type { PromEditorDetectionResult } from '../src/types/editor';

function createContext(id: string): PromEditorDetectionResult {
  const root = document.createElement('div');
  const toolbar = document.createElement('div');
  root.append(toolbar);
  document.body.append(root);
  return {
    id,
    root,
    toolbar,
    datasource: 'Prometheus',
    getQuery: () => '',
    setQuery: () => void 0,
    runQuery: () => void 0
  };
}

describe('EditorRegistry', () => {
  it('adds, retrieves, and cleans up editors', () => {
    const registry = new EditorRegistry();
    const ctx = createContext('one');
    registry.upsert(ctx);
    expect(registry.getContext('one')).toBeDefined();

    const button = document.createElement('button');
    registry.setButton('one', button);
    expect(registry.getButton('one')).toBe(button);

    ctx.root.remove();
    registry.cleanupRemoved();
    expect(registry.getContext('one')).toBeUndefined();
  });
});
