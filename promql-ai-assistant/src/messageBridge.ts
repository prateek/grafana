import { ASSISTANT_IFRAME_ALLOWED_ORIGINS, AUTO_CLOSE_OVERLAY_ON_INSERT } from './config';
import type { EditorRegistry } from './editorRegistry';
import type { PromEditorDetectionResult } from './types/editor';
import type { OverlayController } from './ui/overlay';

type AssistantInboundMessage =
  | { type: 'promql_suggestion'; query: string; editorId?: string }
  | { type: 'promql_context_request'; editorId?: string }
  | { type: 'promql_focus_editor'; editorId: string };

export interface MessageHandlerDeps {
  registry: EditorRegistry;
  overlay: OverlayController;
  getActiveEditorId: () => string | null;
  setActiveEditorId: (id: string | null) => void;
  sendContext: (editor: PromEditorDetectionResult) => void;
}

export function createAssistantMessageHandler(deps: MessageHandlerDeps) {
  return function handleAssistantMessage(event: MessageEvent) {
    if (!ASSISTANT_IFRAME_ALLOWED_ORIGINS.includes(event.origin)) {
      return;
    }

    if (!isAssistantMessage(event.data)) {
      return;
    }
    const data = event.data;

    if (data.type === 'promql_suggestion' && typeof data.query === 'string') {
      const editorId: string | null = data.editorId || deps.getActiveEditorId();
      if (!editorId) {
        return;
      }
      const editor = deps.registry.getContext(editorId);
      if (!editor) {
        return;
      }
      editor.setQuery(data.query);
      editor.runQuery?.();
      if (AUTO_CLOSE_OVERLAY_ON_INSERT) {
        deps.overlay.close();
      }
      return;
    }

    if (data.type === 'promql_context_request') {
      const editorId: string | null = data.editorId || deps.getActiveEditorId();
      if (!editorId) {
        return;
      }
      const editor = deps.registry.getContext(editorId);
      if (!editor) {
        return;
      }
      deps.sendContext(editor);
      return;
    }

    if (data.type === 'promql_focus_editor' && typeof data.editorId === 'string') {
      const editor = deps.registry.getContext(data.editorId);
      if (!editor) {
        return;
      }
      deps.setActiveEditorId(data.editorId);
      deps.sendContext(editor);
    }
  };
}

function isAssistantMessage(data: unknown): data is AssistantInboundMessage {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  const editorId = candidate.editorId;
  switch (candidate.type) {
    case 'promql_suggestion':
      return (
        typeof candidate.query === 'string' &&
        (editorId === undefined || typeof editorId === 'string')
      );
    case 'promql_context_request':
      return editorId === undefined || typeof editorId === 'string';
    case 'promql_focus_editor':
      return typeof editorId === 'string';
    default:
      return false;
  }
}
