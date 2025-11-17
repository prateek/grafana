import { describe, expect, it } from 'vitest';
import { EditorRegistry } from '../src/registry/editorRegistry';

const createEditor = (id: string, root: HTMLElement) => ({
  id,
  datasource: 'prometheus' as const,
  root,
  buttonHost: root,
  getQuery: () => '',
  setQuery: () => true,
  runQuery: () => true
});

describe('EditorRegistry', () => {
  it('removes editors that disappear from the DOM', () => {
    document.body.innerHTML = '<div id="one"></div><div id="two"></div>';
    const first = document.getElementById('one') as HTMLElement;
    const second = document.getElementById('two') as HTMLElement;

    const registry = new EditorRegistry();
    registry.upsert(createEditor('a', first));
    registry.upsert(createEditor('b', second));

    expect(registry.values()).toHaveLength(2);

    second.remove();
    registry.dropMissing(new Set<string>(['a']));

    expect(registry.values()).toHaveLength(1);
    expect(registry.getById('a')).toBeDefined();
    expect(registry.getById('b')).toBeUndefined();
  });
});
