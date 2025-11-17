import { findPromEditors } from './detection/promEditorDetector';
import { EditorRegistry } from './registry/editorRegistry';
import { ensureAssistantButton } from './ui/buttonInjector';
import { OverlayController } from './ui/overlay';
import type { RegisteredEditor } from './registry/editorRegistry';

const registry = new EditorRegistry();
const overlay = new OverlayController({
  onSuggestion: ({ editorId, query }) => {
    const editor = registry.getById(editorId);
    if (!editor) {
      return;
    }
    const updated = editor.setQuery(query);
    if (updated) {
      editor.runQuery();
    }
  }
});

function bootstrap(): void {
  syncEditors();

  const observer = new MutationObserver(() => scheduleSync());
  const target = document.body ?? document.documentElement;
  observer.observe(target, { childList: true, subtree: true });

  window.addEventListener('message', event => overlay.handleAssistantMessage(event));
  window.addEventListener('popstate', () => scheduleSync());
  window.addEventListener('hashchange', () => scheduleSync());
}

function syncEditors(): void {
  const detected = findPromEditors();
  const ids = new Set<string>();

  detected.forEach(editor => {
    const registered = registry.upsert(editor);
    ids.add(registered.id);
    ensureAssistantButton(registered, handleAssistantButtonClick);
  });

  registry.dropMissing(ids);
}

function handleAssistantButtonClick(editor: RegisteredEditor): void {
  overlay.open({
    editorId: editor.id,
    currentQuery: editor.getQuery(),
    datasource: editor.datasource
  });
}

let syncScheduled = false;

function scheduleSync(): void {
  if (syncScheduled) {
    return;
  }
  syncScheduled = true;
  queueMicrotask(() => {
    syncScheduled = false;
    syncEditors();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
