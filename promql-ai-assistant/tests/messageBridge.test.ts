import { describe, expect, it, vi } from 'vitest';
import { createAssistantMessageHandler } from '../src/messageBridge';
import { EditorRegistry } from '../src/editorRegistry';
import { ASSISTANT_IFRAME_URL } from '../src/config';

function buildEditor(id: string) {
  const root = document.createElement('div');
  const toolbar = document.createElement('div');
  root.append(toolbar);
  document.body.append(root);
  const setQuery = vi.fn();
  const runQuery = vi.fn();

  return {
    id,
    root,
    toolbar,
    datasource: 'Prometheus',
    getQuery: () => '',
    setQuery,
    runQuery
  };
}

describe('message bridge', () => {
  it('handles promql_suggestion and context_request messages', () => {
    const registry = new EditorRegistry();
    const editor = buildEditor('editor-1');
    registry.upsert(editor);
    let activeEditorId: string | null = editor.id;
    const sendContext = vi.fn();
    const overlay = { close: vi.fn() } as unknown as Parameters<typeof createAssistantMessageHandler>[0]['overlay'];

    const handler = createAssistantMessageHandler({
      registry,
      overlay,
      getActiveEditorId: () => activeEditorId,
      setActiveEditorId: (id) => {
        activeEditorId = id;
      },
      sendContext
    });

    const origin = new URL(ASSISTANT_IFRAME_URL).origin;

    handler(new MessageEvent('message', { data: { type: 'promql_context_request' }, origin }));
    expect(sendContext).toHaveBeenCalledWith(editor);

    handler(
      new MessageEvent('message', {
        data: { type: 'promql_suggestion', query: 'sum(up)' },
        origin
      })
    );
    expect(editor.setQuery).toHaveBeenCalledWith('sum(up)');
    expect(editor.runQuery).toHaveBeenCalled();
  });
});
